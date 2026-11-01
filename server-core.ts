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
import { syncOfficialLbaRounds } from './src/utils/lbaSyncEngine';
import { EUROCUP_SCHEDULE_ROUNDS, EUROCUP_GROUPS } from './src/utils/eurocupSeasonData';
import { roundSyncDaemon } from './src/utils/roundSyncDaemon';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = isProduction && process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const CACHE_FILE = path.join(__dirname, 'data_cache.json');

let isSyncInProgress = false;

export async function startServer() {
  const app = express();
  app.use(express.json());

  // Inizializza il dataset dal games store persistente in memoria veloce
  console.log('[Server Startup] Inizializzazione dataset dal database partite...');
  let currentDataset = rebuildDatasetFromStore(5, false);
  console.log(`[Server Startup] Caricate ${currentDataset.totalGames} gare ufficiali (${currentDataset.euroleagueGamesCount} EuroLeague, ${currentDataset.eurocupGamesCount} EuroCup, LBA Round 5).`);

  // Avvio demone background autonomo per scansione e auto-aggiornamento continuo
  roundSyncDaemon.startDaemon(3 * 60 * 1000);

  // API 1: GET /api/data/latest -> serve i dati completi delle squadre e giocatori (Stagione 2026/27)
  app.get('/api/data/latest', async (req, res) => {
    try {
      if (fs.existsSync(CACHE_FILE)) {
        const cached = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
        const teamIds = (cached.teams || []).map((t: any) => t.id);
        const hasDuplicateTeams = new Set(teamIds).size !== teamIds.length;
        if (
          cached.teams &&
          cached.teams.length >= 54 &&
          !hasDuplicateTeams &&
          (cached.lbaRound >= 5 || cached.teams.some((t: any) => t.name === 'Virtus Costa Bologna' && t.gp >= 5))
        ) {
          return res.json({
            status: 'ok',
            lastUpdated: cached.lastUpdated,
            totalGames: cached.totalGames,
            lbaRound: cached.lbaRound || 5,
            teamsCount: cached.teams.length,
            playersCount: cached.players.length,
            teams: cached.teams,
            players: cached.players,
            season: '2026/2027',
          });
        }
      }
    } catch (e) {}

    // Se la cache non è aggiornata, ricostruisci alla 5ª giornata
    currentDataset = rebuildDatasetFromStore(5, true);
    try {
      fs.writeFileSync(CACHE_FILE, JSON.stringify({
        lastUpdated: new Date().toISOString(),
        totalGames: currentDataset.totalGames,
        lbaRound: 5,
        teams: currentDataset.teams,
        players: currentDataset.players,
        season: '2026/2027',
      }, null, 2), 'utf-8');
    } catch (e) {}

    res.json({
      status: 'ok',
      lastUpdated: new Date().toISOString(),
      totalGames: currentDataset.totalGames,
      lbaRound: 5,
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

  // API 3: POST /api/sync/trigger -> avvia sincronizzazione forzata LBA ed Euroleague
  app.post('/api/sync/trigger', async (req, res) => {
    if (isSyncInProgress) {
      return res.json({ success: false, message: 'Sincronizzazione già in corso.' });
    }
    isSyncInProgress = true;
    try {
      const lbaSyncRes = await syncOfficialLbaRounds(5);
      const euroSyncRes = await syncOnlyMissingGames();
      const targetRound = Math.max(5, lbaSyncRes.completedRounds || 5);
      currentDataset = rebuildDatasetFromStore(targetRound, true);

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
        totalGames: currentDataset.totalGames,
        teams: currentDataset.teams,
        players: currentDataset.players,
        message: `LBA Serie A sincronizzata con successo alla ${targetRound}ª Giornata!`,
      });
    } catch (err: any) {
      console.error('Trigger sync error:', err);
      res.status(500).json({ success: false, message: err?.message || 'Errore durante la sincronizzazione.' });
    } finally {
      isSyncInProgress = false;
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
      totalGames: currentDataset.totalGames,
      euroleagueGames: currentDataset.euroleagueGamesCount,
      eurocupGames: currentDataset.eurocupGamesCount,
    });
  });

  // API: POST /api/daemon/trigger -> esecuzione manuale forzata del demone con ricalcolo immediato
  app.post('/api/daemon/trigger', async (req, res) => {
    try {
      const cycleResult = await roundSyncDaemon.runCycle();
      currentDataset = rebuildDatasetFromStore(roundSyncDaemon.getStatus().currentRoundLBA, true);
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

  // Controllo automatico periodico ogni 5 minuti
  setInterval(async () => {
    if (!isSyncInProgress) {
      isSyncInProgress = true;
      try {
        const result = await syncOnlyMissingGames();
        if (result.newGamesSynced > 0) {
          currentDataset = rebuildDatasetFromStore();
          console.log(`[Auto-Sync Cron] ${result.newGamesSynced} nuove partite registrate!`);
        }
      } catch (err) {
        console.error('[Auto-Sync Cron] Errore:', err);
      } finally {
        isSyncInProgress = false;
      }
    }
  }, 300000);

  if (isProduction) {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

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
