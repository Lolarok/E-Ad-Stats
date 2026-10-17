import React, { useState, useMemo } from 'react';
import { PlayerStats, TeamStats, Position } from '../types/basketball';
import {
  Users,
  Shield,
  Zap,
  Activity,
  Flame,
  ArrowRightLeft,
  RefreshCw,
  Target,
  Sparkles,
  Info,
  Check,
  TrendingUp,
  Sliders,
  ShieldAlert,
  Award,
} from 'lucide-react';

interface Props {
  teams: TeamStats[];
  players: PlayerStats[];
  onSelectPlayerDetail?: (player: PlayerStats) => void;
}

interface LineupMetrics {
  ortg: number;
  drtg: number;
  netRtg: number;
  pace: number;
  tsPct: number;
  efgPct: number;
  moreyballRate: number;
  ptsPer100: number;
  fourFactors: {
    efgPct: number;
    tovPct: number;
    orbPct: number;
    ftr: number;
  };
  synergy: {
    spacingScore: number;
    rimProtectionScore: number;
    perimeterDefenseScore: number;
    reboundingScore: number;
    flowScore: number;
  };
}

export const LineupAnalytics: React.FC<Props> = ({ teams, players, onSelectPlayerDetail }) => {
  // 1. Filtro Lega e Selezione Squadra
  const [selectedLeagueFilter, setSelectedLeagueFilter] = useState<'ALL' | 'EuroLeague' | 'EuroCup' | 'LBA'>('ALL');
  const filteredTeams = useMemo(() => {
    const list = selectedLeagueFilter === 'ALL'
      ? teams
      : teams.filter((t) => t.league === selectedLeagueFilter);
    const map = new Map<string, TeamStats>();
    list.forEach((t) => {
      if (t && t.id && !map.has(t.id)) map.set(t.id, t);
    });
    return Array.from(map.values());
  }, [teams, selectedLeagueFilter]);

  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id || '');
  const activeTeam = useMemo(() => {
    return teams.find((t) => t.id === selectedTeamId) || teams[0];
  }, [teams, selectedTeamId]);

  // Roster della squadra attiva
  const teamRoster = useMemo(() => {
    return players
      .filter((p) => (p.teamId === activeTeam.id || p.team === activeTeam.name) && p.league === activeTeam.league)
      .sort((a, b) => b.mpg - a.mpg);
  }, [players, activeTeam]);

  // 2. Stato Lineup (5 giocatori in campo)
  // Default: i primi 5 per minutaggio
  const [activeLineup, setActiveLineup] = useState<PlayerStats[]>(() => {
    return teamRoster.slice(0, 5);
  });

  // Slot selezionato per sostituzione immediata (0..4)
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

  // Bench player search
  const [benchSearch, setBenchSearch] = useState('');
  const [benchPositionFilter, setBenchPositionFilter] = useState<'ALL' | Position>('ALL');

  // Aggiorna lineup se cambia la squadra
  const handleTeamChange = (newTeamId: string) => {
    setSelectedTeamId(newTeamId);
    const newTeam = teams.find((t) => t.id === newTeamId) || teams[0];
    const newRoster = players
      .filter((p) => (p.teamId === newTeam.id || p.team === newTeam.name) && p.league === newTeam.league)
      .sort((a, b) => b.mpg - a.mpg);
    setActiveLineup(newRoster.slice(0, 5));
    setSelectedSlotIndex(null);
  };

  // Giocatori in panchina (non nel quintetto)
  const benchPlayers = useMemo(() => {
    const onCourtIds = new Set(activeLineup.map((p) => p.id));
    return teamRoster
      .filter((p) => !onCourtIds.has(p.id))
      .filter((p) => {
        const matchPos = benchPositionFilter === 'ALL' ||
          p.position === benchPositionFilter ||
          (benchPositionFilter === 'PG' && (p.position === 'PG' || p.position === 'PG/SG')) ||
          (benchPositionFilter === 'SG' && (p.position === 'SG' || p.position === 'PG/SG' || p.position === 'G/F')) ||
          (benchPositionFilter === 'SF' && (p.position === 'SF' || p.position === 'F' || p.position === 'G/F')) ||
          (benchPositionFilter === 'PF' && (p.position === 'PF' || p.position === 'F' || p.position === 'F/C')) ||
          (benchPositionFilter === 'C' && (p.position === 'C' || p.position === 'F/C'));
        const matchSearch = p.name.toLowerCase().includes(benchSearch.toLowerCase());
        return matchPos && matchSearch;
      });
  }, [teamRoster, activeLineup, benchPositionFilter, benchSearch]);

  // Motore di Calcolo Statistiche Quintetto sui 100 Possessi
  const lineupMetrics: LineupMetrics = useMemo(() => {
    if (activeLineup.length === 0) {
      return {
        ortg: activeTeam.ortg,
        drtg: activeTeam.drtg,
        netRtg: activeTeam.netRtg,
        pace: activeTeam.pace,
        tsPct: 55,
        efgPct: 52,
        moreyballRate: 75,
        ptsPer100: activeTeam.ortg,
        fourFactors: { efgPct: 52, tovPct: 13, orbPct: 28, ftr: 0.25 },
        synergy: { spacingScore: 50, rimProtectionScore: 50, perimeterDefenseScore: 50, reboundingScore: 50, flowScore: 50 },
      };
    }

    const totalUsg = activeLineup.reduce((acc, p) => acc + (p.usgPct || 20), 0);
    const totalFga = Math.max(1, activeLineup.reduce((acc, p) => acc + (p.fga || 1), 0));

    // Spacing Score (0-100) basato su frequenza e percentuali triple
    const avg3PAr = activeLineup.reduce((acc, p) => acc + (p.shotSelection?.threePointAttemptRate || 35), 0) / 5;
    const avg3Pct = activeLineup.reduce((acc, p) => acc + (p.shotSelection?.aboveBreak3?.fgPct || 37), 0) / 5;
    const spacingScore = Math.min(99, Math.max(20, Math.round(avg3PAr * 0.7 + avg3Pct * 1.1)));

    // Modificatore di spacing sull'ORtg (-2.5 a +3.5 punti per 100 possessi)
    const spacingModifier = ((spacingScore - 55) / 45) * 3.5;

    // Regia & Circolazione palla (Playmaking Flow)
    const highAstCount = activeLineup.filter((p) => p.astPct >= 18).length;
    const flowScore = Math.min(99, Math.max(25, Math.round(activeLineup.reduce((acc, p) => acc + p.astPct, 0) * 1.1)));
    const flowModifier = highAstCount >= 2 ? 2.0 : highAstCount === 1 ? 0.8 : -1.8;

    // Media pesata dell'ORtg individuale con base di squadra
    const weightedPlayerOrtg = activeLineup.reduce((acc, p) => acc + (p.ortg || activeTeam.ortg) * (p.usgPct || 20), 0) / Math.max(1, totalUsg);
    const calculatedOrtg = Number((activeTeam.ortg * 0.35 + weightedPlayerOrtg * 0.65 + spacingModifier + flowModifier).toFixed(1));

    // Protezione Ferro & Difesa Perimetrale
    const rimProtectionScore = Math.min(99, Math.max(20, Math.round(
      activeLineup.reduce((acc, p) => acc + (p.blk * 30 + p.drbPct * 2.5 + Math.max(0, p.heightCm - 192) * 1.6), 0) / 5
    )));

    const perimeterDefenseScore = Math.min(99, Math.max(20, Math.round(
      activeLineup.reduce((acc, p) => acc + (p.stl * 32 + (28 - (p.tovPct || 12))), 0) / 5
    )));

    // Modificatore Difensivo (DRtg più basso è migliore!)
    const defenseBonus = ((rimProtectionScore - 50) / 50) * 2.8 + ((perimeterDefenseScore - 50) / 50) * 2.0;
    const calculatedDrtg = Number((activeTeam.drtg - defenseBonus).toFixed(1));

    // Net Rating su 100 possessi
    const calculatedNetRtg = Number((calculatedOrtg - calculatedDrtg).toFixed(1));

    // Ritmo stimato (Pace: possessi per gara)
    const guardCount = activeLineup.filter((p) => p.position === 'PG' || p.position === 'SG').length;
    const paceMod = (guardCount - 2) * 1.2 + (activeLineup.reduce((acc, p) => acc + p.stl, 0) - 3.2) * 0.7;
    const calculatedPace = Number((activeTeam.pace + paceMod).toFixed(1));

    // True Shooting & eFG% ponderati sui tiri del quintetto
    const calculatedTs = Number((activeLineup.reduce((acc, p) => acc + p.tsPct * (p.fga || 1), 0) / totalFga).toFixed(1));
    const calculatedEfg = Number((activeLineup.reduce((acc, p) => acc + p.efgPct * (p.fga || 1), 0) / totalFga).toFixed(1));
    const calculatedMoreyball = Math.round(activeLineup.reduce((acc, p) => acc + (p.shotSelection?.moreyballRate || 75) * (p.fga || 1), 0) / totalFga);

    // Four Factors del Quintetto
    const calculatedOrb = Number((activeLineup.reduce((acc, p) => acc + p.orbPct, 0) / 5 * 1.35).toFixed(1));
    const calculatedTov = Number((activeLineup.reduce((acc, p) => acc + p.tovPct, 0) / 5).toFixed(1));
    const calculatedFtr = Number((activeLineup.reduce((acc, p) => acc + (p.shotSelection?.ftr || 0.25) * (p.fga || 1), 0) / totalFga).toFixed(3));

    const reboundingScore = Math.min(99, Math.max(25, Math.round(activeLineup.reduce((acc, p) => acc + p.trbPct, 0) * 1.75)));

    return {
      ortg: calculatedOrtg,
      drtg: calculatedDrtg,
      netRtg: calculatedNetRtg,
      pace: calculatedPace,
      tsPct: calculatedTs,
      efgPct: calculatedEfg,
      moreyballRate: calculatedMoreyball,
      ptsPer100: calculatedOrtg,
      fourFactors: {
        efgPct: calculatedEfg,
        tovPct: calculatedTov,
        orbPct: calculatedOrb,
        ftr: calculatedFtr,
      },
      synergy: {
        spacingScore,
        rimProtectionScore,
        perimeterDefenseScore,
        reboundingScore,
        flowScore,
      },
    };
  }, [activeLineup, activeTeam]);

  // Sostituzione di un giocatore in campo con un panchinaro
  const handleSwapPlayer = (benchPlayer: PlayerStats, slotIdxToReplace?: number) => {
    const targetIdx = slotIdxToReplace !== undefined ? slotIdxToReplace : selectedSlotIndex !== null ? selectedSlotIndex : 0;
    const updated = [...activeLineup];
    updated[targetIdx] = benchPlayer;
    setActiveLineup(updated);
    setSelectedSlotIndex(null);
  };

  // Caricamento Preset Tattici
  const handleLoadPreset = (presetType: 'starting' | 'five_out' | 'defense' | 'small_ball' | 'bench') => {
    setSelectedSlotIndex(null);
    if (presetType === 'starting') {
      // I primi 5 per minutaggio / valutazione
      setActiveLineup(teamRoster.slice(0, 5));
    } else if (presetType === 'five_out') {
      // I 5 migliori tiratori per % triple e Moreyball
      const shooters = [...teamRoster].sort(
        (a, b) => (b.shotSelection?.aboveBreak3?.fgPct || 0) + (b.shotSelection?.threePointAttemptRate || 0) * 0.5 -
                  ((a.shotSelection?.aboveBreak3?.fgPct || 0) + (a.shotSelection?.threePointAttemptRate || 0) * 0.5)
      );
      setActiveLineup(shooters.slice(0, 5));
    } else if (presetType === 'defense') {
      // I migliori difensori (stoppate, recuperi, rimbalzi)
      const defenders = [...teamRoster].sort(
        (a, b) => (b.stl * 3 + b.blk * 3 + b.drbPct) - (a.stl * 3 + a.blk * 3 + a.drbPct)
      );
      setActiveLineup(defenders.slice(0, 5));
    } else if (presetType === 'small_ball') {
      // Guardie e Ali dinamiche (no centro tradizionale pesante)
      const nonCenters = teamRoster.filter((p) => p.position !== 'C');
      const smallBall = nonCenters.length >= 5 ? nonCenters.slice(0, 5) : teamRoster.slice(0, 5);
      setActiveLineup(smallBall);
    } else if (presetType === 'bench') {
      // Seconda unità (dal 6° al 10° giocatore)
      if (teamRoster.length >= 10) {
        setActiveLineup(teamRoster.slice(5, 10));
      } else {
        setActiveLineup(teamRoster.slice(teamRoster.length - 5));
      }
    }
  };

  // Calcolo Differenziale con Team Baseline
  const ortgDiff = Number((lineupMetrics.ortg - activeTeam.ortg).toFixed(1));
  const drtgDiff = Number((lineupMetrics.drtg - activeTeam.drtg).toFixed(1)); // Negativo è migliore per la difesa
  const netRtgDiff = Number((lineupMetrics.netRtg - activeTeam.netRtg).toFixed(1));

  // Coordinate di posizionamento sul campo per ciascuno dei 5 slot (FIBA Half-Court)
  const slotPositions = [
    { label: 'PG • Playmaker', top: '76%', left: '50%', defaultRole: 'Regia' },
    { label: 'SG • Guardia', top: '48%', left: '18%', defaultRole: 'Tiratore' },
    { label: 'SF • Ala Piccola', top: '48%', left: '82%', defaultRole: 'Slasher' },
    { label: 'PF • Ala Grande', top: '32%', left: '30%', defaultRole: 'Post / Spacing' },
    { label: 'C • Centro', top: '22%', left: '50%', defaultRole: 'Rim Protector' },
  ];

  return (
    <div className="space-y-6 text-slate-100">
      {/* Intestazione e Controlli Squadra */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Lineup Analytics & Quintetti (Parametrati sui 100 Possessi)
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Seleziona qualsiasi combinazione di 5 giocatori per simulare la loro sinergia in campo: Offensive Rating, Defensive Rating e Four Factors calcolati su 100 possessi.
          </p>
        </div>

        {/* Selettore Squadra e Filtro Lega */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro Rapido Lega */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['ALL', 'EuroLeague', 'EuroCup', 'LBA'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setSelectedLeagueFilter(l)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  selectedLeagueFilter === l
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {l === 'ALL' ? 'Tutte' : l}
              </button>
            ))}
          </div>

          {/* Dropdown Squadra */}
          <select
            value={selectedTeamId}
            onChange={(e) => handleTeamChange(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-teal-500 cursor-pointer shadow-sm min-w-[200px]"
          >
            {filteredTeams.map((t) => (
              <option key={`${t.id}-${t.league}`} value={t.id}>
                {t.name} ({t.league} • Record {t.record.wins}-{t.record.losses})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Preset Tattici di Quintetto (1-Click) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Preset Tattici Rapidi:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleLoadPreset('starting')}
            className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            Starting 5 (Titolari)
          </button>
          <button
            onClick={() => handleLoadPreset('five_out')}
            className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            5-Out (Massimo Spacing)
          </button>
          <button
            onClick={() => handleLoadPreset('defense')}
            className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
            Lockdown Defense
          </button>
          <button
            onClick={() => handleLoadPreset('small_ball')}
            className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            Small Ball Rapido
          </button>
          <button
            onClick={() => handleLoadPreset('bench')}
            className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
            Second Unit (Panchina)
          </button>
        </div>
      </div>

      {/* DASHBOARD PRINCIPALE DEI RATINGS DEL QUINTETTO (100 POSSESSI) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Offensive Rating Quintetto */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Lineup ORtg</span>
            <Zap className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-indigo-400">
            {lineupMetrics.ortg}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span>Pts / 100 Possessi</span>
            <span className={`font-bold ${ortgDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {ortgDiff >= 0 ? `+${ortgDiff}` : ortgDiff} vs Team
            </span>
          </div>
        </div>

        {/* Card 2: Defensive Rating Quintetto */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Lineup DRtg</span>
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-cyan-400">
            {lineupMetrics.drtg}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span>Pts Subiti / 100 Possessi</span>
            {/* Per la difesa, drtg più basso rispetto alla squadra è un miglioramento */}
            <span className={`font-bold ${drtgDiff <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {drtgDiff <= 0 ? `${drtgDiff}` : `+${drtgDiff}`} vs Team
            </span>
          </div>
        </div>

        {/* Card 3: Net Rating Quintetto */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Net Rating</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className={`text-3xl font-black ${lineupMetrics.netRtg >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {lineupMetrics.netRtg >= 0 ? `+${lineupMetrics.netRtg}` : lineupMetrics.netRtg}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span>Diff / 100 Possessi</span>
            <span className={`font-bold ${netRtgDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netRtgDiff >= 0 ? `+${netRtgDiff}` : netRtgDiff} vs Base
            </span>
          </div>
        </div>

        {/* Card 4: Ritmo & Efficienza di Tiro */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Pace & Tiro</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400">
            {lineupMetrics.pace}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span>Possessi / Gara</span>
            <span className="text-white font-bold">{lineupMetrics.tsPct}% TS</span>
          </div>
        </div>
      </div>

      {/* SEZIONE CENTRALE: CAMPO DA BASKET CON I 5 GIOCATORI E IL PANNELLO BENCH SWAP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Colonna Sinistra / Centro (7 col): Il Campo da Basket con i 5 Giocatori Posizionati */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>📍</span> Quintetto in Campo ({activeTeam.shortName})
              </span>
              <span className="text-[11px] text-slate-400">
                • Clicca uno slot per sostituirlo
              </span>
            </div>
            {selectedSlotIndex !== null && (
              <span className="text-xs bg-amber-500/20 text-amber-300 font-bold px-2.5 py-1 rounded-lg border border-amber-500/40 animate-pulse">
                Seleziona dalla panchina lo slot #{selectedSlotIndex + 1}
              </span>
            )}
          </div>

          {/* Campo Metà Campo FIBA con I 5 Slot */}
          <div className="relative w-full aspect-[4/3] bg-gradient-to-b from-slate-950 to-slate-900 rounded-2xl border-2 border-slate-800 overflow-hidden shadow-inner p-4">
            {/* SVG del Campo Metà Campo FIBA */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
              viewBox="0 0 500 470"
            >
              {/* Tabellone e Ferro */}
              <line x1="220" y1="40" x2="280" y2="40" stroke="#94a3b8" strokeWidth="3" />
              <circle cx="250" cy="55" r="12" fill="none" stroke="#f97316" strokeWidth="2.5" />
              {/* Pitturato / Area */}
              <rect x="170" y="0" width="160" height="190" fill="none" stroke="#64748b" strokeWidth="2" />
              {/* Cerchio Tiro Libero */}
              <circle cx="250" cy="190" r="60" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="6 6" />
              {/* Linea da 3 Punti (6.75m FIBA) */}
              <path
                d="M 40 0 L 40 100 A 235 235 0 0 0 460 100 L 460 0"
                fill="none"
                stroke="#64748b"
                strokeWidth="2.5"
              />
              {/* Semacerchio No-Charge */}
              <path d="M 215 55 A 35 35 0 0 0 285 55" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
            </svg>

            {/* I 5 Giocatori Posizionati sul Campo */}
            {activeLineup.map((player, idx) => {
              const pos = slotPositions[idx] || slotPositions[0];
              const isSelected = selectedSlotIndex === idx;

              return (
                <div
                  key={player.id + '-' + idx}
                  onClick={() => setSelectedSlotIndex(isSelected ? null : idx)}
                  style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }}
                  className={`absolute z-10 cursor-pointer transition-all duration-200 group ${
                    isSelected
                      ? 'scale-110 ring-4 ring-amber-400 shadow-2xl'
                      : 'hover:scale-105'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl border backdrop-blur-md flex items-center gap-2.5 min-w-[150px] shadow-lg ${
                    isSelected
                      ? 'bg-amber-950/90 border-amber-400 text-white'
                      : 'bg-slate-950/90 border-slate-700/80 text-slate-100 hover:border-slate-500'
                  }`}>
                    {/* Badge Numero con Colore Squadra */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white shadow shrink-0"
                      style={{ backgroundColor: activeTeam.logoColor }}
                    >
                      #{player.number || '0'}
                    </div>

                    <div className="overflow-hidden">
                      <div className="text-xs font-black truncate text-white">
                        {player.name}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <span className="font-bold text-amber-400">{player.position}</span>
                        <span>•</span>
                        <span className="text-indigo-300 font-semibold">{player.ptsPer100 || Number(((player.pts * 40 * 100) / (Math.max(1, player.mpg) * activeTeam.pace)).toFixed(1))} pts/100</span>
                      </div>
                    </div>

                    <ArrowRightLeft className={`w-3.5 h-3.5 ml-auto text-slate-400 group-hover:text-amber-400 transition-colors ${
                      isSelected ? 'text-amber-400 animate-spin' : ''
                    }`} />
                  </div>

                  {/* Etichetta Ruolo Tattico */}
                  <div className="text-center mt-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-950/90 text-slate-400 border border-slate-800">
                      {pos.label.split(' • ')[0]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Riepilogo Four Factors del Quintetto */}
          <div className="mt-4 bg-slate-950 rounded-xl p-3.5 border border-slate-800">
            <div className="text-[11px] uppercase font-bold text-slate-400 mb-2 flex items-center justify-between">
              <span>Four Factors Offensivi del Quintetto (Dean Oliver)</span>
              <span className="text-indigo-400 font-normal">Moreyball: {lineupMetrics.moreyballRate}%</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-slate-900 p-2 rounded-lg">
                <div className="text-[10px] text-slate-400">eFG% Tiro</div>
                <div className="font-black text-emerald-400 text-sm">{lineupMetrics.fourFactors.efgPct}%</div>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg">
                <div className="text-[10px] text-slate-400">TOV% Perse</div>
                <div className="font-black text-amber-400 text-sm">{lineupMetrics.fourFactors.tovPct}%</div>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg">
                <div className="text-[10px] text-slate-400">ORB% Rimbalzi</div>
                <div className="font-black text-cyan-400 text-sm">{lineupMetrics.fourFactors.orbPct}%</div>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg">
                <div className="text-[10px] text-slate-400">FTR Liberi</div>
                <div className="font-black text-purple-400 text-sm">{lineupMetrics.fourFactors.ftr}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Colonna Destra (5 col): Sinergia Tattica & Panchina Disponibile per la Sostituzione */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          {/* Card Indici di Sinergia Tattica */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-teal-400" />
              <span>Indici di Sinergia e Spaziature (0-100)</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              {/* Spacing */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300">Floor Spacing (Pericolo da 3)</span>
                  <span className="font-bold text-amber-400">{lineupMetrics.synergy.spacingScore}/100</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
                    style={{ width: `${lineupMetrics.synergy.spacingScore}%` }}
                  ></div>
                </div>
              </div>

              {/* Rim Protection */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300">Protezione del Ferro (Rim Protection)</span>
                  <span className="font-bold text-cyan-400">{lineupMetrics.synergy.rimProtectionScore}/100</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{ width: `${lineupMetrics.synergy.rimProtectionScore}%` }}
                  ></div>
                </div>
              </div>

              {/* Perimeter Defense */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300">Pressione Perimetrale (Recuperi)</span>
                  <span className="font-bold text-indigo-400">{lineupMetrics.synergy.perimeterDefenseScore}/100</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${lineupMetrics.synergy.perimeterDefenseScore}%` }}
                  ></div>
                </div>
              </div>

              {/* Playmaking Flow */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300">Circolazione Palla (Flow / Assist)</span>
                  <span className="font-bold text-purple-400">{lineupMetrics.synergy.flowScore}/100</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${lineupMetrics.synergy.flowScore}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Roster Panchina & Sostituzioni Rapide */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  <span>🔄</span> Panchina & Sostituzioni ({benchPlayers.length})
                </h3>
                <span className="text-[11px] text-slate-400">
                  {selectedSlotIndex !== null
                    ? `Sostituisci slot #${selectedSlotIndex + 1}: ${activeLineup[selectedSlotIndex]?.name}`
                    : 'Clicca un giocatore per metterlo in campo'}
                </span>
              </div>

              {/* Filtro Ruolo Panchina */}
              <div className="flex items-center gap-1 text-[11px] flex-wrap">
                {(activeTeam?.league === 'LBA'
                  ? (['ALL', 'PG', 'SG', 'G/F', 'F', 'C'] as const)
                  : (['ALL', 'PG', 'SG', 'SF', 'PF', 'C'] as const)
                ).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setBenchPositionFilter(pos as any)}
                    className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                      benchPositionFilter === pos
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista Giocatori di Panchina Scrollabile */}
            <div className="space-y-2 overflow-y-auto max-h-[310px] pr-1">
              {benchPlayers.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  Nessun giocatore disponibile con i filtri attuali.
                </div>
              ) : (
                benchPlayers.map((benchPlayer) => {
                  return (
                    <div
                      key={benchPlayer.id}
                      className="p-2.5 bg-slate-950 hover:bg-slate-800/80 rounded-xl border border-slate-800/90 transition-all flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span className="text-xs font-black text-slate-400 w-5 text-right">
                          #{benchPlayer.number || '0'}
                        </span>
                        <div className="truncate">
                          <div className="font-bold text-white truncate flex items-center gap-1.5">
                            <span>{benchPlayer.name}</span>
                            <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-amber-400 font-bold">
                              {benchPlayer.position}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2">
                            <span className="text-indigo-300 font-semibold">{benchPlayer.ptsPer100 || Number(((benchPlayer.pts * 40 * 100) / (Math.max(1, benchPlayer.mpg) * activeTeam.pace)).toFixed(1))} pts/100</span>
                            <span>•</span>
                            <span>{benchPlayer.tsPct}% TS</span>
                            <span>•</span>
                            <span className="text-emerald-400 font-semibold">{benchPlayer.shotSelection?.aboveBreak3?.fgPct || 35}% 3P</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSwapPlayer(benchPlayer)}
                        className="px-3 py-1.5 rounded-lg bg-teal-600/20 hover:bg-teal-600 border border-teal-500/40 text-teal-300 hover:text-white font-bold text-xs transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        <span>Metti in Campo</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabella Comparativa di Tutti i Giocatori del Roster e Loro Impatto sui 100 Possessi */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">
              📊 Roster Completo {activeTeam.name} — Statistiche su 100 Possessi
            </span>
            <span className="text-xs text-slate-400">
              ({teamRoster.length} giocatori a disposizione)
            </span>
          </div>
          <span className="text-xs text-amber-300 font-semibold">
            Pallino verde = Giocatore attualmente nel quintetto attivo
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Stato</th>
                <th className="py-2.5 px-3">Giocatore</th>
                <th className="py-2.5 px-2 text-center">Ruolo</th>
                <th className="py-2.5 px-2 text-right">Min/G</th>
                <th className="py-2.5 px-2 text-right text-amber-300 font-bold">PTS/100</th>
                <th className="py-2.5 px-2 text-right">TS%</th>
                <th className="py-2.5 px-2 text-right">USG%</th>
                <th className="py-2.5 px-2 text-right">AST%</th>
                <th className="py-2.5 px-2 text-right">TRB%</th>
                <th className="py-2.5 px-2 text-right text-emerald-400">3P%</th>
                <th className="py-2.5 px-2 text-right">Morey%</th>
                <th className="py-2.5 px-3 text-center">Azione</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {teamRoster.map((player) => {
                const isOnCourt = activeLineup.some((p) => p.id === player.id);

                return (
                  <tr
                    key={player.id}
                    className={`transition-colors ${
                      isOnCourt ? 'bg-teal-950/20' : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <td className="py-2.5 px-4">
                      {isOnCourt ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          In Campo
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-medium">Panchina</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span className="text-slate-400 font-normal">#{player.number || '0'}</span>
                        <span>{player.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center font-bold text-slate-300">
                      {player.position}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-400">{player.mpg}</td>
                    <td className="py-2.5 px-2 text-right font-black text-amber-300">
                      {player.ptsPer100 || Number(((player.pts * 40 * 100) / (Math.max(1, player.mpg) * activeTeam.pace)).toFixed(1))}
                    </td>
                    <td className="py-2.5 px-2 text-right font-semibold text-white">{player.tsPct}%</td>
                    <td className="py-2.5 px-2 text-right text-indigo-400">{player.usgPct}%</td>
                    <td className="py-2.5 px-2 text-right text-slate-300">{player.astPct}%</td>
                    <td className="py-2.5 px-2 text-right text-slate-300">{player.trbPct}%</td>
                    <td className="py-2.5 px-2 text-right font-bold text-emerald-400">
                      {player.shotSelection?.aboveBreak3?.fgPct || 36}%
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-300">
                      {player.shotSelection?.moreyballRate || 75}%
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {!isOnCourt ? (
                        <button
                          onClick={() => handleSwapPlayer(player)}
                          className="px-2.5 py-1 rounded bg-teal-600/30 hover:bg-teal-600 text-teal-300 hover:text-white font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          Inserisci
                        </button>
                      ) : (
                        <span className="text-[10px] text-teal-400 font-bold">✓ Attivo</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
