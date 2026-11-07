import React, { useState, useMemo } from 'react';
import { PlayerStats, TeamStats, League } from '../types/basketball';
import { H2HCardGenerator } from './H2HCardGenerator';
import { AdvancedDataTable } from './AdvancedDataTable';
import { getOrComputePlayerMetrics, getOrComputeTeamMetrics } from '../utils/advancedAnalyticsCalculator';
import {
  BarChart2,
  Table,
  Swords,
  Target,
  Sparkles,
  Search,
  Filter,
  Maximize2,
  TrendingUp,
  Sliders,
  Layers,
  Flame,
  Shield,
  Zap,
  Info,
  ExternalLink,
} from 'lucide-react';

interface Props {
  players: PlayerStats[];
  teams: TeamStats[];
  onSelectPlayer: (player: PlayerStats) => void;
  onSelectTeam: (team: TeamStats) => void;
}

type MainTab = 'scatter' | 'table' | 'four_factors' | 'h2h_card';

interface MetricOption {
  key: string;
  label: string;
  category: 'efficiency' | 'volume' | 'playmaking' | 'shooting' | 'synergy' | 'origin' | 'clutch';
  min?: number;
  max?: number;
  isTeamOnly?: boolean;
  isPlayerOnly?: boolean;
}

const AVAILABLE_METRICS: MetricOption[] = [
  // --- EFFICIENZA & RATING ---
  { key: 'tsPct', label: 'True Shooting % (TS%)', category: 'efficiency', min: 45, max: 72, isPlayerOnly: true },
  { key: 'usgPct', label: 'Usage Rate % (USG%)', category: 'volume', min: 10, max: 35, isPlayerOnly: true },
  { key: 'pts', label: 'Punti a Partita (PPG)', category: 'volume', min: 0, max: 25 },
  { key: 'ptsPer100', label: 'Punti su 100 Possessi', category: 'volume', min: 10, max: 45, isPlayerOnly: true },
  { key: 'astPct', label: 'Assist Percentage (AST%)', category: 'playmaking', min: 5, max: 45, isPlayerOnly: true },
  { key: 'astToRatio', label: 'Rapporto Assist / Perse (AST/TO)', category: 'playmaking', min: 0.5, max: 3.5, isPlayerOnly: true },
  { key: 'tovPct', label: 'Turnover % (TOV%)', category: 'playmaking', min: 5, max: 25 },
  { key: 'reb', label: 'Rimbalzi a Partita (RPG)', category: 'volume', min: 0, max: 12, isPlayerOnly: true },
  { key: 'trbPct', label: 'Total Rebound % (TRB%)', category: 'volume', min: 2, max: 22, isPlayerOnly: true },
  { key: 'ortg', label: 'Offensive Rating (ORtg)', category: 'efficiency', min: 95, max: 130 },
  { key: 'drtg', label: 'Defensive Rating (DRtg)', category: 'efficiency', min: 95, max: 130 },
  { key: 'netRtg', label: 'Net Rating (ORtg - DRtg)', category: 'efficiency', min: -20, max: 25 },
  { key: 'pace', label: 'Ritmo di Gioco (Pace)', category: 'volume', min: 68, max: 85, isTeamOnly: true },

  // --- SHOT QUALITY & EXPECTED STATS ---
  { key: 'shotQuality.xefgPct', label: 'Expected eFG% (xeFG% atteso)', category: 'shooting', min: 42, max: 65 },
  { key: 'shotQuality.shotMakingDiff', label: 'Shot Making / Over Expectation (+/-)', category: 'shooting', min: -10, max: 14 },
  { key: 'shotQuality.shotQualityRating', label: 'Shot Quality Index (0-100)', category: 'shooting', min: 40, max: 99 },
  { key: 'shotQuality.rimFrequencyPct', label: 'Rim Frequency % (Tiri al ferro)', category: 'shooting', min: 10, max: 65 },
  { key: 'shotSelection.moreyballRate', label: 'Moreyball Rate % (Rim + 3PT)', category: 'shooting', min: 55, max: 95 },
  { key: 'shotSelection.ftr', label: 'Free Throw Rate (FTR)', category: 'shooting', min: 0.1, max: 0.55 },
  { key: 'fourFactorsOffense.efgPct', label: 'eFG% Attacco', category: 'shooting', min: 45, max: 62, isTeamOnly: true },
  { key: 'fourFactorsDefense.efgPct', label: 'eFG% Concesso (Difesa)', category: 'shooting', min: 45, max: 62, isTeamOnly: true },

  // --- PLAY TYPES (STIMA ANALITICA) ---
  { key: 'playTypes.pnrBallHandler.ppp', label: 'PnR Ball Handler PPP (Stima Analitica)', category: 'synergy', min: 0.6, max: 1.35 },
  { key: 'playTypes.pnrBallHandler.freqPct', label: 'PnR Ball Handler Frequenza % (Stima)', category: 'synergy', min: 2, max: 50 },
  { key: 'playTypes.pnrRollMan.ppp', label: 'PnR Roll Man PPP (Stima Analitica)', category: 'synergy', min: 0.7, max: 1.45 },
  { key: 'playTypes.pnrRollMan.freqPct', label: 'PnR Roll Man Frequenza % (Stima)', category: 'synergy', min: 2, max: 45 },
  { key: 'playTypes.spotUp.ppp', label: 'Spot-Up / Catch&Shoot PPP (Stima Analitica)', category: 'synergy', min: 0.7, max: 1.4 },
  { key: 'playTypes.spotUp.freqPct', label: 'Spot-Up Frequenza % (Stima)', category: 'synergy', min: 5, max: 45 },
  { key: 'playTypes.isolation.ppp', label: 'Isolation PPP (Stima Analitica)', category: 'synergy', min: 0.6, max: 1.25 },
  { key: 'playTypes.isolation.freqPct', label: 'Isolation Frequenza % (Stima)', category: 'synergy', min: 1, max: 25 },
  { key: 'playTypes.transition.ppp', label: 'Transizione PPP (Stima Analitica)', category: 'synergy', min: 0.85, max: 1.5 },
  { key: 'playTypes.transition.freqPct', label: 'Transizione Frequenza % (Stima)', category: 'synergy', min: 5, max: 30 },
  { key: 'playTypes.postUp.ppp', label: 'Post-Up PPP (Stima Analitica)', category: 'synergy', min: 0.6, max: 1.25 },

  // --- GENESI PUNTI (SCORE ORIGIN) ---
  { key: 'scoreOrigin.pointsInPaint', label: 'Punti nel Pitturato (PITP)', category: 'origin', min: 0, max: 50 },
  { key: 'scoreOrigin.pointsOffTurnovers', label: 'Punti da Palle Perse (POT)', category: 'origin', min: 0, max: 25 },
  { key: 'scoreOrigin.fastbreakPoints', label: 'Punti in Contropiede (Fastbreak)', category: 'origin', min: 0, max: 22 },
  { key: 'scoreOrigin.secondChancePoints', label: 'Punti da 2a Opportunità', category: 'origin', min: 0, max: 18 },

  // --- CLUTCH STATS ---
  { key: 'clutchStats.clutchNetRtg', label: 'Clutch Net Rating (Finali +/-)', category: 'clutch', min: -25, max: 30 },
  { key: 'clutchStats.clutchEfgPct', label: 'Clutch eFG% (Pressione)', category: 'clutch', min: 30, max: 70 },
  { key: 'clutchStats.clutchPts', label: 'Clutch Punti/Gara', category: 'clutch', min: 0, max: 18 },
];

export const ScatterPlotExplorer: React.FC<Props> = ({
  players,
  teams,
  onSelectPlayer,
  onSelectTeam,
}) => {
  const [activeTab, setActiveTab] = useState<MainTab>('scatter');

  // Configurazione Scatter Plot
  const [entityType, setEntityType] = useState<'players' | 'teams'>('players');
  const [selectedLeague, setSelectedLeague] = useState<League | 'ALL'>('ALL');
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [scatterSearch, setScatterSearch] = useState('');
  const [minMpg, setMinMpg] = useState<number>(10);

  // Assi metriche
  const [xMetricKey, setXMetricKey] = useState<string>('usgPct');
  const [yMetricKey, setYMetricKey] = useState<string>('tsPct');
  const [bubbleMetricKey, setBubbleMetricKey] = useState<string>('mpg'); // 'constant', 'mpg', 'pts', 'gp'

  // Stato H2H trasferito
  const [h2hPreselectedType, setH2hPreselectedType] = useState<'players' | 'teams'>('teams');
  const [h2hPreselectedId, setH2hPreselectedId] = useState<string | undefined>();

  // Hover point
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  // Helper estrazione valore numerico nidificato con arricchimento dinamico
  const getNestedValue = (obj: any, key: string): number => {
    if (!obj) return 0;
    let targetObj = obj;
    if (
      key.startsWith('playTypes.') ||
      key.startsWith('scoreOrigin.') ||
      key.startsWith('clutchStats.') ||
      key.startsWith('shotQuality.')
    ) {
      if (!obj.playTypes || !obj.scoreOrigin || !obj.clutchStats || !obj.shotQuality) {
        if ('position' in obj) {
          const metrics = getOrComputePlayerMetrics(obj);
          targetObj = { ...obj, ...metrics };
        } else {
          const metrics = getOrComputeTeamMetrics(obj);
          targetObj = { ...obj, ...metrics };
        }
      }
    }

    if (key.includes('.')) {
      const parts = key.split('.');
      let cur = targetObj;
      for (const p of parts) {
        if (cur === undefined || cur === null) return 0;
        cur = cur[p];
      }
      return typeof cur === 'number' ? cur : 0;
    }
    return typeof targetObj[key] === 'number' ? targetObj[key] : 0;
  };

  // Preset rapidi Hoopology & Pro Analytics
  const applyPreset = (
    preset:
      | 'scorer'
      | 'shot_selection'
      | 'playmaker'
      | 'team_efficiency'
      | 'team_pace_net'
      | 'four_factors'
      | 'shot_making'
      | 'pnr_hub'
      | 'score_origin'
      | 'paint_dominance'
      | 'clutch_net'
  ) => {
    if (preset === 'scorer') {
      setEntityType('players');
      setXMetricKey('usgPct');
      setYMetricKey('tsPct');
      setBubbleMetricKey('pts');
    } else if (preset === 'shot_making') {
      setEntityType('players');
      setXMetricKey('shotQuality.xefgPct');
      setYMetricKey('shotQuality.shotMakingDiff');
      setBubbleMetricKey('pts');
    } else if (preset === 'pnr_hub') {
      setEntityType('players');
      setXMetricKey('playTypes.pnrBallHandler.freqPct');
      setYMetricKey('playTypes.pnrBallHandler.ppp');
      setBubbleMetricKey('usgPct');
    } else if (preset === 'shot_selection') {
      setEntityType('players');
      setXMetricKey('shotSelection.moreyballRate');
      setYMetricKey('tsPct');
      setBubbleMetricKey('mpg');
    } else if (preset === 'playmaker') {
      setEntityType('players');
      setXMetricKey('astPct');
      setYMetricKey('astToRatio');
      setBubbleMetricKey('pts');
    } else if (preset === 'team_efficiency') {
      setEntityType('teams');
      setXMetricKey('ortg');
      setYMetricKey('drtg');
      setBubbleMetricKey('pace');
    } else if (preset === 'score_origin') {
      setEntityType('teams');
      setXMetricKey('scoreOrigin.pointsOffTurnovers');
      setYMetricKey('scoreOrigin.fastbreakPoints');
      setBubbleMetricKey('pace');
    } else if (preset === 'paint_dominance') {
      setEntityType('teams');
      setXMetricKey('scoreOrigin.pointsInPaint');
      setYMetricKey('scoreOrigin.secondChancePoints');
      setBubbleMetricKey('netRtg');
    } else if (preset === 'clutch_net') {
      setEntityType('teams');
      setXMetricKey('netRtg');
      setYMetricKey('clutchStats.clutchNetRtg');
      setBubbleMetricKey('ppg');
    } else if (preset === 'team_pace_net') {
      setEntityType('teams');
      setXMetricKey('pace');
      setYMetricKey('netRtg');
      setBubbleMetricKey('ppg');
    } else if (preset === 'four_factors') {
      setEntityType('teams');
      setXMetricKey('fourFactorsOffense.efgPct');
      setYMetricKey('fourFactorsDefense.efgPct');
      setBubbleMetricKey('pace');
    }
  };

  // Navigazione da tabella a H2H Card
  const handleCompareWithH2H = (type: 'players' | 'teams', id: string) => {
    setH2hPreselectedType(type);
    setH2hPreselectedId(id);
    setActiveTab('h2h_card');
  };

  // Dati filtrati per lo scatter plot
  const scatterData = useMemo(() => {
    if (entityType === 'teams') {
      return teams.filter((t) => {
        if (selectedLeague !== 'ALL' && t.league !== selectedLeague) return false;
        if (scatterSearch && !t.name.toLowerCase().includes(scatterSearch.toLowerCase())) return false;
        return true;
      });
    } else {
      return players.filter((p) => {
        if (selectedLeague !== 'ALL' && p.league !== selectedLeague) return false;
        if (selectedPosition !== 'ALL' && !p.position.includes(selectedPosition)) return false;
        if (p.mpg < minMpg) return false;
        if (p.gamesPlayed < 2) return false;
        if (
          scatterSearch &&
          !p.name.toLowerCase().includes(scatterSearch.toLowerCase()) &&
          !p.team.toLowerCase().includes(scatterSearch.toLowerCase())
        ) {
          return false;
        }
        return true;
      });
    }
  }, [entityType, teams, players, selectedLeague, selectedPosition, scatterSearch, minMpg]);

  // Dimensioni SVG Scatter
  const width = 800;
  const height = 480;
  const padding = 65;

  // Calcolo min / max e medie dinamiche
  const { minX, maxX, minY, maxY, avgX, avgY, xLabel, yLabel } = useMemo(() => {
    const xOption = AVAILABLE_METRICS.find((m) => m.key === xMetricKey);
    const yOption = AVAILABLE_METRICS.find((m) => m.key === yMetricKey);

    const xVals = scatterData.map((d) => getNestedValue(d, xMetricKey)).filter((v) => !isNaN(v) && isFinite(v));
    const yVals = scatterData.map((d) => getNestedValue(d, yMetricKey)).filter((v) => !isNaN(v) && isFinite(v));

    let calcMinX = xVals.length ? Math.min(...xVals) : 0;
    let calcMaxX = xVals.length ? Math.max(...xVals) : 100;
    let calcMinY = yVals.length ? Math.min(...yVals) : 0;
    let calcMaxY = yVals.length ? Math.max(...yVals) : 100;

    // Buffer del 5% per non toccare i bordi
    const spanX = Math.max(1, calcMaxX - calcMinX);
    const spanY = Math.max(1, calcMaxY - calcMinY);

    calcMinX = Math.floor(calcMinX - spanX * 0.08);
    calcMaxX = Math.ceil(calcMaxX + spanX * 0.08);
    calcMinY = Math.floor(calcMinY - spanY * 0.08);
    calcMaxY = Math.ceil(calcMaxY + spanY * 0.08);

    const calcAvgX = xVals.length ? Number((xVals.reduce((a, b) => a + b, 0) / xVals.length).toFixed(1)) : (calcMinX + calcMaxX) / 2;
    const calcAvgY = yVals.length ? Number((yVals.reduce((a, b) => a + b, 0) / yVals.length).toFixed(1)) : (calcMinY + calcMaxY) / 2;

    return {
      minX: calcMinX,
      maxX: calcMaxX,
      minY: calcMinY,
      maxY: calcMaxY,
      avgX: calcAvgX,
      avgY: calcAvgY,
      xLabel: xOption?.label || xMetricKey,
      yLabel: yOption?.label || yMetricKey,
    };
  }, [scatterData, xMetricKey, yMetricKey]);

  const getX = (val: number) => {
    return padding + ((val - minX) / Math.max(1, maxX - minX)) * (width - 2 * padding);
  };

  const getY = (val: number) => {
    return height - padding - ((val - minY) / Math.max(1, maxY - minY)) * (height - 2 * padding);
  };

  const avgXPos = getX(avgX);
  const avgYPos = getY(avgY);

  // Quadrante count
  const quadrantStats = useMemo(() => {
    let qTopRight = 0;
    let qTopLeft = 0;
    let qBottomRight = 0;
    let qBottomLeft = 0;

    scatterData.forEach((d) => {
      const vx = getNestedValue(d, xMetricKey);
      const vy = getNestedValue(d, yMetricKey);
      if (vx >= avgX && vy >= avgY) qTopRight++;
      else if (vx < avgX && vy >= avgY) qTopLeft++;
      else if (vx >= avgX && vy < avgY) qBottomRight++;
      else qBottomLeft++;
    });

    return { qTopRight, qTopLeft, qBottomRight, qBottomLeft };
  }, [scatterData, xMetricKey, yMetricKey, avgX, avgY]);

  return (
    <div className="space-y-6">
      {/* Stili di stampa isolata per card H2H */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-h2h-card, #printable-h2h-card * {
            visibility: visible;
          }
          #printable-h2h-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            background: #090d16 !important;
            color: #f8fafc !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Header Hub Hoopology Regular Season */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <BarChart2 className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-black text-white tracking-tight">
                Hoopology Analytics & Scatter Studio 2026/27
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Esplora correlazioni avanzate, tabelle con ordinamento multi-metrica e genera card testa a testa per EuroLeague, EuroCup e LBA Serie A.
            </p>
          </div>

          {/* Sub-Navigazione Tab Principali (Stile Hoopology) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('scatter')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'scatter'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>Scatter & Quadranti</span>
            </button>

            <button
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Table className="w-4 h-4" />
              <span>Tabella & Classifiche</span>
            </button>

            <button
              onClick={() => setActiveTab('four_factors')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'four_factors'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Four Factors & Tiri</span>
            </button>

            <button
              onClick={() => setActiveTab('h2h_card')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'h2h_card'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Swords className="w-4 h-4" />
              <span>Card Testa a Testa</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* VISTA 1: SCATTER PLOT & EFFICIENCY MATRIX */}
        {/* ============================================================ */}
        {activeTab === 'scatter' && (
          <div className="space-y-5 pt-4">
            {/* Barra dei Filtri & Preset Rapidi */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Switch Giocatori / Squadre */}
                <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => {
                      setEntityType('players');
                      setXMetricKey('usgPct');
                      setYMetricKey('tsPct');
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      entityType === 'players' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Giocatori ({scatterData.length})
                  </button>
                  <button
                    onClick={() => {
                      setEntityType('teams');
                      setXMetricKey('pace');
                      setYMetricKey('netRtg');
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      entityType === 'teams' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Squadre ({scatterData.length})
                  </button>
                </div>

                {/* Preset Rapidi Hoopology */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Preset:</span>
                  </span>
                  {entityType === 'players' ? (
                    <>
                      <button
                        onClick={() => applyPreset('scorer')}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                          xMetricKey === 'usgPct' && yMetricKey === 'tsPct'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        Scorer: USG% vs TS%
                      </button>
                      <button
                        onClick={() => applyPreset('shot_making')}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                          xMetricKey.includes('xefgPct')
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        🎯 Shot Quality vs Making
                      </button>
                      <button
                        onClick={() => applyPreset('pnr_hub')}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                          xMetricKey.includes('pnrBallHandler')
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        ⚡ PnR Handler (Freq vs PPP)
                      </button>
                      <button
                        onClick={() => applyPreset('shot_selection')}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                          xMetricKey === 'shotSelection.moreyballRate' && yMetricKey === 'tsPct'
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        Moreyball vs TS%
                      </button>
                      <button
                        onClick={() => applyPreset('playmaker')}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                          xMetricKey === 'astPct' && yMetricKey === 'astToRatio'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        Playmaking: AST% vs AST/TO
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => applyPreset('team_pace_net')}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                          xMetricKey === 'pace' && yMetricKey === 'netRtg'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        Pace vs Net Rating
                      </button>
                      <button
                        onClick={() => applyPreset('score_origin')}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                          xMetricKey.includes('pointsOffTurnovers')
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        ⚡ Contropiede vs Palle Perse
                      </button>
                      <button
                        onClick={() => applyPreset('paint_dominance')}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                          xMetricKey.includes('pointsInPaint')
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        🛡️ Dominio Pitturato (PITP)
                      </button>
                      <button
                        onClick={() => applyPreset('clutch_net')}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                          yMetricKey.includes('clutchNetRtg')
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        🔥 Clutch Execution (+/-)
                      </button>
                      <button
                        onClick={() => applyPreset('team_efficiency')}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                          xMetricKey === 'ortg' && yMetricKey === 'drtg'
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        ORtg vs DRtg
                      </button>
                      <button
                        onClick={() => applyPreset('four_factors')}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                          xMetricKey.includes('efgPct')
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        eFG% Attacco vs Difesa
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Selettori Assi Custom & Filtro Lega/Ruolo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                {/* Asse X */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold block">Asse Orizzontale (X):</label>
                  <select
                    value={xMetricKey}
                    onChange={(e) => setXMetricKey(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {AVAILABLE_METRICS.filter(
                      (m) => (entityType === 'players' ? !m.isTeamOnly : !m.isPlayerOnly)
                    ).map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Asse Y */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold block">Asse Verticale (Y):</label>
                  <select
                    value={yMetricKey}
                    onChange={(e) => setYMetricKey(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {AVAILABLE_METRICS.filter(
                      (m) => (entityType === 'players' ? !m.isTeamOnly : !m.isPlayerOnly)
                    ).map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro Lega */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold block">Competizione:</label>
                  <select
                    value={selectedLeague}
                    onChange={(e) => setSelectedLeague(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">Tutte le 3 Competizioni</option>
                    <option value="EuroLeague">EuroLeague (18 squadre)</option>
                    <option value="EuroCup">BKT EuroCup (32 squadre)</option>
                    <option value="LBA">LBA Serie A (16 squadre)</option>
                  </select>
                </div>

                {/* Cerca o Filtro Ruolo */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold block">
                    {entityType === 'players' ? 'Filtra per Ruolo o Cerca:' : 'Cerca Squadra:'}
                  </label>
                  <div className="flex gap-1.5">
                    {entityType === 'players' && (
                      <select
                        value={selectedPosition}
                        onChange={(e) => setSelectedPosition(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-white text-xs w-20"
                      >
                        <option value="ALL">Tutti</option>
                        <option value="PG">PG</option>
                        <option value="SG">SG</option>
                        <option value="SF">SF</option>
                        <option value="PF">PF</option>
                        <option value="C">C</option>
                      </select>
                    )}
                    <input
                      type="text"
                      value={scatterSearch}
                      onChange={(e) => setScatterSearch(e.target.value)}
                      placeholder="Cerca nome..."
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white placeholder-slate-500 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Indicatori Quadranti d'Efficienza con conteggi */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-[11px]">
              <div className="bg-emerald-950/30 border border-emerald-800/40 p-2.5 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span>Nord-Est (Alto/Alto)</span>
                  <span className="font-mono bg-emerald-500/20 px-1.5 py-0.2 rounded text-[10px]">
                    {quadrantStats.qTopRight}
                  </span>
                </div>
                <p className="text-slate-400 text-[10px]">
                  {entityType === 'players'
                    ? 'Super-Star ed élite: alto carico e rendimento sopra media.'
                    : 'Dominatrici: efficienza e ritmo ai massimi livelli della lega.'}
                </p>
              </div>

              <div className="bg-sky-950/30 border border-sky-800/40 p-2.5 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-sky-400 font-bold">
                  <span>Nord-Ovest (Basso X / Alto Y)</span>
                  <span className="font-mono bg-sky-500/20 px-1.5 py-0.2 rounded text-[10px]">
                    {quadrantStats.qTopLeft}
                  </span>
                </div>
                <p className="text-slate-400 text-[10px]">
                  {entityType === 'players'
                    ? 'Specialisti ultra-efficienti: basso volume ma grandissima precisione.'
                    : 'Controllo tattico: ritmo moderato o difesa solida ma alta qualità.'}
                </p>
              </div>

              <div className="bg-amber-950/30 border border-amber-800/40 p-2.5 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-amber-400 font-bold">
                  <span>Sud-Est (Alto X / Basso Y)</span>
                  <span className="font-mono bg-amber-500/20 px-1.5 py-0.2 rounded text-[10px]">
                    {quadrantStats.qBottomRight}
                  </span>
                </div>
                <p className="text-slate-400 text-[10px]">
                  {entityType === 'players'
                    ? 'Volume alto ma resa limitata: troppi tiri o turnover.'
                    : 'Transizione frenetica senza adeguata conversione offensiva.'}
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-slate-400 font-bold">
                  <span>Sud-Ovest (Basso/Basso)</span>
                  <span className="font-mono bg-slate-800 px-1.5 py-0.2 rounded text-[10px]">
                    {quadrantStats.qBottomLeft}
                  </span>
                </div>
                <p className="text-slate-500 text-[10px]">
                  {entityType === 'players'
                    ? 'Uso limitato ed impatto ridotto a referto.'
                    : 'Ritmo basso e difficoltà nella produzione numerica.'}
                </p>
              </div>
            </div>

            {/* Grafico Scatter Interattivo SVG */}
            <div className="relative w-full overflow-x-auto bg-slate-950 rounded-2xl p-4 border border-slate-800 shadow-inner">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[900px] mx-auto select-none">
                {/* Linee Media Campionato (Assi di riferimento) */}
                <line
                  x1={avgXPos}
                  y1={padding}
                  x2={avgXPos}
                  y2={height - padding}
                  stroke="#475569"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <line
                  x1={padding}
                  y1={avgYPos}
                  x2={width - padding}
                  y2={avgYPos}
                  stroke="#475569"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />

                {/* Assi Principali */}
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#64748b" strokeWidth="2" />
                <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#64748b" strokeWidth="2" />

                {/* Etichette Media */}
                <text x={avgXPos + 6} y={padding + 14} fill="#64748b" fontSize="10" fontWeight="bold">
                  Media X: {avgX}
                </text>
                <text x={width - padding - 70} y={avgYPos - 6} fill="#64748b" fontSize="10" fontWeight="bold">
                  Media Y: {avgY}
                </text>

                {/* Etichette Assi */}
                <text x={width / 2} y={height - 18} fill="#94a3b8" fontSize="12" fontWeight="bold" textAnchor="middle">
                  {xLabel} →
                </text>
                <text
                  x={-height / 2}
                  y={22}
                  fill="#94a3b8"
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                  transform="rotate(-90)"
                >
                  {yLabel} →
                </text>

                {/* Punti del grafico */}
                {scatterData.map((item) => {
                  const rawX = getNestedValue(item, xMetricKey);
                  const rawY = getNestedValue(item, yMetricKey);
                  const cx = getX(rawX);
                  const cy = getY(rawY);

                  const isHovered = hoveredPoint?.id === item.id;
                  const isT = entityType === 'teams';

                  let pointColor = '#6366f1';
                  if (item.league === 'EuroLeague') pointColor = '#f59e0b';
                  else if (item.league === 'EuroCup') pointColor = '#06b6d4';
                  else if (item.league === 'LBA') pointColor = '#10b981';

                  const radius = isHovered ? 9 : isT ? 7 : 5.5;

                  return (
                    <g
                      key={item.id}
                      className="cursor-pointer transition-transform duration-150"
                      onClick={() => (isT ? onSelectTeam(item as TeamStats) : onSelectPlayer(item as PlayerStats))}
                      onMouseEnter={() => setHoveredPoint(item)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      <circle
                        cx={cx}
                        cy={cy}
                        r={radius}
                        fill={pointColor}
                        stroke="#ffffff"
                        strokeWidth={isHovered ? 2.5 : 1}
                        className="hover:scale-125 transition-all"
                      />
                      <text
                        x={cx}
                        y={cy - 9}
                        fill="#f8fafc"
                        fontSize={isHovered ? '11' : '9'}
                        fontWeight={isHovered ? 'bold' : 'normal'}
                        textAnchor="middle"
                        className="pointer-events-none drop-shadow"
                      >
                        {isT ? (item as TeamStats).shortName || item.name.slice(0, 4) : item.name.split(' ').pop()}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Tooltip Hover Dettagliato */}
              {hoveredPoint && (
                <div className="absolute top-6 right-6 bg-slate-900/95 border border-slate-700 p-3.5 rounded-2xl shadow-2xl backdrop-blur-md pointer-events-none z-20 text-xs min-w-[220px]">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 mb-2">
                    <span className="font-bold text-white text-sm truncate">{hoveredPoint.name}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        hoveredPoint.league === 'EuroLeague'
                          ? 'bg-amber-500/20 text-amber-300'
                          : hoveredPoint.league === 'EuroCup'
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {hoveredPoint.league}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mb-2">
                    {entityType === 'players' ? `${hoveredPoint.team} · ${hoveredPoint.position}` : hoveredPoint.name}
                  </div>
                  <div className="space-y-1.5 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">{xLabel.split('(')[0]}:</span>
                      <span className="font-bold text-sky-400 font-mono">
                        {getNestedValue(hoveredPoint, xMetricKey)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{yLabel.split('(')[0]}:</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {getNestedValue(hoveredPoint, yMetricKey)}
                      </span>
                    </div>
                    {entityType === 'players' && (
                      <div className="flex justify-between pt-1 border-t border-slate-800 text-[11px] text-slate-400">
                        <span>Punti a partita:</span>
                        <span className="text-white font-bold">{hoveredPoint.pts} PPG</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Legenda Colori Leghe & Shortcut */}
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> EuroLeague
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span> EuroCup
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> LBA Serie A
                </div>
              </div>
              <div className="text-[11px] text-slate-500 italic">
                Clicca su un cerchio per aprire la scheda o usa il tab <strong>"Card Testa a Testa"</strong> per confrontare due elementi!
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VISTA 2: TABELLA ANALITICA & CLASSIFICHE HOOPOLOGY */}
        {/* ============================================================ */}
        {activeTab === 'table' && (
          <div className="pt-4">
            <AdvancedDataTable
              players={players}
              teams={teams}
              onSelectPlayer={onSelectPlayer}
              onSelectTeam={onSelectTeam}
              onCompareWithH2H={handleCompareWithH2H}
            />
          </div>
        )}

        {/* ============================================================ */}
        {/* VISTA 3: FOUR FACTORS & PROFILI DI TIRO */}
        {/* ============================================================ */}
        {activeTab === 'four_factors' && (
          <div className="pt-4 space-y-6">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-cyan-400" />
                <span>Dean Oliver's Four Factors (I 4 Pilastri Analitici della Vittoria)</span>
              </h3>
              <p className="text-xs text-slate-400">
                La scomposizione del basket moderno in 4 metriche fondamentali su 100 possessi: tiro effettivo (eFG%), palle perse (TOV%), rimbalzi d'attacco (ORB%) e frequenza tiri liberi (FTR).
              </p>
            </div>

            {/* Griglia 4 Fattori Squadre Top */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* eFG% Leader */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <span>1. Tiro Effettivo (eFG%)</span>
                  <span>Offensivo</span>
                </div>
                <div className="space-y-2 text-xs">
                  {teams
                    .slice()
                    .sort((a, b) => b.fourFactorsOffense.efgPct - a.fourFactorsOffense.efgPct)
                    .slice(0, 5)
                    .map((t, idx) => (
                      <div key={t.id} className="flex items-center justify-between">
                        <span className="text-slate-300 truncate max-w-[150px]">
                          {idx + 1}. {t.name}
                        </span>
                        <span className="font-mono font-bold text-emerald-400">{t.fourFactorsOffense.efgPct}%</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* TOV% Leader (Minor numero di palle perse) */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-sky-400 uppercase tracking-wider">
                  <span>2. Sicurezza Palla (TOV%)</span>
                  <span>Minori Perse</span>
                </div>
                <div className="space-y-2 text-xs">
                  {teams
                    .slice()
                    .sort((a, b) => a.fourFactorsOffense.tovPct - b.fourFactorsOffense.tovPct)
                    .slice(0, 5)
                    .map((t, idx) => (
                      <div key={t.id} className="flex items-center justify-between">
                        <span className="text-slate-300 truncate max-w-[150px]">
                          {idx + 1}. {t.name}
                        </span>
                        <span className="font-mono font-bold text-sky-400">{t.fourFactorsOffense.tovPct}%</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* ORB% Leader */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <span>3. Rimbalzo Attacco (ORB%)</span>
                  <span>Controllo Tabellone</span>
                </div>
                <div className="space-y-2 text-xs">
                  {teams
                    .slice()
                    .sort((a, b) => b.fourFactorsOffense.orbPct - a.fourFactorsOffense.orbPct)
                    .slice(0, 5)
                    .map((t, idx) => (
                      <div key={t.id} className="flex items-center justify-between">
                        <span className="text-slate-300 truncate max-w-[150px]">
                          {idx + 1}. {t.name}
                        </span>
                        <span className="font-mono font-bold text-amber-400">{t.fourFactorsOffense.orbPct}%</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Moreyball Rate Leader */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  <span>4. Moreyball Rate %</span>
                  <span>Ferro + Triple</span>
                </div>
                <div className="space-y-2 text-xs">
                  {teams
                    .slice()
                    .sort((a, b) => b.shotSelection.moreyballRate - a.shotSelection.moreyballRate)
                    .slice(0, 5)
                    .map((t, idx) => (
                      <div key={t.id} className="flex items-center justify-between">
                        <span className="text-slate-300 truncate max-w-[150px]">
                          {idx + 1}. {t.name}
                        </span>
                        <span className="font-mono font-bold text-indigo-400">{t.shotSelection.moreyballRate}%</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VISTA 4: GENERATORE CARD TESTA A TESTA (H2H) */}
        {/* ============================================================ */}
        {activeTab === 'h2h_card' && (
          <div className="pt-4">
            <H2HCardGenerator
              players={players}
              teams={teams}
              initialPlayer1Id={h2hPreselectedType === 'players' ? h2hPreselectedId : undefined}
              initialTeam1Id={h2hPreselectedType === 'teams' ? h2hPreselectedId : undefined}
              onSelectPlayer={onSelectPlayer}
              onSelectTeam={onSelectTeam}
            />
          </div>
        )}
      </div>
    </div>
  );
};
