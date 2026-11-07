import React, { useState, useMemo, useRef } from 'react';
import { PlayerStats, TeamStats } from '../types/basketball';
import { RadarComparisonChart } from './RadarComparisonChart';
import {
  getOrComputePlayerMetrics,
  getOrComputeTeamMetrics,
} from '../utils/advancedAnalyticsCalculator';
import {
  Printer,
  Copy,
  Check,
  Download,
  Share2,
  Swords,
  Sparkles,
  Trophy,
  Activity,
  Layers,
  ChevronRight,
  Code,
  Flame,
  Shield,
  Target,
  Zap,
} from 'lucide-react';

interface Props {
  players: PlayerStats[];
  teams: TeamStats[];
  initialPlayer1Id?: string;
  initialPlayer2Id?: string;
  initialTeam1Id?: string;
  initialTeam2Id?: string;
  onSelectPlayer?: (player: PlayerStats) => void;
  onSelectTeam?: (team: TeamStats) => void;
}

export const H2HCardGenerator: React.FC<Props> = ({
  players,
  teams,
  initialPlayer1Id,
  initialPlayer2Id,
  initialTeam1Id,
  initialTeam2Id,
  onSelectPlayer,
  onSelectTeam,
}) => {
  const [compareType, setCompareType] = useState<'players' | 'teams'>('teams');
  const [cardLayout, setCardLayout] = useState<'horizontal' | 'vertical'>('horizontal');

  // Selezione Giocatori
  const [player1Id, setPlayer1Id] = useState<string>(initialPlayer1Id || players[0]?.id || '');
  const [player2Id, setPlayer2Id] = useState<string>(initialPlayer2Id || players[1]?.id || '');

  // Selezione Squadre
  const [team1Id, setTeam1Id] = useState<string>(initialTeam1Id || teams[0]?.id || '');
  const [team2Id, setTeam2Id] = useState<string>(initialTeam2Id || teams[1]?.id || '');

  // Stato azioni di esportazione
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const uniqueTeams: TeamStats[] = useMemo(() => {
    const map = new Map<string, TeamStats>();
    teams.forEach((t) => {
      if (t && t.id && !map.has(t.id)) map.set(t.id, t);
    });
    return Array.from(map.values());
  }, [teams]);

  const p1 = players.find((p) => p.id === player1Id) || players[0];
  const p2 = players.find((p) => p.id === player2Id) || players[1];

  const t1 = uniqueTeams.find((t) => t.id === team1Id) || uniqueTeams[0] || teams[0];
  const t2 = uniqueTeams.find((t) => t.id === team2Id) || uniqueTeams[1] || teams[1];

  // Metriche Radar Giocatori
  const playerMetrics = useMemo(() => {
    if (!p1 || !p2) return [];
    return [
      { label: 'TS% (Efficienza)', val1: p1.tsPct, val2: p2.tsPct, max: 70, unit: '%' },
      { label: 'USG% (Carico)', val1: p1.usgPct, val2: p2.usgPct, max: 35, unit: '%' },
      { label: 'AST% (Regia)', val1: p1.astPct, val2: p2.astPct, max: 45, unit: '%' },
      { label: 'TRB% (Rimbalzi)', val1: p1.trbPct, val2: p2.trbPct, max: 20, unit: '%' },
      { label: 'Moreyball (Tiro)', val1: p1.shotSelection?.moreyballRate || 75, val2: p2.shotSelection?.moreyballRate || 75, max: 95, unit: '%' },
      { label: 'Game Score', val1: p1.gameScore || 10, val2: p2.gameScore || 10, max: 25, unit: '' },
    ];
  }, [p1, p2]);

  // Metriche Radar Squadre
  const teamMetrics = useMemo(() => {
    if (!t1 || !t2) return [];
    return [
      { label: 'Off. Rating', val1: t1.ortg, val2: t2.ortg, max: 130, unit: '' },
      { label: 'Def. Rating (Inv)', val1: Math.max(10, 140 - t1.drtg), val2: Math.max(10, 140 - t2.drtg), max: 45, unit: '' },
      { label: 'Pace (Ritmo)', val1: t1.pace, val2: t2.pace, max: 85, unit: '' },
      { label: 'eFG% (Tiro)', val1: t1.fourFactorsOffense?.efgPct || 50, val2: t2.fourFactorsOffense?.efgPct || 50, max: 65, unit: '%' },
      { label: 'Moreyball Rate', val1: t1.shotSelection?.moreyballRate || 75, val2: t2.shotSelection?.moreyballRate || 75, max: 95, unit: '%' },
      { label: 'FT Rate', val1: Math.round((t1.shotSelection?.ftr || 0.25) * 100), val2: Math.round((t2.shotSelection?.ftr || 0.25) * 100), max: 45, unit: '%' },
    ];
  }, [t1, t2]);

  // Metriche avanzate granulari (Play Types, Genesi Punti, Clutch, Shot Quality)
  const m1 = useMemo(() => {
    return compareType === 'teams' ? getOrComputeTeamMetrics(t1) : getOrComputePlayerMetrics(p1);
  }, [compareType, t1, p1]);

  const m2 = useMemo(() => {
    return compareType === 'teams' ? getOrComputeTeamMetrics(t2) : getOrComputePlayerMetrics(p2);
  }, [compareType, t2, p2]);

  // Punti di forza calcolati per Squadre
  const getTeamStrengths = (team: TeamStats, opp: TeamStats) => {
    const list: string[] = [];
    const tMetrics = getOrComputeTeamMetrics(team);
    const oppMetrics = getOrComputeTeamMetrics(opp);

    if (tMetrics.shotQuality.shotMakingDiff > 1.5) {
      list.push(`Shot-Making d'élite (+${tMetrics.shotQuality.shotMakingDiff}% oltre l'eFG% attesa)`);
    }
    if (tMetrics.clutchStats.clutchNetRtg > 5) {
      list.push(`Esecuzione clutch vincente (+${tMetrics.clutchStats.clutchNetRtg} NetRtg nei finali)`);
    }
    if (tMetrics.playTypes.pnrBallHandler.ppp > 0.95) {
      list.push(`Attacco da Pick & Roll altamente produttivo (${tMetrics.playTypes.pnrBallHandler.ppp} PPP)`);
    }
    if (tMetrics.scoreOrigin.pointsInPaint > 36) {
      list.push(`Dominio nel pitturato (${tMetrics.scoreOrigin.pointsInPaint} PITP a partita)`);
    }
    if (team.ortg > 115) list.push(`Attacco d'élite (${team.ortg} ORtg su 100 poss)`);
    else if (team.ortg > opp.ortg) list.push(`Vantaggio offensivo (+${(team.ortg - opp.ortg).toFixed(1)} ORtg)`);

    if (team.drtg < 105) list.push(`Difesa solida (${team.drtg} DRtg concessi)`);
    else if (team.drtg < opp.drtg) list.push(`Miglior tenuta difensiva (-${(opp.drtg - team.drtg).toFixed(1)} DRtg)`);

    if (team.fourFactorsOffense.efgPct > 54) list.push(`Alta precisione di tiro (${team.fourFactorsOffense.efgPct}% eFG)`);
    if (team.fourFactorsOffense.orbPct > 32) list.push(`Controllo del rimbalzo offensivo (${team.fourFactorsOffense.orbPct}%)`);
    if (team.shotSelection.moreyballRate > 78) list.push(`Shot selection analitica (${team.shotSelection.moreyballRate}% al ferro o 3PT)`);

    return list.slice(0, 4);
  };

  // Punti di forza per Giocatori
  const getPlayerStrengths = (player: PlayerStats, opp: PlayerStats) => {
    const list: string[] = [];
    const pMetrics = getOrComputePlayerMetrics(player);

    if (pMetrics.shotQuality.shotMakingDiff > 2.0) {
      list.push(`Shot Maker puro (+${pMetrics.shotQuality.shotMakingDiff}% sopra l'eFG% attesa)`);
    }
    if (pMetrics.playTypes.pnrBallHandler.freqPct > 30 && pMetrics.playTypes.pnrBallHandler.ppp > 0.92) {
      list.push(`Motore di Pick & Roll primario (${pMetrics.playTypes.pnrBallHandler.ppp} PPP su ${pMetrics.playTypes.pnrBallHandler.freqPct}% poss)`);
    }
    if (pMetrics.playTypes.spotUp.ppp > 1.10) {
      list.push(`Tiratore letale sugli scarichi Spot-Up (${pMetrics.playTypes.spotUp.ppp} PPP)`);
    }
    if (pMetrics.clutchStats.clutchNetRtg > 3) {
      list.push(`Affidabilità nei possessi decisivi (+${pMetrics.clutchStats.clutchNetRtg} Clutch NetRtg)`);
    }
    if (player.tsPct > 60) list.push(`Efficienza d'élite (${player.tsPct}% True Shooting)`);
    if (player.ptsPer100 && player.ptsPer100 > 30) list.push(`Volume realizzativo top (${player.ptsPer100} Pts/100p)`);
    else if (player.pts > opp.pts) list.push(`Miglior media realizzativa (${player.pts} PPG vs ${opp.pts})`);

    if (player.astToRatio > 2.0) list.push(`Regia sicura (${player.astToRatio} assist per palla persa)`);
    if (player.astPct > 25) list.push(`Coinvolgimento primario nei canestri di squadra (${player.astPct}% AST%)`);
    if (player.shotSelection.moreyballRate > 80) list.push(`Shot-diet ad alto rendimento (${player.shotSelection.moreyballRate}% Moreyball)`);

    return list.slice(0, 4);
  };

  // 1. Stampa Card (Print / Salva PDF)
  const handlePrint = () => {
    window.print();
  };

  // 2. Copia Snippet Embed HTML & iframe
  const handleCopyEmbed = () => {
    const title = compareType === 'teams' ? `${t1.name} vs ${t2.name}` : `${p1.name} vs ${p2.name}`;
    const embedHtml = `<!-- Hoopology Matchup Card Embed: ${title} -->
<div style="font-family: system-ui, -apple-system, sans-serif; background: #090d16; color: #f8fafc; border: 1px solid #1e293b; border-radius: 16px; padding: 24px; max-width: 680px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 12px; margin-bottom: 16px;">
    <span style="font-size: 11px; font-weight: 800; color: #10b981; letter-spacing: 0.05em; text-transform: uppercase;">EUROBASKET ANALYTICS · HEAD-TO-HEAD</span>
    <span style="font-size: 11px; color: #94a3b8;">Stagione 2026/27</span>
  </div>
  <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 16px; align-items: center; text-align: center;">
    <div>
      <h3 style="margin: 0; font-size: 18px; font-weight: 800; color: #ffffff;">${compareType === 'teams' ? t1.name : p1.name}</h3>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">${compareType === 'teams' ? `${t1.league} · Record: ${t1.wins}-${t1.losses}` : `${p1.team} · ${p1.position}`}</p>
    </div>
    <div style="font-size: 14px; font-weight: 900; color: #64748b;">VS</div>
    <div>
      <h3 style="margin: 0; font-size: 18px; font-weight: 800; color: #ffffff;">${compareType === 'teams' ? t2.name : p2.name}</h3>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">${compareType === 'teams' ? `${t2.league} · Record: ${t2.wins}-${t2.losses}` : `${p2.team} · ${p2.position}`}</p>
    </div>
  </div>
</div>`;

    navigator.clipboard.writeText(embedHtml);
    setCopyStatus('embed');
    setTimeout(() => setCopyStatus(null), 2500);
  };

  // 3. Scarica Card come SVG vettoriale
  const handleDownloadSvg = () => {
    const isT = compareType === 'teams';
    const name1 = isT ? t1.name : p1.name;
    const name2 = isT ? t2.name : p2.name;
    const sub1 = isT ? `${t1.league} (${t1.wins}-${t1.losses})` : `${p1.team} (${p1.position})`;
    const sub2 = isT ? `${t2.league} (${t2.wins}-${t2.losses})` : `${p2.team} (${p2.position})`;

    const statRows = isT
      ? [
          { label: 'Offensive Rating (ORtg)', v1: t1.ortg, v2: t2.ortg },
          { label: 'Defensive Rating (DRtg)', v1: t1.drtg, v2: t2.drtg, inv: true },
          { label: 'Net Rating', v1: (t1.netRtg >= 0 ? '+' : '') + t1.netRtg, v2: (t2.netRtg >= 0 ? '+' : '') + t2.netRtg },
          { label: 'Ritmo di Gioco (Pace)', v1: t1.pace, v2: t2.pace },
          { label: 'eFG% (Tiro Effettivo)', v1: t1.fourFactorsOffense.efgPct + '%', v2: t2.fourFactorsOffense.efgPct + '%' },
          { label: 'Moreyball Rate %', v1: t1.shotSelection.moreyballRate + '%', v2: t2.shotSelection.moreyballRate + '%' },
        ]
      : [
          { label: 'Punti a Partita (PPG)', v1: p1.pts, v2: p2.pts },
          { label: 'True Shooting (TS%)', v1: p1.tsPct + '%', v2: p2.tsPct + '%' },
          { label: 'Usage Rate (USG%)', v1: p1.usgPct + '%', v2: p2.usgPct + '%' },
          { label: 'Assist Percentage (AST%)', v1: p1.astPct + '%', v2: p2.astPct + '%' },
          { label: 'Punti su 100 Possessi', v1: p1.ptsPer100 || Math.round(p1.pts * 1.3), v2: p2.ptsPer100 || Math.round(p2.pts * 1.3) },
          { label: 'Moreyball Rate %', v1: p1.shotSelection.moreyballRate + '%', v2: p2.shotSelection.moreyballRate + '%' },
        ];

    let rowsSvg = '';
    statRows.forEach((r, idx) => {
      const y = 170 + idx * 36;
      rowsSvg += `
        <rect x="30" y="${y - 18}" width="660" height="28" rx="6" fill="${idx % 2 === 0 ? '#131b2e' : '#0d1322'}" />
        <text x="120" y="${y}" fill="#38bdf8" font-size="14" font-weight="bold" text-anchor="middle">${r.v1}</text>
        <text x="360" y="${y}" fill="#94a3b8" font-size="12" font-weight="600" text-anchor="middle">${r.label}</text>
        <text x="600" y="${y}" fill="#fbbf24" font-size="14" font-weight="bold" text-anchor="middle">${r.v2}</text>
      `;
    });

    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 440" width="720" height="440" style="background:#090d16; font-family: sans-serif;">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#020617" />
        </linearGradient>
      </defs>
      <rect width="720" height="440" rx="20" fill="url(#grad)" stroke="#1e293b" stroke-width="2" />
      
      <!-- Header -->
      <text x="360" y="38" fill="#10b981" font-size="12" font-weight="bold" letter-spacing="2" text-anchor="middle">HOOPOLOGY ANALYTICS · HEAD-TO-HEAD CARD</text>
      <text x="360" y="58" fill="#64748b" font-size="11" text-anchor="middle">Stagione Ufficiale 2026/27</text>
      <line x1="40" y1="72" x2="680" y2="72" stroke="#1e293b" stroke-width="1.5" />

      <!-- Matchup Banner -->
      <text x="120" y="105" fill="#ffffff" font-size="17" font-weight="800" text-anchor="middle">${name1}</text>
      <text x="120" y="125" fill="#38bdf8" font-size="11" text-anchor="middle">${sub1}</text>

      <circle cx="360" cy="110" r="18" fill="#1e293b" />
      <text x="360" y="115" fill="#94a3b8" font-size="11" font-weight="900" text-anchor="middle">VS</text>

      <text x="600" y="105" fill="#ffffff" font-size="17" font-weight="800" text-anchor="middle">${name2}</text>
      <text x="600" y="125" fill="#fbbf24" font-size="11" text-anchor="middle">${sub2}</text>

      <!-- Stat Rows -->
      ${rowsSvg}

      <!-- Footer -->
      <line x1="40" y1="400" x2="680" y2="400" stroke="#1e293b" stroke-width="1" />
      <text x="360" y="422" fill="#475569" font-size="10" text-anchor="middle">Metriche avanzate calcolate su 100 possessi e Four Factors ufficiali</text>
    </svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `matchup_${isT ? t1.shortName || 't1' : p1.name.replace(/\s+/g, '_')}_vs_${isT ? t2.shortName || 't2' : p2.name.replace(/\s+/g, '_')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setCopyStatus('svg');
    setTimeout(() => setCopyStatus(null), 2500);
  };

  // 4. Copia Testo Formattato per Social / App
  const handleCopyText = () => {
    const isT = compareType === 'teams';
    const text = isT
      ? `🏀 HEAD-TO-HEAD: ${t1.name} vs ${t2.name} (Stagione 2026/27)
📊 ORtg: ${t1.ortg} vs ${t2.ortg}
🛡️ DRtg: ${t1.drtg} vs ${t2.drtg}
⚡ Pace: ${t1.pace} vs ${t2.pace} poss/gara
🎯 eFG%: ${t1.fourFactorsOffense.efgPct}% vs ${t2.fourFactorsOffense.efgPct}%
⭐ Moreyball: ${t1.shotSelection.moreyballRate}% vs ${t2.shotSelection.moreyballRate}%
#EuroBasket #LBA #EuroLeague #BasketballAnalytics`
      : `🏀 HEAD-TO-HEAD: ${p1.name} (${p1.team}) vs ${p2.name} (${p2.team})
🎯 TS%: ${p1.tsPct}% vs ${p2.tsPct}%
🔥 USG%: ${p1.usgPct}% vs ${p2.usgPct}%
🪄 AST%: ${p1.astPct}% vs ${p2.astPct}%
📊 Pts/100: ${p1.ptsPer100 || Math.round(p1.pts * 1.3)} vs ${p2.ptsPer100 || Math.round(p2.pts * 1.3)}
#EuroBasket #BasketballAnalytics`;

    navigator.clipboard.writeText(text);
    setCopyStatus('text');
    setTimeout(() => setCopyStatus(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Controlli di Configurazione Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Swords className="w-5 h-5" />
          </span>
          <div>
            <h3 className="font-bold text-base text-white">Generatore Matchup Card (Stampa & Condividi)</h3>
            <p className="text-xs text-slate-400">
              Crea schede testa a testa in stile Hoopology, pronte per stampa PDF, esportazione vettoriale SVG ed embed.
            </p>
          </div>
        </div>

        {/* Selettori Modalità & Layout */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Switch Giocatori / Squadre */}
          <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setCompareType('teams')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                compareType === 'teams' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Squadre
            </button>
            <button
              onClick={() => setCompareType('players')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                compareType === 'players' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Giocatori
            </button>
          </div>

          {/* Azioni di Esportazione */}
          <button
            onClick={handlePrint}
            title="Stampa o salva in PDF la card pulita"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Stampa / PDF</span>
          </button>

          <button
            onClick={handleDownloadSvg}
            title="Scarica come grafica vettoriale SVG"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            {copyStatus === 'svg' ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Download className="w-4 h-4 text-cyan-400" />
            )}
            <span>Scarica SVG</span>
          </button>

          <button
            onClick={handleCopyEmbed}
            title="Copia codice HTML / iframe per il tuo sito o blog"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            {copyStatus === 'embed' ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Code className="w-4 h-4 text-amber-400" />
            )}
            <span>Copia Embed</span>
          </button>

          <button
            onClick={handleCopyText}
            title="Copia riassunto formattato per social e messaggistica"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            {copyStatus === 'text' ? (
              <Check className="w-4 h-4" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            <span>Copia Testo</span>
          </button>
        </div>
      </div>

      {/* Selettori Entità Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {compareType === 'teams' ? (
          <>
            <div className="p-3 bg-slate-950 rounded-xl border border-sky-500/40 space-y-1.5">
              <label className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block">
                Squadra 1 (Blu)
              </label>
              <select
                value={team1Id}
                onChange={(e) => setTeam1Id(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                {uniqueTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.league}) · {t.record?.wins ?? t.wins ?? 0}V - {t.record?.losses ?? t.losses ?? 0}S
                  </option>
                ))}
              </select>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-amber-500/40 space-y-1.5">
              <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                Squadra 2 (Oro)
              </label>
              <select
                value={team2Id}
                onChange={(e) => setTeam2Id(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {uniqueTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.league}) · {t.record?.wins ?? t.wins ?? 0}V - {t.record?.losses ?? t.losses ?? 0}S
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <>
            <div className="p-3 bg-slate-950 rounded-xl border border-sky-500/40 space-y-1.5">
              <label className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block">
                Giocatore 1 (Blu)
              </label>
              <select
                value={player1Id}
                onChange={(e) => setPlayer1Id(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.team}) · {p.position} · {p.pts} PPG ({p.tsPct}% TS)
                  </option>
                ))}
              </select>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-amber-500/40 space-y-1.5">
              <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                Giocatore 2 (Oro)
              </label>
              <select
                value={player2Id}
                onChange={(e) => setPlayer2Id(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.team}) · {p.position} · {p.pts} PPG ({p.tsPct}% TS)
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {/* ============================================================ */}
      {/* LA MATCHUP CARD UFFICIALE (STAMPABILE & CONDIVIDIBILE) */}
      {/* ============================================================ */}
      <div
        id="printable-h2h-card"
        ref={cardRef}
        className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-slate-100"
      >
        {/* Sfondo geometrico sottile */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none"></div>

        {/* Header della Card */}
        <div className="relative z-10 flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-extrabold text-emerald-400 uppercase tracking-wider text-[11px]">
              Hoopology Analytics Card
            </span>
            <span>·</span>
            <span>Stagione 2026/27</span>
            <span>·</span>
            <span>Metriche su 100 Possessi</span>
          </div>

          <div className="text-[11px] font-mono text-slate-500 uppercase">
            {compareType === 'teams' ? `${t1.league} vs ${t2.league}` : `${p1.league} vs ${p2.league}`}
          </div>
        </div>

        {/* Matchup Header Banner: Entità 1 vs Entità 2 */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-11 gap-4 items-center mb-8">
          {/* Lato Sinistro (Blu) */}
          <div className="md:col-span-5 p-4 rounded-2xl bg-sky-950/20 border border-sky-500/30 flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-lg shrink-0"
              style={{ backgroundColor: compareType === 'teams' ? t1.logoColor || '#0284c7' : '#0284c7' }}
            >
              {compareType === 'teams' ? (t1.shortName || t1.name.slice(0, 3)).toUpperCase() : p1.number || '#'}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-black text-white truncate">
                {compareType === 'teams' ? t1.name : p1.name}
              </h2>
              <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span>{compareType === 'teams' ? t1.league : p1.team}</span>
                <span>·</span>
                <span className="font-semibold text-sky-400">
                  {compareType === 'teams'
                    ? `${t1.record?.wins ?? t1.wins ?? 0}V - ${t1.record?.losses ?? t1.losses ?? 0}S`
                    : `${p1.position} · ${p1.heightCm} cm`}
                </span>
              </div>
            </div>
          </div>

          {/* VS Badge Centrale */}
          <div className="md:col-span-1 flex justify-center py-2 md:py-0">
            <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center font-black text-xs text-slate-400 shadow-inner">
              VS
            </div>
          </div>

          {/* Lato Destro (Oro) */}
          <div className="md:col-span-5 p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-end gap-4 text-right">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-black text-white truncate">
                {compareType === 'teams' ? t2.name : p2.name}
              </h2>
              <div className="text-xs text-slate-400 mt-0.5 flex items-center justify-end gap-2">
                <span className="font-semibold text-amber-400">
                  {compareType === 'teams'
                    ? `${t2.record?.wins ?? t2.wins ?? 0}V - ${t2.record?.losses ?? t2.losses ?? 0}S`
                    : `${p2.position} · ${p2.heightCm} cm`}
                </span>
                <span>·</span>
                <span>{compareType === 'teams' ? t2.league : p2.team}</span>
              </div>
            </div>
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-lg shrink-0"
              style={{ backgroundColor: compareType === 'teams' ? t2.logoColor || '#d97706' : '#d97706' }}
            >
              {compareType === 'teams' ? (t2.shortName || t2.name.slice(0, 3)).toUpperCase() : p2.number || '#'}
            </div>
          </div>
        </div>

        {/* Contenuto Grafico & Statistico */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Radar Chart Multi-Assi */}
          <div className="lg:col-span-5 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 flex flex-col items-center justify-center">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-emerald-400" />
              <span>Radar d'Impatto Multidimensionale</span>
            </div>
            <RadarComparisonChart
              entity1Name={compareType === 'teams' ? t1.shortName || t1.name : p1.name}
              entity2Name={compareType === 'teams' ? t2.shortName || t2.name : p2.name}
              metrics={compareType === 'teams' ? teamMetrics : playerMetrics}
              color1="#38bdf8"
              color2="#fbbf24"
            />
          </div>

          {/* Tale of the Tape (Confronto Dettagliato a Barre con Delta) */}
          <div className="lg:col-span-7 space-y-2.5">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Metrica Avanzata</span>
              <span className="text-[11px] text-slate-500 font-normal">Valore / Vantaggio statistico</span>
            </div>

            {(compareType === 'teams'
              ? [
                  { label: 'Offensive Rating (ORtg)', v1: t1.ortg, v2: t2.ortg, max: 130, unit: '', higherBetter: true },
                  { label: 'Defensive Rating (DRtg)', v1: t1.drtg, v2: t2.drtg, max: 130, unit: '', higherBetter: false },
                  { label: 'Net Rating', v1: t1.netRtg, v2: t2.netRtg, max: 25, unit: '', higherBetter: true },
                  { label: 'Pace (Possessi / Partita)', v1: t1.pace, v2: t2.pace, max: 85, unit: '', higherBetter: true },
                  { label: 'eFG% (Percentuale Effettiva)', v1: t1.fourFactorsOffense.efgPct, v2: t2.fourFactorsOffense.efgPct, max: 65, unit: '%', higherBetter: true },
                  { label: 'Moreyball Rate (Rim + 3PT)', v1: t1.shotSelection.moreyballRate, v2: t2.shotSelection.moreyballRate, max: 95, unit: '%', higherBetter: true },
                  { label: 'Offensive Rebound % (ORB%)', v1: t1.fourFactorsOffense.orbPct, v2: t2.fourFactorsOffense.orbPct, max: 45, unit: '%', higherBetter: true },
                  { label: 'Free Throw Rate (FTR)', v1: Math.round(t1.shotSelection.ftr * 100), v2: Math.round(t2.shotSelection.ftr * 100), max: 40, unit: '%', higherBetter: true },
                ]
              : [
                  { label: 'True Shooting % (TS%)', v1: p1.tsPct, v2: p2.tsPct, max: 70, unit: '%', higherBetter: true },
                  { label: 'Usage Rate % (USG%)', v1: p1.usgPct, v2: p2.usgPct, max: 35, unit: '%', higherBetter: true },
                  { label: 'Punti / Partita (PPG)', v1: p1.pts, v2: p2.pts, max: 25, unit: '', higherBetter: true },
                  { label: 'Punti su 100 Possessi', v1: p1.ptsPer100 || Math.round(p1.pts * 1.3), v2: p2.ptsPer100 || Math.round(p2.pts * 1.3), max: 45, unit: '', higherBetter: true },
                  { label: 'Assist Percentage (AST%)', v1: p1.astPct, v2: p2.astPct, max: 45, unit: '%', higherBetter: true },
                  { label: 'Rapporto Assist / Perse (AST/TO)', v1: p1.astToRatio, v2: p2.astToRatio, max: 4.0, unit: '', higherBetter: true },
                  { label: 'Rimbalzi Totali % (TRB%)', v1: p1.trbPct, v2: p2.trbPct, max: 25, unit: '%', higherBetter: true },
                  { label: 'Moreyball Rate (Rim + 3PT)', v1: p1.shotSelection.moreyballRate, v2: p2.shotSelection.moreyballRate, max: 95, unit: '%', higherBetter: true },
                ]
            ).map((row, idx) => {
              const diff = Number((row.v1 - row.v2).toFixed(1));
              const is1Ahead = row.higherBetter ? diff > 0 : diff < 0;
              const is2Ahead = row.higherBetter ? diff < 0 : diff > 0;
              return (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`font-mono font-bold ${is1Ahead ? 'text-sky-400' : 'text-slate-300'}`}>
                      {row.v1}
                      {row.unit}
                    </span>
                    <span className="font-semibold text-slate-300">{row.label}</span>
                    <span className={`font-mono font-bold ${is2Ahead ? 'text-amber-400' : 'text-slate-300'}`}>
                      {row.v2}
                      {row.unit}
                    </span>
                  </div>

                  {/* Doppia barra di bilanciamento centrata */}
                  <div className="grid grid-cols-2 gap-1.5 h-2">
                    {/* Barra Sinistra (cresce verso sinistra) */}
                    <div className="w-full bg-slate-900 rounded-l flex justify-end overflow-hidden">
                      <div
                        className="h-full bg-sky-500 rounded-l transition-all"
                        style={{ width: `${Math.min(100, Math.max(5, (row.v1 / row.max) * 100))}%` }}
                      ></div>
                    </div>
                    {/* Barra Destra (cresce verso destra) */}
                    <div className="w-full bg-slate-900 rounded-r flex justify-start overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-r transition-all"
                        style={{ width: `${Math.min(100, Math.max(5, (row.v2 / row.max) * 100))}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sezione Granulare: Play Types, Genesi Punti & Shot Making */}
        <div className="relative z-10 mt-6 pt-6 border-t border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Analisi Tattica Granulare: Play Types, Genesi Punti & Shot Making</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Play-Type: Stima Analitica · Coordinate Reali</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            {/* Box 1: Synergy Play Types */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
              <div className="text-[11px] font-sans font-bold text-amber-300 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <span>⚡</span>
                  <span>Play Types (PPP)</span>
                </span>
                <span className="text-[9px] text-slate-500 font-normal font-mono">Stima analitica</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-sky-400 font-bold">{m1.playTypes.pnrBallHandler.ppp}</span>
                  <span className="font-sans text-[11px] text-slate-300">PnR Handler</span>
                  <span className="text-amber-400 font-bold">{m2.playTypes.pnrBallHandler.ppp}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-sky-400 font-bold">{m1.playTypes.spotUp.ppp}</span>
                  <span className="font-sans text-[11px] text-slate-300">Spot-Up</span>
                  <span className="text-amber-400 font-bold">{m2.playTypes.spotUp.ppp}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-sky-400 font-bold">{m1.playTypes.transition.ppp}</span>
                  <span className="font-sans text-[11px] text-slate-300">Transizione</span>
                  <span className="text-amber-400 font-bold">{m2.playTypes.transition.ppp}</span>
                </div>
              </div>
            </div>

            {/* Box 2: Genesi Punti */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
              <div className="text-[11px] font-sans font-bold text-sky-300 flex items-center gap-1">
                <span>🛡️</span>
                <span>Genesi Punti (Gara)</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-sky-400 font-bold">{m1.scoreOrigin.pointsInPaint}</span>
                  <span className="font-sans text-[11px] text-slate-300">Pitturato (PITP)</span>
                  <span className="text-amber-400 font-bold">{m2.scoreOrigin.pointsInPaint}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-sky-400 font-bold">{m1.scoreOrigin.pointsOffTurnovers}</span>
                  <span className="font-sans text-[11px] text-slate-300">Da Palle Perse</span>
                  <span className="text-amber-400 font-bold">{m2.scoreOrigin.pointsOffTurnovers}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-sky-400 font-bold">{m1.scoreOrigin.secondChancePoints}</span>
                  <span className="font-sans text-[11px] text-slate-300">2a Opportunità</span>
                  <span className="text-amber-400 font-bold">{m2.scoreOrigin.secondChancePoints}</span>
                </div>
              </div>
            </div>

            {/* Box 3: Shot Making & Clutch */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
              <div className="text-[11px] font-sans font-bold text-rose-300 flex items-center gap-1">
                <span>🎯</span>
                <span>Shot Making & Clutch</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-sky-400 font-bold">{m1.shotQuality.xefgPct}%</span>
                  <span className="font-sans text-[11px] text-slate-300">xeFG% Atteso</span>
                  <span className="text-amber-400 font-bold">{m2.shotQuality.xefgPct}%</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span className={`font-bold ${m1.shotQuality.shotMakingDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {m1.shotQuality.shotMakingDiff >= 0 ? `+${m1.shotQuality.shotMakingDiff}%` : `${m1.shotQuality.shotMakingDiff}%`}
                  </span>
                  <span className="font-sans text-[11px] text-slate-300">Shot Making (+/-)</span>
                  <span className={`font-bold ${m2.shotQuality.shotMakingDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {m2.shotQuality.shotMakingDiff >= 0 ? `+${m2.shotQuality.shotMakingDiff}%` : `${m2.shotQuality.shotMakingDiff}%`}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span className={`font-bold ${m1.clutchStats.clutchNetRtg >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {m1.clutchStats.clutchNetRtg >= 0 ? `+${m1.clutchStats.clutchNetRtg}` : m1.clutchStats.clutchNetRtg}
                  </span>
                  <span className="font-sans text-[11px] text-slate-300">Clutch NetRtg</span>
                  <span className={`font-bold ${m2.clutchStats.clutchNetRtg >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {m2.clutchStats.clutchNetRtg >= 0 ? `+${m2.clutchStats.clutchNetRtg}` : m2.clutchStats.clutchNetRtg}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Punti di Forza e Chiavi Tattiche (Bottom Insights) */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-800">
          {/* Punti di Forza Entità 1 */}
          <div className="p-4 rounded-2xl bg-sky-950/20 border border-sky-500/20 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
              <Flame className="w-4 h-4" />
              <span>Punti di Forza: {compareType === 'teams' ? t1.name : p1.name}</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {(compareType === 'teams' ? getTeamStrengths(t1, t2) : getPlayerStrengths(p1, p2)).map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-sky-400 font-bold shrink-0">✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Punti di Forza Entità 2 */}
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <Flame className="w-4 h-4" />
              <span>Punti di Forza: {compareType === 'teams' ? t2.name : p2.name}</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {(compareType === 'teams' ? getTeamStrengths(t2, t1) : getPlayerStrengths(p2, p1)).map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold shrink-0">✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Card */}
        <div className="relative z-10 mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
          <div>
            <span>Hoopology Analytics Platform · Dati ufficiali Euroleague Basketball & legabasket.it</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Stagione 2026/27</span>
            <span className="text-emerald-400 font-semibold">100 Possessions Normalized · Play-Type su stima analitica</span>
          </div>
        </div>
      </div>
    </div>
  );
};
