export type League = 'EuroLeague' | 'EuroCup' | 'LBA';
export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C' | 'G/F' | 'F' | 'PG/SG' | 'F/C' | '-';

export interface ShotZoneStats {
  fgaPct: number;    // % di tiri presi in questa zona rispetto al totale tiri
  fgPct: number;     // % di realizzazione in questa zona (0 - 100)
  pps: number;       // Punti per tiro (Points Per Shot)
  leagueAvgFgPct: number; // Media di riferimento lega per confronto visivo (+/-)
}

export interface PlayerShotSelection {
  rim: ShotZoneStats;          // Sotto canestro / Pitturato ristretto (< 1.5m)
  paintNonRim: ShotZoneStats;  // Pitturato fuori dal ferro / Floater area
  midRange: ShotZoneStats;     // Media distanza (2PT lunghi e arresto e tiro)
  corner3: ShotZoneStats;      // Triple dall'angolo (distanza minore 6.60m)
  aboveBreak3: ShotZoneStats;  // Triple frontali e a 45° (6.75m)
  ftr: number;                 // Free Throw Rate: FTA / FGA
  threePointAttemptRate: number; // 3PAr: 3PA / FGA
  moreyballRate: number;       // % tiri al ferro + triple sul totale FGA
  shotStyleNotes: string;      // Descrizione tattica selezione tiro
}

export interface PlayerStats {
  id: string;
  name: string;
  team: string;
  teamId: string;
  league: League;
  position: Position;
  number: number;
  heightCm: number;
  gamesPlayed: number;
  mpg: number; // Minuti per partita

  // Statistiche tradizionali a partita
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
  fga: number;
  fgm: number;
  fg2a: number;
  fg2m: number;
  fg3a: number;
  fg3m: number;
  fta: number;
  ftm: number;
  pir: number; // Performance Index Rating (Valutazione Euroleague tradizionale)
  plusMinus: number;

  // Statistiche Avanzate
  tsPct: number;      // True Shooting % (PTS / (2 * (FGA + 0.44 * FTA)))
  efgPct: number;     // Effective Field Goal % ((FGM + 0.5 * 3PM) / FGA)
  usgPct: number;     // Usage Rate %
  astPct: number;     // Assist Percentage
  astToRatio: number; // Assist / Turnover Ratio
  tovPct: number;     // Turnover Percentage
  orbPct: number;     // Offensive Rebound %
  drbPct: number;     // Defensive Rebound %
  trbPct: number;     // Total Rebound %
  ortg: number;       // Offensive Rating individuale (stima pts/100 poss)
  drtg: number;       // Defensive Rating individuale
  netRtg: number;     // Ortg - Drtg
  gameScore: number;  // Hollinger Game Score medio
  bpm: number;        // Box Plus Minus stimato
  ptsPer100?: number; // Punti normalizzati su 100 possessi (Gold standard analitico)
  rebPer100?: number; // Rimbalzi su 100 possessi
  astPer100?: number; // Assist su 100 possessi
  pp40?: number;      // Punti su 40 minuti (mantenuto per compatibilità)

  // Selezione di tiro specifica
  shotSelection: PlayerShotSelection;

  // Statistiche Avanzate Granulari (Synergy, Shot Quality, Clutch, Score Origin)
  playTypes?: PlayTypeBreakdown;
  scoreOrigin?: ScoreOriginStats;
  clutchStats?: ClutchStats;
  shotQuality?: ShotQualityStats;
}

export interface PlayTypeStat {
  freqPct: number;    // % sul totale possessi (es. 28.5%)
  ppp: number;        // Punti Per Possesso (es. 0.98)
  scorePct?: number;  // % possessi conclusi con punti
  fgPct?: number;     // FG% dal campo
}

export interface PlayTypeBreakdown {
  pnrBallHandler: PlayTypeStat;
  pnrRollMan: PlayTypeStat;
  spotUp: PlayTypeStat;
  isolation: PlayTypeStat;
  transition: PlayTypeStat;
  postUp: PlayTypeStat;
  cutOffScreen?: PlayTypeStat;
}

export interface ScoreOriginStats {
  pointsInPaint: number;      // PITP (Punti nel Pitturato)
  pointsOffTurnovers: number; // POT (Punti da Palle Perse)
  fastbreakPoints: number;    // Fastbreak (Contropiede)
  secondChancePoints: number; // Second Chance (Seconda Opportunità)
  pitpRatio?: number;         // % PITP sul totale punti segnati
}

export interface ClutchStats {
  clutchNetRtg: number;       // Net Rating negli ultimi 5 min con scarto <= 5 punti
  clutchEfgPct: number;       // eFG% nei finali punto a punto
  clutchPts: number;          // Punti medi segnati in clutch
  clutchUsgPct?: number;      // Usg% nel clutch
  clutchRecord?: { wins: number; losses: number };
}

export interface ShotQualityStats {
  xefgPct: number;            // Expected eFG% in base a zone e contestazione
  shotMakingDiff: number;     // eFG% - xeFG% (Shot Making over expectation)
  shotQualityRating: number;  // Valutazione qualità dei tiri generati (0 - 100)
  rimFrequencyPct: number;    // % di tiri presi al ferro (<1.5m)
}

export interface TeamShotSelection {
  rimPct: number;
  rimFgPct: number;
  midRangePct: number;
  midRangeFgPct: number;
  corner3Pct: number;
  corner3FgPct: number;
  aboveBreak3Pct: number;
  aboveBreak3FgPct: number;
  moreyballRate: number; // (Rim FGA + 3P FGA) / Total FGA
  ftr: number;
  pps: number;
}

export interface FourFactors {
  efgPct: number;     // Shooting
  tovPct: number;     // Ball Security
  orbPct: number;     // Offensive Rebound Control
  ftr: number;        // Foul Drawing
}

export interface TeamStats {
  id: string;
  name: string;
  shortName: string;
  league: League;
  logoColor: string;
  secondaryColor: string;
  gp: number;
  record: { wins: number; losses: number };
  wins?: number;
  losses?: number;
  
  // Pace e Rating per 100 possessi
  pace: number;       // Possessi stimati per 40 minuti FIBA
  ortg: number;       // Offensive Rating (Pts segnati / 100 poss)
  drtg: number;       // Defensive Rating (Pts subiti / 100 poss)
  netRtg: number;     // Ortg - Drtg
  ppg: number;
  pts?: number;
  oppPpg: number;

  // I 4 Fattori di Dean Oliver (Offensivi e Difensivi concessi)
  fourFactorsOffense: FourFactors;
  fourFactorsDefense: FourFactors;

  // Selezione di Tiro di Squadra
  shotSelection: TeamShotSelection;

  // Stile di gioco
  playStyle: string;

  // Statistiche Avanzate Granulari (Synergy, Shot Quality, Clutch, Score Origin)
  playTypes?: PlayTypeBreakdown;
  scoreOrigin?: ScoreOriginStats;
  clutchStats?: ClutchStats;
  shotQuality?: ShotQualityStats;
}
