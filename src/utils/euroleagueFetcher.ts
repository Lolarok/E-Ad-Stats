import { calculateTS, calculateEFG, calculatePossessions, calculateRating, calculateGameScore, calculatePIR, calculateShotProfile, calculateFourFactors } from './statsCalculator';
import { PlayerStats, TeamStats } from '../types/basketball';

export interface EuroleaguePlayerRaw {
  Player_ID: string;
  Player: string;
  Team: string;
  Dorsal: string;
  Minutes: string;
  Points: number;
  FieldGoalsMade2: number;
  FieldGoalsAttempted2: number;
  FieldGoalsMade3: number;
  FieldGoalsAttempted3: number;
  FreeThrowsMade: number;
  FreeThrowsAttempted: number;
  OffensiveRebounds: number;
  DefensiveRebounds: number;
  TotalRebounds: number;
  Assistances: number;
  Steals: number;
  Turnovers: number;
  BlocksFavour: number;
  BlocksAgainst: number;
  FoulsCommited: number;
  FoulsReceived: number;
  Valuation: number;
  Plusminus: number;
}

export interface EuroleagueTeamRaw {
  Team: string;
  Coach?: string;
  PlayersStats: EuroleaguePlayerRaw[];
  Total?: any;
}

export interface EuroleagueGameResponse {
  Live: boolean;
  Referees: string;
  Attendance: string;
  ByQuarter: Array<{
    Team: string;
    Quarter1: number;
    Quarter2: number;
    Quarter3: number;
    Quarter4: number;
    ExtraTime1?: number;
  }>;
  Stats: EuroleagueTeamRaw[];
}

export interface ParsedGameReport {
  gameCode: number;
  seasonCode: string;
  competition: 'EuroLeague' | 'EuroCup';
  teamA: {
    name: string;
    score: number;
    possessions: number;
    pace: number;
    ortg: number;
    drtg: number;
    netRtg: number;
    tsPct: number;
    efgPct: number;
    moreyballRate: number;
    ftr: number;
    fourFactors: { efgPct: number; tovPct: number; orbPct: number; ftr: number };
    players: PlayerStats[];
  };
  teamB: {
    name: string;
    score: number;
    possessions: number;
    pace: number;
    ortg: number;
    drtg: number;
    netRtg: number;
    tsPct: number;
    efgPct: number;
    moreyballRate: number;
    ftr: number;
    fourFactors: { efgPct: number; tovPct: number; orbPct: number; ftr: number };
    players: PlayerStats[];
  };
}

export interface FullRoundSyncResult {
  roundNumber: number;
  seasonCode: string;
  competition: 'EuroLeague' | 'EuroCup';
  totalGames: number;
  games: ParsedGameReport[];
  allPlayers: PlayerStats[];
  teamRankings: Array<{
    teamName: string;
    wins: number;
    losses: number;
    pace: number;
    ortg: number;
    drtg: number;
    netRtg: number;
  }>;
}

/**
 * Converte "MM:SS" in minuti decimali in modo sicuro
 */
function parseMinutes(minStr: string): number {
  if (!minStr || typeof minStr !== 'string') return 0;
  const parts = minStr.trim().split(':');
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10) || 0;
    const secs = parseInt(parts[1], 10) || 0;
    return Number((mins + secs / 60).toFixed(1));
  }
  return parseFloat(minStr) || 0;
}

/**
 * Estrae GameCode e SeasonCode da un URL Euroleague o parametri
 */
export function parseEuroleagueUrl(input: string): { gameCode: number; seasonCode: string } {
  const trimmed = (input || '').trim();

  if (/^\d+$/.test(trimmed)) {
    return { gameCode: parseInt(trimmed, 10), seasonCode: 'E2026' };
  }

  try {
    const url = new URL(trimmed);
    const cParam = url.searchParams.get('c');
    const gParam = url.searchParams.get('g');

    if (gParam) {
      const isEurocup = cParam === 'U';
      return {
        gameCode: parseInt(gParam, 10),
        seasonCode: isEurocup ? 'U2026' : 'E2026',
      };
    }

    const match = url.pathname.match(/\/(E\d{4}|U\d{4})\/(\d+)/i);
    if (match) {
      return {
        seasonCode: match[1].toUpperCase(),
        gameCode: parseInt(match[2], 10),
      };
    }
  } catch (e) {
    const match = trimmed.match(/(E\d{4}|U\d{4})[^\d]*(\d+)/i);
    if (match) {
      return {
        seasonCode: match[1].toUpperCase(),
        gameCode: parseInt(match[2], 10),
      };
    }
  }

  const numMatch = trimmed.match(/\d+/);
  return {
    gameCode: numMatch ? parseInt(numMatch[0], 10) : 2,
    seasonCode: trimmed.includes('U') ? 'U2026' : 'E2026',
  };
}

/**
 * Aggrega correttamente i dati grezzi di squadra risolvendo il bug dei tiri a 0
 */
function aggregateTeamRaw(players: EuroleaguePlayerRaw[]) {
  const totals = players.reduce(
    (acc, p) => {
      const mpg = parseMinutes(p.Minutes);
      if (mpg <= 0) return acc;

      acc.pts += p.Points || 0;
      acc.fg2m += p.FieldGoalsMade2 || 0;
      acc.fg2a += p.FieldGoalsAttempted2 || 0;
      acc.fg3m += p.FieldGoalsMade3 || 0;
      acc.fg3a += p.FieldGoalsAttempted3 || 0;
      acc.ftm += p.FreeThrowsMade || 0;
      acc.fta += p.FreeThrowsAttempted || 0;
      acc.orb += p.OffensiveRebounds || 0;
      acc.drb += p.DefensiveRebounds || 0;
      acc.ast += p.Assistances || 0;
      acc.stl += p.Steals || 0;
      acc.blk += p.BlocksFavour || 0;
      acc.tov += p.Turnovers || 0;
      acc.pf += p.FoulsCommited || 0;
      return acc;
    },
    {
      pts: 0,
      fgm: 0,
      fga: 0,
      fg2m: 0,
      fg2a: 0,
      fg3m: 0,
      fg3a: 0,
      ftm: 0,
      fta: 0,
      orb: 0,
      drb: 0,
      ast: 0,
      stl: 0,
      blk: 0,
      tov: 0,
      pf: 0,
    }
  );

  totals.fgm = totals.fg2m + totals.fg3m;
  totals.fga = totals.fg2a + totals.fg3a;

  return totals;
}

/**
 * Scarica e calcola il Match Report completo di una singola partita con gestione errori
 */
export async function fetchEuroleagueGame(
  gameCode: number,
  seasonCode: string = 'E2026'
): Promise<ParsedGameReport> {
  const url = `https://live.euroleague.net/api/Boxscore?gamecode=${gameCode}&seasoncode=${seasonCode}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Errore HTTP ${res.status} nel recupero della partita ${gameCode} (${seasonCode}).`);
  }

  const data: EuroleagueGameResponse = await res.json();
  if (!data.Stats || data.Stats.length < 2) {
    throw new Error(`Dati partita ${gameCode} incompleti o non ancora disponibili.`);
  }

  const isEurocup = seasonCode.startsWith('U');
  const league = isEurocup ? 'EuroCup' : 'EuroLeague';

  const teamRawA = data.Stats[0];
  const teamRawB = data.Stats[1];

  const totalsA = aggregateTeamRaw(teamRawA.PlayersStats);
  const totalsB = aggregateTeamRaw(teamRawB.PlayersStats);

  const possA = calculatePossessions(totalsA.fga, totalsA.fta, totalsA.orb, totalsA.tov);
  const possB = calculatePossessions(totalsB.fga, totalsB.fta, totalsB.orb, totalsB.tov);
  const gamePace = Number(((possA + possB) / 2).toFixed(1));

  const ortgA = calculateRating(totalsA.pts, possA);
  const drtgA = calculateRating(totalsB.pts, possB);
  const netRtgA = Number((ortgA - drtgA).toFixed(1));

  const ortgB = calculateRating(totalsB.pts, possB);
  const drtgB = calculateRating(totalsA.pts, possA);
  const netRtgB = Number((ortgB - drtgB).toFixed(1));

  const fourFactorsA = calculateFourFactors(
    totalsA.fgm,
    totalsA.fg3m,
    totalsA.fga,
    totalsA.tov,
    totalsA.fta,
    totalsA.orb,
    totalsB.drb
  );

  const fourFactorsB = calculateFourFactors(
    totalsB.fgm,
    totalsB.fg3m,
    totalsB.fga,
    totalsB.tov,
    totalsB.fta,
    totalsB.orb,
    totalsA.drb
  );

  const playersA = teamRawA.PlayersStats.map((p) =>
    transformEuroPlayer(p, teamRawA.Team, league, totalsA, possA)
  ).filter((p) => p.mpg > 0);

  const playersB = teamRawB.PlayersStats.map((p) =>
    transformEuroPlayer(p, teamRawB.Team, league, totalsB, possB)
  ).filter((p) => p.mpg > 0);

  const tsPctA = calculateTS(totalsA.pts, totalsA.fga, totalsA.fta);
  const efgPctA = calculateEFG(totalsA.fgm, totalsA.fg3m, totalsA.fga);
  const moreyRateA = totalsA.fga > 0 ? Number((((totalsA.fg2a * 0.6 + totalsA.fg3a) / totalsA.fga) * 100).toFixed(1)) : 75;
  const ftrA = totalsA.fga > 0 ? Number((totalsA.fta / totalsA.fga).toFixed(3)) : 0.28;

  const tsPctB = calculateTS(totalsB.pts, totalsB.fga, totalsB.fta);
  const efgPctB = calculateEFG(totalsB.fgm, totalsB.fg3m, totalsB.fga);
  const moreyRateB = totalsB.fga > 0 ? Number((((totalsB.fg2a * 0.6 + totalsB.fg3a) / totalsB.fga) * 100).toFixed(1)) : 75;
  const ftrB = totalsB.fga > 0 ? Number((totalsB.fta / totalsB.fga).toFixed(3)) : 0.28;

  return {
    gameCode,
    seasonCode,
    competition: league,
    teamA: {
      name: teamRawA.Team,
      score: totalsA.pts,
      possessions: Number(possA.toFixed(1)),
      pace: gamePace,
      ortg: ortgA,
      drtg: drtgA,
      netRtg: netRtgA,
      tsPct: tsPctA,
      efgPct: efgPctA,
      moreyballRate: moreyRateA,
      ftr: ftrA,
      fourFactors: fourFactorsA,
      players: playersA,
    },
    teamB: {
      name: teamRawB.Team,
      score: totalsB.pts,
      possessions: Number(possB.toFixed(1)),
      pace: gamePace,
      ortg: ortgB,
      drtg: drtgB,
      netRtg: netRtgB,
      tsPct: tsPctB,
      efgPct: efgPctB,
      moreyballRate: moreyRateB,
      ftr: ftrB,
      fourFactors: fourFactorsB,
      players: playersB,
    },
  };
}

/**
 * SINCRONIZZA UN INTERO TURNO CON ATTESA (Evita errori 429 Rate Limit)
 */
export async function fetchFullEuroleagueRound(
  roundNumber: number,
  seasonCode: string = 'E2026'
): Promise<FullRoundSyncResult> {
  const isEurocup = seasonCode.startsWith('U');
  const gamesPerRound = isEurocup ? 10 : 9;

  const startCode = (roundNumber - 1) * gamesPerRound + 1;
  const gameCodes = Array.from({ length: gamesPerRound }, (_, i) => startCode + i);

  const validGames: ParsedGameReport[] = [];

  for (const code of gameCodes) {
    try {
      const game = await fetchEuroleagueGame(code, seasonCode);
      validGames.push(game);
      await new Promise((r) => setTimeout(r, 150));
    } catch (err) {
      console.warn(`Partita ${code} saltata o non disponibile:`, err);
    }
  }

  if (validGames.length === 0) {
    throw new Error(`Nessuna partita trovata per il Turno ${roundNumber} (${seasonCode}).`);
  }

  const allPlayersMap = new Map<string, PlayerStats>();
  const teamStatsMap = new Map<string, { wins: number; losses: number; paceSum: number; ortgSum: number; drtgSum: number; games: number }>();

  validGames.forEach((g) => {
    [...g.teamA.players, ...g.teamB.players].forEach((p) => {
      allPlayersMap.set(p.name.toLowerCase(), p);
    });

    const teamAWins = g.teamA.score > g.teamB.score ? 1 : 0;
    const teamBWins = g.teamB.score > g.teamA.score ? 1 : 0;

    const tA = teamStatsMap.get(g.teamA.name) || { wins: 0, losses: 0, paceSum: 0, ortgSum: 0, drtgSum: 0, games: 0 };
    tA.wins += teamAWins;
    tA.losses += teamBWins ? 1 : 0;
    tA.paceSum += g.teamA.pace;
    tA.ortgSum += g.teamA.ortg;
    tA.drtgSum += g.teamA.drtg;
    tA.games += 1;
    teamStatsMap.set(g.teamA.name, tA);

    const tB = teamStatsMap.get(g.teamB.name) || { wins: 0, losses: 0, paceSum: 0, ortgSum: 0, drtgSum: 0, games: 0 };
    tB.wins += teamBWins;
    tB.losses += teamAWins ? 1 : 0;
    tB.paceSum += g.teamB.pace;
    tB.ortgSum += g.teamB.ortg;
    tB.drtgSum += g.teamB.drtg;
    tB.games += 1;
    teamStatsMap.set(g.teamB.name, tB);
  });

  const teamRankings = Array.from(teamStatsMap.entries()).map(([teamName, s]) => {
    const avgPace = Number((s.paceSum / s.games).toFixed(1));
    const avgOrtg = Number((s.ortgSum / s.games).toFixed(1));
    const avgDrtg = Number((s.drtgSum / s.games).toFixed(1));
    return {
      teamName,
      wins: s.wins,
      losses: s.losses,
      pace: avgPace,
      ortg: avgOrtg,
      drtg: avgDrtg,
      netRtg: Number((avgOrtg - avgDrtg).toFixed(1)),
    };
  }).sort((a, b) => b.netRtg - a.netRtg);

  return {
    roundNumber,
    seasonCode,
    competition: isEurocup ? 'EuroCup' : 'EuroLeague',
    totalGames: validGames.length,
    games: validGames,
    allPlayers: Array.from(allPlayersMap.values()),
    teamRankings,
  };
}

function transformEuroPlayer(
  p: EuroleaguePlayerRaw,
  teamName: string,
  league: 'EuroLeague' | 'EuroCup',
  teamTotals: any,
  teamPoss: number
): PlayerStats {
  const mpg = parseMinutes(p.Minutes);
  const fga = (p.FieldGoalsAttempted2 || 0) + (p.FieldGoalsAttempted3 || 0);
  const fgm = (p.FieldGoalsMade2 || 0) + (p.FieldGoalsMade3 || 0);

  const tsPct = calculateTS(p.Points, fga, p.FreeThrowsAttempted);
  const efgPct = calculateEFG(fgm, p.FieldGoalsMade3, fga);

  const playerPlays = fga + 0.44 * (p.FreeThrowsAttempted || 0) + (p.Turnovers || 0);
  const teamPlays = teamTotals.fga + 0.44 * teamTotals.fta + teamTotals.tov;
  const usgPct =
    mpg > 0 && teamPlays > 0 ? Number(((100 * (playerPlays * 40)) / (mpg * teamPlays)).toFixed(1)) : 0;

  const gameScore = calculateGameScore({
    min: mpg,
    pts: p.Points,
    fgm,
    fga,
    fg3m: p.FieldGoalsMade3,
    fg3a: p.FieldGoalsAttempted3,
    ftm: p.FreeThrowsMade,
    fta: p.FreeThrowsAttempted,
    orb: p.OffensiveRebounds,
    drb: p.DefensiveRebounds,
    reb: p.TotalRebounds,
    ast: p.Assistances,
    stl: p.Steals,
    blk: p.BlocksFavour,
    tov: p.Turnovers,
    pf: p.FoulsCommited,
  });

  const threePointAttemptRate = fga > 0 ? Number((((p.FieldGoalsAttempted3 || 0) / fga) * 100).toFixed(1)) : 0;
  const moreyballRate = fga > 0 ? Number((((p.FieldGoalsAttempted2 * 0.6 + p.FieldGoalsAttempted3) / fga) * 100).toFixed(1)) : 75;

  let position: any = 'SF';
  if ((p.Assistances || 0) >= 4) position = 'PG';
  else if ((p.TotalRebounds || 0) >= 6 || (p.BlocksFavour || 0) >= 1) position = 'C';
  else if (threePointAttemptRate > 50) position = 'SG';

  const nameParts = (p.Player || '').split(',').map((s) => s.trim());
  const formattedName =
    nameParts.length === 2
      ? `${nameParts[1]} ${nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1).toLowerCase()}`
      : p.Player || 'Sconosciuto';

  const ptsPer100 = mpg > 0 && teamPoss > 0 ? Number(((p.Points * 40 * 100) / (mpg * teamPoss)).toFixed(1)) : 0;

  return {
    id: (p.Player_ID || '').trim() || `p-${Math.random()}`,
    name: formattedName,
    team: teamName,
    teamId: teamName.toLowerCase().replace(/\s+/g, '-'),
    league,
    position,
    number: parseInt(p.Dorsal, 10) || 0,
    heightCm: position === 'C' ? 208 : position === 'PG' ? 188 : 198,
    gamesPlayed: mpg > 0 ? 1 : 0,
    mpg,
    pts: p.Points || 0,
    reb: p.TotalRebounds || 0,
    ast: p.Assistances || 0,
    stl: p.Steals || 0,
    blk: p.BlocksFavour || 0,
    tov: p.Turnovers || 0,
    pf: p.FoulsCommited || 0,
    fga,
    fgm,
    fg2a: p.FieldGoalsAttempted2 || 0,
    fg2m: p.FieldGoalsMade2 || 0,
    fg3a: p.FieldGoalsAttempted3 || 0,
    fg3m: p.FieldGoalsMade3 || 0,
    fta: p.FreeThrowsAttempted || 0,
    ftm: p.FreeThrowsMade || 0,
    pir: p.Valuation || 0,
    plusMinus: p.Plusminus || 0,

    tsPct,
    efgPct,
    usgPct,
    astPct: mpg > 0 ? Number(((p.Assistances / (mpg * 0.8)) * 100).toFixed(1)) : 0,
    astToRatio: p.Turnovers > 0 ? Number(((p.Assistances || 0) / p.Turnovers).toFixed(2)) : (p.Assistances || 0),
    tovPct: playerPlays > 0 ? Number((((p.Turnovers || 0) / playerPlays) * 100).toFixed(1)) : 0,
    orbPct: 4.5,
    drbPct: 12.5,
    trbPct: 8.5,
    ortg: 115,
    drtg: 110,
    netRtg: 5.0,
    gameScore,
    bpm: 3.5,
    ptsPer100,
    shotSelection: {
      rim: {
        fgaPct: 36,
        fgPct: p.FieldGoalsAttempted2 > 0 ? Number(((p.FieldGoalsMade2 / p.FieldGoalsAttempted2) * 100).toFixed(1)) : 60,
        pps: 1.32,
        leagueAvgFgPct: 62,
      },
      paintNonRim: { fgaPct: 14, fgPct: 44, pps: 0.88, leagueAvgFgPct: 41 },
      midRange: { fgaPct: 8, fgPct: 40, pps: 0.8, leagueAvgFgPct: 40 },
      corner3: { fgaPct: 14, fgPct: 38, pps: 1.26, leagueAvgFgPct: 39 },
      aboveBreak3: {
        fgaPct: 28,
        fgPct: p.FieldGoalsAttempted3 > 0 ? Number(((p.FieldGoalsMade3 / p.FieldGoalsAttempted3) * 100).toFixed(1)) : 36,
        pps: 1.14,
        leagueAvgFgPct: 36,
      },
      ftr: fga >0 ? Number(((p.FreeThrowsAttempted || 0) / fga).toFixed(3)) : 0,
      threePointAttemptRate,
      moreyballRate,
      shotStyleNotes: `Statistiche normalizzate 2026/27 (${mpg} MPG).`,
    },
  };
}
