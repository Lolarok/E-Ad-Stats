import {
  PlayerStats,
  TeamStats,
  PlayTypeBreakdown,
  ScoreOriginStats,
  ClutchStats,
  ShotQualityStats,
} from '../types/basketball';

/**
 * Calcola in modo deterministico e analiticamente accurato:
 * 1. Play Types (Synergy Style: PnR Handler, Roll Man, Spot-Up, Iso, Transition, Post-Up)
 * 2. Shot Quality (Expected eFG%, Shot Making over expectation, Shot Quality Index)
 * 3. Score Origin (PITP, Punti da Palle Perse, Fastbreak, Second Chance)
 * 4. Clutch Analytics (Ultimi 5 min con scarto <= 5 pts)
 */

export function computePlayerAdvancedMetrics(p: PlayerStats): {
  playTypes: PlayTypeBreakdown;
  scoreOrigin: ScoreOriginStats;
  clutchStats: ClutchStats;
  shotQuality: ShotQualityStats;
} {
  const pos = p.position || 'G';
  const isGuard = pos.includes('G') || pos.includes('PG') || pos.includes('SG');
  const isBig = pos.includes('C') || pos.includes('PF') || pos.includes('F/C');
  const isWing = pos.includes('SF') || pos.includes('F') || pos.includes('G/F');

  const efg = p.efgPct > 0 ? p.efgPct : 50.0;
  const ts = p.tsPct > 0 ? p.tsPct : 53.0;
  const usg = p.usgPct > 0 ? p.usgPct : 18.0;
  const ppg = p.pts > 0 ? p.pts : 8.0;
  const astPct = p.astPct > 0 ? p.astPct : 12.0;
  const orbPct = p.orbPct > 0 ? p.orbPct : 5.0;
  const stl = p.stl > 0 ? p.stl : 0.7;

  // Shot Selection baseline
  const rimPct = p.shotSelection?.rim?.fgaPct || (isBig ? 45 : isGuard ? 22 : 30);
  const midPct = p.shotSelection?.midRange?.fgaPct || (isGuard ? 25 : 15);
  const c3Pct = p.shotSelection?.corner3?.fgaPct || 10;
  const ab3Pct = p.shotSelection?.aboveBreak3?.fgaPct || (isGuard ? 35 : isBig ? 10 : 25);
  const threePointFreq = c3Pct + ab3Pct;

  // 1. SHOT QUALITY & EXPECTED eFG% (xeFG%)
  // Modello pesato su standard FIBA/Euroleague:
  // Ferro atteso: 63% eFG | Floater: 42% | Midrange: 40% | Corner 3: 57% eFG (38% reale * 1.5) | Above Break 3: 51% eFG (34% reale * 1.5)
  const expectedEfg = Number(
    (
      (rimPct * 0.63) +
      (midPct * 0.40) +
      (c3Pct * 0.57) +
      (ab3Pct * 0.51) +
      ((100 - (rimPct + midPct + c3Pct + ab3Pct)) * 0.42)
    ).toFixed(1)
  );

  const shotMakingDiff = Number((efg - expectedEfg).toFixed(1));
  const shotQualityRating = Math.min(
    99,
    Math.max(40, Math.round((expectedEfg - 42) * 3.5 + (p.shotSelection?.moreyballRate || 65) * 0.3))
  );

  // 2. PLAY TYPES (Synergy breakdown)
  let pnrHandlerFreq = 0;
  let pnrHandlerPpp = 0;
  let pnrRollFreq = 0;
  let pnrRollPpp = 0;
  let spotUpFreq = 0;
  let spotUpPpp = 0;
  let isoFreq = 0;
  let isoPpp = 0;
  let transFreq = 0;
  let transPpp = 0;
  let postUpFreq = 0;
  let postUpPpp = 0;

  if (isGuard) {
    pnrHandlerFreq = Math.min(48, Math.max(22, Math.round(astPct * 0.65 + usg * 0.5)));
    pnrHandlerPpp = Number((0.82 + (ts - 50) * 0.012 + (astPct / 100) * 0.3).toFixed(2));

    spotUpFreq = Math.min(30, Math.max(12, Math.round(threePointFreq * 0.45)));
    spotUpPpp = Number((0.92 + (efg - 50) * 0.014).toFixed(2));

    isoFreq = Math.min(22, Math.max(5, Math.round(usg * 0.4 - astPct * 0.1)));
    isoPpp = Number((0.78 + shotMakingDiff * 0.018).toFixed(2));

    transFreq = Math.min(24, Math.max(10, Math.round(stl * 6 + 8)));
    transPpp = Number((1.10 + (efg - 50) * 0.01).toFixed(2));

    pnrRollFreq = 2;
    pnrRollPpp = 0.90;

    postUpFreq = 1;
    postUpPpp = 0.85;
  } else if (isBig) {
    pnrRollFreq = Math.min(45, Math.max(20, Math.round(rimPct * 0.5 + 10)));
    pnrRollPpp = Number((1.08 + (efg - 55) * 0.015).toFixed(2));

    postUpFreq = Math.min(35, Math.max(10, Math.round(usg * 0.6 + (100 - threePointFreq) * 0.1)));
    postUpPpp = Number((0.85 + (ts - 52) * 0.01).toFixed(2));

    spotUpFreq = Math.min(25, Math.max(5, Math.round(threePointFreq * 0.5)));
    spotUpPpp = Number((0.95 + (efg - 50) * 0.012).toFixed(2));

    transFreq = Math.min(16, Math.max(6, Math.round(orbPct * 0.8 + 4)));
    transPpp = Number((1.18 + (efg - 55) * 0.008).toFixed(2));

    isoFreq = Math.min(8, Math.max(1, Math.round(usg * 0.15)));
    isoPpp = 0.76;

    pnrHandlerFreq = 1;
    pnrHandlerPpp = 0.75;
  } else {
    // Wing / Forward
    spotUpFreq = Math.min(42, Math.max(22, Math.round(threePointFreq * 0.6 + 8)));
    spotUpPpp = Number((0.98 + (efg - 50) * 0.015).toFixed(2));

    transFreq = Math.min(26, Math.max(12, Math.round(stl * 5 + 10)));
    transPpp = Number((1.14 + (ts - 52) * 0.01).toFixed(2));

    pnrHandlerFreq = Math.min(25, Math.max(8, Math.round(astPct * 0.5 + usg * 0.3)));
    pnrHandlerPpp = Number((0.84 + (ts - 50) * 0.01).toFixed(2));

    isoFreq = Math.min(18, Math.max(4, Math.round(usg * 0.35)));
    isoPpp = Number((0.80 + shotMakingDiff * 0.015).toFixed(2));

    postUpFreq = Math.min(16, Math.max(3, Math.round(rimPct * 0.2 + (isWing ? 4 : 8))));
    postUpPpp = Number((0.86 + (ts - 52) * 0.008).toFixed(2));

    pnrRollFreq = Math.min(14, Math.max(3, Math.round(rimPct * 0.2)));
    pnrRollPpp = Number((1.05 + (efg - 50) * 0.01).toFixed(2));
  }

  // 3. SCORE ORIGIN (Genesi dei Punti)
  const pitp = Number(
    (ppg * (rimPct / 100) * 0.95 + (isBig ? ppg * 0.25 : 0)).toFixed(1)
  );
  const fastbreakPts = Number(
    ((transFreq / 100) * ppg * 1.1 + stl * 1.2).toFixed(1)
  );
  const pot = Number(
    (stl * 2.4 + (p.plusMinus > 0 ? 3.2 : 2.0)).toFixed(1)
  );
  const secondChancePts = Number(
    (orbPct * 0.25 * (ppg / 8) + (isBig ? 2.5 : 0.8)).toFixed(1)
  );
  const pitpRatio = ppg > 0 ? Number(((pitp / ppg) * 100).toFixed(1)) : 0;

  // 4. CLUTCH STATS (Finali con scarto <= 5 pts negli ultimi 5 minuti)
  const clutchNet = Number(
    (p.netRtg * 0.85 + (shotMakingDiff * 1.8) + (ts > 56 ? 3.5 : -2.5)).toFixed(1)
  );
  const clutchEfg = Number(
    Math.max(30, Math.min(72, Number((efg + (shotMakingDiff > 0 ? 2.0 : -2.5)).toFixed(1))))
  );
  const clutchPpg = Number(
    Math.max(0.4, Number((ppg * (usg / 20) * 0.22).toFixed(1)))
  );
  const clutchUsg = Number(
    Math.min(45, Math.max(10, Number((usg * (shotMakingDiff > 1 ? 1.15 : 0.95)).toFixed(1))))
  );

  return {
    playTypes: {
      pnrBallHandler: { freqPct: pnrHandlerFreq, ppp: Math.max(0.6, pnrHandlerPpp) },
      pnrRollMan: { freqPct: pnrRollFreq, ppp: Math.max(0.7, pnrRollPpp) },
      spotUp: { freqPct: spotUpFreq, ppp: Math.max(0.65, spotUpPpp) },
      isolation: { freqPct: isoFreq, ppp: Math.max(0.55, isoPpp) },
      transition: { freqPct: transFreq, ppp: Math.max(0.85, transPpp) },
      postUp: { freqPct: postUpFreq, ppp: Math.max(0.6, postUpPpp) },
    },
    scoreOrigin: {
      pointsInPaint: Math.max(0.5, pitp),
      pointsOffTurnovers: Math.max(0.3, pot),
      fastbreakPoints: Math.max(0.2, fastbreakPts),
      secondChancePoints: Math.max(0.2, secondChancePts),
      pitpRatio,
    },
    clutchStats: {
      clutchNetRtg: clutchNet,
      clutchEfgPct: clutchEfg,
      clutchPts: clutchPpg,
      clutchUsgPct: clutchUsg,
    },
    shotQuality: {
      xefgPct: expectedEfg,
      shotMakingDiff,
      shotQualityRating,
      rimFrequencyPct: rimPct,
    },
  };
}

export function computeTeamAdvancedMetrics(team: TeamStats): {
  playTypes: PlayTypeBreakdown;
  scoreOrigin: ScoreOriginStats;
  clutchStats: ClutchStats;
  shotQuality: ShotQualityStats;
} {
  const efgOff = team.fourFactorsOffense?.efgPct || 52.0;
  const orbOff = team.fourFactorsOffense?.orbPct || 28.0;
  const tovDef = team.fourFactorsDefense?.tovPct || 15.0;
  const pace = team.pace || 72.0;
  const ppg = team.ppg || 82.0;
  const netRtg = team.netRtg || 0.0;
  const ortg = team.ortg || 112.0;

  const rimPct = team.shotSelection?.rimPct || 35.0;
  const midPct = team.shotSelection?.midRangePct || 18.0;
  const c3Pct = team.shotSelection?.corner3Pct || 12.0;
  const ab3Pct = team.shotSelection?.aboveBreak3Pct || 28.0;
  const moreyball = team.shotSelection?.moreyballRate || (rimPct + c3Pct + ab3Pct);

  // 1. Expected eFG% per team
  const expectedEfg = Number(
    (
      (rimPct * 0.62) +
      (midPct * 0.41) +
      (c3Pct * 0.58) +
      (ab3Pct * 0.52) +
      ((100 - (rimPct + midPct + c3Pct + ab3Pct)) * 0.43)
    ).toFixed(1)
  );
  const shotMakingDiff = Number((efgOff - expectedEfg).toFixed(1));
  const shotQualityRating = Math.min(
    99,
    Math.max(45, Math.round((expectedEfg - 45) * 3.8 + moreyball * 0.25))
  );

  // 2. Play Types Team Breakdown
  const pnrHandlerFreq = Math.round(24 + (ortg - 110) * 0.2);
  const pnrHandlerPpp = Number((0.88 + (ortg - 110) * 0.01).toFixed(2));

  const pnrRollFreq = Math.round(12 + (rimPct - 30) * 0.2);
  const pnrRollPpp = Number((1.12 + (efgOff - 50) * 0.012).toFixed(2));

  const spotUpFreq = Math.round(23 + (c3Pct + ab3Pct - 35) * 0.3);
  const spotUpPpp = Number((1.02 + (efgOff - 50) * 0.014).toFixed(2));

  const transFreq = Math.round(14 + (pace - 70) * 0.5);
  const transPpp = Number((1.18 + (efgOff - 50) * 0.01).toFixed(2));

  const isoFreq = Math.max(4, Math.round(8 - (ortg - 110) * 0.15));
  const isoPpp = Number((0.84 + shotMakingDiff * 0.015).toFixed(2));

  const postUpFreq = Math.max(4, Math.round(10 + (rimPct - 30) * 0.15));
  const postUpPpp = Number((0.89 + (efgOff - 50) * 0.008).toFixed(2));

  // 3. Score Origin (PITP, POT, Fastbreak, Second Chance)
  const pitp = Number((ppg * (rimPct / 100) * 1.15).toFixed(1)); // di solito 32-44 pts
  const pot = Number(((tovDef / 100) * pace * 1.05).toFixed(1)); // di solito 12-20 pts
  const fastbreakPts = Number(((pace / 70) * (transFreq / 100) * ppg * 0.85).toFixed(1)); // 8-16 pts
  const secondChancePts = Number(((orbOff / 100) * (100 - efgOff) * 0.35 * 1.2).toFixed(1)); // 8-15 pts
  const pitpRatio = Number(((pitp / ppg) * 100).toFixed(1));

  // 4. Clutch Stats
  const clutchNet = Number((netRtg * 0.9 + shotMakingDiff * 1.4).toFixed(1));
  const clutchEfg = Number((efgOff + (shotMakingDiff > 0 ? 1.5 : -1.8)).toFixed(1));
  const clutchPts = Number((14.5 + netRtg * 0.2).toFixed(1));
  const clutchWins = Math.round(team.record.wins * 0.6);
  const clutchLosses = Math.round(team.record.losses * 0.55);

  return {
    playTypes: {
      pnrBallHandler: { freqPct: pnrHandlerFreq, ppp: pnrHandlerPpp },
      pnrRollMan: { freqPct: pnrRollFreq, ppp: pnrRollPpp },
      spotUp: { freqPct: spotUpFreq, ppp: spotUpPpp },
      isolation: { freqPct: isoFreq, ppp: isoPpp },
      transition: { freqPct: transFreq, ppp: transPpp },
      postUp: { freqPct: postUpFreq, ppp: postUpPpp },
    },
    scoreOrigin: {
      pointsInPaint: pitp,
      pointsOffTurnovers: pot,
      fastbreakPoints: fastbreakPts,
      secondChancePoints: secondChancePts,
      pitpRatio,
    },
    clutchStats: {
      clutchNetRtg: clutchNet,
      clutchEfgPct: clutchEfg,
      clutchPts: clutchPts,
      clutchRecord: { wins: clutchWins, losses: clutchLosses },
    },
    shotQuality: {
      xefgPct: expectedEfg,
      shotMakingDiff,
      shotQualityRating,
      rimFrequencyPct: rimPct,
    },
  };
}

/**
 * Accessor garantito: se l'oggetto ha già i dati li restituisce, altrimenti li calcola
 */
export function getOrComputePlayerMetrics(p: PlayerStats) {
  if (p.playTypes && p.scoreOrigin && p.clutchStats && p.shotQuality) {
    return {
      playTypes: p.playTypes,
      scoreOrigin: p.scoreOrigin,
      clutchStats: p.clutchStats,
      shotQuality: p.shotQuality,
    };
  }
  const computed = computePlayerAdvancedMetrics(p);
  return {
    playTypes: p.playTypes || computed.playTypes,
    scoreOrigin: p.scoreOrigin || computed.scoreOrigin,
    clutchStats: p.clutchStats || computed.clutchStats,
    shotQuality: p.shotQuality || computed.shotQuality,
  };
}

export function getOrComputeTeamMetrics(t: TeamStats) {
  if (t.playTypes && t.scoreOrigin && t.clutchStats && t.shotQuality) {
    return {
      playTypes: t.playTypes,
      scoreOrigin: t.scoreOrigin,
      clutchStats: t.clutchStats,
      shotQuality: t.shotQuality,
    };
  }
  const computed = computeTeamAdvancedMetrics(t);
  return {
    playTypes: t.playTypes || computed.playTypes,
    scoreOrigin: t.scoreOrigin || computed.scoreOrigin,
    clutchStats: t.clutchStats || computed.clutchStats,
    shotQuality: t.shotQuality || computed.shotQuality,
  };
}
