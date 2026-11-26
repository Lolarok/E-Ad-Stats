import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, isAdminUser, signInWithGoogle, signOutUser } from '../firebase';
import {
  getSeasonSnapshotMetaFromCloud,
  loadSeasonSnapshotFromCloud,
  saveSeasonSnapshotToCloud,
  loadTrafficSnapshotFromCloud,
  saveTrafficSnapshotToCloud,
  type CloudSeasonMeta,
  type CloudSeasonSnapshot,
  type RawTrafficStorePayload,
} from '../utils/firebaseCloudSync';
import type { PlayerStats, TeamStats } from '../types/basketball';

interface FirebaseContextValue {
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  cloudMeta: CloudSeasonMeta | null;
  isSyncingCloud: boolean;
  cloudError: string | null;
  lastTrafficCloudSyncAt: string | null;
  loginWithGoogle: () => Promise<User | null>;
  logout: () => Promise<void>;
  refreshCloudMeta: () => Promise<CloudSeasonMeta | null>;
  saveSeasonToCloud: (override?: {
    teams?: TeamStats[];
    players?: PlayerStats[];
    lbaRound?: number;
    totalGames?: number;
  }) => Promise<CloudSeasonMeta | null>;
  restoreSeasonFromCloud: () => Promise<CloudSeasonSnapshot | null>;
  backupTrafficToCloud: () => Promise<{ savedAtIso: string; totalPageViews: number; totalSessions: number } | null>;
  restoreTrafficFromCloud: () => Promise<boolean>;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

function extractReadableError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.error === 'string') {
      return parsed.error;
    }
  } catch {
    // Plain message
  }
  return raw;
}

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [cloudMeta, setCloudMeta] = useState<CloudSeasonMeta | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [lastTrafficCloudSyncAt, setLastTrafficCloudSyncAt] = useState<string | null>(null);

  const isAdmin = isAdminUser(user);
  const hasAutoReconciledRef = useRef<string | null>(null);

  const refreshCloudMeta = useCallback(async (): Promise<CloudSeasonMeta | null> => {
    try {
      const meta = await getSeasonSnapshotMetaFromCloud();
      setCloudMeta(meta);
      return meta;
    } catch (err) {
      setCloudError(extractReadableError(err));
      return null;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Load public cloud season metadata on initial boot
  useEffect(() => {
    void refreshCloudMeta();
  }, [refreshCloudMeta]);

  const saveSeasonToCloud = useCallback(
    async (override?: {
      teams?: TeamStats[];
      players?: PlayerStats[];
      lbaRound?: number;
      totalGames?: number;
    }): Promise<CloudSeasonMeta | null> => {
      if (!auth.currentUser || !isAdminUser(auth.currentUser)) {
        setCloudError('Accedi con account Google amministratore per salvare su Firebase.');
        return null;
      }
      setIsSyncingCloud(true);
      setCloudError(null);
      try {
        const [latestRes, daemonRes] = await Promise.all([
          fetch('/api/data/latest'),
          fetch('/api/daemon/status').catch(() => null),
        ]);
        const latestData = latestRes.ok ? await latestRes.json() : null;
        const daemonData = daemonRes && daemonRes.ok ? await daemonRes.json() : null;

        const teams: TeamStats[] = override?.teams?.length ? override.teams : latestData?.teams || [];
        const players: PlayerStats[] = override?.players?.length ? override.players : latestData?.players || [];

        if (teams.length === 0 || players.length === 0) {
          throw new Error('Dataset non ancora pronto per il salvataggio cloud.');
        }

        const savedMeta = await saveSeasonSnapshotToCloud({
          teams,
          players,
          lbaRound: override?.lbaRound || latestData?.lbaRound || daemonData?.currentRoundLBA || 9,
          euroleagueGamesCount: daemonData?.euroleagueGames || 0,
          eurocupGamesCount: daemonData?.eurocupGames || 0,
          totalGames: override?.totalGames || latestData?.totalGames || daemonData?.totalGames || 0,
          pbpCachedGames: daemonData?.pbpStatus?.cachedPbpGames || 0,
          pbpCoveragePct: daemonData?.pbpStatus?.coveragePct || 0,
          sourceLastUpdated: latestData?.lastUpdated || new Date().toISOString(),
        });

        setCloudMeta(savedMeta);
        return savedMeta;
      } catch (err) {
        setCloudError(extractReadableError(err));
        return null;
      } finally {
        setIsSyncingCloud(false);
      }
    },
    []
  );

  const restoreSeasonFromCloud = useCallback(async (): Promise<CloudSeasonSnapshot | null> => {
    setIsSyncingCloud(true);
    setCloudError(null);
    try {
      const snapshot = await loadSeasonSnapshotFromCloud();
      if (!snapshot) return null;

      setCloudMeta(snapshot.meta);
      await fetch('/api/cloud/hydrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teams: snapshot.teams,
          players: snapshot.players,
          lbaRound: snapshot.meta.lbaRound,
          totalGames: snapshot.meta.totalGames,
          euroleagueGamesCount: snapshot.meta.euroleagueGamesCount,
          eurocupGamesCount: snapshot.meta.eurocupGamesCount,
          lastUpdated: snapshot.meta.sourceLastUpdated || snapshot.meta.updatedAtIso,
        }),
      }).catch(() => {});

      return snapshot;
    } catch (err) {
      setCloudError(extractReadableError(err));
      return null;
    } finally {
      setIsSyncingCloud(false);
    }
  }, []);

  const backupTrafficToCloud = useCallback(async () => {
    if (!auth.currentUser || !isAdminUser(auth.currentUser)) {
      setCloudError('Accedi come amministratore per salvare gli accessi su Firebase.');
      return null;
    }
    setIsSyncingCloud(true);
    setCloudError(null);
    try {
      const rawRes = await fetch('/api/traffic/raw');
      if (!rawRes.ok) throw new Error(`HTTP ${rawRes.status}`);
      const rawStore: RawTrafficStorePayload = await rawRes.json();
      const result = await saveTrafficSnapshotToCloud(rawStore);
      setLastTrafficCloudSyncAt(result.savedAtIso);
      return result;
    } catch (err) {
      setCloudError(extractReadableError(err));
      return null;
    } finally {
      setIsSyncingCloud(false);
    }
  }, []);

  const restoreTrafficFromCloud = useCallback(async (): Promise<boolean> => {
    if (!auth.currentUser || !isAdminUser(auth.currentUser)) {
      setCloudError('Accedi come amministratore per ripristinare gli accessi da Firebase.');
      return false;
    }
    setIsSyncingCloud(true);
    setCloudError(null);
    try {
      const cloudTraffic = await loadTrafficSnapshotFromCloud();
      if (!cloudTraffic) return false;
      const hydrateRes = await fetch('/api/traffic/hydrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cloudTraffic),
      });
      if (!hydrateRes.ok) throw new Error(`HTTP ${hydrateRes.status}`);
      if (cloudTraffic.updatedAtIso) {
        setLastTrafficCloudSyncAt(cloudTraffic.updatedAtIso);
      }
      return true;
    } catch (err) {
      setCloudError(extractReadableError(err));
      return false;
    } finally {
      setIsSyncingCloud(false);
    }
  }, []);

  // Automatic cloud reconciliation when Admin signs in:
  // - Pushes newer server dataset to Firestore (or restores newer cloud snapshot to server)
  // - Merges & backs up Accessi App traffic stats so restarts never wipe history
  useEffect(() => {
    if (!authReady || !isAdmin || !user?.uid) return;
    if (hasAutoReconciledRef.current === user.uid) return;
    hasAutoReconciledRef.current = user.uid;

    const reconcile = async () => {
      try {
        const [meta, latestRes, rawTrafficRes, cloudTraffic] = await Promise.all([
          getSeasonSnapshotMetaFromCloud().catch(() => null),
          fetch('/api/data/latest').catch(() => null),
          fetch('/api/traffic/raw').catch(() => null),
          loadTrafficSnapshotFromCloud().catch(() => null),
        ]);

        if (meta) setCloudMeta(meta);

        // 1. Reconcile basketball dataset
        if (latestRes && latestRes.ok) {
          const serverData = await latestRes.json();
          const serverGames = Number(serverData?.totalGames || 0);
          const serverLba = Number(serverData?.lbaRound || 0);
          const cloudGames = Number(meta?.totalGames || 0);
          const cloudLba = Number(meta?.lbaRound || 0);

          if (!meta || serverGames > cloudGames || serverLba > cloudLba) {
            if (Array.isArray(serverData?.teams) && serverData.teams.length >= 50) {
              await saveSeasonToCloud({
                teams: serverData.teams,
                players: serverData.players,
                lbaRound: serverLba,
                totalGames: serverGames,
              });
            }
          } else if (cloudGames > serverGames || cloudLba > serverLba) {
            await restoreSeasonFromCloud();
          }
        }

        // 2. Reconcile traffic analytics store (merge cloud + server so zero hits are ever lost)
        if (rawTrafficRes && rawTrafficRes.ok) {
          const serverTraffic: RawTrafficStorePayload = await rawTrafficRes.json();
          if (cloudTraffic) {
            if (cloudTraffic.updatedAtIso) {
              setLastTrafficCloudSyncAt(cloudTraffic.updatedAtIso);
            }
            const hydrateRes = await fetch('/api/traffic/hydrate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(cloudTraffic),
            }).catch(() => null);
            if (hydrateRes && hydrateRes.ok) {
              const mergedRes = await fetch('/api/traffic/raw').catch(() => null);
              if (mergedRes && mergedRes.ok) {
                const merged: RawTrafficStorePayload = await mergedRes.json();
                if (
                  merged.totalPageViews > cloudTraffic.totalPageViews ||
                  merged.totalSessions > cloudTraffic.totalSessions
                ) {
                  const saved = await saveTrafficSnapshotToCloud(merged);
                  setLastTrafficCloudSyncAt(saved.savedAtIso);
                }
              }
            }
          } else if ((serverTraffic?.totalPageViews || 0) > 0) {
            const saved = await saveTrafficSnapshotToCloud(serverTraffic);
            setLastTrafficCloudSyncAt(saved.savedAtIso);
          }
        }
      } catch (err) {
        console.warn('Auto cloud reconciliation skipped:', err);
      }
    };

    void reconcile();
  }, [authReady, isAdmin, user?.uid, saveSeasonToCloud, restoreSeasonFromCloud]);

  const loginWithGoogle = useCallback(async (): Promise<User | null> => {
    setCloudError(null);
    try {
      const signedInUser = await signInWithGoogle();
      return signedInUser;
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setCloudError(extractReadableError(err));
      }
      return null;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setCloudError(null);
    hasAutoReconciledRef.current = null;
    await signOutUser();
  }, []);

  return (
    <FirebaseContext.Provider
      value={{
        user,
        authReady,
        isAdmin,
        cloudMeta,
        isSyncingCloud,
        cloudError,
        lastTrafficCloudSyncAt,
        loginWithGoogle,
        logout,
        refreshCloudMeta,
        saveSeasonToCloud,
        restoreSeasonFromCloud,
        backupTrafficToCloud,
        restoreTrafficFromCloud,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export function useFirebase(): FirebaseContextValue {
  const ctx = useContext(FirebaseContext);
  if (!ctx) {
    throw new Error('useFirebase must be used within FirebaseProvider');
  }
  return ctx;
}
