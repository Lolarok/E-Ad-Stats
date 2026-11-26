import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, isAdminUser, OperationType } from '../firebase';
import type { PlayerStats, TeamStats } from '../types/basketball';

export const SEASON_META_ID = 'current_2026_27';
export const TRAFFIC_SNAPSHOT_ID = 'current';
const CHUNK_SIZE = 200; // <= 250 rules cap and well under 1MB Firestore document limit

export interface CloudSeasonMeta {
  season: string;
  status: 'active' | 'archived';
  lbaRound: number;
  euroleagueGamesCount: number;
  eurocupGamesCount: number;
  totalGames: number;
  teamsCount: number;
  playersCount: number;
  teamChunksCount: number;
  playerChunksCount: number;
  pbpCachedGames: number;
  pbpCoveragePct: number;
  sourceLastUpdated: string;
  updatedBy: string;
  updatedAtIso?: string;
}

export interface CloudSeasonSnapshot {
  meta: CloudSeasonMeta;
  teams: TeamStats[];
  players: PlayerStats[];
}

export interface RawTrafficStorePayload {
  startedAt: string;
  totalPageViews: number;
  totalSessions: number;
  uniqueVisitors: string[];
  daily: Record<string, { pageViews: number; sessions: number; visitors: string[] }>;
  hourly: number[];
  tabViews: Record<string, number>;
  interactions: Record<string, number>;
  devices: Record<'Desktop' | 'Mobile' | 'Tablet', number>;
  browsers: Record<string, number>;
  osCounts: Record<string, number>;
  referrers: Record<string, number>;
  languages: Record<string, number>;
  recentSessions: Array<Record<string, unknown>>;
}

function sanitizeForFirestore<T>(value: T): T {
  if (value === null || value === undefined) {
    return null as unknown as T;
  }
  if (typeof value === 'number') {
    return (Number.isFinite(value) ? value : 0) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = sanitizeForFirestore(v);
      }
    }
    return out as T;
  }
  return value;
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function timestampToIso(ts: unknown): string | undefined {
  if (!ts) return undefined;
  if (typeof ts === 'object' && ts !== null && 'toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function') {
    return (ts as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof ts === 'string') return ts;
  return undefined;
}

export async function getSeasonSnapshotMetaFromCloud(): Promise<CloudSeasonMeta | null> {
  const path = `season_meta/${SEASON_META_ID}`;
  try {
    const snap = await getDoc(doc(db, 'season_meta', SEASON_META_ID));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      season: String(d.season || '2026/2027'),
      status: d.status === 'archived' ? 'archived' : 'active',
      lbaRound: Number(d.lbaRound || 0),
      euroleagueGamesCount: Number(d.euroleagueGamesCount || 0),
      eurocupGamesCount: Number(d.eurocupGamesCount || 0),
      totalGames: Number(d.totalGames || 0),
      teamsCount: Number(d.teamsCount || 0),
      playersCount: Number(d.playersCount || 0),
      teamChunksCount: Number(d.teamChunksCount || 0),
      playerChunksCount: Number(d.playerChunksCount || 0),
      pbpCachedGames: Number(d.pbpCachedGames || 0),
      pbpCoveragePct: Number(d.pbpCoveragePct || 0),
      sourceLastUpdated: String(d.sourceLastUpdated || ''),
      updatedBy: String(d.updatedBy || ''),
      updatedAtIso: timestampToIso(d.updatedAt),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function loadSeasonSnapshotFromCloud(): Promise<CloudSeasonSnapshot | null> {
  const meta = await getSeasonSnapshotMetaFromCloud();
  if (!meta || meta.teamChunksCount <= 0 || meta.playerChunksCount <= 0) {
    return null;
  }

  const teamPromises = Array.from({ length: meta.teamChunksCount }, async (_, idx) => {
    const chunkId = `${SEASON_META_ID}_teams_${idx}`;
    const path = `season_chunks/${chunkId}`;
    try {
      const snap = await getDoc(doc(db, 'season_chunks', chunkId));
      return snap.exists() ? ((snap.data().items || []) as TeamStats[]) : [];
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  });

  const playerPromises = Array.from({ length: meta.playerChunksCount }, async (_, idx) => {
    const chunkId = `${SEASON_META_ID}_players_${idx}`;
    const path = `season_chunks/${chunkId}`;
    try {
      const snap = await getDoc(doc(db, 'season_chunks', chunkId));
      return snap.exists() ? ((snap.data().items || []) as PlayerStats[]) : [];
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  });

  const [teamChunkArrays, playerChunkArrays] = await Promise.all([
    Promise.all(teamPromises),
    Promise.all(playerPromises),
  ]);

  const teams = teamChunkArrays.flat();
  const players = playerChunkArrays.flat();

  if (teams.length === 0 || players.length === 0) {
    return null;
  }

  return { meta, teams, players };
}

export async function saveSeasonSnapshotToCloud(params: {
  teams: TeamStats[];
  players: PlayerStats[];
  lbaRound: number;
  euroleagueGamesCount: number;
  eurocupGamesCount: number;
  totalGames: number;
  pbpCachedGames: number;
  pbpCoveragePct: number;
  sourceLastUpdated?: string;
}): Promise<CloudSeasonMeta> {
  const currentUser = auth.currentUser;
  if (!currentUser || !isAdminUser(currentUser)) {
    throw new Error('Accesso amministratore richiesto per salvare lo snapshot su Firebase.');
  }

  const cleanTeams = sanitizeForFirestore(params.teams).slice(0, 200);
  const cleanPlayers = sanitizeForFirestore(params.players).slice(0, 3000);
  const teamChunks = chunkArray(cleanTeams, CHUNK_SIZE);
  const playerChunks = chunkArray(cleanPlayers, CHUNK_SIZE);

  const safeLbaRound = Math.min(40, Math.max(1, Math.round(params.lbaRound || 1)));
  const safeElGames = Math.min(500, Math.max(0, Math.round(params.euroleagueGamesCount || 0)));
  const safeEcGames = Math.min(500, Math.max(0, Math.round(params.eurocupGamesCount || 0)));
  const safeTotalGames = Math.min(
    1000,
    Math.max(0, Math.round(params.totalGames || safeElGames + safeEcGames))
  );
  const safePbpGames = Math.min(1000, Math.max(0, Math.round(params.pbpCachedGames || 0)));
  const safePbpPct = Math.min(100, Math.max(0, Math.round(params.pbpCoveragePct || 0)));
  const sourceLastUpdated = (params.sourceLastUpdated || new Date().toISOString()).slice(0, 64);

  const metaRef = doc(db, 'season_meta', SEASON_META_ID);
  const metaPath = `season_meta/${SEASON_META_ID}`;

  let existingMetaData: Record<string, unknown> | null = null;
  try {
    const existingMetaSnap = await getDoc(metaRef);
    if (existingMetaSnap.exists()) {
      existingMetaData = existingMetaSnap.data();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, metaPath);
  }

  const metaPayload = {
    season: '2026/2027',
    status: existingMetaData?.status === 'archived' ? 'archived' : 'active',
    lbaRound: safeLbaRound,
    euroleagueGamesCount: safeElGames,
    eurocupGamesCount: safeEcGames,
    totalGames: safeTotalGames,
    teamsCount: cleanTeams.length,
    playersCount: cleanPlayers.length,
    teamChunksCount: teamChunks.length,
    playerChunksCount: playerChunks.length,
    pbpCachedGames: safePbpGames,
    pbpCoveragePct: safePbpPct,
    sourceLastUpdated,
    updatedBy: currentUser.uid,
    createdAt: existingMetaData?.createdAt ?? serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(metaRef, metaPayload);
  } catch (error) {
    handleFirestoreError(error, existingMetaData ? OperationType.UPDATE : OperationType.CREATE, metaPath);
  }

  // Write team chunks
  for (let i = 0; i < teamChunks.length; i++) {
    const chunkId = `${SEASON_META_ID}_teams_${i}`;
    const chunkRef = doc(db, 'season_chunks', chunkId);
    const chunkPath = `season_chunks/${chunkId}`;
    let existingChunk: Record<string, unknown> | null = null;
    try {
      const snap = await getDoc(chunkRef);
      if (snap.exists()) existingChunk = snap.data();
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, chunkPath);
    }

    const chunkPayload = {
      metaId: SEASON_META_ID,
      kind: 'teams',
      chunkIndex: i,
      totalChunks: teamChunks.length,
      season: '2026/2027',
      items: teamChunks[i],
      updatedBy: currentUser.uid,
      createdAt: existingChunk?.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(chunkRef, chunkPayload);
    } catch (error) {
      handleFirestoreError(error, existingChunk ? OperationType.UPDATE : OperationType.CREATE, chunkPath);
    }
  }

  // Write player chunks
  for (let i = 0; i < playerChunks.length; i++) {
    const chunkId = `${SEASON_META_ID}_players_${i}`;
    const chunkRef = doc(db, 'season_chunks', chunkId);
    const chunkPath = `season_chunks/${chunkId}`;
    let existingChunk: Record<string, unknown> | null = null;
    try {
      const snap = await getDoc(chunkRef);
      if (snap.exists()) existingChunk = snap.data();
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, chunkPath);
    }

    const chunkPayload = {
      metaId: SEASON_META_ID,
      kind: 'players',
      chunkIndex: i,
      totalChunks: playerChunks.length,
      season: '2026/2027',
      items: playerChunks[i],
      updatedBy: currentUser.uid,
      createdAt: existingChunk?.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(chunkRef, chunkPayload);
    } catch (error) {
      handleFirestoreError(error, existingChunk ? OperationType.UPDATE : OperationType.CREATE, chunkPath);
    }
  }

  return {
    season: '2026/2027',
    status: 'active',
    lbaRound: safeLbaRound,
    euroleagueGamesCount: safeElGames,
    eurocupGamesCount: safeEcGames,
    totalGames: safeTotalGames,
    teamsCount: cleanTeams.length,
    playersCount: cleanPlayers.length,
    teamChunksCount: teamChunks.length,
    playerChunksCount: playerChunks.length,
    pbpCachedGames: safePbpGames,
    pbpCoveragePct: safePbpPct,
    sourceLastUpdated,
    updatedBy: currentUser.uid,
    updatedAtIso: new Date().toISOString(),
  };
}

export async function loadTrafficSnapshotFromCloud(): Promise<
  (RawTrafficStorePayload & { updatedAtIso?: string }) | null
> {
  const currentUser = auth.currentUser;
  if (!currentUser || !isAdminUser(currentUser)) {
    return null;
  }

  const path = `traffic_snapshots/${TRAFFIC_SNAPSHOT_ID}`;
  try {
    const snap = await getDoc(doc(db, 'traffic_snapshots', TRAFFIC_SNAPSHOT_ID));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      startedAt: String(d.startedAt || new Date().toISOString()),
      totalPageViews: Number(d.totalPageViews || 0),
      totalSessions: Number(d.totalSessions || 0),
      uniqueVisitors: Array.isArray(d.uniqueVisitors) ? d.uniqueVisitors.map(String) : [],
      daily: (d.daily && typeof d.daily === 'object' ? d.daily : {}) as RawTrafficStorePayload['daily'],
      hourly:
        Array.isArray(d.hourly) && d.hourly.length === 24
          ? d.hourly.map((n: unknown) => Number(n || 0))
          : Array.from({ length: 24 }, () => 0),
      tabViews: (d.tabViews || {}) as Record<string, number>,
      interactions: (d.interactions || {}) as Record<string, number>,
      devices: {
        Desktop: Number(d.devices?.Desktop || 0),
        Mobile: Number(d.devices?.Mobile || 0),
        Tablet: Number(d.devices?.Tablet || 0),
      },
      browsers: (d.browsers || {}) as Record<string, number>,
      osCounts: (d.osCounts || {}) as Record<string, number>,
      referrers: (d.referrers || {}) as Record<string, number>,
      languages: (d.languages || {}) as Record<string, number>,
      recentSessions: Array.isArray(d.recentSessions) ? d.recentSessions : [],
      updatedAtIso: timestampToIso(d.updatedAt),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveTrafficSnapshotToCloud(
  rawStore: RawTrafficStorePayload
): Promise<{ savedAtIso: string; totalPageViews: number; totalSessions: number }> {
  const currentUser = auth.currentUser;
  if (!currentUser || !isAdminUser(currentUser)) {
    throw new Error('Accesso amministratore richiesto per salvare le statistiche traffico su Firebase.');
  }

  const ref = doc(db, 'traffic_snapshots', TRAFFIC_SNAPSHOT_ID);
  const path = `traffic_snapshots/${TRAFFIC_SNAPSHOT_ID}`;

  let existingData: Record<string, unknown> | null = null;
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) existingData = snap.data();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  const normalizedHourly =
    Array.isArray(rawStore.hourly) && rawStore.hourly.length === 24
      ? rawStore.hourly.map((v) => Math.max(0, Number(v || 0)))
      : Array.from({ length: 24 }, () => 0);

  const sanitizedDaily: Record<string, { pageViews: number; sessions: number; visitors: string[] }> = {};
  const dayKeys = Object.keys(rawStore.daily || {}).sort().slice(-60);
  for (const key of dayKeys) {
    const bucket = rawStore.daily[key];
    if (!bucket) continue;
    sanitizedDaily[key] = {
      pageViews: Math.max(0, Number(bucket.pageViews || 0)),
      sessions: Math.max(0, Number(bucket.sessions || 0)),
      visitors: Array.isArray(bucket.visitors) ? bucket.visitors.slice(-500).map(String) : [],
    };
  }

  const payload = sanitizeForFirestore({
    startedAt: String(rawStore.startedAt || new Date().toISOString()).slice(0, 64),
    totalPageViews: Math.max(0, Number(rawStore.totalPageViews || 0)),
    totalSessions: Math.max(0, Number(rawStore.totalSessions || 0)),
    uniqueVisitors: (Array.isArray(rawStore.uniqueVisitors) ? rawStore.uniqueVisitors : [])
      .slice(-1000)
      .map(String),
    daily: sanitizedDaily,
    hourly: normalizedHourly,
    tabViews: rawStore.tabViews || {},
    interactions: rawStore.interactions || {},
    devices: {
      Desktop: Math.max(0, Number(rawStore.devices?.Desktop || 0)),
      Mobile: Math.max(0, Number(rawStore.devices?.Mobile || 0)),
      Tablet: Math.max(0, Number(rawStore.devices?.Tablet || 0)),
    },
    browsers: rawStore.browsers || {},
    osCounts: rawStore.osCounts || {},
    referrers: rawStore.referrers || {},
    languages: rawStore.languages || {},
    recentSessions: (Array.isArray(rawStore.recentSessions) ? rawStore.recentSessions : []).slice(0, 50),
    updatedBy: currentUser.uid,
  });

  try {
    await setDoc(ref, {
      ...payload,
      createdAt: existingData?.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, existingData ? OperationType.UPDATE : OperationType.CREATE, path);
  }

  return {
    savedAtIso: new Date().toISOString(),
    totalPageViews: payload.totalPageViews,
    totalSessions: payload.totalSessions,
  };
}
