import fs from 'fs';
import path from 'path';

const ROOT_DIR = typeof process !== 'undefined' && typeof process.cwd === 'function' ? process.cwd() : '.';
const PBP_STORE_PATH = path.join(ROOT_DIR, 'data_pbp_store.json');
const GAMES_STORE_PATH = path.join(ROOT_DIR, 'data_games_store.json');

export interface PbpEvent {
  TYPE?: number;
  NUMBEROFPLAY?: number;
  CODETEAM?: string | null;
  PLAYER_ID?: string | null;
  PLAYTYPE?: string | null;
  PLAYER?: string | null;
  TEAM?: string | null;
  DORSAL?: string | null;
  MINUTE?: number;
  MARKERTIME?: string | null;
  POINTS_A?: number | null;
  POINTS_B?: number | null;
  COMMENT?: string | null;
  PLAYINFO?: string | null;
}

export interface PbpGameRecord {
  Live?: boolean;
  TeamA?: string;
  TeamB?: string;
  CodeTeamA?: string;
  CodeTeamB?: string;
  ActualQuarter?: number;
  FirstQuarter?: PbpEvent[];
  SecondQuarter?: PbpEvent[];
  ThirdQuarter?: PbpEvent[];
  ForthQuarter?: PbpEvent[];
  FourthQuarter?: PbpEvent[];
  ExtraTime?: PbpEvent[];
}

export interface PbpSideCounts {
  pts: number;
  fga: number;
  fgm: number;
  fg2a: number;
  fg2m: number;
  fg3a: number;
  fg3m: number;
  fta: number;
  ftm: number;
  orb: number;
  drb: number;
  tov: number;
}

export interface AnalyzedPlayerPbp {
  playerId: string;
  onSec: number;
  onPtsFor: number;
  onPtsAgainst: number;
  onPossFor: number;
  onPossAgainst: number;
  clutchPts: number;
  clutchFga: number;
  clutchFgm: number;
  clutchFg3m: number;
  clutchFta: number;
  clutchOnPtsFor: number;
  clutchOnPtsAgainst: number;
  clutchOnPossFor: number;
  clutchOnPossAgainst: number;
}

export interface AnalyzedGamePbp {
  gameKey: string;
  teams: [
    {
      teamName: string;
      raw: PbpSideCounts;
      nonGarbage: PbpSideCounts;
      clutch: PbpSideCounts;
      killShots: number;
      runsConceded: number;
      players: Record<string, AnalyzedPlayerPbp>;
    },
    {
      teamName: string;
      raw: PbpSideCounts;
      nonGarbage: PbpSideCounts;
      clutch: PbpSideCounts;
      killShots: number;
      runsConceded: number;
      players: Record<string, AnalyzedPlayerPbp>;
    }
  ];
}

let inMemoryPbpCache: Record<string, PbpGameRecord> | null = null;
let isPbpSyncRunning = false;
let lastPbpSyncAt: string | null = null;
let lastRateLimitAt: number = 0;

export function loadPbpStore(): Record<string, PbpGameRecord> {
  if (inMemoryPbpCache) return inMemoryPbpCache;
  try {
    if (fs.existsSync(PBP_STORE_PATH)) {
      const content = fs.readFileSync(PBP_STORE_PATH, 'utf-8');
      inMemoryPbpCache = JSON.parse(content);
      return inMemoryPbpCache!;
    }
  } catch (e) {
    console.error('[PBP Engine] Failed to load data_pbp_store.json:', e);
  }
  inMemoryPbpCache = {};
  return inMemoryPbpCache;
}

export function savePbpStore(store: Record<string, PbpGameRecord>) {
  inMemoryPbpCache = store;
  try {
    fs.writeFileSync(PBP_STORE_PATH, JSON.stringify(store), 'utf-8');
  } catch (e) {
    console.error('[PBP Engine] Failed to write data_pbp_store.json:', e);
  }
}

export function getPbpSyncStatus() {
  const pbpStore = loadPbpStore();
  let totalCompletedEuroGames = 0;
  let cachedCompletedGames = 0;

  try {
    if (fs.existsSync(GAMES_STORE_PATH)) {
      const gamesStore = JSON.parse(fs.readFileSync(GAMES_STORE_PATH, 'utf-8'));
      for (const [key, g] of Object.entries<any>(gamesStore)) {
        if (!g || g.Live || !g.Stats || g.Stats.length < 2) continue;
        totalCompletedEuroGames++;
        if (pbpStore[key] && (pbpStore[key].FirstQuarter?.length || 0) > 0) {
          cachedCompletedGames++;
        }
      }
    }
  } catch (e) {}

  return {
    totalCompletedEuroGames,
    cachedPbpGames: cachedCompletedGames,
    missingPbpGames: Math.max(0, totalCompletedEuroGames - cachedCompletedGames),
    coveragePct:
      totalCompletedEuroGames > 0
        ? Number(((cachedCompletedGames / totalCompletedEuroGames) * 100).toFixed(1))
        : 0,
    isSyncing: isPbpSyncRunning,
    lastSyncAt: lastPbpSyncAt,
  };
}

function emptyCounts(): PbpSideCounts {
  return {
    pts: 0,
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
  };
}

export function calcPossessionsFromCounts(c: PbpSideCounts): number {
  return Math.max(0, c.fga + 0.44 * c.fta - c.orb + c.tov);
}

function parseMarkerRemainingSec(marker: any, minute: number | undefined, isOt: boolean): number {
  if (typeof marker === 'string' && marker.includes(':')) {
    const parts = marker.trim().split(':');
    const m = parseInt(parts[0], 10);
    const s = parseInt(parts[1], 10);
    if (!isNaN(m) && !isNaN(s)) {
      return Math.max(0, m * 60 + s);
    }
  }
  const periodLen = isOt ? 300 : 600;
  if (typeof minute === 'number' && minute > 0) {
    if (isOt) {
      const otMin = ((minute - 41) % 5) + 1;
      return Math.max(0, (5 - otMin + 0.5) * 60);
    }
    const qMin = ((minute - 1) % 10) + 1;
    return Math.max(0, (10 - qMin + 0.5) * 60);
  }
  return periodLen;
}

function getGameElapsedSec(quarterNum: number, marker: any, minute: number | undefined): number {
  const isOt = quarterNum >= 5;
  const periodLen = isOt ? 300 : 600;
  const rem = Math.min(periodLen, parseMarkerRemainingSec(marker, minute, isOt));
  if (quarterNum <= 4) {
    return (quarterNum - 1) * 600 + (600 - rem);
  }
  return 2400 + (quarterNum - 5) * 300 + (300 - rem);
}

function emptyPlayerPbp(playerId: string): AnalyzedPlayerPbp {
  return {
    playerId,
    onSec: 0,
    onPtsFor: 0,
    onPtsAgainst: 0,
    onPossFor: 0,
    onPossAgainst: 0,
    clutchPts: 0,
    clutchFga: 0,
    clutchFgm: 0,
    clutchFg3m: 0,
    clutchFta: 0,
    clutchOnPtsFor: 0,
    clutchOnPtsAgainst: 0,
    clutchOnPossFor: 0,
    clutchOnPossAgainst: 0,
  };
}

function applyStatEvent(counts: PbpSideCounts, playType: string): { pts: number; possDelta: number } {
  switch (playType) {
    case '2FGM':
      counts.fga += 1;
      counts.fgm += 1;
      counts.fg2a += 1;
      counts.fg2m += 1;
      counts.pts += 2;
      return { pts: 2, possDelta: 1 };
    case '2FGA':
      counts.fga += 1;
      counts.fg2a += 1;
      return { pts: 0, possDelta: 1 };
    case '3FGM':
      counts.fga += 1;
      counts.fgm += 1;
      counts.fg3a += 1;
      counts.fg3m += 1;
      counts.pts += 3;
      return { pts: 3, possDelta: 1 };
    case '3FGA':
      counts.fga += 1;
      counts.fg3a += 1;
      return { pts: 0, possDelta: 1 };
    case 'FTM':
      counts.fta += 1;
      counts.ftm += 1;
      counts.pts += 1;
      return { pts: 1, possDelta: 0.44 };
    case 'FTA':
      counts.fta += 1;
      return { pts: 0, possDelta: 0.44 };
    case 'O':
      counts.orb += 1;
      return { pts: 0, possDelta: -1 };
    case 'D':
      counts.drb += 1;
      return { pts: 0, possDelta: 0 };
    case 'TO':
      counts.tov += 1;
      return { pts: 0, possDelta: 1 };
    default:
      return { pts: 0, possDelta: 0 };
  }
}

/**
 * Analizza un singolo match combinando Boxscore (per starter e mappatura team) e Play-by-Play ufficiale.
 */
export function analyzeGamePlayByPlay(
  gameKey: string,
  gameBoxscore: any,
  pbp: PbpGameRecord
): AnalyzedGamePbp | null {
  if (!pbp || !gameBoxscore?.Stats || gameBoxscore.Stats.length < 2) return null;

  const q1 = pbp.FirstQuarter || [];
  const q2 = pbp.SecondQuarter || [];
  const q3 = pbp.ThirdQuarter || [];
  const q4 = pbp.ForthQuarter || pbp.FourthQuarter || [];
  const extra = pbp.ExtraTime || [];

  if (q1.length === 0 && q2.length === 0 && q3.length === 0 && q4.length === 0) {
    return null;
  }

  const stat0 = gameBoxscore.Stats[0];
  const stat1 = gameBoxscore.Stats[1];
  const team0Name = (stat0.Team || '').trim();
  const team1Name = (stat1.Team || '').trim();

  const codeA = (pbp.CodeTeamA || '').trim().toUpperCase();
  const codeB = (pbp.CodeTeamB || '').trim().toUpperCase();

  // Mappatura affidabile CodeTeamA/B -> Stats[0]/Stats[1] tramite Player_ID condivisi o nome squadra
  const team0Pids = new Set(
    (stat0.PlayersStats || []).map((p: any) => (p.Player_ID || '').trim()).filter(Boolean)
  );
  const team1Pids = new Set(
    (stat1.PlayersStats || []).map((p: any) => (p.Player_ID || '').trim()).filter(Boolean)
  );

  let side0Code = codeA;
  let side1Code = codeB;

  let codeAMatches0 = 0;
  let codeAMatches1 = 0;
  for (const ev of [...q1, ...q2]) {
    const c = (ev.CODETEAM || '').trim().toUpperCase();
    const pid = (ev.PLAYER_ID || '').trim();
    if (!c || !pid) continue;
    if (c === codeA) {
      if (team0Pids.has(pid)) codeAMatches0++;
      if (team1Pids.has(pid)) codeAMatches1++;
    }
  }

  if (codeAMatches1 > codeAMatches0) {
    side0Code = codeB;
    side1Code = codeA;
  } else if (codeAMatches0 === 0 && codeAMatches1 === 0) {
    const pbpTeamAUpper = (pbp.TeamA || '').trim().toUpperCase();
    if (pbpTeamAUpper && pbpTeamAUpper === team1Name.toUpperCase()) {
      side0Code = codeB;
      side1Code = codeA;
    }
  }

  const rawCounts: [PbpSideCounts, PbpSideCounts] = [emptyCounts(), emptyCounts()];
  const nonGarbageCounts: [PbpSideCounts, PbpSideCounts] = [emptyCounts(), emptyCounts()];
  const clutchCounts: [PbpSideCounts, PbpSideCounts] = [emptyCounts(), emptyCounts()];
  const killShots: [number, number] = [0, 0];
  const runsConceded: [number, number] = [0, 0];

  // Inizializza quintetti titolari da Boxscore (IsStarter === 1)
  const onCourt: [Set<string>, Set<string>] = [new Set<string>(), new Set<string>()];
  for (let side = 0; side < 2; side++) {
    const starters = (gameBoxscore.Stats[side].PlayersStats || [])
      .filter((p: any) => Number(p.IsStarter) === 1 && (p.Player_ID || '').trim())
      .slice(0, 5);
    starters.forEach((p: any) => onCourt[side].add((p.Player_ID || '').trim()));
  }

  const playerPbpMaps: [Record<string, AnalyzedPlayerPbp>, Record<string, AnalyzedPlayerPbp>] = [{}, {}];
  const getPlayerRec = (side: 0 | 1, pid: string): AnalyzedPlayerPbp => {
    if (!playerPbpMaps[side][pid]) {
      playerPbpMaps[side][pid] = emptyPlayerPbp(pid);
    }
    return playerPbpMaps[side][pid];
  };

  let scoreSide0 = 0;
  let scoreSide1 = 0;
  let lastElapsedSec = 0;

  // Stato streak Kill Shots (10-0+)
  let runSide: 0 | 1 | null = null;
  let runPts = 0;
  let runCounted = false;

  // Divide ExtraTime in blocchi OT da 5 min se ci sono più overtime usando PLAYTYPE === 'BP'
  const quarterStreams: Array<{ qNum: number; events: PbpEvent[] }> = [
    { qNum: 1, events: q1 },
    { qNum: 2, events: q2 },
    { qNum: 3, events: q3 },
    { qNum: 4, events: q4 },
  ];

  if (extra.length > 0) {
    let otIdx = 5;
    let currentOtEvents: PbpEvent[] = [];
    for (const ev of extra) {
      if (ev.PLAYTYPE === 'BP' && currentOtEvents.length > 0) {
        quarterStreams.push({ qNum: otIdx++, events: currentOtEvents });
        currentOtEvents = [];
      }
      currentOtEvents.push(ev);
    }
    if (currentOtEvents.length > 0) {
      quarterStreams.push({ qNum: otIdx, events: currentOtEvents });
    }
  }

  const ON_COURT_ACTION_TYPES = new Set([
    '2FGM', '2FGA', '3FGM', '3FGA', 'FTM', 'FTA', 'O', 'D', 'TO', 'AS', 'ST', 'FV', 'AG', 'CM', 'RV', 'OF',
  ]);

  for (const { qNum, events } of quarterStreams) {
    const sorted = events.slice().sort((a, b) => (a.NUMBEROFPLAY || 0) - (b.NUMBEROFPLAY || 0));

    for (const ev of sorted) {
      const playType = (ev.PLAYTYPE || '').trim();
      const codeTeam = (ev.CODETEAM || '').trim().toUpperCase();
      const pid = (ev.PLAYER_ID || '').trim();
      const side: 0 | 1 | null =
        codeTeam && codeTeam === side0Code ? 0 : codeTeam && codeTeam === side1Code ? 1 : null;

      // Calcola avanzamento cronometro
      const elapsedSec = getGameElapsedSec(qNum, ev.MARKERTIME, ev.MINUTE);
      if (elapsedSec > lastElapsedSec) {
        const dt = elapsedSec - lastElapsedSec;
        for (const p0 of onCourt[0]) {
          getPlayerRec(0, p0).onSec += dt;
        }
        for (const p1 of onCourt[1]) {
          getPlayerRec(1, p1).onSec += dt;
        }
        lastElapsedSec = elapsedSec;
      }

      // Sostituzioni IN / OUT
      if (side !== null && pid && playType === 'IN') {
        onCourt[side].add(pid);
        getPlayerRec(side, pid);
        continue;
      }
      if (side !== null && pid && playType === 'OUT') {
        onCourt[side].delete(pid);
        continue;
      }

      // Auto-riparazione: se un giocatore compie un'azione in campo e non era ancora nei 5 (rarissimo caso di mancato IsStarter)
      if (side !== null && pid && ON_COURT_ACTION_TYPES.has(playType) && !onCourt[side].has(pid) && onCourt[side].size < 5) {
        onCourt[side].add(pid);
      }

      if (side === null) continue;

      const oppSide: 0 | 1 = side === 0 ? 1 : 0;
      const diffBefore = Math.abs(scoreSide0 - scoreSide1);
      const isOt = qNum >= 5;
      const remSecInPeriod = parseMarkerRemainingSec(ev.MARKERTIME, ev.MINUTE, isOt);

      // Garbage time FIBA 40': ultimi 5 minuti del 4° quarto con scarto >= 15 punti PRIMA dell'azione
      const isGarbage = qNum === 4 && remSecInPeriod <= 300 && diffBefore >= 15;
      // Clutch: ultimi 5 minuti di Q4 o tutto OT con scarto <= 5 punti PRIMA dell'azione
      const isClutch = ((qNum === 4 && remSecInPeriod <= 300) || qNum >= 5) && diffBefore <= 5;

      const { pts, possDelta } = applyStatEvent(rawCounts[side], playType);
      if (!isGarbage) {
        applyStatEvent(nonGarbageCounts[side], playType);
      }
      if (isClutch) {
        applyStatEvent(clutchCounts[side], playType);
      }

      // Aggiorna On-Court stats per i 5 in campo di entrambe le squadre
      if (pts > 0 || possDelta !== 0) {
        for (const pOn of onCourt[side]) {
          const rec = getPlayerRec(side, pOn);
          rec.onPtsFor += pts;
          rec.onPossFor += possDelta;
          if (isClutch) {
            rec.clutchOnPtsFor += pts;
            rec.clutchOnPossFor += possDelta;
          }
        }
        for (const pOpp of onCourt[oppSide]) {
          const rec = getPlayerRec(oppSide, pOpp);
          rec.onPtsAgainst += pts;
          rec.onPossAgainst += possDelta;
          if (isClutch) {
            rec.clutchOnPtsAgainst += pts;
            rec.clutchOnPossAgainst += possDelta;
          }
        }
      }

      // Statistiche Clutch individuali
      if (isClutch && pid) {
        const pRec = getPlayerRec(side, pid);
        if (playType === '2FGM') {
          pRec.clutchPts += 2;
          pRec.clutchFga += 1;
          pRec.clutchFgm += 1;
        } else if (playType === '2FGA') {
          pRec.clutchFga += 1;
        } else if (playType === '3FGM') {
          pRec.clutchPts += 3;
          pRec.clutchFga += 1;
          pRec.clutchFgm += 1;
          pRec.clutchFg3m += 1;
        } else if (playType === '3FGA') {
          pRec.clutchFga += 1;
        } else if (playType === 'FTM') {
          pRec.clutchPts += 1;
          pRec.clutchFta += 1;
        } else if (playType === 'FTA') {
          pRec.clutchFta += 1;
        }
      }

      // Aggiorna punteggio corrente e streak Kill Shots (10-0+)
      if (pts > 0) {
        if (side === 0) scoreSide0 += pts;
        else scoreSide1 += pts;

        // Verifica anche sincronia con POINTS_A / POINTS_B ufficiali se presenti
        if (typeof ev.POINTS_A === 'number' && typeof ev.POINTS_B === 'number') {
          if (side0Code === codeA) {
            scoreSide0 = ev.POINTS_A;
            scoreSide1 = ev.POINTS_B;
          } else {
            scoreSide0 = ev.POINTS_B;
            scoreSide1 = ev.POINTS_A;
          }
        }

        if (runSide === side) {
          runPts += pts;
        } else {
          runSide = side;
          runPts = pts;
          runCounted = false;
        }
        if (runPts >= 10 && !runCounted) {
          killShots[side] += 1;
          runsConceded[oppSide] += 1;
          runCounted = true;
        }
      }
    }

    // Assicurati che a fine periodo il cronometro arrivi alla fine esatta del quarto
    const periodEndSec = qNum <= 4 ? qNum * 600 : 2400 + (qNum - 4) * 300;
    if (periodEndSec > lastElapsedSec) {
      const dt = periodEndSec - lastElapsedSec;
      for (const p0 of onCourt[0]) getPlayerRec(0, p0).onSec += dt;
      for (const p1 of onCourt[1]) getPlayerRec(1, p1).onSec += dt;
      lastElapsedSec = periodEndSec;
    }
  }

  return {
    gameKey,
    teams: [
      {
        teamName: team0Name,
        raw: rawCounts[0],
        nonGarbage: nonGarbageCounts[0],
        clutch: clutchCounts[0],
        killShots: killShots[0],
        runsConceded: runsConceded[0],
        players: playerPbpMaps[0],
      },
      {
        teamName: team1Name,
        raw: rawCounts[1],
        nonGarbage: nonGarbageCounts[1],
        clutch: clutchCounts[1],
        killShots: killShots[1],
        runsConceded: runsConceded[1],
        players: playerPbpMaps[1],
      },
    ],
  };
}

/**
 * Scarica in modalità throttled e sicura un batch di Play-by-Play mancanti (evitando HTTP 429).
 */
export async function syncMissingPlayByPlayBatch(
  maxToFetch: number = 30,
  delayMs: number = 480
): Promise<{
  fetched: number;
  failed: number;
  rateLimited: boolean;
  status: ReturnType<typeof getPbpSyncStatus>;
}> {
  if (isPbpSyncRunning) {
    return { fetched: 0, failed: 0, rateLimited: false, status: getPbpSyncStatus() };
  }

  // Rispetta un cooldown di 60 secondi dopo un 429
  if (Date.now() - lastRateLimitAt < 60_000) {
    return { fetched: 0, failed: 0, rateLimited: true, status: getPbpSyncStatus() };
  }

  isPbpSyncRunning = true;
  let fetched = 0;
  let failed = 0;
  let rateLimited = false;

  try {
    if (!fs.existsSync(GAMES_STORE_PATH)) {
      return { fetched: 0, failed: 0, rateLimited: false, status: getPbpSyncStatus() };
    }

    const gamesStore = JSON.parse(fs.readFileSync(GAMES_STORE_PATH, 'utf-8'));
    const pbpStore = loadPbpStore();

    const missingKeys: string[] = [];
    for (const [key, g] of Object.entries<any>(gamesStore)) {
      if (!g || g.Live || !g.Stats || g.Stats.length < 2) continue;
      const cached = pbpStore[key];
      if (!cached || !cached.FirstQuarter || cached.FirstQuarter.length === 0) {
        missingKeys.push(key);
      }
    }

    const slice = missingKeys.slice(0, maxToFetch);
    for (const key of slice) {
      const [seasonCode, gameCodeStr] = key.split('_');
      if (!seasonCode || !gameCodeStr) continue;

      try {
        const url = `https://live.euroleague.net/api/PlayByPlay?gamecode=${gameCodeStr}&seasoncode=${seasonCode}`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (EuroBasketAnalytics/2.0)',
            Accept: 'application/json, text/plain, */*',
          },
          signal: AbortSignal.timeout(4500),
        });

        if (res.status === 429) {
          console.warn(`[PBP Sync] HTTP 429 rate-limit rilevato su ${key}. Pausa automatica.`);
          lastRateLimitAt = Date.now();
          rateLimited = true;
          break;
        }

        if (res.ok) {
          const text = await res.text();
          if (text.trim().startsWith('{')) {
            const parsed: PbpGameRecord = JSON.parse(text);
            if ((parsed.FirstQuarter?.length || 0) > 0) {
              pbpStore[key] = parsed;
              fetched++;
            } else {
              failed++;
            }
          } else {
            failed++;
          }
        } else {
          failed++;
        }
      } catch (err) {
        failed++;
      }

      if (fetched > 0 && fetched % 10 === 0) {
        savePbpStore(pbpStore);
      }

      await new Promise((r) => setTimeout(r, delayMs));
    }

    if (fetched > 0) {
      savePbpStore(pbpStore);
    }
    lastPbpSyncAt = new Date().toISOString();
  } finally {
    isPbpSyncRunning = false;
  }

  return {
    fetched,
    failed,
    rateLimited,
    status: getPbpSyncStatus(),
  };
}
