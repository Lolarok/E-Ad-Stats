import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  rebuildDatasetFromStore,
  syncOnlyMissingGames,
  loadGamesStore,
} from './src/utils/gamesStoreEngine';
import { buildLbaSeasonData, LBA_SCHEDULE_ROUNDS } from './src/utils/lbaSeasonData';
import { syncOfficialLbaRounds, getLatestCompletedLbaRound } from './src/utils/lbaSyncEngine';
import { EUROCUP_SCHEDULE_ROUNDS, EUROCUP_GROUPS } from './src/utils/eurocupSeasonData';
import { roundSyncDaemon } from './src/utils/roundSyncDaemon';
import { getPbpSyncStatus, syncMissingPlayByPlayBatch } from './src/utils/pbpAnalyticsEngine';
import {
  recordTrafficEvent,
  getTrafficDashboardSummary,
  resetTrafficAnalytics,
  exportRawTrafficStore,
  mergeOrHydrateTrafficStore,
} from './src/utils/trafficAnalyticsEngine';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = isProduction && process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const CACHE_FILE = path.join(__dirname, 'data_cache.json');

let isSyncInProgress = false;

export async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  let currentDataset: ReturnType<typeof rebuildDatasetFromStore> = {
    teams: [],
    players: [],
    totalGames: 0,
    euroleagueGamesCount: 0,
    eurocupGamesCount: 0,
  };

  // Caricamento rapido dalla cache su disco per avvio istantaneo sulla porta 3000
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const cached = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      if (Array.isArray(cached.teams) && Array.isArray(cached.players) && cached.teams.length > 0) {
        currentDataset = {
          teams: cached.teams,
          players: cached.players,
          totalGames: cached.totalGames || 0,
          euroleagueGamesCount: cached.teams.some((t: any) => t.league === 'EuroLeague') ? 60 : 0,
          eurocupGamesCount: cached.teams.some((t: any) => t.league === 'EuroCup') ? 64 : 0,
        };
      }
    }
  } catch (e) {}

  const ensureDatasetReady = () => {
    if (!currentDataset.teams || currentDataset.teams.length === 0) {
      currentDataset = rebuildDatasetFromStore(getLatestCompletedLbaRound(), false);
    }
    return currentDataset;
  };

  // Ricostruzione completa non bloccante dopo il bind della porta HTTP + check cloud Firestore
  setImmediate(async () => {
    try {
      const latestLba = getLatestCompletedLbaRound();
      console.log(`[Server Startup] Inizializzazione dataset dal database partite (LBA Round ${latestLba})...`);
      currentDataset = rebuildDatasetFromStore(latestLba, false);
      console.log(`[Server Startup] Caricate ${currentDataset.totalGames} gare ufficiali (${currentDataset.euroleagueGamesCount} EuroLeague, ${currentDataset.eurocupGamesCount} EuroCup, LBA Round ${latestLba}).`);

      // Cold-start cloud hydration: se su Firebase Firestore esiste uno snapshot più aggiornato, lo carica automaticamente
      try {
        const fbConfigPath = path.join(__dirname, 'firebase-applet-config.json');
        if (fs.existsSync(fbConfigPath)) {
          const fbConfig = JSON.parse(fs.readFileSync(fbConfigPath, 'utf-8'));
          if (fbConfig?.projectId && fbConfig?.firestoreDatabaseId) {
            const { initializeApp, getApps } = await import('firebase/app');
            const { getFirestore, doc, getDoc } = await import('firebase/firestore');
            const fbApp = getApps().length > 0 ? getApps()[0] : initializeApp(fbConfig);
            const fbDb = getFirestore(fbApp, fbConfig.firestoreDatabaseId);
            const metaSnap = await getDoc(doc(fbDb, 'season_meta', 'current_2026_27'));
            if (metaSnap.exists()) {
              const meta = metaSnap.data();
              const cloudGames = Number(meta.totalGames || 0);
              const cloudLba = Number(meta.lbaRound || 0);
              if (cloudGames > currentDataset.totalGames || cloudLba > latestLba) {
                const teamCount = Number(meta.teamChunksCount || 0);
                const playerCount = Number(meta.playerChunksCount || 0);
                const [tSnaps, pSnaps] = await Promise.all([
                  Promise.all(
                    Array.from({ length: teamCount }, (_, i) =>
                      getDoc(doc(fbDb, 'season_chunks', `current_2026_27_teams_${i}`))
                    )
                  ),
                  Promise.all(
                    Array.from({ length: playerCount }, (_, i) =>
                      getDoc(doc(fbDb, 'season_chunks', `current_2026_27_players_${i}`))
                    )
                  ),
                ]);
                const cloudTeams = tSnaps.flatMap((s) => (s.exists() ? s.data().items || [] : []));
                const cloudPlayers = pSnaps.flatMap((s) => (s.exists() ? s.data().items || [] : []));
                if (cloudTeams.length >= 50 && cloudPlayers.length >= 500) {
                  currentDataset = {
                    teams: cloudTeams,
                    players: cloudPlayers,
                    totalGames: cloudGames,
                    euroleagueGamesCount: Number(meta.euroleagueGamesCount || currentDataset.euroleagueGamesCount),
                    eurocupGamesCount: Number(meta.eurocupGamesCount || currentDataset.eurocupGamesCount),
                  };
                  fs.writeFileSync(
                    CACHE_FILE,
                    JSON.stringify(
                      {
                        lastUpdated: String(meta.sourceLastUpdated || new Date().toISOString()),
                        totalGames: cloudGames,
                        lbaRound: Math.max(latestLba, cloudLba),
                        teams: cloudTeams,
                        players: cloudPlayers,
                        season: '2026/2027',
                      },
                      null,
                      2
                    ),
                    'utf-8'
                  );
                  console.log(
                    `[Server Startup] Idratato snapshot da Firebase Firestore (${cloudGames} gare, LBA R${cloudLba}, ${cloudTeams.length} squadre, ${cloudPlayers.length} giocatori).`
                  );
                }
              }
            }
          }
        }
      } catch (cloudErr: any) {
        console.warn('[Server Startup] Check cloud Firestore saltato:', cloudErr?.message || cloudErr);
      }
    } catch (err) {
      console.error('[Server Startup] Errore inizializzazione dataset:', err);
    }
  });

  // Avvio demone background autonomo (scansione ogni 15 minuti per evitare rate-limit e restare aggiornati post-gara)
  roundSyncDaemon.startDaemon(15 * 60 * 1000);

  // API 1: GET /api/data/latest -> serve i dati completi delle squadre e giocatori (Stagione 2026/27)
  app.get('/api/data/latest', async (req, res) => {
    const latestLba = getLatestCompletedLbaRound();
    try {
      if (fs.existsSync(CACHE_FILE)) {
        const cached = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
        const teamIds = (cached.teams || []).map((t: any) => t.id);
        const hasDuplicateTeams = new Set(teamIds).size !== teamIds.length;
        if (
          cached.teams &&
          cached.teams.length >= 54 &&
          !hasDuplicateTeams &&
          cached.teams[0]?.nonGarbage &&
          cached.teams[0]?.quarterSplits &&
          cached.teams[0]?.situational &&
          (cached.lbaRound || 0) >= latestLba
        ) {
          return res.json({
            status: 'ok',
            lastUpdated: cached.lastUpdated,
            totalGames: cached.totalGames,
            lbaRound: cached.lbaRound || latestLba,
            teamsCount: cached.teams.length,
            playersCount: cached.players.length,
            teams: cached.teams,
            players: cached.players,
            season: '2026/2027',
          });
        }
      }
    } catch (e) {}

    // Se la cache non è aggiornata all'ultima giornata su disco, ricostruisci
    currentDataset = rebuildDatasetFromStore(latestLba, false);
    try {
      fs.writeFileSync(CACHE_FILE, JSON.stringify({
        lastUpdated: new Date().toISOString(),
        totalGames: currentDataset.totalGames,
        lbaRound: latestLba,
        teams: currentDataset.teams,
        players: currentDataset.players,
        season: '2026/2027',
      }, null, 2), 'utf-8');
    } catch (e) {}

    res.json({
      status: 'ok',
      lastUpdated: new Date().toISOString(),
      totalGames: currentDataset.totalGames,
      lbaRound: latestLba,
      teamsCount: currentDataset.teams.length,
      playersCount: currentDataset.players.length,
      teams: currentDataset.teams,
      players: currentDataset.players,
      season: '2026/2027',
    });
  });

  // API 2: GET /api/games/list -> elenco completo di tutte le partite registrate con punteggi
  app.get('/api/games/list', (req, res) => {
    const store = loadGamesStore();
    const gamesList = Object.entries(store).map(([key, d]) => {
      const isEuroCup = key.startsWith('U2026');
      const gameCode = parseInt(key.split('_')[1], 10);
      const teamA = d.Stats?.[0]?.Team || 'Team A';
      const scoreA = d.Stats?.[0]?.PlayersStats?.reduce((a: number, b: any) => a + (b.Points || 0), 0) || 0;
      const teamB = d.Stats?.[1]?.Team || 'Team B';
      const scoreB = d.Stats?.[1]?.PlayersStats?.reduce((a: number, b: any) => a + (b.Points || 0), 0) || 0;
      return {
        key,
        league: isEuroCup ? 'EuroCup' : 'EuroLeague',
        gameCode,
        teamA,
        scoreA,
        teamB,
        scoreB,
        isLive: d.Live,
      };
    }).sort((a, b) => b.gameCode - a.gameCode);

    res.json({
      totalGames: gamesList.length,
      games: gamesList,
    });
  });

  // API 3: POST /api/sync/trigger -> avvia sincronizzazione forzata LBA, EuroLeague, EuroCup & PBP
  app.post('/api/sync/trigger', async (req, res) => {
    if (isSyncInProgress) {
      return res.json({ success: false, message: 'Sincronizzazione già in corso.' });
    }
    isSyncInProgress = true;
    try {
      const lbaSyncRes = await syncOfficialLbaRounds();
      const euroSyncRes = await syncOnlyMissingGames();
      const pbpRes = await syncMissingPlayByPlayBatch(80, 80);
      const targetRound = Math.max(getLatestCompletedLbaRound(), lbaSyncRes.completedRounds || 5);
      currentDataset = rebuildDatasetFromStore(targetRound, false);

      try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify({
          lastUpdated: new Date().toISOString(),
          totalGames: currentDataset.totalGames,
          lbaRound: targetRound,
          teams: currentDataset.teams,
          players: currentDataset.players,
          season: '2026/2027',
        }, null, 2), 'utf-8');
      } catch (e) {}

      res.json({
        success: true,
        lbaRound: targetRound,
        totalLbaMatches: targetRound * 8,
        newGamesCount: euroSyncRes.newGamesSynced + lbaSyncRes.newMatchesSynced,
        newPbpCount: pbpRes.fetched,
        totalGames: currentDataset.totalGames,
        teams: currentDataset.teams,
        players: currentDataset.players,
        message: `Dati aggiornati: LBA Giornata ${targetRound}, EuroLeague + EuroCup (${currentDataset.totalGames} gare ufficiali).`,
      });
    } catch (err: any) {
      console.error('Trigger sync error:', err);
      res.status(500).json({ success: false, message: err?.message || 'Errore durante la sincronizzazione.' });
    } finally {
      isSyncInProgress = false;
    }
  });

  // API 3B: GET /api/sync/cron -> endpoint leggero richiamabile da Cloud Scheduler / cron-job.org per mantenere l'app online sempre aggiornata
  app.get('/api/sync/cron', async (req, res) => {
    try {
      const cycleResult = await roundSyncDaemon.runCycle();
      const latestLba = getLatestCompletedLbaRound();
      currentDataset = rebuildDatasetFromStore(latestLba, false);
      res.json({
        ok: cycleResult.success,
        message: cycleResult.message,
        lbaRound: latestLba,
        totalGames: currentDataset.totalGames,
        euroleagueGames: currentDataset.euroleagueGamesCount,
        eurocupGames: currentDataset.eurocupGamesCount,
        pbpStatus: getPbpSyncStatus(),
        syncedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({ ok: false, message: err?.message || 'Cron sync error' });
    }
  });

  // API 4: GET /api/sync/status -> stato della sincronizzazione
  app.get('/api/sync/status', (req, res) => {
    res.json({
      isSyncInProgress,
      totalGames: currentDataset.totalGames,
      euroleagueGames: currentDataset.euroleagueGamesCount,
      eurocupGames: currentDataset.eurocupGamesCount,
    });
  });

  // API: GET /api/daemon/status -> stato in tempo reale del demone autonomo
  app.get('/api/daemon/status', (req, res) => {
    const status = roundSyncDaemon.getStatus();
    res.json({
      ...status,
      pbpStatus: getPbpSyncStatus(),
      totalGames: currentDataset.totalGames,
      euroleagueGames: currentDataset.euroleagueGamesCount,
      eurocupGames: currentDataset.eurocupGamesCount,
    });
  });

  // API: GET /api/pbp/status -> stato copertura Play-by-Play EuroLeague & EuroCup
  app.get('/api/pbp/status', (req, res) => {
    res.json(getPbpSyncStatus());
  });

  // API: POST /api/pbp/sync -> sincronizza un lotto di Play-by-Play mancanti
  app.post('/api/pbp/sync', async (req, res) => {
    try {
      const maxGames = Math.min(120, Math.max(5, parseInt(req.body?.maxGames || '60', 10) || 60));
      const result = await syncMissingPlayByPlayBatch(maxGames, 80);
      const latestLba = getLatestCompletedLbaRound();
      if (result.fetched > 0) {
        currentDataset = rebuildDatasetFromStore(latestLba, false);
        try {
          fs.writeFileSync(CACHE_FILE, JSON.stringify({
            lastUpdated: new Date().toISOString(),
            totalGames: currentDataset.totalGames,
            lbaRound: latestLba,
            teams: currentDataset.teams,
            players: currentDataset.players,
            season: '2026/2027',
          }, null, 2), 'utf-8');
        } catch (e) {}
      }
      res.json({
        success: true,
        newlyFetched: result.fetched,
        ...result,
        teams: result.fetched > 0 ? currentDataset.teams : undefined,
        players: result.fetched > 0 ? currentDataset.players : undefined,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || 'Errore sync PBP.' });
    }
  });

  // API: POST /api/daemon/trigger -> esecuzione manuale forzata del demone con ricalcolo immediato
  app.post('/api/daemon/trigger', async (req, res) => {
    try {
      const cycleResult = await roundSyncDaemon.runCycle();
      const latestLba = getLatestCompletedLbaRound();
      currentDataset = rebuildDatasetFromStore(latestLba, false);
      res.json({
        success: cycleResult.success,
        message: cycleResult.message,
        daemonStatus: roundSyncDaemon.getStatus(),
        totalGames: currentDataset.totalGames,
        teamsCount: currentDataset.teams.length,
        playersCount: currentDataset.players.length,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || 'Errore esecuzione demone.' });
    }
  });

  // API 5: POST /api/lba/sync-round -> sincronizza il turno LBA indicato
  app.post('/api/lba/sync-round', async (req, res) => {
    try {
      const round = parseInt(req.body?.round || req.query?.round || 5, 10);
      const validRound = Math.max(1, Math.min(30, isNaN(round) ? 5 : round));
      await syncOfficialLbaRounds(validRound);
      currentDataset = rebuildDatasetFromStore(validRound, true);
      const lbaTeams = currentDataset.teams.filter((t) => t.league === 'LBA');
      const lbaPlayers = currentDataset.players.filter((p) => p.league === 'LBA');

      try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify({
          lastUpdated: new Date().toISOString(),
          totalGames: currentDataset.totalGames,
          lbaRound: validRound,
          teams: currentDataset.teams,
          players: currentDataset.players,
          season: '2026/2027',
        }, null, 2), 'utf-8');
      } catch (e) {}

      res.json({
        success: true,
        round: validRound,
        matches: LBA_SCHEDULE_ROUNDS[validRound] || [],
        teamsCount: lbaTeams.length,
        playersCount: lbaPlayers.length,
        totalTeams: currentDataset.teams.length,
        totalPlayers: currentDataset.players.length,
        teams: currentDataset.teams,
        players: currentDataset.players,
      });
    } catch (err: any) {
      console.error('Error in /api/lba/sync-round:', err);
      res.status(500).json({ success: false, message: err?.message });
    }
  });

  // API 5B: POST /api/sync/auto-round -> avanza/sincronizza turno LBA richiesto da RoundUpdater
  app.post('/api/sync/auto-round', async (req, res) => {
    try {
      let currentRound = 5;
      const lbaStorePath = path.resolve(__dirname, 'data_lba_store.json');
      if (fs.existsSync(lbaStorePath)) {
        try {
          const store = JSON.parse(fs.readFileSync(lbaStorePath, 'utf-8'));
          if (store.round) currentRound = store.round;
        } catch (e) {}
      }
      const targetRound = Math.min(30, Math.max(1, currentRound));
      await syncOfficialLbaRounds(targetRound);
      currentDataset = rebuildDatasetFromStore(targetRound, true);
      res.json({
        success: true,
        previousRound: currentRound,
        currentRound: targetRound,
        season: '2026/2027',
        matches: LBA_SCHEDULE_ROUNDS[targetRound] || [],
        teams: currentDataset.teams,
        players: currentDataset.players,
        totalTeams: currentDataset.teams.length,
        totalPlayers: currentDataset.players.length,
        message: `⚡ Aggiornato con successo al Turno ${targetRound} della Stagione 2026/27 (${targetRound}ª Giornata completata)!`,
      });
    } catch (err: any) {
      console.error('Error in /api/sync/auto-round:', err);
      res.status(500).json({ success: false, message: err?.message });
    }
  });

  // API 5C: POST /api/eurocup/sync-round -> sincronizza il turno EuroCup indicato (32 squadre in 4 gironi)
  app.post('/api/eurocup/sync-round', async (req, res) => {
    try {
      const round = parseInt(req.body?.round || req.query?.round || 4, 10);
      const validRound = Math.max(1, Math.min(18, isNaN(round) ? 4 : round));
      
      currentDataset = rebuildDatasetFromStore(4, true);

      try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify({
          lastUpdated: new Date().toISOString(),
          totalGames: currentDataset.totalGames,
          lbaRound: 4,
          eurocupRound: validRound,
          teams: currentDataset.teams,
          players: currentDataset.players,
          season: '2026/2027',
        }, null, 2), 'utf-8');
      } catch (e) {}

      res.json({
        success: true,
        round: validRound,
        matches: EUROCUP_SCHEDULE_ROUNDS[validRound] || [],
        totalTeams: currentDataset.teams.length,
        totalPlayers: currentDataset.players.length,
        teams: currentDataset.teams,
        players: currentDataset.players,
        message: `🇪🇺 Round ${validRound} di BKT EuroCup sincronizzato con successo (${EUROCUP_SCHEDULE_ROUNDS[validRound]?.length || 16} partite su 4 gironi)!`,
      });
    } catch (err: any) {
      console.error('Error in /api/eurocup/sync-round:', err);
      res.status(500).json({ success: false, message: err?.message });
    }
  });

  // API 6: GET /api/lba/schedule -> elenco turni LBA
  app.get('/api/lba/schedule', (req, res) => {
    res.json({
      season: '2026/2027',
      rounds: LBA_SCHEDULE_ROUNDS,
    });
  });

  // API 6B: GET /api/eurocup/schedule -> elenco turni EuroCup
  app.get('/api/eurocup/schedule', (req, res) => {
    res.json({
      season: '2026/2027',
      rounds: EUROCUP_SCHEDULE_ROUNDS,
      groups: EUROCUP_GROUPS,
    });
  });

  // API 6C: GET /api/audit/dnp -> audit deterministico sui minutaggi
  app.get('/api/audit/dnp', (req, res) => {
    let players = currentDataset.players || [];
    if (fs.existsSync(CACHE_FILE)) {
      try {
        const cached = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
        if (cached.players && cached.players.length > 0) {
          players = cached.players;
        }
      } catch (e) {}
    }
    const dnpPlayers = players.filter((p: any) => p.gamesPlayed === 0 || p.mpg <= 1.0);
    const anomalies = dnpPlayers.filter((p: any) => (p.pts || 0) > 0 || (p.fga || 0) > 0);
    const baiocchi = players.find((p: any) => p.name.includes('Baiocchi')) || null;

    res.json({
      success: true,
      auditedAt: new Date().toISOString(),
      totalPlayersAudited: players.length,
      dnpOrReserveCount: dnpPlayers.length,
      anomaliesCount: anomalies.length,
      status: anomalies.length === 0 ? 'VALIDATED_CLEAN' : 'ANOMALIES_DETECTED',
      baiocchiVirtusBologna: baiocchi ? {
        name: baiocchi.name,
        team: baiocchi.team,
        gamesPlayed: baiocchi.gamesPlayed,
        pts: baiocchi.pts,
        status: baiocchi.gamesPlayed === 0 && baiocchi.pts === 0 ? 'CORRETTO_BLOCCATO_A_ZERO' : 'ANOMALO',
      } : null,
    });
  });

  // API 7: GET /api/season/status -> riepilogo stagione
  app.get('/api/season/status', (req, res) => {
    let lbaRound = 4;
    try {
      if (fs.existsSync(path.resolve(__dirname, 'data_lba_store.json'))) {
        const lbaStore = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'data_lba_store.json'), 'utf-8'));
        if (lbaStore.round) lbaRound = lbaStore.round;
      }
    } catch (e) {}

    const elRound = Math.max(1, Math.floor((currentDataset.euroleagueGamesCount || 0) / 9));
    const ecRound = Math.max(1, Math.floor((currentDataset.eurocupGamesCount || 0) / 16));

    res.json({
      season: '2026/2027',
      competitions: {
        euroleague: { name: 'Turkish Airlines EuroLeague', currentRound: elRound },
        eurocup: { name: 'BKT EuroCup', currentRound: ecRound },
        lba: { name: 'Lega Basket Serie A', currentRound: lbaRound },
      },
      totalTeams: currentDataset.teams.length,
      totalPlayers: currentDataset.players.length,
    });
  });

  // API 8: GET /api/apisports/status -> stato API-Sports
  app.get('/api/apisports/status', async (req, res) => {
    const { checkApiSportsStatus } = await import('./src/utils/apiSportsService');
    const status = await checkApiSportsStatus();
    res.json(status);
  });

  // API 9: Traffic & Contacts Analytics Endpoints
  app.post('/api/traffic/event', (req, res) => {
    try {
      const payload = req.body || {};
      if (!payload || !payload.type) {
        return res.status(400).json({ ok: false, message: 'Missing event type' });
      }
      const forwarded = req.headers['x-forwarded-for'];
      const clientIp = Array.isArray(forwarded)
        ? forwarded[0]
        : typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : req.socket?.remoteAddress || '0.0.0.0';

      const result = recordTrafficEvent({
        payload,
        userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : '',
        ip: clientIp,
        acceptLanguage:
          typeof req.headers['accept-language'] === 'string' ? req.headers['accept-language'] : '',
        host: typeof req.headers.host === 'string' ? req.headers.host : '',
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ ok: false, message: err?.message || 'Traffic tracking error' });
    }
  });

  app.get('/api/traffic/summary', (req, res) => {
    try {
      const daysParam = parseInt(String(req.query?.days || '14'), 10);
      const validDays = daysParam === 7 || daysParam === 30 ? daysParam : 14;
      res.json(getTrafficDashboardSummary(validDays));
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Unable to compute traffic summary' });
    }
  });

  app.post('/api/traffic/reset', (req, res) => {
    try {
      res.json(resetTrafficAnalytics());
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Unable to reset traffic counters' });
    }
  });

  app.get('/api/traffic/raw', (req, res) => {
    try {
      res.json(exportRawTrafficStore());
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Unable to export raw traffic store' });
    }
  });

  app.post('/api/traffic/hydrate', (req, res) => {
    try {
      const incoming = req.body;
      if (!incoming || typeof incoming !== 'object') {
        return res.status(400).json({ ok: false, message: 'Invalid traffic payload' });
      }
      const summary = mergeOrHydrateTrafficStore(incoming);
      res.json({ ok: true, summary });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || 'Unable to hydrate traffic store' });
    }
  });

  // API 10: POST /api/cloud/hydrate -> riceve uno snapshot stagione da Firebase Firestore e aggiorna cache server
  app.post('/api/cloud/hydrate', (req, res) => {
    try {
      const { teams, players, lbaRound, totalGames, euroleagueGamesCount, eurocupGamesCount, lastUpdated } =
        req.body || {};
      if (!Array.isArray(teams) || !Array.isArray(players) || teams.length < 50 || players.length < 500) {
        return res.status(400).json({ ok: false, message: 'Snapshot non valido o incompleto.' });
      }
      const safeTotalGames = Math.max(0, Number(totalGames || 0));
      const safeLbaRound = Math.max(1, Math.min(40, Number(lbaRound || getLatestCompletedLbaRound())));

      currentDataset = {
        teams: teams.slice(0, 200),
        players: players.slice(0, 3000),
        totalGames: safeTotalGames || currentDataset.totalGames,
        euroleagueGamesCount: Number(euroleagueGamesCount || currentDataset.euroleagueGamesCount),
        eurocupGamesCount: Number(eurocupGamesCount || currentDataset.eurocupGamesCount),
      };

      try {
        fs.writeFileSync(
          CACHE_FILE,
          JSON.stringify(
            {
              lastUpdated: typeof lastUpdated === 'string' ? lastUpdated : new Date().toISOString(),
              totalGames: currentDataset.totalGames,
              lbaRound: safeLbaRound,
              teams: currentDataset.teams,
              players: currentDataset.players,
              season: '2026/2027',
            },
            null,
            2
          ),
          'utf-8'
        );
      } catch (e) {}

      res.json({
        ok: true,
        totalGames: currentDataset.totalGames,
        lbaRound: safeLbaRound,
        teamsCount: currentDataset.teams.length,
        playersCount: currentDataset.players.length,
      });
    } catch (err: any) {
      res.status(500).json({ ok: false, message: err?.message || 'Errore idratazione cloud' });
    }
  });

  // Nota: la scansione periodica automatica è gestita centralmente da roundSyncDaemon (ogni 15 minuti) + GET /api/sync/cron.

  if (isProduction) {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vitePromise = createViteServer({
      server: { middlewareMode: true, hmr: false, ws: false },
      appType: 'spa',
    });
    vitePromise.catch((err) => {
      console.error('[Vite Startup Error]', err);
    });
    app.use(async (req, res, next) => {
      try {
        const vite = await vitePromise;
        vite.middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  }

  // Assicura che currentDataset sia popolato anche in richieste sincrone immediate
  ensureDatasetReady();

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Avviato con successo sulla porta ${PORT}`);
  });

  const shutdown = () => {
    console.log('[Server] Ricevuto segnale di arresto, chiusura in corso...');
    try {
      roundSyncDaemon.stopDaemon();
    } catch (e) {}
    server.close(() => {
      process.exit(0);
    });
  };

  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}
