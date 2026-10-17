import fs from 'fs';
import path from 'path';
import { TeamStats, PlayerStats } from '../types/basketball';
import { buildLbaSeasonData } from './lbaSeasonData';
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

/**
 * Converte "MM:SS" in secondi totali in modo sicuro
 */
function parseSeconds(minStr: any): number {
  if (!minStr || typeof minStr !== 'string') return 0;
  const clean = minStr.trim().toUpperCase();
  if (clean === 'DNP' || clean === '00:00' || clean === '0' || clean === '') return 0;
  const parts = clean.split(':');
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10) || 0;
    const s = parseInt(parts[1], 10) || 0;
    return m * 60 + s;
  }
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : Math.round(num * 60);
}

/**
 * Limita le percentuali stimate nel range [0, 100] evitando valori >100%
 */
function clampPct(val: number): number {
  if (isNaN(val) || !isFinite(val)) return 0;
  return Number(Math.min(100, Math.max(0, val)).toFixed(1));
}

export async function syncLbaFromOfficialApi(targetRound?: number): Promise<{ teams: TeamStats[]; players: PlayerStats[] }> {
  const roundToUse = targetRound || 3;
  try {
    await syncOfficialLbaRounds(roundToUse);
    if (fs.existsSync(LBA_STORE_PATH)) {
      const data = JSON.parse(fs.readFileSync(LBA_STORE_PATH, 'utf-8'));
      if (data.teams && data.players && data.teams.length >= 16) {
        return { teams: data.teams, players: data.players };
      }
    }
  } catch (e) {
    console.warn('[LBA Sync] Fallback su generatore interno LBA:', e);
  }

  const { teams: lbaTeams, players: lbaPlayers } = buildLbaSeasonData(roundToUse);
  return { teams: lbaTeams, players: lbaPlayers };
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
  try {
    const store = loadGamesStore();
    store[key] = gameData;
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save game to store:', e);
  }
}

export function rebuildDatasetFromStore(
  explicitLbaRound?: number,
  writeTsSourceFile: boolean = false
): {
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
    for (const p of teamObj?.PlayersStats || []) {
      const sec = parseSeconds(p.Minutes);
      if (sec <= 0) continue; // Ignora righe DNP nei conteggi di squadra

      totals.pts += Number(p.Points) || 0;
      totals.fg2a += Number(p.FieldGoalsAttempted2) || 0;
      totals.fg2m += Number(p.FieldGoalsMade2) || 0;
      totals.fg3a += Number(p.FieldGoalsAttempted3) || 0;
      totals.fg3m += Number(p.FieldGoalsMade3) || 0;
      totals.fga += (Number(p.FieldGoalsAttempted2) || 0) + (Number(p.FieldGoalsAttempted3) || 0);
      totals.fgm += (Number(p.FieldGoalsMade2) || 0) + (Number(p.FieldGoalsMade3) || 0);
      totals.fta += Number(p.FreeThrowsAttempted) || 0;
      totals.ftm += Number(p.FreeThrowsMade) || 0;
      totals.orb += Number(p.OffensiveRebounds) || 0;
      totals.drb += Number(p.DefensiveRebounds) || 0;
      totals.tov += Number(p.Turnovers) || 0;
    }
    if (teamObj?.tmr?.Turnovers) totals.tov += Number(teamObj.tmr.Turnovers) || 0;
    return totals;
  }

  let elCount = 0;
  let ecCount = 0;

  for (const [key, d] of entries) {
    if (!d || !d.Stats || d.Stats.length < 2) continue;
    if (d.Live) continue;

    const isEuroCup = key.startsWith('U2026');
    if (isEuroCup) {
      const gNum = parseInt(key.split('_')[1], 10);
      if (gNum > 48) continue;
    }
    const league = isEuroCup ? 'EuroCup' : 'EuroLeague';

    const t0 = d.Stats[0];
    const t1 = d.Stats[1];
    const t0Name = (t0?.Team || '').trim().toUpperCase();
    const t1Name = (t1?.Team || '').trim().toUpperCase();

    if (!t0Name || !t1Name) continue;

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

    if (tot0.pts === 0 && tot1.pts === 0) continue;

    if (isEuroCup) ecCount++;
    else elCount++;

    const poss0 = Math.max(1, tot0.fga + 0.44 * tot0.fta - tot0.orb + tot0.tov);
    const poss1 = Math.max(1, tot1.fga + 0.44 * tot1.fta - tot1.orb + tot1.tov);

    for (let i = 0; i < 2; i++) {
      const t = d.Stats[i];
      const myTot = i === 0 ? tot0 : tot1;
      const oppTot = i === 0 ? tot1 : tot0;
      const myPoss = i === 0 ? poss0 : poss1;
      const oppPoss = i === 0 ? poss1 : poss0;

      const isWin = myTot.pts > oppTot.pts;
      const tName = (t.Team || '').trim();
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
      if (isWin) tEntry.wins += 1;
      else tEntry.losses += 1;
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

      // Aggrega singoli giocatori (Controlla i minuti PRIMA di creare il record!)
      for (const p of t.PlayersStats || []) {
        const sec = parseSeconds(p.Minutes);
        if (sec <= 60) continue; // Salta rigorosamente DNP o < 1 minuto giocato

        const pId = (p.Player_ID || '').trim();
        if (!pId || pId.toUpperCase() === 'TEAM') continue;

        const playerAggKey = `${league}___${pId}`;
        let pEntry = playerAgg.get(playerAggKey);
        if (!pEntry) {
          pEntry = {
            id: pId,
            rawName: p.Player || 'Unknown',
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

        pEntry.gp += 1;
        pEntry.totalSec += sec;
        pEntry.pts += Number(p.Points) || 0;
        pEntry.reb += Number(p.TotalRebounds) || 0;
        pEntry.ast += Number(p.Assistances) || 0;
        pEntry.stl += Number(p.Steals) || 0;
        pEntry.blk += Number(p.BlocksFavour) || 0;
        pEntry.tov += Number(p.Turnovers) || 0;
        pEntry.pf += Number(p.FoulsCommited) || 0;
        pEntry.fga += (Number(p.FieldGoalsAttempted2) || 0) + (Number(p.FieldGoalsAttempted3) || 0);
        pEntry.fgm += (Number(p.FieldGoalsMade2) || 0) + (Number(p.FieldGoalsMade3) || 0);
        pEntry.fg2a += Number(p.FieldGoalsAttempted2) || 0;
        pEntry.fg2m += Number(p.FieldGoalsMade2) || 0;
        pEntry.fg3a += Number(p.FieldGoalsAttempted3) || 0;
        pEntry.fg3m += Number(p.FieldGoalsMade3) || 0;
        pEntry.fta += Number(p.FreeThrowsAttempted) || 0;
        pEntry.ftm += Number(p.FreeThrowsMade) || 0;
        pEntry.pir += Number(p.Valuation) || 0;
        pEntry.plusMinus += Number(p.Plusminus) || 0;
        pEntry.orb += Number(p.OffensiveRebounds) || 0;
        pEntry.drb += Number(p.DefensiveRebounds) || 0;
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

    const efgOff = t.fga > 0 ? clampPct(((t.fgm + 0.5 * t.fg3m) / t.fga) * 100) : 52.0;
    const tovOff = t.possTotal > 0 ? clampPct((t.tov / t.possTotal) * 100) : 13.0;
    const orbOff = t.orb + t.oppDrb > 0 ? clampPct((t.orb / (t.orb + t.oppDrb)) * 100) : 30.0;
    const ftrOff = t.fga > 0 ? Number((t.fta / t.fga).toFixed(3)) : 0.28;

    const efgDef = t.oppFga > 0 ? clampPct(((t.oppFgm + 0.5 * t.oppFg3m) / t.oppFga) * 100) : 50.0;
    const tovDef = t.oppPossTotal > 0 ? clampPct((t.oppTov / t.oppPossTotal) * 100) : 14.0;
    const orbDef = t.oppOrb + t.drb > 0 ? clampPct((t.oppOrb / (t.oppOrb + t.drb)) * 100) : 26.0;
    const ftrDef = t.oppFga > 0 ? Number((t.oppFta / t.oppFga).toFixed(3)) : 0.26;

    const moreyball = t.fga > 0 ? Math.min(100, Math.round(((t.fg2a * 0.6 + t.fg3a) / t.fga) * 100)) : 76;

    const actualName = t.name || tName;
    const teamId = actualName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
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
        rimFgPct: t.fg2a > 0 ? clampPct((t.fg2m / t.fg2a) * 100 * 1.12) : 62.0,
        midRangePct: 14,
        midRangeFgPct: 42.0,
        corner3Pct: 15,
        corner3FgPct: t.fg3a > 0 ? clampPct((t.fg3m / t.fg3a) * 100 * 1.08) : 39.0,
        aboveBreak3Pct: 33,
        aboveBreak3FgPct: t.fg3a > 0 ? clampPct((t.fg3m / t.fg3a) * 100 * 0.96) : 35.0,
        moreyballRate: moreyball,
        ftr: ftrOff,
        pps: t.fga > 0 ? Number((t.ptsScored / t.fga).toFixed(2)) : 1.2,
      },
      playStyle: `Stagione 2026/27 (${t.gp} gare): ${ortg} ORtg (Pts/100p), ${drtg} DRtg, Pace: ${pace} poss/gara.`,
    });
  }

  // Aggiungi squadre e giocatori LBA Serie A ufficiali 2026/27
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
          lbaData.season === '2026/2027'
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
    if (p.gp === 0 || p.totalSec <= 60) continue;

    const gp = Math.max(1, p.gp);
    const mpg = Number((p.totalSec / 60 / gp).toFixed(1));
    const pts = Number((p.pts / gp).toFixed(1));
    const reb = Number((p.reb / gp).toFixed(1));
    const ast = Number((p.ast / gp).toFixed(1));
    const stl = Number((p.stl / gp).toFixed(1));
    const blk = Number((p.blk / gp).toFixed(1));
    const tov = Number((p.tov / gp).toFixed(1));
    const pf = Number((p.pf / gp).toFixed(1));

    const fga = Number((p.fga / gp).toFixed(1));
    const fgm = Number((p.fgm / gp).toFixed(1));
    const fg2a = Number((p.fg2a / gp).toFixed(1));
    const fg2m = Number((p.fg2m / gp).toFixed(1));
    const fg3a = Number((p.fg3a / gp).toFixed(1));
    const fg3m = Number((p.fg3m / gp).toFixed(1));
    const fta = Number((p.fta / gp).toFixed(1));
    const ftm = Number((p.ftm / gp).toFixed(1));

    const tsDenom = 2 * (p.fga + 0.44 * p.fta);
    const tsPct = tsDenom > 0 ? clampPct((p.pts / tsDenom) * 100) : 0;
    const efgPct = p.fga > 0 ? clampPct(((p.fgm + 0.5 * p.fg3m) / p.fga) * 100) : 0;
    const ftr = p.fga > 0 ? Number((p.fta / p.fga).toFixed(3)) : 0;
    const threeAttemptRate = p.fga > 0 ? clampPct((p.fg3a / p.fga) * 100) : 0;
    const moreyball = p.fga > 0 ? Math.min(100, Math.round(((p.fg2a * 0.6 + p.fg3a) / p.fga) * 100)) : 70;

    const pir = Math.round(p.pir / gp);
    const plusMinus = Number((p.plusMinus / gp).toFixed(1));

    const tTeam = builtEuroTeams.find((t) => t.name === p.team && t.league === p.league);
    const teamPace = tTeam ? tTeam.pace : 75.0;

    const ptsPer100 = mpg > 0 ? Number(((pts * 40 * 100) / (mpg * teamPace)).toFixed(1)) : 0;
    const rebPer100 = mpg > 0 ? Number(((reb * 40 * 100) / (mpg * teamPace)).toFixed(1)) : 0;
    const astPer100 = mpg > 0 ? Number(((ast * 40 * 100) / (mpg * teamPace)).toFixed(1)) : 0;

    const nameParts = (p.rawName || '').split(',').map((s: string) => s.trim());
    let formattedName = p.rawName || 'Unknown';
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

    const teamId = p.team.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

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

    const isItalianEuroClub = Boolean(euroToLbaClubMap[teamId]);
    const isLegitItalianEuroClubPlayer =
      lbaMatch &&
      isItalianEuroClub &&
      lbaMatch.team.toLowerCase().includes(euroToLbaClubMap[teamId].toLowerCase());

    // Escludi solo se il club è italiano ma il giocatore gioca in un'altra squadra LBA
    if (isItalianEuroClub && lbaMatch && !isLegitItalianEuroClubPlayer) {
      continue;
    }

    let finalName = formattedName;
    let position: any = 'SF';
    if (ast >= 3.5) position = 'PG';
    else if (reb >= 5.5) position = 'PF';
    else if (threeAttemptRate >= 45) position = 'SG';

    let number = p.number;
    let heightCm = position === 'PF' ? 204 : position === 'PG' ? 188 : 196;

    if (lbaMatch && isLegitItalianEuroClubPlayer) {
      finalName = lbaMatch.name;
      position = lbaMatch.position;
      if (lbaMatch.number) number = lbaMatch.number;
      if (lbaMatch.heightCm) heightCm = lbaMatch.heightCm;
    }

    const gs = Number(
      (
        pts +
        0.4 * fgm -
        0.7 * fga -
        0.4 * (fta - ftm) +
        0.7 * (p.orb / gp) +
        0.3 * (p.drb / gp) +
        stl +
        0.7 * ast -
        0.4 * pf -
        tov
      ).toFixed(1)
    );

    const playerPlaysPerGame = fga + 0.44 * fta + tov;
    const estimatedUsg =
      mpg > 0 ? clampPct((100 * (playerPlaysPerGame * (40 / mpg))) / (teamPace * 1.05)) : 18.0;

    builtEuroPlayers.push({
      id: pId,
      name: finalName,
      team: p.team,
      teamId,
      league: p.league,
      position,
      number,
      heightCm,
      gamesPlayed: gp,
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
      usgPct: estimatedUsg,
      astPct: mpg > 0 ? clampPct((ast / (mpg * 0.75)) * 100) : 0,
      astToRatio: tov > 0 ? Number((ast / tov).toFixed(2)) : ast,
      tovPct: playerPlaysPerGame > 0 ? clampPct((tov / playerPlaysPerGame) * 100) : 10.0,
      orbPct: 4.0,
      drbPct: 14.0,
      trbPct: 9.0,
      ortg: tTeam ? tTeam.ortg : 114,
      drtg: tTeam ? tTeam.drtg : 110,
      netRtg: tTeam ? tTeam.netRtg : 4.0,
      gameScore: gs,
      bpm: 4.0,
      ptsPer100,
      rebPer100,
      astPer100,
      shotSelection: {
        rim: {
          fgaPct: 36,
          fgPct: p.fg2a > 0 ? clampPct((p.fg2m / p.fg2a) * 100 * 1.1) : 60,
          pps: 1.32,
          leagueAvgFgPct: 62,
        },
        paintNonRim: { fgaPct: 14, fgPct: 44, pps: 0.88, leagueAvgFgPct: 41 },
        midRange: { fgaPct: 8, fgPct: 40, pps: 0.8, leagueAvgFgPct: 40 },
        corner3: {
          fgaPct: 14,
          fgPct: p.fg3a > 0 ? clampPct((p.fg3m / p.fg3a) * 100 * 1.05) : 38,
          pps: 1.26,
          leagueAvgFgPct: 39,
        },
        aboveBreak3: {
          fgaPct: 28,
          fgPct: p.fg3a > 0 ? clampPct((p.fg3m / p.fg3a) * 100 * 0.95) : 35,
          pps: 1.14,
          leagueAvgFgPct: 36,
        },
        ftr,
        threePointAttemptRate: threeAttemptRate,
        moreyballRate: moreyball,
        shotStyleNotes: `Stagione 2026/27 (${gp} gare): ${ptsPer100} Pts/100 poss (${tsPct}% TS).`,
      },
    });
  }

  const finalTeams = [...builtEuroTeams, ...lbaTeams];
  const finalPlayers = [...builtEuroPlayers, ...lbaPlayers];
  const totalGames = elCount + ecCount;

  const cacheObj = {
    lastUpdated: new Date().toISOString(),
    totalGames,
    lbaRound: targetRound,
    teams: finalTeams,
    players: finalPlayers,
  };

  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheObj, null, 2), 'utf-8');
    // Sovrascrive basketballData.ts SOLO se richiesto esplicitamente (evita il riavvio forzato di Vite durante le chiamate API!)
    if (writeTsSourceFile) {
      const fileContent =
        'import { PlayerStats, TeamStats } from "../types/basketball";\n\n' +
        'export const TEAMS_DATA: TeamStats[] = ' +
        JSON.stringify(finalTeams, null, 2) +
        ';\n\n' +
        'export const PLAYERS_DATA: PlayerStats[] = ' +
        JSON.stringify(finalPlayers, null, 2) +
        ';\n';
      fs.writeFileSync(DATA_FILE, fileContent, 'utf-8');
    }
  } catch (err) {
    console.error('Error writing dataset cache:', err);
  }

  return {
    teams: finalTeams,
    players: finalPlayers,
    totalGames,
    euroleagueGamesCount: elCount,
    eurocupGamesCount: ecCount,
  };
}

/**
 * Sincronizza rapidamente solo le gare mancanti con "Early-Stop"
 * (Se trova 4 gare consecutive non ancora disputate, interrompe la scansione evitando 40 secondi di attesa inutile!)
 */
export async function syncOnlyMissingGames(): Promise<{
  newGamesSynced: number;
  totalGames: number;
}> {
  const store = loadGamesStore();
  let newGamesCount = 0;

  async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // 1. Scansiona EuroLeague con uscita intelligente (Early-Stop)
  let consecutiveEmptyEL = 0;
  for (let g = 1; g <= 60; g++) {
    const key = `E2026_${g}`;
    if (store[key] && !store[key].Live) {
      consecutiveEmptyEL = 0;
      continue;
    }

    if (consecutiveEmptyEL >= 4) {
      // Abbiamo raggiunto i turni futuri non ancora disputati: inutile continuare!
      break;
    }

    try {
      const res = await fetch(`https://live.euroleague.net/api/Boxscore?gamecode=${g}&seasoncode=E2026`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (EuroBasketAnalytics/2.0)',
          Accept: 'application/json, text/plain, */*',
        },
        signal: AbortSignal.timeout(2500),
      });
      if (res.ok) {
        const text = await res.text();
        if (text.startsWith('{')) {
          const d = JSON.parse(text);
          if (d.Stats && d.Stats.length >= 2) {
            const t0 = (d.Stats[0]?.Team || '').trim().toUpperCase();
            const t1 = (d.Stats[1]?.Team || '').trim().toUpperCase();
            if (OFFICIAL_EUROLEAGUE_TEAMS.has(t0) && OFFICIAL_EUROLEAGUE_TEAMS.has(t1)) {
              store[key] = d;
              newGamesCount++;
              consecutiveEmptyEL = 0;
              console.log(`[Auto-Sync Engine] Nuova gara EuroLeague scaricata: ${key}`);
            } else {
              consecutiveEmptyEL++;
            }
          } else {
            consecutiveEmptyEL++;
          }
        } else {
          consecutiveEmptyEL++;
        }
      } else {
        consecutiveEmptyEL++;
      }
    } catch (err) {
      consecutiveEmptyEL++;
    }
    await sleep(180);
  }

  // 2. Scansiona EuroCup con uscita intelligente (Early-Stop)
  let consecutiveEmptyEC = 0;
  for (let g = 1; g <= 48; g++) {
    const key = `U2026_${g}`;
    if (store[key] && !store[key].Live) {
      consecutiveEmptyEC = 0;
      continue;
    }

    if (consecutiveEmptyEC >= 4) {
      break;
    }

    try {
      const res = await fetch(`https://live.euroleague.net/api/Boxscore?gamecode=${g}&seasoncode=U2026`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (EuroBasketAnalytics/2.0)',
          Accept: 'application/json, text/plain, */*',
        },
        signal: AbortSignal.timeout(2500),
      });
      if (res.ok) {
        const text = await res.text();
        if (text.startsWith('{')) {
          const d = JSON.parse(text);
          if (d.Stats && d.Stats.length >= 2) {
            const t0 = (d.Stats[0]?.Team || '').trim().toUpperCase();
            const t1 = (d.Stats[1]?.Team || '').trim().toUpperCase();
            if (OFFICIAL_EUROCUP_TEAMS.has(t0) && OFFICIAL_EUROCUP_TEAMS.has(t1)) {
              store[key] = d;
              newGamesCount++;
              consecutiveEmptyEC = 0;
              console.log(`[Auto-Sync Engine] Nuova gara EuroCup scaricata: ${key}`);
            } else {
              consecutiveEmptyEC++;
            }
          } else {
            consecutiveEmptyEC++;
          }
        } else {
          consecutiveEmptyEC++;
        }
      } else {
        consecutiveEmptyEC++;
      }
    } catch (err) {
      consecutiveEmptyEC++;
    }
    await sleep(180);
  }

  // 3. Sincronizza LBA Serie A
  try {
    await syncLbaFromOfficialApi();
  } catch (err) {
    console.error('[Auto-Sync Engine] Errore sincronizzazione LBA:', err);
  }

  if (newGamesCount > 0) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  }

  const { totalGames } = rebuildDatasetFromStore();
  return { newGamesSynced: newGamesCount, totalGames };
}
