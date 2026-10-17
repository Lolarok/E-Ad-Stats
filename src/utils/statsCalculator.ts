/**
 * Motore di calcolo per Statistiche Avanzate di Basket (Regolamento FIBA 40 Minuti)
 */

export interface RawPlayerBoxscore {
  min: number;
  pts: number;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
  orb: number;
  drb: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
}

export interface RawTeamTotals {
  min: number; // normalmente 200 min (5 giocatori x 40m) o 225 per overtime
  pts: number;
  fga: number;
  fgm: number;
  fta: number;
  ftm: number;
  orb: number;
  drb: number;
  reb: number;
  ast: number;
  tov: number;
  fg3a: number;
  fg3m: number;
}

/**
 * Calcola la True Shooting Percentage (TS%)
 * Formula: PTS / (2 * (FGA + 0.44 * FTA))
 */
export function calculateTS(pts: number, fga: number, fta: number): number {
  const denominator = 2 * (fga + 0.44 * fta);
  if (denominator === 0) return 0;
  return Number(((pts / denominator) * 100).toFixed(1));
}

/**
 * Calcola l'Effective Field Goal Percentage (eFG%)
 * Formula: (FGM + 0.5 * 3PM) / FGA
 */
export function calculateEFG(fgm: number, fg3m: number, fga: number): number {
  if (fga === 0) return 0;
  return Number((((fgm + 0.5 * fg3m) / fga) * 100).toFixed(1));
}

/**
 * Stima dei possessi di una squadra (Formula Oliver adattata ai 40 minuti FIBA)
 * Poss = 0.96 * (FGA + 0.44 * FTA - ORB + TOV)
 */
export function calculatePossessions(fga: number, fta: number, orb: number, tov: number): number {
  return 0.96 * (fga + 0.44 * fta - orb + tov);
}

/**
 * Calcola il Ritmo (Pace) su 40 minuti FIBA
 */
export function calculatePace(teamPoss: number, oppPoss: number, teamMinutes: number = 200): number {
  const totalPoss = (teamPoss + oppPoss) / 2;
  return Number((totalPoss * (200 / teamMinutes)).toFixed(1));
}

/**
 * Calcola l'Offensive Rating (Punti per 100 possessi)
 */
export function calculateRating(pts: number, possessions: number): number {
  if (possessions <= 0) return 0;
  return Number(((pts / possessions) * 100).toFixed(1));
}

/**
 * Calcola l'Usage Percentage (USG%)
 * Formula: 100 * ((FGA + 0.44 * FTA + TOV) * (Team_MIN / 5)) / (Player_MIN * (Team_FGA + 0.44 * Team_FTA + Team_TOV))
 */
export function calculateUSG(
  player: { fga: number; fta: number; tov: number; min: number },
  team: { fga: number; fta: number; tov: number; min: number }
): number {
  if (player.min <= 0) return 0;
  const playerPlays = player.fga + 0.44 * player.fta + player.tov;
  const teamPlays = team.fga + 0.44 * team.fta + team.tov;
  if (teamPlays <= 0) return 0;

  const usage = 100 * ((playerPlays * (team.min / 5)) / (player.min * teamPlays));
  return Number(usage.toFixed(1));
}

/**
 * Calcola il Game Score di John Hollinger (Molto superiore al PIR)
 * Formula: PTS + 0.4*FGM - 0.7*FGA - 0.4*(FTA - FTM) + 0.7*ORB + 0.3*DRB + STL + 0.7*AST + 0.7*BLK - 0.4*PF - TOV
 */
export function calculateGameScore(p: RawPlayerBoxscore): number {
  const score =
    p.pts +
    0.4 * p.fgm -
    0.7 * p.fga -
    0.4 * (p.fta - p.ftm) +
    0.7 * p.orb +
    0.3 * p.drb +
    p.stl +
    0.7 * p.ast +
    0.7 * p.blk -
    0.4 * p.pf -
    p.tov;
  return Number(score.toFixed(1));
}

/**
 * Calcola il tradizionale PIR (Valutazione Euroleague)
 */
export function calculatePIR(
  p: RawPlayerBoxscore,
  foulsDrawn: number = Math.round(p.fta * 0.7) // stima se non presente
): number {
  const positive = p.pts + (p.orb + p.drb) + p.ast + p.stl + p.blk + foulsDrawn;
  const negative = (p.fga - p.fgm) + (p.fta - p.ftm) + p.tov + p.pf;
  return positive - negative;
}

/**
 * Metriche di selezione di tiro (Shot Profile)
 */
export function calculateShotProfile(fga: number, fg2a: number, fg3a: number, fta: number, pts: number) {
  const threePointAttemptRate = fga > 0 ? Number(((fg3a / fga) * 100).toFixed(1)) : 0;
  const twoPointAttemptRate = fga > 0 ? Number(((fg2a / fga) * 100).toFixed(1)) : 0;
  const ftr = fga > 0 ? Number((fta / fga).toFixed(3)) : 0;
  const pointsPerShot = fga > 0 ? Number((pts / fga).toFixed(2)) : 0;

  return {
    threePointAttemptRate,
    twoPointAttemptRate,
    ftr,
    pointsPerShot,
  };
}

/**
 * I 4 Fattori di Dean Oliver
 */
export function calculateFourFactors(
  fgm: number,
  fg3m: number,
  fga: number,
  tov: number,
  fta: number,
  orb: number,
  oppDrb: number
) {
  const efgPct = calculateEFG(fgm, fg3m, fga);
  const poss = calculatePossessions(fga, fta, orb, tov);
  const tovPct = poss > 0 ? Number(((tov / poss) * 100).toFixed(1)) : 0;
  const availableOrbs = orb + oppDrb;
  const orbPct = availableOrbs > 0 ? Number(((orb / availableOrbs) * 100).toFixed(1)) : 0;
  const ftr = fga > 0 ? Number((fta / fga).toFixed(3)) : 0;

  return {
    efgPct,
    tovPct,
    orbPct,
    ftr,
  };
}
