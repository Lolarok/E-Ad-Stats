import fs from 'fs';
import path from 'path';
import { TeamStats, PlayerStats } from '../types/basketball';

const ROOT_DIR = typeof process !== 'undefined' && typeof process.cwd === 'function' ? process.cwd() : '.';
const LBA_STORE_PATH = path.join(ROOT_DIR, 'data_lba_store.json');
const OFFICIAL_PLAYERS_PATH = path.join(ROOT_DIR, 'all_official_players_full_2026.json');

export interface LbaSyncResult {
  completedRounds: number;
  totalMatches: number;
  newMatchesSynced: number;
  lastUpdated: string;
}

function mapOfficialRole(role: string): string {
  if (!role || role === '-') return '-';
  const r = role.trim();
  switch (r) {
    case 'Playmaker': return 'PG';
    case 'Guardia': return 'SG';
    case 'Guardia/Ala': return 'G/F';
    case 'Ala': return 'F';
    case 'Centro': return 'C';
    case 'Play/Guardia': return 'PG/SG';
    case 'Ala/Centro': return 'F/C';
    case 'Pivot': return 'C';
    default: return r;
  }
}

const TEAM_METADATA: Record<string, { id: string; shortName: string; color: string }> = {
  'Armani Olimpia Milano': { id: 'lba-armani-olimpia-milano', shortName: 'Milano', color: '#c8102e' },
  'Virtus Costa Bologna': { id: 'lba-virtus-costa-bologna', shortName: 'Virtus', color: '#000000' },
  'Umana Reyer Venezia': { id: 'lba-umana-reyer-venezia', shortName: 'Venezia', color: '#8a1538' },
  'Dolomiti Energia Trentino': { id: 'lba-dolomiti-energia-trentino', shortName: 'Trento', color: '#1e293b' },
  'Bertram Derthona Tortona': { id: 'lba-bertram-derthona-tortona', shortName: 'Tortona', color: '#002d62' },
  'UNA Hotels Reggio Emilia': { id: 'lba-una-hotels-reggio-emilia', shortName: 'Reggio Emilia', color: '#e30613' },
  'Nutribullet Treviso Basket': { id: 'lba-nutribullet-treviso', shortName: 'Treviso', color: '#0085ca' },
  'Pallacanestro Trieste': { id: 'lba-pallacanestro-trieste', shortName: 'Trieste', color: '#dc2626' },
  'Openjobmetis Varese': { id: 'lba-openjobmetis-varese', shortName: 'Varese', color: '#991b1b' },
  'Napoli Basketball': { id: 'lba-napoli-basketball', shortName: 'Napoli', color: '#0284c7' },
  'Longobardi Scafati Basket': { id: 'lba-longobardi-scafati-basket', shortName: 'Scafati', color: '#ea580c' },
  'Acqua S.Bernardo Cantù': { id: 'lba-acqua-san-bernardo-cantu', shortName: 'Cantù', color: '#1d4ed8' },
  'APU Old Wild West Udine': { id: 'lba-apu-udine', shortName: 'Udine', color: '#111827' },
  'Tezenis Verona': { id: 'lba-tezenis-verona', shortName: 'Verona', color: '#eab308' },
  'BC Roma': { id: 'lba-bc-roma', shortName: 'BC Roma', color: '#7c3aed' },
  'Maxima Roma': { id: 'lba-maxima-roma', shortName: 'Maxima Roma', color: '#d97706' },
};

/**
 * Recupera da legabasket.it o dai file locali le partite concluse fino al turno richiesto.
 */
export async function syncOfficialLbaRounds(maxDaysToScan: number = 4): Promise<LbaSyncResult> {
  const allMatches: any[] = [];
  let newMatchesSynced = 0;
  let maxCompletedRound = 1;

  for (let day = 1; day <= maxDaysToScan; day++) {
    const cachedFilePath = path.join(ROOT_DIR, `official_round_${day}_completed.json`);
    let dayMatches: any[] = [];

    // Se esiste la cache locale completata, usala prima
    if (fs.existsSync(cachedFilePath)) {
      try {
        dayMatches = JSON.parse(fs.readFileSync(cachedFilePath, 'utf-8'));
      } catch (e) {}
    }

    // Se la cache non ha 8 gare o stiamo cercando aggiornamenti live
    if (!dayMatches || dayMatches.length < 8) {
      try {
        const calUrl = `https://www.legabasket.it/api/championships/get-championships-calendar-by-id?id=602&day=${day}`;
        const calRes = await fetch(calUrl);
        if (calRes.ok) {
          const calData = await calRes.json();
          const matches = calData.matches || [];
          const fetchedMatches: any[] = [];

          for (const m of matches) {
            // Se la partita è terminata (game_status === "2")
            if (m.game_status === '2' || m.game_status === 2) {
              const sHome = m.h_team_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
              const sAway = m.v_team_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
              const gameUrl = `https://www.legabasket.it/game/${m.id}/${sHome}-${sAway}`;
              try {
                const text = await (await fetch(gameUrl)).text();
                const nextDataMatch = text.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
                if (nextDataMatch) {
                  const nextData = JSON.parse(nextDataMatch[1]);
                  const game = nextData.props?.pageProps?.game;
                  fetchedMatches.push({
                    matchId: m.id,
                    homeTeam: m.h_team_name,
                    awayTeam: m.v_team_name,
                    homeScore: m.home_final_score,
                    visitorScore: m.visitor_final_score,
                    matchDate: m.match_datetime,
                    scores: game?.scores,
                    matchData: game?.match,
                  });
                  newMatchesSynced++;
                }
              } catch (e) {}
            }
          }

          if (fetchedMatches.length > 0) {
            dayMatches = fetchedMatches;
            fs.writeFileSync(cachedFilePath, JSON.stringify(dayMatches, null, 2), 'utf-8');
          }
        }
      } catch (e) {
        console.warn(`[LBA Sync] Errore connessione legabasket.it per giornata ${day}:`, e);
      }
    }

    if (dayMatches && dayMatches.length > 0) {
      allMatches.push(...dayMatches);
      maxCompletedRound = day;
    }
  }

  // Se abbiamo partite elaborate, ricalcoliamo il dataset ufficiale LBA
  if (allMatches.length > 0) {
    calculateAndSaveLbaStore(allMatches, maxCompletedRound);
  }

  return {
    completedRounds: maxCompletedRound,
    totalMatches: allMatches.length,
    newMatchesSynced,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Calcola e restituisce sincronicamente il dataset LBA ufficiale a partire dalle partite completate.
 */
export function buildOfficialLbaDataset(roundNumber: number = 3): {
  teams: TeamStats[];
  players: PlayerStats[];
  round: number;
} {
  const allMatches: any[] = [];
  for (let day = 1; day <= roundNumber; day++) {
    const cachedFilePath = path.join(ROOT_DIR, `official_round_${day}_completed.json`);
    if (fs.existsSync(cachedFilePath)) {
      try {
        const matches = JSON.parse(fs.readFileSync(cachedFilePath, 'utf-8'));
        allMatches.push(...matches);
      } catch (e) {}
    }
  }

  if (allMatches.length > 0) {
    calculateAndSaveLbaStore(allMatches, roundNumber);
  }

  if (fs.existsSync(LBA_STORE_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(LBA_STORE_PATH, 'utf-8'));
      return {
        teams: data.teams || [],
        players: data.players || [],
        round: data.round || roundNumber,
      };
    } catch (e) {}
  }

  return { teams: [], players: [], round: roundNumber };
}

/**
 * Calcola statistiche avanzate su 100 possessi e Four Factors per squadre e giocatori LBA.
 */
export function calculateAndSaveLbaStore(allMatches: any[], roundNumber: number) {
  let officialPlayers: any[] = [];
  try {
    if (fs.existsSync(OFFICIAL_PLAYERS_PATH)) {
      officialPlayers = JSON.parse(fs.readFileSync(OFFICIAL_PLAYERS_PATH, 'utf-8'));
    }
  } catch (e) {
    console.error('Errore lettura all_official_players_full_2026.json:', e);
  }

  // 1. Aggregazione Squadre
  const teamAgg = new Map<string, any>();
  Object.keys(TEAM_METADATA).forEach((name) => {
    teamAgg.set(name, {
      name,
      gp: 0,
      w: 0,
      l: 0,
      pts: 0,
      oppPts: 0,
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
      poss: 0,
      oppPoss: 0,
    });
  });

  allMatches.forEach((m) => {
    const h = m.homeTeam;
    const a = m.awayTeam;
    const teH = teamAgg.get(h);
    const teA = teamAgg.get(a);
    if (!teH || !teA) return;

    const hs = m.homeScore;
    const as = m.visitorScore;
    const ht = m.scores?.ht?.totals;
    const vt = m.scores?.vt?.totals;

    teH.gp++;
    teA.gp++;
    teH.pts += hs;
    teA.pts += as;
    teH.oppPts += as;
    teA.oppPts += hs;
    if (hs > as) {
      teH.w++;
      teA.l++;
    } else {
      teA.w++;
      teH.l++;
    }

    const hFga = (ht?.t2_t || 0) + (ht?.t3_t || 0);
    const hFgm = (ht?.t2_r || 0) + (ht?.t3_r || 0);
    const aFga = (vt?.t2_t || 0) + (vt?.t3_t || 0);
    const aFgm = (vt?.t2_r || 0) + (vt?.t3_r || 0);

    teH.fga += hFga;
    teH.fgm += hFgm;
    teH.fg2a += ht?.t2_t || 0;
    teH.fg2m += ht?.t2_r || 0;
    teH.fg3a += ht?.t3_t || 0;
    teH.fg3m += ht?.t3_r || 0;
    teH.fta += ht?.tl_t || 0;
    teH.ftm += ht?.tl_r || 0;
    teH.orb += ht?.rimbalzi_o || 0;
    teH.drb += ht?.rimbalzi_d || 0;
    teH.tov += ht?.palle_p || 0;

    teA.fga += aFga;
    teA.fgm += aFgm;
    teA.fg2a += vt?.t2_t || 0;
    teA.fg2m += vt?.t2_r || 0;
    teA.fg3a += vt?.t3_t || 0;
    teA.fg3m += vt?.t3_r || 0;
    teA.fta += vt?.tl_t || 0;
    teA.ftm += vt?.tl_r || 0;
    teA.orb += vt?.rimbalzi_o || 0;
    teA.drb += vt?.rimbalzi_d || 0;
    teA.tov += vt?.palle_p || 0;

    teH.oppFga += aFga;
    teH.oppFgm += aFgm;
    teH.oppFg3m += vt?.t3_r || 0;
    teH.oppFta += vt?.tl_t || 0;
    teH.oppOrb += vt?.rimbalzi_o || 0;
    teH.oppDrb += vt?.rimbalzi_d || 0;
    teH.oppTov += vt?.palle_p || 0;

    teA.oppFga += hFga;
    teA.oppFgm += hFgm;
    teA.oppFg3m += ht?.t3_r || 0;
    teA.oppFta += ht?.tl_t || 0;
    teA.oppOrb += ht?.rimbalzi_o || 0;
    teA.oppDrb += ht?.rimbalzi_d || 0;
    teA.oppTov += ht?.palle_p || 0;

    const hPoss = hFga + 0.44 * (ht?.tl_t || 0) - (ht?.rimbalzi_o || 0) + (ht?.palle_p || 0);
    const aPoss = aFga + 0.44 * (vt?.tl_t || 0) - (vt?.rimbalzi_o || 0) + (vt?.palle_p || 0);
    teH.poss += hPoss;
    teH.oppPoss += aPoss;
    teA.poss += aPoss;
    teA.oppPoss += hPoss;
  });

  const calculatedTeams: TeamStats[] = Array.from(teamAgg.values())
    .map((t) => {
      const gp = Math.max(1, t.gp);
      const info = TEAM_METADATA[t.name] || {
        id: 'lba-' + t.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        shortName: t.name,
        color: '#4f46e5',
      };
      const ppg = Number((t.pts / gp).toFixed(1));
      const oppPpg = Number((t.oppPts / gp).toFixed(1));
      const pace = Number((t.poss / gp).toFixed(1));
      const ortg = t.poss > 0 ? Number(((t.pts / t.poss) * 100).toFixed(1)) : 110.0;
      const drtg = t.oppPoss > 0 ? Number(((t.oppPts / t.oppPoss) * 100).toFixed(1)) : 110.0;
      const netRtg = Number((ortg - drtg).toFixed(1));

      const efgOff = t.fga > 0 ? Number((((t.fgm + 0.5 * t.fg3m) / t.fga) * 100).toFixed(1)) : 52.0;
      const tovOff = t.poss > 0 ? Number(((t.tov / t.poss) * 100).toFixed(1)) : 13.0;
      const orbOff = t.orb + t.oppDrb > 0 ? Number(((t.orb / (t.orb + t.oppDrb)) * 100).toFixed(1)) : 30.0;
      const ftrOff = t.fga > 0 ? Number((t.fta / t.fga).toFixed(3)) : 0.28;

      const efgDef = t.oppFga > 0 ? Number((((t.oppFgm + 0.5 * t.oppFg3m) / t.oppFga) * 100).toFixed(1)) : 50.0;
      const tovDef = t.oppPoss > 0 ? Number(((t.oppTov / t.oppPoss) * 100).toFixed(1)) : 14.0;
      const orbDef = t.oppOrb + t.drb > 0 ? Number(((t.oppOrb / (t.oppOrb + t.drb)) * 100).toFixed(1)) : 26.0;
      const ftrDef = t.oppFga > 0 ? Number((t.oppFta / t.oppFga).toFixed(3)) : 0.26;

      const moreyball = t.fga > 0 ? Math.round(((t.fg2a * 0.6 + t.fg3a) / t.fga) * 100) : 80;

      return {
        id: info.id,
        name: t.name,
        shortName: info.shortName,
        league: 'LBA' as const,
        logoColor: info.color,
        secondaryColor: '#ffffff',
        gp: t.gp,
        record: { wins: t.w, losses: t.l },
        wins: t.w,
        losses: t.l,
        pace,
        ortg,
        drtg,
        netRtg,
        ppg,
        oppPpg,
        fourFactorsOffense: { efgPct: efgOff, tovPct: tovOff, orbPct: orbOff, ftr: ftrOff },
        fourFactorsDefense: { efgPct: efgDef, tovPct: tovDef, orbPct: orbDef, ftr: ftrDef },
        shotSelection: {
          rimPct: 37,
          rimFgPct: t.fg2a > 0 ? Number(((t.fg2m / t.fg2a) * 100 * 1.15).toFixed(1)) : 67.0,
          midRangePct: 15,
          midRangeFgPct: 42.0,
          corner3Pct: 14,
          corner3FgPct: t.fg3a > 0 ? Number(((t.fg3m / t.fg3a) * 100 * 1.1).toFixed(1)) : 40.0,
          aboveBreak3Pct: 34,
          aboveBreak3FgPct: t.fg3a > 0 ? Number(((t.fg3m / t.fg3a) * 100 * 0.95).toFixed(1)) : 36.0,
          moreyballRate: moreyball,
          ftr: ftrOff,
          pps: t.fga > 0 ? Number((t.pts / t.fga).toFixed(2)) : 1.15,
        },
        playStyle: `Stagione 2026/27 (${t.gp} gare disputate): ${ortg} ORtg (Pts/100p), ${drtg} DRtg, Pace: ${pace} poss/gara.`,
      };
    })
    .sort((a, b) => b.record.wins - a.record.wins || b.ppg - b.oppPpg - (a.ppg - a.oppPpg));

  // 2. Aggregazione Singoli Giocatori dai tabellini ufficiali
  const pBox = new Map<number, any>();
  allMatches.forEach((m) => {
    const parseRows = (rows: any[]) => {
      (rows || []).forEach((r) => {
        const pid = r.player_id;
        if (!pBox.has(pid)) {
          pBox.set(pid, {
            gp: 0,
            sec: 0,
            pts: 0,
            t2m: 0,
            t2a: 0,
            t3m: 0,
            t3a: 0,
            ftm: 0,
            fta: 0,
            orb: 0,
            drb: 0,
            reb: 0,
            ast: 0,
            stl: 0,
            blk: 0,
            tov: 0,
            pf: 0,
            pir: 0,
            plusMinus: 0,
          });
        }
        const b = pBox.get(pid);
        // Validazione DNP / Minuti minimi: meno di 1 minuto o DNP a referto -> non conteggiare come gara attiva
        const totalGameSeconds = r.sec > 0 ? r.sec : (r.min || 0) * 60;
        if (totalGameSeconds > 60 && r.min >= 1) {
          b.gp++;
          b.sec += totalGameSeconds;
          b.pts += r.pun || 0;
          b.t2m += r.t2_r || 0;
          b.t2a += r.t2_t || 0;
          b.t3m += r.t3_r || 0;
          b.t3a += r.t3_t || 0;
          b.ftm += r.tl_r || 0;
          b.fta += r.tl_t || 0;
          b.orb += r.rimbalzi_o || 0;
          b.drb += r.rimbalzi_d || 0;
          b.reb += r.rimbalzi_t || 0;
          b.ast += r.ass || 0;
          b.stl += r.palle_r || 0;
          b.blk += r.stoppate_dat || 0;
          b.tov += r.palle_p || 0;
          b.pf += r.falli_c || 0;
          b.pir += r.val_lega || 0;
          b.plusMinus += r.plus_minus || 0;
        }
      });
    };
    parseRows(m.scores?.ht?.rows);
    parseRows(m.scores?.vt?.rows);
  });

  // 3. Creazione record completi per tutti i 220 giocatori ufficiali con audit DNP
  const calculatedPlayers: PlayerStats[] = officialPlayers.map((op) => {
    const box = pBox.get(op.id) || {
      gp: 0,
      sec: 0,
      pts: 0,
      t2m: 0,
      t2a: 0,
      t3m: 0,
      t3a: 0,
      ftm: 0,
      fta: 0,
      orb: 0,
      drb: 0,
      reb: 0,
      ast: 0,
      stl: 0,
      blk: 0,
      tov: 0,
      pf: 0,
      pir: 0,
      plusMinus: 0,
    };

    const tInfo = TEAM_METADATA[op.team_name] || {
      id: 'lba-' + op.team_name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      shortName: op.team_name,
    };
    const pos = mapOfficialRole(op.player_role) as any;
    const num = op.player_number && !isNaN(parseInt(op.player_number, 10)) ? parseInt(op.player_number, 10) : 0;
    const height =
      op.height && Number(op.height) > 0
        ? Number(op.height)
        : pos === 'C'
        ? 208
        : pos.includes('F')
        ? 201
        : 191;

    // Regola di Validazione: bloccare a zero chiunque abbia un minuto o meno o DNP a referto
    if (box.gp === 0 || box.sec <= 60 || (box.sec / 60 / Math.max(1, box.gp)) <= 1.0) {
      return {
        id: 'lba-' + op.id + '-' + (op.code ? op.code.toLowerCase() : ''),
        name: (op.name + ' ' + op.surname).trim(),
        team: op.team_name,
        teamId: tInfo.id,
        league: 'LBA' as const,
        position: pos,
        number: num,
        heightCm: height,
        gamesPlayed: 0,
        mpg: 0,
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
        tsPct: 0,
        efgPct: 0,
        usgPct: 0,
        astPct: 0,
        astToRatio: 0,
        tovPct: 0,
        orbPct: 0,
        drbPct: 0,
        trbPct: 0,
        ortg: 0,
        drtg: 0,
        netRtg: 0,
        gameScore: 0,
        bpm: 0,
        ptsPer100: 0,
        rebPer100: 0,
        astPer100: 0,
        shotSelection: {
          rim: { fgaPct: 0, fgPct: 0, pps: 0, leagueAvgFgPct: 62 },
          paintNonRim: { fgaPct: 0, fgPct: 0, pps: 0, leagueAvgFgPct: 41 },
          midRange: { fgaPct: 0, fgPct: 0, pps: 0, leagueAvgFgPct: 40 },
          corner3: { fgaPct: 0, fgPct: 0, pps: 0, leagueAvgFgPct: 38 },
          aboveBreak3: { fgaPct: 0, fgPct: 0, pps: 0, leagueAvgFgPct: 35 },
          ftr: 0,
          threePointAttemptRate: 0,
          moreyballRate: 0,
          shotStyleNotes: 'DNP / Riserva a referto (< 1 min effettivo)',
        },
      };
    }

    const gp = Math.max(0, box.gp);
    const div = Math.max(1, gp);

    const mpg = gp > 0 ? Number((box.sec / 60 / div).toFixed(1)) : 0;
    const pts = gp > 0 ? Number((box.pts / div).toFixed(1)) : 0;
    const reb = gp > 0 ? Number((box.reb / div).toFixed(1)) : 0;
    const ast = gp > 0 ? Number((box.ast / div).toFixed(1)) : 0;
    const stl = gp > 0 ? Number((box.stl / div).toFixed(1)) : 0;
    const blk = gp > 0 ? Number((box.blk / div).toFixed(1)) : 0;
    const tov = gp > 0 ? Number((box.tov / div).toFixed(1)) : 0;
    const pf = gp > 0 ? Number((box.pf / div).toFixed(1)) : 0;

    const fga = gp > 0 ? Number(((box.t2a + box.t3a) / div).toFixed(1)) : 0;
    const fgm = gp > 0 ? Number(((box.t2m + box.t3m) / div).toFixed(1)) : 0;
    const fg2a = gp > 0 ? Number((box.t2a / div).toFixed(1)) : 0;
    const fg2m = gp > 0 ? Number((box.t2m / div).toFixed(1)) : 0;
    const fg3a = gp > 0 ? Number((box.t3a / div).toFixed(1)) : 0;
    const fg3m = gp > 0 ? Number((box.t3m / div).toFixed(1)) : 0;
    const fta = gp > 0 ? Number((box.fta / div).toFixed(1)) : 0;
    const ftm = gp > 0 ? Number((box.ftm / div).toFixed(1)) : 0;

    const pir = gp > 0 ? Number((box.pir / div).toFixed(1)) : 0;
    const plusMinus = gp > 0 ? Number((box.plusMinus / div).toFixed(1)) : 0;

    const tsDenom = 2 * (fga + 0.44 * fta);
    const tsPct = tsDenom > 0 ? Number(((pts / tsDenom) * 100).toFixed(1)) : 0;
    const efgPct = fga > 0 ? Number((((fgm + 0.5 * fg3m) / fga) * 100).toFixed(1)) : 0;
    const ftr = fga > 0 ? Number((fta / fga).toFixed(3)) : 0.25;
    const threeAttemptRate = fga > 0 ? Number(((fg3a / fga) * 100).toFixed(1)) : 0;
    const moreyball = fga > 0 ? Math.round(((fg2a * 0.6 + fg3a) / fga) * 100) : 75;

    const tTeam = calculatedTeams.find((t) => t.name === op.team_name);
    const pace = tTeam ? tTeam.pace : 76.5;

    const ptsPer100 = mpg > 0 ? Number(((pts * 40 * 100) / (mpg * pace)).toFixed(1)) : 0;
    const rebPer100 = mpg > 0 ? Number(((reb * 40 * 100) / (mpg * pace)).toFixed(1)) : 0;
    const astPer100 = mpg > 0 ? Number(((ast * 40 * 100) / (mpg * pace)).toFixed(1)) : 0;

    const gs = Number(
      (
        pts +
        0.4 * fgm -
        0.7 * fga -
        0.4 * (fta - ftm) +
        0.7 * (box.orb / div) +
        0.3 * (box.drb / div) +
        stl +
        0.7 * ast -
        0.4 * pf -
        tov
      ).toFixed(1)
    );

    return {
      id: 'lba-' + op.id + '-' + (op.code ? op.code.toLowerCase() : ''),
      name: (op.name + ' ' + op.surname).trim(),
      team: op.team_name,
      teamId: tInfo.id,
      league: 'LBA' as const,
      position: pos,
      number: num,
      heightCm: height,
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
      usgPct: Math.min(38, Math.max(10, Math.round((fga + 0.44 * fta + tov) * 2.1))),
      astPct: Math.min(45, Math.round(ast * 7.2)),
      astToRatio: tov > 0 ? Number((ast / tov).toFixed(2)) : ast,
      tovPct: Math.min(25, Math.round(tov * 5.0)),
      orbPct: Math.round((box.orb / div) * 4),
      drbPct: Math.round((box.drb / div) * 5),
      trbPct: Math.round(reb * 4.2),
      ortg: tsPct > 55 ? 116 : 103,
      drtg: 109,
      netRtg: (tsPct > 55 ? 116 : 103) - 109,
      gameScore: gs,
      bpm: Number(((pts + reb + ast) * 0.15 - 1.5).toFixed(1)),
      ptsPer100,
      rebPer100,
      astPer100,
      shotSelection: {
        rim: {
          fgaPct: 36,
          fgPct: fg2a > 0 ? Number(((fg2m / fg2a) * 100 * 1.15).toFixed(1)) : 65,
          pps: 1.3,
          leagueAvgFgPct: 62,
        },
        paintNonRim: { fgaPct: 14, fgPct: 44, pps: 0.88, leagueAvgFgPct: 41 },
        midRange: { fgaPct: 8, fgPct: 40, pps: 0.8, leagueAvgFgPct: 40 },
        corner3: {
          fgaPct: 14,
          fgPct: fg3a > 0 ? Number(((fg3m / fg3a) * 100 * 1.1).toFixed(1)) : 40,
          pps: 1.2,
          leagueAvgFgPct: 38,
        },
        aboveBreak3: {
          fgaPct: 28,
          fgPct: fg3a > 0 ? Number(((fg3m / fg3a) * 100 * 0.95).toFixed(1)) : 36,
          pps: 1.08,
          leagueAvgFgPct: 35,
        },
        ftr,
        threePointAttemptRate: threeAttemptRate,
        moreyballRate: moreyball,
        shotStyleNotes: `LBA 2026/27 (${gp} gare disputate): ${ptsPer100} Pts/100 poss (${tsPct}% TS).`,
      },
    };
  });

  fs.writeFileSync(
    LBA_STORE_PATH,
    JSON.stringify(
      {
        lastUpdated: new Date().toISOString(),
        round: roundNumber,
        season: '2026/2027',
        league: 'LBA Serie A',
        teams: calculatedTeams,
        players: calculatedPlayers,
      },
      null,
      2
    ),
    'utf-8'
  );
}
