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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = 3000;
const CACHE_FILE = path.join(__dirname, 'data_cache.json');

let isSyncInProgress = false;

export async function startServer() {
  const app = express();
  app.use(express.json());

  // Inizializza il dataset dal games store persistente
  console.log('[Server Startup] Inizializzazione dataset dal database partite...');
  let currentDataset = rebuildDatasetFromStore(3);
  console.log(`[Server Startup] Caricate ${currentDataset.totalGames} gare ufficiali (${currentDataset.euroleagueGamesCount} EuroLeague, ${currentDataset.eurocupGamesCount} EuroCup).`);

  // Lancia scansione delle sole partite mancanti all'avvio (non re-interroga mai quelle già concluse!)
  setTimeout(async () => {
    if (!isSyncInProgress) {
      isSyncInProgress = true;
      try {
        console.log('[Auto-Sync Server] Scansione intelligente partite mancanti/live...');
        const result = await syncOnlyMissingGames();
        if (result.newGamesSynced > 0) {
          currentDataset = rebuildDatasetFromStore(3);
          console.log(`[Auto-Sync Server] ${result.newGamesSynced} nuove partite registrate! Totale: ${result.totalGames}`);
        } else {
          console.log('[Auto-Sync Server] Tutte le partite concluse sono già sincronizzate.');
        }
      } catch (err) {
        console.error('[Auto-Sync Server] Errore scansione:', err);
      } finally {
        isSyncInProgress = false;
      }
    }
  }, 2000);

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
          (cached.lbaRound >= 3 || cached.teams.some((t: any) => t.name === 'Virtus Costa Bologna' && t.gp === 3))
        ) {
          return res.json({
            status: 'ok',
            lastUpdated: cached.lastUpdated,
            totalGames: cached.totalGames,
            lbaRound: cached.lbaRound || 3,
            teamsCount: cached.teams.length,
            playersCount: cached.players.length,
            teams: cached.teams,
            players: cached.players,
            season: '2026/2027',
          });
        }
      }
    } catch (e) {}

    // Se la cache non è aggiornata, ricostruisci alla 3ª giornata
    currentDataset = rebuildDatasetFromStore(3);
    try {
      fs.writeFileSync(CACHE_FILE, JSON.stringify({
        lastUpdated: new Date().toISOString(),
        totalGames: currentDataset.totalGames,
        lbaRound: 3,
        teams: currentDataset.teams,
        players: currentDataset.players,
        season: '2026/2027',
      }, null, 2), 'utf-8');
    } catch (e) {}

    res.json({
      status: 'ok',
      lastUpdated: new Date().toISOString(),
      totalGames: currentDataset.totalGames,
      lbaRound: 3,
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
      const lbaSyncRes = await syncOfficialLbaRounds(4);
      const euroSyncRes = await syncOnlyMissingGames();
      const targetRound = Math.max(3, lbaSyncRes.completedRounds || 3);
      currentDataset = rebuildDatasetFromStore(targetRound);

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

  // API 5: POST /api/lba/sync-round -> sincronizza il turno LBA indicato
  app.post('/api/lba/sync-round', (req, res) => {
    try {
      const round = parseInt(req.body?.round || req.query?.round || 3, 10);
      const validRound = Math.max(1, Math.min(30, isNaN(round) ? 3 : round));
      const { teams: lbaTeams, players: lbaPlayers } = buildLbaSeasonData(validRound);
      const lbaStorePath = path.resolve(__dirname, 'data_lba_store.json');
      fs.writeFileSync(
        lbaStorePath,
        JSON.stringify(
          {
            lastUpdated: new Date().toISOString(),
            round: validRound,
            season: '2026/2027',
            league: 'LBA Serie A',
            teams: lbaTeams,
            players: lbaPlayers,
          },
          null,
          2
        ),
        'utf-8'
      );
      currentDataset = rebuildDatasetFromStore(validRound);
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
    let lbaRound = 3;
    try {
      if (fs.existsSync(path.resolve(__dirname, 'data_lba_store.json'))) {
        const lbaStore = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'data_lba_store.json'), 'utf-8'));
        if (lbaStore.round) lbaRound = lbaStore.round;
      }
    } catch (e) {}

    res.json({
      season: '2026/2027',
      competitions: {
        euroleague: { name: 'Turkish Airlines EuroLeague', currentRound: 4 },
        eurocup: { name: 'BKT EuroCup', currentRound: 3 },
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
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Avviato con successo sulla porta ${PORT}`);
  });
}

// Avvio automatico se eseguito direttamente
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  startServer();
}
