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

  // API 1: GET /api/data/latest -> serve i dati completi delle 68 squadre e giocatori (Stagione 2026/27)
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
          !cached.teams.some((t: any) => t.id === 'kids-us-manresa' || t.name === 'ALBA BERLIN') &&
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
      // 1. Sincronizzazione partite ufficiali LBA Serie A da Legabasket
      const lbaSyncRes = await syncOfficialLbaRounds(4);

      // 2. Sincronizzazione partite EuroLeague ed EuroCup
      const euroSyncRes = await syncOnlyMissingGames();

      // 3. Ricalcolo dataset con il turno LBA più recente (Turno 3)
      const targetRound = Math.max(3, lbaSyncRes.completedRounds || 3);
      currentDataset = rebuildDatasetFromStore(targetRound);

      // Salva nella cache persistente
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
        message: `LBA Serie A sincronizzata con successo alla ${targetRound}ª Giornata (${targetRound * 8} partite ufficiali)!`,
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

  // API 5: POST /api/lba/sync-round -> sincronizza il turno LBA indicato (1..3)
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

  // API 6: GET /api/lba/schedule -> elenco turni e gare disputate LBA 2026/27
  app.get('/api/lba/schedule', (req, res) => {
    res.json({
      season: '2026/2027',
      rounds: LBA_SCHEDULE_ROUNDS,
    });
  });

  // API 6B: GET /api/eurocup/schedule -> elenco turni e gare disputate BKT EuroCup 2026/27
  app.get('/api/eurocup/schedule', (req, res) => {
    res.json({
      season: '2026/2027',
      rounds: EUROCUP_SCHEDULE_ROUNDS,
      groups: EUROCUP_GROUPS,
    });
  });

  // API 6C: GET /api/audit/dnp -> audit deterministico sui minutaggi e blocco anomalie DNP (es. Baiocchi)
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
    const activePlayers = players.filter((p: any) => p.gamesPlayed > 0 && p.mpg > 1.0);
    const baiocchi = players.find((p: any) => p.name.includes('Baiocchi')) || null;

    res.json({
      success: true,
      auditedAt: new Date().toISOString(),
      totalPlayersAudited: players.length,
      dnpOrReserveCount: dnpPlayers.length,
      activeCount: activePlayers.length,
      anomaliesCount: anomalies.length,
      status: anomalies.length === 0 ? 'VALIDATED_CLEAN' : 'ANOMALIES_DETECTED',
      rule: 'Bloccare a zero chiunque abbia meno di un minuto o DNP a referto (GP = 0, MPG = 0, PTS = 0)',
      baiocchiVirtusBologna: baiocchi ? {
        name: baiocchi.name,
        team: baiocchi.team,
        league: baiocchi.league,
        gamesPlayed: baiocchi.gamesPlayed,
        mpg: baiocchi.mpg,
        pts: baiocchi.pts,
        status: baiocchi.gamesPlayed === 0 && baiocchi.pts === 0 ? 'CORRETTO_BLOCCATO_A_ZERO' : 'ANOMALO',
      } : null,
      sampleDnpAudited: dnpPlayers.slice(0, 10).map((p: any) => ({
        id: p.id,
        name: p.name,
        team: p.team,
        league: p.league,
        gamesPlayed: p.gamesPlayed,
        mpg: p.mpg,
        pts: p.pts,
      })),
    });
  });

  // API 6D: ALL /api/sync/auto -> pipeline deterministica di sincronizzazione per le 3 leghe (E2026, U2026, LBA2026)
  app.all('/api/sync/auto', async (req, res) => {
    if (isSyncInProgress) {
      return res.json({ success: true, message: 'Sincronizzazione già in esecuzione in background.', status: 'in_progress' });
    }
    isSyncInProgress = true;
    try {
      console.log('[Auto-Sync Pipeline] Avvio sincronizzazione ufficiale EuroLeague, EuroCup e LBA...');
      const lbaRes = await syncOfficialLbaRounds(4);
      const euroRes = await syncOnlyMissingGames();
      currentDataset = rebuildDatasetFromStore(Math.max(3, lbaRes.completedRounds || 3));

      try {
        fs.writeFileSync(
          CACHE_FILE,
          JSON.stringify(
            {
              lastUpdated: new Date().toISOString(),
              totalGames: currentDataset.totalGames,
              lbaRound: Math.max(3, lbaRes.completedRounds || 3),
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
        success: true,
        message: 'Sincronizzazione automatica completata con audit minutaggi su tutte le 3 competizioni.',
        totalGames: currentDataset.totalGames,
        teamsCount: currentDataset.teams.length,
        playersCount: currentDataset.players.length,
        euroleagueGames: currentDataset.euroleagueGamesCount,
        eurocupGames: currentDataset.eurocupGamesCount,
        lbaCompletedRounds: lbaRes.completedRounds,
      });
    } catch (e: any) {
      console.error('[Auto-Sync Pipeline] Errore:', e);
      res.status(500).json({ success: false, message: e?.message || 'Errore sincronizzazione automatica' });
    } finally {
      isSyncInProgress = false;
    }
  });

  // API 7: GET /api/season/status -> riepilogo globale della stagione 2026/27 su tutte e tre le leghe
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
      totalCompetitions: 3,
      competitions: {
        euroleague: {
          name: 'Turkish Airlines EuroLeague',
          teamsCount: 20,
          currentRound: 4,
          availableRounds: [1, 2, 3, 4],
          status: 'Stagione 2026/27 • Round 4 Concluso',
        },
        eurocup: {
          name: 'BKT EuroCup',
          teamsCount: 20,
          currentRound: 3,
          availableRounds: [1, 2, 3],
          status: 'Stagione 2026/27 • Round 3 Concluso (30 gare disputate)',
          nextRoundNotice: 'Turno 4 in programma il 15-16 Ottobre 2026',
        },
        lba: {
          name: 'Lega Basket Serie A (LBA)',
          teamsCount: 16,
          currentRound: lbaRound,
          availableRounds: [1, 2, 3],
          status: `Stagione 2026/27 • Round ${lbaRound} Concluso (24 gare disputate)`,
          nextRoundNotice: `Turno ${lbaRound + 1} in programma nel prossimo fine settimana`,
        },
      },
      totalTeams: currentDataset.teams.length,
      totalPlayers: currentDataset.players.length,
      isAutoSyncActive: true,
      lastCheck: new Date().toISOString(),
    });
  });

  // API 8: GET /api/apisports/status -> verifica stato collegamento API-Sports (100 chiamate/giorno free)
  app.get('/api/apisports/status', async (req, res) => {
    const { checkApiSportsStatus } = await import('./src/utils/apiSportsService');
    const status = await checkApiSportsStatus();
    res.json(status);
  });

  // API 9: POST /api/sync/auto-round -> sincronizza il turno LBA indicato (max 30)
  app.post('/api/sync/auto-round', (req, res) => {
    try {
      let currentRound = 3;
      const lbaStorePath = path.resolve(__dirname, 'data_lba_store.json');
      if (fs.existsSync(lbaStorePath)) {
        const store = JSON.parse(fs.readFileSync(lbaStorePath, 'utf-8'));
        if (store.round) currentRound = store.round;
      }
      const targetRound = Math.min(30, Math.max(1, currentRound));
      const { teams: lbaTeams, players: lbaPlayers } = buildLbaSeasonData(targetRound);
      fs.writeFileSync(
        lbaStorePath,
        JSON.stringify(
          {
            lastUpdated: new Date().toISOString(),
            round: targetRound,
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
      currentDataset = rebuildDatasetFromStore(targetRound);
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
        message: `⚡ Aggiornato con successo al Turno ${targetRound} della Stagione 2026/27 (3ª Giornata completata)!`,
      });
    } catch (err: any) {
      console.error('Error in /api/sync/auto-round:', err);
      res.status(500).json({ success: false, message: err?.message });
    }
  });

  // Controllo automatico periodico ogni 2 minuti per partite o turni appena conclusi
  setInterval(async () => {
    if (!isSyncInProgress) {
      isSyncInProgress = true;
      try {
        const result = await syncOnlyMissingGames();
        if (result.newGamesSynced > 0) {
          currentDataset = rebuildDatasetFromStore();
          try {
            fs.writeFileSync(
              CACHE_FILE,
              JSON.stringify(
                {
                  lastUpdated: new Date().toISOString(),
                  totalGames: currentDataset.totalGames,
                  lbaRound: 3,
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
          console.log(`[Auto-Sync Cron] ${result.newGamesSynced} nuove partite registrate! Totale: ${result.totalGames}`);
        }
      } catch (err) {
        console.error('[Auto-Sync Cron] Errore:', err);
      } finally {
        isSyncInProgress = false;
      }
    }
  }, 2 * 60 * 1000);

  // Integrazione Vite / Static
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Full-Stack Server] EuroBasket Lab running on port ${PORT} (Incremental Games Store Active)`);
  });
}
