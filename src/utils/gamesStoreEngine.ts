import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TeamStats, PlayerStats } from '../types/basketball';
import { buildLbaSeasonData, LBA_SCHEDULE_ROUNDS } from './lbaSeasonData';
import { syncOfficialLbaRounds } from './lbaSyncEngine';

const ROOT_DIR = typeof process !== 'undefined' && typeof process.cwd === 'function' ? process.cwd() : '.';
const STORE_PATH = path.join(ROOT_DIR, 'data_games_store.json');
const LBA_STORE_PATH = path.join(ROOT_DIR, 'data_lba_store.json');
const CACHE_FILE = path.join(ROOT_DIR, 'data_cache.json');
const DATA_FILE = path.join(ROOT_DIR, 'src/data/basketballData.ts');

export const OFFICIAL_EUROLEAGUE_TEAMS = new Set([
  'CRVENA ZVEZDA MERIDIANBET BELGRADE',
  'ZALGIRIS KAUNAS',
  'DUBAI BASKETBALL',
  'REAL MADRID',
  'HAPOEL IBI TEL AVIV',
  'FC BAYERN MUNICH',
  'FC BARCELONA',
  'ANADOLU EFES ISTANBUL',
  'KOSNER BASKONIA VITORIA-GASTEIZ',
  'OLYMPIACOS PIRAEUS',
  'LDLC ASVEL VILLEURBANNE',
  'MACCABI RAPYD TEL AVIV',
  'PANATHINAIKOS AKTOR ATHENS',
  'PARIS BASKETBALL',
  'BESIKTAS ISTANBUL',
  'VALENCIA BASKET',
  'FENERBAHCE TARFIN ISTANBUL',
  'VIRTUS BOLOGNA',
  'PARTIZAN MOZZART BET BELGRADE',
  'ARMANI OLIMPIA MILAN',
]);

export const OFFICIAL_EUROCUP_TEAMS = new Set([
  '7BET-LIETKABELIS PANEVEZYS',
  'ARIS MIDEA THESSALONIKI',
  'BAHCESEHIR COLLEGE ISTANBUL',
  'BESIKTAS FIBABANKA ISTANBUL',
  'BUDUCNOST VOLI PODGORICA',
  'CEDEVITA OLIMPIJA LJUBLJANA',
  'COSEA JL BOURG-EN-BRESSE',
  'DOLOMITI ENERGIA TRENTO',
  'DREAMLAND GRAN CANARIA',
  'HAPOEL BANK YAHAV JERUSALEM',
  'HAPOEL SHLOMO TEL AVIV',
  'JOVENTUT BADALONA',
  'LONDON LIONS',
  'MAXIMA ROMA',
  'NEPTUNAS KLAIPEDA',
  'NINERS CHEMNITZ',
  'RATIOPHARM ULM',
  'ROMA BASKETBALL',
  'SLASK WROCLAW',
  'TOFAS BURSA',
  'TREFL SOPOT',
  'TURK TELEKOM ANKARA',
  'U-BT CLUJ-NAPOCA',
  'UMANA REYER VENICE',
]);

export async function syncLbaFromOfficialApi(targetRound?: number): Promise<{ teams: TeamStats[]; players: PlayerStats[] }> {
  try {
    const roundToUse = targetRound || 3;
    await syncOfficialLbaRounds(roundToUse);
    if (fs.existsSync(LBA_STORE_PATH)) {
      const data = JSON.parse(fs.readFileSync(LBA_STORE_PATH, 'utf-8'));
      if (data.teams && data.players && data.teams.length >= 16) {
        return { teams: data.teams, players: data.players };
      }
    }
    const { teams: lbaTeams, players: lbaPlayers } = buildLbaSeasonData(roundToUse);
    return { teams: lbaTeams, players: lbaPlayers };
  } catch (e) {
    console.error('Error generating LBA data:', e);
    const { teams: lbaTeams, players: lbaPlayers } = buildLbaSeasonData(targetRound || 3);
    return { teams: lbaTeams, players: lbaPlayers };
  }
}

export interface GameStoreRecord {
  Live: boolean;
  Referees?: string;
  Attendance?: string;
  ByQuarter?: any[];
  Stats: Array<{
    Team: string;
    Coach?: string;
    PlayersStats: any[];
    tmr?: { Turnovers?: number };
    totr?: any;
  }>;
}

export function loadGamesStore(): Record<string, GameStoreRecord> {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const content = fs.readFileSync(STORE_PATH, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Failed to load games store:', e);
  }
  return {};
}

export function saveGameToStore(key: string, gameData: GameStoreRecord) {
  const store = loadGamesStore();
  store[key] = gameData;
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

export function rebuildDatasetFromStore(explicitLbaRound?: number): {
  teams: TeamStats[];
  players: PlayerStats[];
  totalGames: number;
  euroleagueGamesCount: number;
  eurocupGamesCount: number;
} {
  const store = loadGamesStore();
  const entries = Object.entries(store);

  const teamAgg = new Map<string, any>();
  const playerAgg = new Map<string, any>();

  const teamColorMap: Record<string, string> = {
    'DUBAI BASKETBALL': '#c5a059',
    'REAL MADRID': '#4f3299',
    'CRVENA ZVEZDA MERIDIANBET BELGRADE': '#e10600',
    'ZALGIRIS KAUNAS': '#006a3b',
    'HAPOEL IBI TEL AVIV': '#d3112d',
    'FC BAYERN MUNICH': '#dc052d',
    'FC BARCELONA': '#004d98',
    'ANADOLU EFES ISTANBUL': '#002663',
    'KOSNER BASKONIA VITORIA-GASTEIZ': '#a6192e',
    'OLYMPIACOS PIRAEUS': '#d6001c',
    'LDLC ASVEL VILLEURBANNE': '#1f2937',
    'MACCABI RAPYD TEL AVIV': '#f3d03e',
    'PANATHINAIKOS AKTOR ATHENS': '#007934',
    'PARIS BASKETBALL': '#111827',
    'BESIKTAS ISTANBUL': '#000000',
    'ALBA BERLIN': '#ffd100',
    'VALENCIA BASKET': '#eb690b',
    'FENERBAHCE TARFIN ISTANBUL': '#002d72',
    'VIRTUS BOLOGNA': '#000000',
    'PARTIZAN MOZZART BET BELGRADE': '#000000',
    'ARMANI OLIMPIA MILAN': '#c8102e',
    'UMANA REYER VENICE': '#8a1538',
    'U-BT CLUJ-NAPOCA': '#000000',
    'NINERS CHEMNITZ': '#e30613',
    'DREAMLAND GRAN CANARIA': '#ffd100',
    'RATIOPHARM ULM': '#f39200',
    'BAHCESEHIR COLLEGE ISTANBUL': '#002b49',
    'HAPOEL SHLOMO TEL AVIV': '#cc0000',
    'LIETKABELIS PANEVEZYS': '#79001f',
    'JOVENTUT BADALONA': '#006a3b',
    'WOLVES TWINSBET VILNIUS': '#00843d',
    'DOLOMITI ENERGIA TRENTO': '#1e293b',
    'BUDUCNOST VOLI PODGORICA': '#003399',
    'HAPOEL MIDTOWN JERUSALEM': '#cc0000',
    'CEDEVITA OLIMPIJA LJUBLJANA': '#008751',
    'LONDON LIONS': '#000000',
    'TURK TELEKOM ANKARA': '#00a3e0',
    'SLASK WROCLAW': '#00843d',
    'TOFAS BURSA': '#00205b',
    'COSEA JL BOURG-EN-BRESSE': '#d9272e',
    'ARIS MIDEA THESSALONIKI': '#ffd100',
    'TREFL SOPOT': '#fed100',
    'VEOLIA TOWERS HAMBURG': '#002d72',
    'BESIKTAS FIBABANKA ISTANBUL': '#000000',
    '7BET-LIETKABELIS PANEVEZYS': '#79001f',
    'HAPOEL BANK YAHAV JERUSALEM': '#cc0000',
    'NEPTUNAS KLAIPEDA': '#003da5',
    'MAXIMA ROMA': '#8a1538',
    'ROMA BASKETBALL': '#c5a059',
  };

  function getTeamBoxTotals(teamObj: any) {
    const totals = { fga: 0, fgm: 0, fg2a: 0, fg2m: 0, fg3a: 0, fg3m: 0, fta: 0, ftm: 0, orb: 0, drb: 0, tov: 0, pts: 0 };
    for (const p of teamObj.PlayersStats || []) {
      totals.pts += p.Points || 0;
      totals.fg2a += p.FieldGoalsAttempted2 || 0;
      totals.fg2m += p.FieldGoalsMade2 || 0;
      totals.fg3a += p.FieldGoalsAttempted3 || 0;
      totals.fg3m += p.FieldGoalsMade3 || 0;
      totals.fga += (p.FieldGoalsAttempted2 || 0) + (p.FieldGoalsAttempted3 || 0);
      totals.fgm += (p.FieldGoalsMade2 || 0) + (p.FieldGoalsMade3 || 0);
      totals.fta += p.FreeThrowsAttempted || 0;
      totals.ftm += p.FreeThrowsMade || 0;
      totals.orb += p.OffensiveRebounds || 0;
      totals.drb += p.DefensiveRebounds || 0;
      totals.tov += p.Turnovers || 0;
    }
    if (teamObj.tmr?.Turnovers) totals.tov += teamObj.tmr.Turnovers;
    return totals;
  }

  let elCount = 0;
  let ecCount = 0;

  for (const [key, d] of entries) {
    if (!d.Stats || d.Stats.length < 2) continue;
    // Salta partite non concluse
    if (d.Live) continue;

    const isEuroCup = key.startsWith('U2026');
    if (isEuroCup) {
      const gNum = parseInt(key.split('_')[1], 10);
      if (gNum > 40) continue; // Copre fino al 4° turno di EuroCup
    }
    const league = isEuroCup ? 'EuroCup' : 'EuroLeague';
    if (isEuroCup) ecCount++; else elCount++;

    const t0 = d.Stats[0];
    const t1 = d.Stats[1];
    const t0Name = t0?.Team?.trim().toUpperCase();
    const t1Name = t1?.Team?.trim().toUpperCase();

    if (isEuroCup) {
      if (!OFFICIAL_EUROCUP_TEAMS.has(t0Name) || !OFFICIAL_EUROCUP_TEAMS.has(t1Name)) {
        continue;
      }
    } else {
      if (!OFFICIAL_EUROLEAGUE_TEAMS.has(t0Name) || !OFFICIAL_EUROLEAGUE_TEAMS.has(t1Name)) {
        continue;
      }
    }

    const tot0 = getTeamBoxTotals(t0);
    const tot1 = getTeamBoxTotals(t1);

    // Se la partita non ha punti registrati, salta
    if (tot0.pts === 0 && tot1.pts === 0) continue;

    const poss0 = tot0.fga + 0.44 * tot0.fta - tot0.orb + tot0.tov;
    const poss1 = tot1.fga + 0.44 * tot1.fta - tot1.orb + tot1.tov;

    for (let i = 0; i < 2; i++) {
      const t = d.Stats[i];
      const opp = d.Stats[1 - i];
      const myTot = i === 0 ? tot0 : tot1;
      const oppTot = i === 0 ? tot1 : tot0;
      const myPoss = i === 0 ? poss0 : poss1;
      const oppPoss = i === 0 ? poss1 : poss0;

      const isWin = myTot.pts > oppTot.pts;
      const tName = t.Team.trim();
      const teamAggKey = `${league}___${tName}`;

      let tEntry = teamAgg.get(teamAggKey);
      if (!tEntry) {
        tEntry = {
          name: tName,
          league,
          gp: 0,
          wins: 0,
          losses: 0,
          ptsScored: 0,
          ptsAllowed: 0,
          possTotal: 0,
          oppPossTotal: 0,
          fga: 0,
          fgm: 0,
          fg2a: 0,
          fg2m: 0,
          fg3a: 0,
          fg3m: 0,
          fta: 0,
          ftm: 0,
          orb: 0,
          drb: 0,
          tov: 0,
          oppFga: 0,
          oppFgm: 0,
          oppFg3m: 0,
          oppFta: 0,
          oppOrb: 0,
          oppDrb: 0,
          oppTov: 0,
        };
        teamAgg.set(teamAggKey, tEntry);
      }

      tEntry.gp += 1;
      if (isWin) tEntry.wins += 1; else tEntry.losses += 1;
      tEntry.ptsScored += myTot.pts;
      tEntry.ptsAllowed += oppTot.pts;
      tEntry.possTotal += myPoss;
      tEntry.oppPossTotal += oppPoss;

      tEntry.fga += myTot.fga;
      tEntry.fgm += myTot.fgm;
      tEntry.fg2a += myTot.fg2a;
      tEntry.fg2m += myTot.fg2m;
      tEntry.fg3a += myTot.fg3a;
      tEntry.fg3m += myTot.fg3m;
      tEntry.fta += myTot.fta;
      tEntry.ftm += myTot.ftm;
      tEntry.orb += myTot.orb;
      tEntry.drb += myTot.drb;
      tEntry.tov += myTot.tov;

      tEntry.oppFga += oppTot.fga;
      tEntry.oppFgm += oppTot.fgm;
      tEntry.oppFg3m += oppTot.fg3m;
      tEntry.oppFta += oppTot.fta;
      tEntry.oppOrb += oppTot.orb;
      tEntry.oppDrb += oppTot.drb;
      tEntry.oppTov += oppTot.tov;

      // Aggrega singoli giocatori
      for (const p of t.PlayersStats || []) {
        if (!p.Minutes || p.Minutes === '00:00' || p.Minutes === '0') continue;
        const pId = p.Player_ID.trim();
        const playerAggKey = `${league}___${pId}`;
        let pEntry = playerAgg.get(playerAggKey);
        if (!pEntry) {
          pEntry = {
            id: pId,
            rawName: p.Player,
            team: tName,
            league,
            number: parseInt(p.Dorsal, 10) || 0,
            gp: 0,
            totalSec: 0,
            pts: 0,
            reb: 0,
            ast: 0,
            stl: 0,
            blk: 0,
            tov: 0,
            pf: 0,
            fga: 0,
            fgm: 0,
            fg2a: 0,
            fg2m: 0,
            fg3a: 0,
            fg3m: 0,
            fta: 0,
            ftm: 0,
            pir: 0,
            plusMinus: 0,
            orb: 0,
            drb: 0,
          };
          playerAgg.set(playerAggKey, pEntry);
        }

        const minParts = (p.Minutes || '').split(':');
        const sec = minParts.length === 2 ? parseInt(minParts[0], 10) * 60 + parseInt(minParts[1], 10) : 0;
        // Audit DNP / Minuti minimi: bloccare a zero chiunque abbia un minuto o meno (< 60s) o DNP
        if (sec <= 60 || p.Minutes === 'DNP' || p.Minutes === '00:00' || p.Minutes === '0' || !p.Minutes) {
          continue;
        }
        pEntry.gp += 1;
        pEntry.totalSec += sec;
        pEntry.pts += p.Points || 0;
        pEntry.reb += p.TotalRebounds || 0;
        pEntry.ast += p.Assistances || 0;
        pEntry.stl += p.Steals || 0;
        pEntry.blk += p.BlocksFavour || 0;
        pEntry.tov += p.Turnovers || 0;
        pEntry.pf += p.FoulsCommited || 0;
        pEntry.fga += (p.FieldGoalsAttempted2 || 0) + (p.FieldGoalsAttempted3 || 0);
        pEntry.fgm += (p.FieldGoalsMade2 || 0) + (p.FieldGoalsMade3 || 0);
        pEntry.fg2a += p.FieldGoalsAttempted2 || 0;
        pEntry.fg2m += p.FieldGoalsMade2 || 0;
        pEntry.fg3a += p.FieldGoalsAttempted3 || 0;
        pEntry.fg3m += p.FieldGoalsMade3 || 0;
        pEntry.fta += p.FreeThrowsAttempted || 0;
        pEntry.ftm += p.FreeThrowsMade || 0;
        pEntry.pir += p.Valuation || 0;
        pEntry.plusMinus += p.Plusminus || 0;
        pEntry.orb += p.OffensiveRebounds || 0;
        pEntry.drb += p.DefensiveRebounds || 0;
      }
    }
  }

  // Costruisci squadre EuroLeague ed EuroCup
  const builtEuroTeams: TeamStats[] = [];
  for (const [tName, t] of teamAgg) {
    const gp = Math.max(1, t.gp);
    const ppg = Number((t.ptsScored / gp).toFixed(1));
    const oppPpg = Number((t.ptsAllowed / gp).toFixed(1));

    const pace = Number((t.possTotal / gp).toFixed(1));
    const ortg = t.possTotal > 0 ? Number(((t.ptsScored / t.possTotal) * 100).toFixed(1)) : 110.0;
    const drtg = t.oppPossTotal > 0 ? Number(((t.ptsAllowed / t.oppPossTotal) * 100).toFixed(1)) : 110.0;
    const netRtg = Number((ortg - drtg).toFixed(1));

    const efgOff = t.fga > 0 ? Number((((t.fgm + 0.5 * t.fg3m) / t.fga) * 100).toFixed(1)) : 52.0;
    const tovOff = t.possTotal > 0 ? Number(((t.tov / t.possTotal) * 100).toFixed(1)) : 13.0;
    const orbOff = (t.orb + t.oppDrb) > 0 ? Number(((t.orb / (t.orb + t.oppDrb)) * 100).toFixed(1)) : 30.0;
    const ftrOff = t.fga > 0 ? Number((t.fta / t.fga).toFixed(3)) : 0.280;

    const efgDef = t.oppFga > 0 ? Number((((t.oppFgm + 0.5 * t.oppFg3m) / t.oppFga) * 100).toFixed(1)) : 50.0;
    const tovDef = t.oppPossTotal > 0 ? Number(((t.oppTov / t.oppPossTotal) * 100).toFixed(1)) : 14.0;
    const orbDef = (t.oppOrb + t.drb) > 0 ? Number(((t.oppOrb / (t.oppOrb + t.drb)) * 100).toFixed(1)) : 26.0;
    const ftrDef = t.oppFga > 0 ? Number((t.oppFta / t.oppFga).toFixed(3)) : 0.260;

    const moreyball = t.fga > 0 ? Math.round(((t.fg2a * 0.6 + t.fg3a) / t.fga) * 100) : 85;

    const actualName = t.name || tName;
    const baseId = actualName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const teamId = baseId;
    const color = teamColorMap[actualName] || '#4f46e5';

    builtEuroTeams.push({
      id: teamId,
      name: actualName,
      shortName: actualName.split(' ')[0],
      league: t.league,
      logoColor: color,
      secondaryColor: '#ffffff',
      gp: t.gp,
      record: { wins: t.wins, losses: t.losses },
      wins: t.wins,
      losses: t.losses,
      pace,
      ortg,
      drtg,
      netRtg,
      ppg,
      pts: ppg,
      oppPpg,
      fourFactorsOffense: { efgPct: efgOff, tovPct: tovOff, orbPct: orbOff, ftr: ftrOff },
      fourFactorsDefense: { efgPct: efgDef, tovPct: tovDef, orbPct: orbDef, ftr: ftrDef },
      shotSelection: {
        rimPct: 38,
        rimFgPct: t.fg2a > 0 ? Number(((t.fg2m / t.fg2a) * 100 * 1.15).toFixed(1)) : 67.0,
        midRangePct: 14,
        midRangeFgPct: 42.0,
        corner3Pct: 15,
        corner3FgPct: t.fg3a > 0 ? Number(((t.fg3m / t.fg3a) * 100 * 1.1).toFixed(1)) : 42.0,
        aboveBreak3Pct: 33,
        aboveBreak3FgPct: t.fg3a > 0 ? Number(((t.fg3m / t.fg3a) * 100 * 0.95).toFixed(1)) : 38.0,
        moreyballRate: moreyball,
        ftr: ftrOff,
        pps: t.fga > 0 ? Number(((t.ptsScored / t.fga)).toFixed(2)) : 1.20,
      },
      playStyle: `Stagione 2026/27 (${t.gp} gare): ${ortg} ORtg (Pts/100p), ${drtg} DRtg, Pace: ${pace} poss/gara.`,
    });
  }

  // Aggiungi squadre e giocatori LBA Serie A ufficiali 2026/27 da data_lba_store.json
  let lbaTeams: TeamStats[] = [];
  let lbaPlayers: PlayerStats[] = [];
  const targetRound = explicitLbaRound || 3;

  try {
    let needRegenerate = true;
    if (fs.existsSync(LBA_STORE_PATH)) {
      try {
        const lbaData = JSON.parse(fs.readFileSync(LBA_STORE_PATH, 'utf-8'));
        if (
          lbaData.teams &&
          lbaData.teams.length === 16 &&
          lbaData.round >= targetRound &&
          lbaData.season === '2026/2027' &&
          lbaData.teams.some((t: any) => t.name === 'Virtus Costa Bologna') &&
          lbaData.players.some((p: any) => p.name === 'Nicola Akele')
        ) {
          lbaTeams = lbaData.teams;
          lbaPlayers = lbaData.players;
          needRegenerate = false;
        }
      } catch (e) {
        needRegenerate = true;
      }
    }

    if (needRegenerate) {
      console.log(`[LBA Engine] Generazione statistiche ufficiali LBA Serie A 2026/27 (Turno ${targetRound})...`);
      const generated = buildLbaSeasonData(targetRound);
      lbaTeams = generated.teams;
      lbaPlayers = generated.players;
      fs.writeFileSync(
        LBA_STORE_PATH,
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
    }
  } catch (e) {
    console.error('Error reading/generating LBA store:', e);
  }

  // Costruisci giocatori EuroLeague ed EuroCup
  const builtEuroPlayers: PlayerStats[] = [];
  for (const [pId, p] of playerAgg) {
    const isDnp = p.gp === 0 || p.totalSec <= 60;
    const gp = isDnp ? 0 : Math.max(1, p.gp);
    const mpg = isDnp ? 0 : Number(((p.totalSec / 60) / gp).toFixed(1));
    const pts = isDnp ? 0 : Number((p.pts / gp).toFixed(1));
    const reb = isDnp ? 0 : Number((p.reb / gp).toFixed(1));
    const ast = isDnp ? 0 : Number((p.ast / gp).toFixed(1));
    const stl = isDnp ? 0 : Number((p.stl / gp).toFixed(1));
    const blk = isDnp ? 0 : Number((p.blk / gp).toFixed(1));
    const tov = isDnp ? 0 : Number((p.tov / gp).toFixed(1));
    const pf = isDnp ? 0 : Number((p.pf / gp).toFixed(1));

    const fga = isDnp ? 0 : Number((p.fga / gp).toFixed(1));
    const fgm = isDnp ? 0 : Number((p.fgm / gp).toFixed(1));
    const fg2a = isDnp ? 0 : Number((p.fg2a / gp).toFixed(1));
    const fg2m = isDnp ? 0 : Number((p.fg2m / gp).toFixed(1));
    const fg3a = isDnp ? 0 : Number((p.fg3a / gp).toFixed(1));
    const fg3m = isDnp ? 0 : Number((p.fg3m / gp).toFixed(1));
    const fta = isDnp ? 0 : Number((p.fta / gp).toFixed(1));
    const ftm = isDnp ? 0 : Number((p.ftm / gp).toFixed(1));

    const tsDenom = 2 * (p.fga + 0.44 * p.fta);
    const tsPct = !isDnp && tsDenom > 0 ? Number(((p.pts / tsDenom) * 100).toFixed(1)) : 0;
    const efgPct = !isDnp && p.fga > 0 ? Number((((p.fgm + 0.5 * p.fg3m) / p.fga) * 100).toFixed(1)) : 0;
    const ftr = !isDnp && p.fga > 0 ? Number((p.fta / p.fga).toFixed(3)) : 0.25;
    const threeAttemptRate = !isDnp && p.fga > 0 ? Number(((p.fg3a / p.fga) * 100).toFixed(1)) : 0;
    const moreyball = !isDnp && p.fga > 0 ? Math.round(((p.fg2a * 0.6 + p.fg3a) / p.fga) * 100) : 0;

    const pir = isDnp ? 0 : Math.round(p.pir / gp);
    const plusMinus = isDnp ? 0 : Number((p.plusMinus / gp).toFixed(1));

    const tTeam = builtEuroTeams.find((t) => t.name === p.team);
    const teamPace = tTeam ? tTeam.pace : 75.0;

    const ptsPer100 = !isDnp && mpg > 0 ? Number(((pts * 40 * 100) / (mpg * teamPace)).toFixed(1)) : 0;
    const rebPer100 = !isDnp && mpg > 0 ? Number(((reb * 40 * 100) / (mpg * teamPace)).toFixed(1)) : 0;
    const astPer100 = !isDnp && mpg > 0 ? Number(((ast * 40 * 100) / (mpg * teamPace)).toFixed(1)) : 0;

    const nameParts = p.rawName.split(',').map((s: string) => s.trim());
    let formattedName = p.rawName;
    if (nameParts.length === 2) {
      const first = nameParts[1]
        .split(' ')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
      const last = nameParts[0]
        .split(' ')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
      formattedName = `${first} ${last}`.trim();
    }

    const baseTeamId = p.team.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const teamId = baseTeamId;

    // Mappa corrispondenza tra club europei e club LBA per le squadre italiane che giocano la coppa
    const euroToLbaClubMap: Record<string, string> = {
      'armani-olimpia-milan': 'Armani Olimpia Milano',
      'virtus-bologna': 'Virtus Costa Bologna',
      'umana-reyer-venice': 'Umana Reyer Venezia',
      'dolomiti-energia-trento': 'Dolomiti Energia Trentino',
      'maxima-roma': 'Maxima Roma',
      'roma-basketball': 'BC Roma',
    };

    const normEuro = formattedName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const lbaMatch = lbaPlayers.find(
      (lp) => lp.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normEuro
    );

    const isLegitItalianEuroClubPlayer =
      lbaMatch &&
      euroToLbaClubMap[teamId] &&
      lbaMatch.team.toLowerCase().includes(euroToLbaClubMap[teamId].toLowerCase());

    // Se il giocatore appartiene a una squadra LBA ma NON a questo specifico club europeo
    // (es. gioca a Verona, Varese, Roma, Tortona, o ha cambiato squadra),
    // rimuoviamo il vecchio record europeo per eliminare tutti i doppioni e le presenze errate.
    if (lbaMatch && !isLegitItalianEuroClubPlayer) {
      continue;
    }

    let finalName = formattedName;
    let position: any = 'SF';
    if (ast >= 3.5) position = 'PG';
    else if (reb >= 5.5) position = 'PF';
    else if (threeAttemptRate >= 45) position = 'SG';

    let number = p.number;
    let heightCm = position === 'PF' ? 204 : position === 'PG' ? 188 : 196;

    // Per i giocatori delle squadre italiane che giocano SIA LBA che la Coppa (Milano, Virtus, Venezia, Trento nello stesso club),
    // sincronizziamo con nome, ruolo, numero e altezza ufficiali
    if (lbaMatch && isLegitItalianEuroClubPlayer) {
      finalName = lbaMatch.name;
      position = lbaMatch.position;
      if (lbaMatch.number) number = lbaMatch.number;
      if (lbaMatch.heightCm) heightCm = lbaMatch.heightCm;
    }

    const gs = Number((pts + 0.4 * fgm - 0.7 * fga - 0.4 * (fta - ftm) + 0.7 * (p.orb / gp) + 0.3 * (p.drb / gp) + stl + 0.7 * ast - 0.4 * pf - tov).toFixed(1));

    builtEuroPlayers.push({
      id: pId,
      name: finalName,
      team: p.team,
      teamId,
      league: p.league,
      position,
      number,
      heightCm,
      gamesPlayed: isDnp ? 0 : p.gp,
      mpg,
      pts,
      reb,
      ast,
      stl,
      blk,
      tov,
      pf,
      fga,
      fgm,
      fg2a,
      fg2m,
      fg3a,
      fg3m,
      fta,
      ftm,
      pir,
      plusMinus,
      tsPct,
      efgPct,
      usgPct: isDnp ? 0 : Number(((fga + 0.44 * fta + tov) * 2).toFixed(1)),
      astPct: isDnp ? 0 : Number((ast * 4).toFixed(1)),
      astToRatio: tov > 0 ? Number((ast / tov).toFixed(2)) : ast,
      tovPct: isDnp ? 0 : 12.0,
      orbPct: isDnp ? 0 : 4.0,
      drbPct: isDnp ? 0 : 14.0,
      trbPct: isDnp ? 0 : 9.0,
      ortg: isDnp ? 0 : (tTeam ? tTeam.ortg : 115),
      drtg: isDnp ? 0 : (tTeam ? tTeam.drtg : 110),
      netRtg: isDnp ? 0 : (tTeam ? tTeam.netRtg : 5.0),
      gameScore: isDnp ? 0 : gs,
      bpm: isDnp ? 0 : 4.5,
      ptsPer100,
      rebPer100,
      astPer100,
      shotSelection: isDnp ? {
        rim: { fgaPct: 0, fgPct: 0, pps: 0, leagueAvgFgPct: 62 },
        paintNonRim: { fgaPct: 0, fgPct: 0, pps: 0, leagueAvgFgPct: 41 },
        midRange: { fgaPct: 0, fgPct: 0, pps: 0, leagueAvgFgPct: 40 },
        corner3: { fgaPct: 0, fgPct: 0, pps: 0, leagueAvgFgPct: 39 },
        aboveBreak3: { fgaPct: 0, fgPct: 0, pps: 0, leagueAvgFgPct: 36 },
        ftr: 0,
        threePointAttemptRate: 0,
        moreyballRate: 0,
        shotStyleNotes: 'DNP / Riserva a referto (< 1 min effettivo)',
      } : {
        rim: { fgaPct: 36, fgPct: p.fg2a > 0 ? Number(((p.fg2m / p.fg2a) * 100 * 1.15).toFixed(1)) : 66, pps: 1.32, leagueAvgFgPct: 62 },
        paintNonRim: { fgaPct: 14, fgPct: 44, pps: 0.88, leagueAvgFgPct: 41 },
        midRange: { fgaPct: 8, fgPct: 40, pps: 0.80, leagueAvgFgPct: 40 },
        corner3: { fgaPct: 14, fgPct: p.fg3a > 0 ? Number(((p.fg3m / p.fg3a) * 100 * 1.1).toFixed(1)) : 42, pps: 1.26, leagueAvgFgPct: 39 },
        aboveBreak3: { fgaPct: 28, fgPct: p.fg3a > 0 ? Number(((p.fg3m / p.fg3a) * 100 * 0.95).toFixed(1)) : 38, pps: 1.14, leagueAvgFgPct: 36 },
        ftr,
        threePointAttemptRate: threeAttemptRate,
        moreyballRate: moreyball,
        shotStyleNotes: `Stagione 2026/27 (${p.gp} gare): ${ptsPer100} Pts/100 poss (${tsPct}% TS).`,
      },
    });
  }

  const finalTeams = [...builtEuroTeams, ...lbaTeams];
  const finalPlayers = [...builtEuroPlayers, ...lbaPlayers];
  const totalGames = elCount + ecCount;

  // Salva sia data_cache.json sia src/data/basketballData.ts
  const cacheObj = {
    lastUpdated: new Date().toISOString(),
    totalGames,
    lbaRound: targetRound,
    teams: finalTeams,
    players: finalPlayers,
  };

  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheObj, null, 2), 'utf-8');
    const fileContent =
      'import { PlayerStats, TeamStats } from "../types/basketball";\n\n' +
      'export const TEAMS_DATA: TeamStats[] = ' +
      JSON.stringify(finalTeams, null, 2) +
      ';\n\n' +
      'export const PLAYERS_DATA: PlayerStats[] = ' +
      JSON.stringify(finalPlayers, null, 2) +
      ';\n';
    fs.writeFileSync(DATA_FILE, fileContent, 'utf-8');
  } catch (err) {
    console.error('Error writing dataset files:', err);
  }

  return {
    teams: finalTeams,
    players: finalPlayers,
    totalGames,
    euroleagueGamesCount: elCount,
    eurocupGamesCount: ecCount,
  };
}

export async function syncOnlyMissingGames(): Promise<{
  newGamesSynced: number;
  totalGames: number;
}> {
  const store = loadGamesStore();
  let newGamesCount = 0;

  async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Scansiona solo gare mancanti o Live in EuroLeague (1..60, copre fino al 6° turno)
  for (let g = 1; g <= 60; g++) {
    const key = `E2026_${g}`;
    if (store[key] && !store[key].Live) {
      continue; // Già scaricata e conclusa, non serve risollecitare Cloudflare!
    }

    try {
      const res = await fetch(`https://live.euroleague.net/api/Boxscore?gamecode=${g}&seasoncode=E2026`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (EuroBasketAnalytics/2.0)',
          Accept: 'application/json, text/plain, */*',
        },
        signal: AbortSignal.timeout(3500),
      });
      const text = await res.text();
      if (text.startsWith('{')) {
        const d = JSON.parse(text);
        if (d.Stats && d.Stats.length >= 2) {
          const t0 = d.Stats[0]?.Team?.trim().toUpperCase();
          const t1 = d.Stats[1]?.Team?.trim().toUpperCase();
          if (OFFICIAL_EUROLEAGUE_TEAMS.has(t0) && OFFICIAL_EUROLEAGUE_TEAMS.has(t1)) {
            store[key] = d;
            newGamesCount++;
            console.log(`[Auto-Sync Engine] Nuova gara EuroLeague scaricata: ${key}`);
          }
        }
      }
    } catch (err) {}
    await sleep(600);
  }

  // Scansiona gare dei primi 4 turni di EuroCup (1..40)
  for (let g = 1; g <= 40; g++) {
    const key = `U2026_${g}`;
    if (store[key] && !store[key].Live) {
      continue; // Già scaricata e conclusa!
    }

    try {
      const res = await fetch(`https://live.euroleague.net/api/Boxscore?gamecode=${g}&seasoncode=U2026`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (EuroBasketAnalytics/2.0)',
          Accept: 'application/json, text/plain, */*',
        },
        signal: AbortSignal.timeout(3500),
      });
      const text = await res.text();
      if (text.startsWith('{')) {
        const d = JSON.parse(text);
        if (d.Stats && d.Stats.length >= 2) {
          const t0 = d.Stats[0]?.Team?.trim().toUpperCase();
          const t1 = d.Stats[1]?.Team?.trim().toUpperCase();
          if (OFFICIAL_EUROCUP_TEAMS.has(t0) && OFFICIAL_EUROCUP_TEAMS.has(t1)) {
            store[key] = d;
            newGamesCount++;
            console.log(`[Auto-Sync Engine] Nuova gara EuroCup scaricata: ${key}`);
          }
        }
      }
    } catch (err) {}
    await sleep(600);
  }

  // Sincronizza anche la LBA Serie A ufficiale da legabasket.it
  try {
    await syncLbaFromOfficialApi();
  } catch (err) {
    console.error('[Auto-Sync Engine] Errore sincronizzazione LBA:', err);
  }

  if (newGamesCount > 0) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
    const { totalGames } = rebuildDatasetFromStore();
    return { newGamesSynced: newGamesCount, totalGames };
  }

  const { totalGames } = rebuildDatasetFromStore();
  return { newGamesSynced: 0, totalGames };
}
