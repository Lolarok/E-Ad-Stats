import React, { useState, useMemo } from 'react';
import { PlayerStats, TeamStats, League } from '../types/basketball';
import {
  getOrComputePlayerMetrics,
  getOrComputeTeamMetrics,
} from '../utils/advancedAnalyticsCalculator';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Swords,
  ExternalLink,
  Filter,
  Trophy,
  SlidersHorizontal,
  Download,
  Target,
  Zap,
  Flame,
  Shield,
  Activity,
  Sparkles,
  Info,
} from 'lucide-react';

interface Props {
  players: PlayerStats[];
  teams: TeamStats[];
  onSelectPlayer: (player: PlayerStats) => void;
  onSelectTeam: (team: TeamStats) => void;
  onCompareWithH2H: (type: 'players' | 'teams', id: string) => void;
}

export type TableViewMode = 'advanced' | 'situational' | 'playtypes' | 'origin_clutch' | 'shot_quality';

export const AdvancedDataTable: React.FC<Props> = ({
  players,
  teams,
  onSelectPlayer,
  onSelectTeam,
  onCompareWithH2H,
}) => {
  const [tableType, setTableType] = useState<'players' | 'teams'>('players');
  const [viewMode, setViewMode] = useState<TableViewMode>('advanced');
  const [excludeGarbageTime, setExcludeGarbageTime] = useState<boolean>(false);
  const [leagueFilter, setLeagueFilter] = useState<League | 'ALL'>('ALL');
  const [posFilter, setPosFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [minGp, setMinGp] = useState<number>(2);
  const [minMpg, setMinMpg] = useState<number>(10);

  // Ordinamento
  const [sortField, setSortField] = useState<string>('pts');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Paginazione
  const [page, setPage] = useState<number>(1);
  const pageSize = 20;

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Helper per estrarre valori anche nidificati o calcolati
  const extractPlayerValue = (p: PlayerStats, field: string): number => {
    const metrics = getOrComputePlayerMetrics(p);
    if (field === 'xefgPct') return metrics.shotQuality.xefgPct;
    if (field === 'shotMakingDiff') return metrics.shotQuality.shotMakingDiff;
    if (field === 'shotQualityRating') return metrics.shotQuality.shotQualityRating;
    if (field === 'rimFrequencyPct') return metrics.shotQuality.rimFrequencyPct;
    if (field === 'pnrHandlerPpp') return metrics.playTypes.pnrBallHandler.ppp;
    if (field === 'pnrHandlerFreq') return metrics.playTypes.pnrBallHandler.freqPct;
    if (field === 'pnrRollPpp') return metrics.playTypes.pnrRollMan.ppp;
    if (field === 'spotUpPpp') return metrics.playTypes.spotUp.ppp;
    if (field === 'isoPpp') return metrics.playTypes.isolation.ppp;
    if (field === 'transPpp') return metrics.playTypes.transition.ppp;
    if (field === 'postUpPpp') return metrics.playTypes.postUp.ppp;
    if (field === 'pointsInPaint') return metrics.scoreOrigin.pointsInPaint;
    if (field === 'pointsOffTurnovers') return metrics.scoreOrigin.pointsOffTurnovers;
    if (field === 'fastbreakPoints') return metrics.scoreOrigin.fastbreakPoints;
    if (field === 'secondChancePoints') return metrics.scoreOrigin.secondChancePoints;
    if (field === 'clutchNetRtg') return metrics.clutchStats.clutchNetRtg;
    if (field === 'clutchEfgPct') return metrics.clutchStats.clutchEfgPct;
    if (field === 'clutchPts') return metrics.clutchStats.clutchPts;
    if (field === 'moreyballRate') return p.shotSelection?.moreyballRate || 0;
    if (field === 'onCourtNetRtg') return p.realOnOff?.onCourtNetRtg ?? -999;
    if (field === 'offCourtNetRtg') return p.realOnOff?.offCourtNetRtg ?? -999;
    if (field === 'netSwing') return p.realOnOff?.netSwing ?? -999;
    if (field === 'onCourtMinutes') return p.realOnOff?.onCourtMinutes ?? 0;
    if (field === 'volatilitySigma') return p.volatilitySigma ?? 0;
    return (p as any)[field] ?? 0;
  };

  const extractTeamValue = (t: TeamStats, field: string): number => {
    const metrics = getOrComputeTeamMetrics(t);
    if (excludeGarbageTime) {
      if (field === 'ortg') return t.nonGarbage?.ortg ?? t.ortg;
      if (field === 'drtg') return t.nonGarbage?.drtg ?? t.drtg;
      if (field === 'netRtg') return t.nonGarbage?.netRtg ?? t.netRtg;
      if (field === 'efgOff') return t.nonGarbage?.efgPct ?? t.fourFactorsOffense?.efgPct ?? 0;
      if (field === 'orbOff') return t.nonGarbage?.orbPct ?? t.fourFactorsOffense?.orbPct ?? 0;
      if (field === 'drbPct') return t.nonGarbage?.drbPct ?? Number((100 - (t.fourFactorsDefense?.orbPct ?? 26)).toFixed(1));
    }
    if (field === 'ngOrtg') return t.nonGarbage?.ortg ?? t.ortg;
    if (field === 'ngDrtg') return t.nonGarbage?.drtg ?? t.drtg;
    if (field === 'ngNetRtg') return t.nonGarbage?.netRtg ?? t.netRtg;
    if (field === 'ngOrbPct') return t.nonGarbage?.orbPct ?? t.fourFactorsOffense?.orbPct ?? 0;
    if (field === 'ngDrbPct') return t.nonGarbage?.drbPct ?? Number((100 - (t.fourFactorsDefense?.orbPct ?? 26)).toFixed(1));
    if (field === 'garbageTimePossPct') return t.nonGarbage?.garbageTimePossPct ?? 0;
    if (field === 'q3AdjustmentIndex') return t.quarterSplits?.q3AdjustmentIndex ?? 0;
    if (field === 'killShotsPerGame') return t.situational?.killShotsPerGame ?? 0;
    if (field === 'runsConcededPerGame') return t.situational?.runsConcededPerGame ?? 0;
    if (field === 'volatilitySigma') return t.situational?.volatilitySigma ?? 0;
    if (field === 'netRtgVsTop500') return t.situational?.netRtgVsTop500 ?? t.netRtg;
    if (field === 'orbOff') return t.fourFactorsOffense?.orbPct || 0;
    if (field === 'drbPct') return t.nonGarbage?.drbPct ?? Number((100 - (t.fourFactorsDefense?.orbPct ?? 26)).toFixed(1));
    if (field === 'xefgPct') return metrics.shotQuality.xefgPct;
    if (field === 'shotMakingDiff') return metrics.shotQuality.shotMakingDiff;
    if (field === 'shotQualityRating') return metrics.shotQuality.shotQualityRating;
    if (field === 'rimFrequencyPct') return metrics.shotQuality.rimFrequencyPct;
    if (field === 'pnrHandlerPpp') return metrics.playTypes.pnrBallHandler.ppp;
    if (field === 'pnrRollPpp') return metrics.playTypes.pnrRollMan.ppp;
    if (field === 'spotUpPpp') return metrics.playTypes.spotUp.ppp;
    if (field === 'isoPpp') return metrics.playTypes.isolation.ppp;
    if (field === 'transPpp') return metrics.playTypes.transition.ppp;
    if (field === 'postUpPpp') return metrics.playTypes.postUp.ppp;
    if (field === 'pointsInPaint') return metrics.scoreOrigin.pointsInPaint;
    if (field === 'pointsOffTurnovers') return metrics.scoreOrigin.pointsOffTurnovers;
    if (field === 'fastbreakPoints') return metrics.scoreOrigin.fastbreakPoints;
    if (field === 'secondChancePoints') return metrics.scoreOrigin.secondChancePoints;
    if (field === 'clutchNetRtg') return metrics.clutchStats.clutchNetRtg;
    if (field === 'clutchEfgPct') return metrics.clutchStats.clutchEfgPct;
    if (field === 'clutchPts') return metrics.clutchStats.clutchPts;
    if (field === 'moreyballRate') return t.shotSelection?.moreyballRate || 0;
    if (field === 'efgOff') return t.fourFactorsOffense?.efgPct || 0;
    if (field === 'efgDef') return t.fourFactorsDefense?.efgPct || 0;
    if (field === 'wins') return t.record?.wins ?? t.wins ?? 0;
    return (t as any)[field] ?? 0;
  };

  // Filtro Squadre
  const filteredTeams = useMemo(() => {
    return teams
      .filter((t) => {
        if (leagueFilter !== 'ALL' && t.league !== leagueFilter) return false;
        if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        const valA = extractTeamValue(a, sortField);
        const valB = extractTeamValue(b, sortField);
        return sortAsc ? valA - valB : valB - valA;
      });
  }, [teams, leagueFilter, search, sortField, sortAsc, excludeGarbageTime]);

  // Filtro Giocatori
  const filteredPlayers = useMemo(() => {
    return players
      .filter((p) => {
        if (leagueFilter !== 'ALL' && p.league !== leagueFilter) return false;
        if (posFilter !== 'ALL' && !p.position.includes(posFilter)) return false;
        if (p.gamesPlayed < minGp) return false;
        if (p.mpg < minMpg) return false;
        if (
          search &&
          !p.name.toLowerCase().includes(search.toLowerCase()) &&
          !p.team.toLowerCase().includes(search.toLowerCase())
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const valA = extractPlayerValue(a, sortField);
        const valB = extractPlayerValue(b, sortField);
        return sortAsc ? valA - valB : valB - valA;
      });
  }, [players, leagueFilter, posFilter, minGp, minMpg, search, sortField, sortAsc]);

  // Esportazione CSV
  const handleExportCsv = () => {
    const isP = tableType === 'players';
    const rows = isP ? filteredPlayers : filteredTeams;
    if (rows.length === 0) return;

    let headers: string[] = [];
    let csvData: string[][] = [];

    if (isP) {
      headers = [
        'Nome',
        'Squadra',
        'Lega',
        'Ruolo',
        'GP',
        'MPG',
        'PTS',
        'TS%',
        'eFG%',
        'xeFG%',
        'ShotMakingDiff',
        'USG%',
        'AST%',
        'AST/TO',
        'ORtg',
        'DRtg',
        'NetRtg',
        'Moreyball%',
        'PnR_Handler_PPP',
        'PnR_Roll_PPP',
        'SpotUp_PPP',
        'Iso_PPP',
        'Trans_PPP',
        'PostUp_PPP',
        'PITP',
        'POT',
        'Fastbreak',
        '2ndChance',
        'ClutchNetRtg',
        'OnCourt_NetRtg',
        'OffCourt_NetRtg',
        'OnOff_Swing',
        'Volatility_Sigma',
      ];
      csvData = (rows as PlayerStats[]).map((p) => {
        const m = getOrComputePlayerMetrics(p);
        return [
          `"${p.name}"`,
          `"${p.team}"`,
          p.league,
          p.position,
          String(p.gamesPlayed),
          String(p.mpg),
          String(p.pts),
          String(p.tsPct),
          String(p.efgPct),
          String(m.shotQuality.xefgPct),
          String(m.shotQuality.shotMakingDiff),
          String(p.usgPct),
          String(p.astPct),
          String(p.astToRatio),
          String(p.ortg),
          String(p.drtg),
          String(p.netRtg),
          String(p.shotSelection.moreyballRate),
          String(m.playTypes.pnrBallHandler.ppp),
          String(m.playTypes.pnrRollMan.ppp),
          String(m.playTypes.spotUp.ppp),
          String(m.playTypes.isolation.ppp),
          String(m.playTypes.transition.ppp),
          String(m.playTypes.postUp.ppp),
          String(m.scoreOrigin.pointsInPaint),
          String(m.scoreOrigin.pointsOffTurnovers),
          String(m.scoreOrigin.fastbreakPoints),
          String(m.scoreOrigin.secondChancePoints),
          String(m.clutchStats.clutchNetRtg),
          String(p.realOnOff?.onCourtNetRtg ?? ''),
          String(p.realOnOff?.offCourtNetRtg ?? ''),
          String(p.realOnOff?.netSwing ?? ''),
          String(p.volatilitySigma ?? ''),
        ];
      });
    } else {
      headers = [
        'Squadra',
        'Lega',
        'GP',
        'V-S',
        'Pace',
        'ORtg',
        'DRtg',
        'NetRtg',
        'NoGarbage_ORtg',
        'NoGarbage_DRtg',
        'NoGarbage_NetRtg',
        'NoGarbage_ORB%',
        'NoGarbage_DRB%',
        'GarbageTime%',
        'Q3_Coach_Adj',
        'KillShots_G',
        'Volatility_Sigma',
        'NetRtg_vs_Top500',
        'PPG',
        'OppPPG',
        'eFG% Off',
        'xeFG%',
        'ShotMakingDiff',
        'PnR_Handler_PPP',
        'PnR_Roll_PPP',
        'SpotUp_PPP',
        'Trans_PPP',
        'PITP',
        'POT',
        'Fastbreak',
        '2ndChance',
        'ClutchNetRtg',
      ];
      csvData = (rows as TeamStats[]).map((t) => {
        const m = getOrComputeTeamMetrics(t);
        return [
          `"${t.name}"`,
          t.league,
          String(t.gp),
          `"${t.record?.wins ?? t.wins ?? 0}-${t.record?.losses ?? t.losses ?? 0}"`,
          String(t.pace),
          String(t.ortg),
          String(t.drtg),
          String(t.netRtg),
          String(t.nonGarbage?.ortg ?? t.ortg),
          String(t.nonGarbage?.drtg ?? t.drtg),
          String(t.nonGarbage?.netRtg ?? t.netRtg),
          String(t.nonGarbage?.orbPct ?? t.fourFactorsOffense.orbPct),
          String(t.nonGarbage?.drbPct ?? Number((100 - t.fourFactorsDefense.orbPct).toFixed(1))),
          String(t.nonGarbage?.garbageTimePossPct ?? 0),
          String(t.quarterSplits?.q3AdjustmentIndex ?? 0),
          String(t.situational?.killShotsPerGame ?? 0),
          String(t.situational?.volatilitySigma ?? 0),
          String(t.situational?.netRtgVsTop500 ?? t.netRtg),
          String(t.ppg),
          String(t.oppPpg),
          String(t.fourFactorsOffense.efgPct),
          String(m.shotQuality.xefgPct),
          String(m.shotQuality.shotMakingDiff),
          String(m.playTypes.pnrBallHandler.ppp),
          String(m.playTypes.pnrRollMan.ppp),
          String(m.playTypes.spotUp.ppp),
          String(m.playTypes.transition.ppp),
          String(m.scoreOrigin.pointsInPaint),
          String(m.scoreOrigin.pointsOffTurnovers),
          String(m.scoreOrigin.fastbreakPoints),
          String(m.scoreOrigin.secondChancePoints),
          String(m.clutchStats.clutchNetRtg),
        ];
      });
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...csvData.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pro_analytics_${isP ? 'giocatori' : 'squadre'}_2026_27.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const paginatedPlayers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPlayers.slice(start, start + pageSize);
  }, [filteredPlayers, page]);

  const totalPages = Math.ceil(filteredPlayers.length / pageSize);

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-50 ml-1 inline" />;
    return sortAsc ? (
      <ArrowUp className="w-3 h-3 text-emerald-400 ml-1 inline" />
    ) : (
      <ArrowDown className="w-3 h-3 text-emerald-400 ml-1 inline" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Controlli Filtro Superiore */}
      <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-4">
        {/* Switch Giocatori / Squadre + View Mode Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Switch Giocatori / Squadre */}
            <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => {
                  setTableType('players');
                  setSortField('pts');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  tableType === 'players' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Giocatori ({filteredPlayers.length})
              </button>
              <button
                onClick={() => {
                  setTableType('teams');
                  setSortField('netRtg');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  tableType === 'teams' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Squadre ({filteredTeams.length})
              </button>
            </div>

            {/* View Mode Tabs (Statistiche Avanzate / Situazionale / Play Types / Genesi & Clutch / Shot Quality) */}
            <div className="flex flex-wrap items-center p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs gap-1">
              <button
                onClick={() => setViewMode('advanced')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  viewMode === 'advanced' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                <span>Base & Rating</span>
              </button>
              <button
                onClick={() => setViewMode('situational')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  viewMode === 'situational' ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Situazionale & Momentum</span>
              </button>
              <button
                onClick={() => setViewMode('playtypes')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  viewMode === 'playtypes' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Play Types (Stima Analitica)</span>
              </button>
              <button
                onClick={() => setViewMode('origin_clutch')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  viewMode === 'origin_clutch' ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>Genesi Punti & Clutch</span>
              </button>
              <button
                onClick={() => setViewMode('shot_quality')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  viewMode === 'shot_quality' ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Target className="w-3.5 h-3.5 text-cyan-400" />
                <span>Shot Quality & Making</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filtro Leghe */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              {(['ALL', 'EuroLeague', 'EuroCup', 'LBA'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    setLeagueFilter(l);
                    setPage(1);
                  }}
                  className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    leagueFilter === l
                      ? l === 'EuroLeague'
                        ? 'bg-amber-600 text-white'
                        : l === 'EuroCup'
                        ? 'bg-cyan-600 text-white'
                        : l === 'LBA'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {l === 'ALL' ? 'Tutte' : l}
                </button>
              ))}
            </div>

            {/* Esporta CSV */}
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Esporta CSV</span>
            </button>
          </div>
        </div>

        {/* Seconda riga: Search e Filtri avanzati */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800/80 text-xs">
          {/* Cerca Nome */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={tableType === 'players' ? 'Cerca giocatore o squadra...' : 'Cerca squadra...'}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
            />
          </div>

          {/* Filtro Ruoli per Giocatori */}
          {tableType === 'players' && (
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <span className="text-slate-500 px-2 font-medium">Ruolo:</span>
              {['ALL', 'PG', 'SG', 'SF', 'PF', 'C'].map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setPosFilter(r);
                    setPage(1);
                  }}
                  className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    posFilter === r ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          {/* Slider Minuti Minimi per Giocatori */}
          {tableType === 'players' && (
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-400">
              <span>Min MPG:</span>
              <input
                type="range"
                min="0"
                max="25"
                step="5"
                value={minMpg}
                onChange={(e) => {
                  setMinMpg(Number(e.target.value));
                  setPage(1);
                }}
                className="w-16 accent-indigo-500 cursor-pointer"
              />
              <span className="font-mono text-white font-bold w-6">{minMpg}m</span>
            </div>
          )}

          {/* Toggle Garbage Time per Squadre */}
          {tableType === 'teams' && (
            <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800 ml-auto">
              <button
                onClick={() => setExcludeGarbageTime(false)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  !excludeGarbageTime ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Partita Intera
              </button>
              <button
                onClick={() => setExcludeGarbageTime(true)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  excludeGarbageTime ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Escludi Garbage Time
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Nota Metodologica per Play Types */}
      {viewMode === 'playtypes' && (
        <div className="flex items-center gap-2 px-3 py-2 bg-purple-950/20 border border-purple-500/20 rounded-xl text-xs text-purple-300">
          <Info className="w-4 h-4 text-purple-400 shrink-0" />
          <span>
            <strong>Nota metodologica:</strong> I valori di Play-Type (PnR, Spot-Up, Transizione, Isolamento) sono <strong>stime analitiche</strong> modellate sulla base delle coordinate di tiro reali, del ruolo del giocatore e dei dati di possesso ufficiali.
          </span>
        </div>
      )}

      {/* Nota Metodologica No-Garbage & Situazionale */}
      {(excludeGarbageTime || viewMode === 'situational') && (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-950/20 border border-emerald-500/25 rounded-xl text-xs text-emerald-200">
          <Info className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Filtro Garbage Time & Metriche Reali:</strong> Esclude possessi negli ultimi 5&apos; di Q4 con scarto ≥ 15 pt (Play-by-Play EuroLeague/EuroCup) o l&apos;intero Q4 se scarto fine Q3 ≥ 20 pt (LBA / gare senza PBP). On/Off e Clutch mostrano dati reali PBP dove disponibili.
          </span>
        </div>
      )}

      {/* ============================================================ */}
      {/* TABELLA GIOCATORI */}
      {/* ============================================================ */}
      {tableType === 'players' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 select-none">
                <tr>
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3 cursor-pointer hover:text-white" onClick={() => handleSort('name')}>
                    Giocatore {getSortIcon('name')}
                  </th>
                  <th className="py-3 px-2">Squadra</th>
                  <th className="py-3 px-2">Ruolo</th>

                  {/* COLONNE A SECONDA DELLA VIEW MODE */}
                  {viewMode === 'advanced' && (
                    <>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('mpg')}>
                        MPG {getSortIcon('mpg')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('pts')}>
                        PPG {getSortIcon('pts')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('tsPct')}>
                        TS% {getSortIcon('tsPct')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('usgPct')}>
                        USG% {getSortIcon('usgPct')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('astPct')}>
                        AST% {getSortIcon('astPct')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('astToRatio')}>
                        AST/TO {getSortIcon('astToRatio')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('ortg')}>
                        ORtg {getSortIcon('ortg')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('netRtg')}>
                        NetRtg {getSortIcon('netRtg')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('moreyballRate')}>
                        Morey% {getSortIcon('moreyballRate')}
                      </th>
                    </>
                  )}

                  {viewMode === 'playtypes' && (
                    <>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('pnrHandlerPpp')}>
                        PnR Hand. PPP (Stima) {getSortIcon('pnrHandlerPpp')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('pnrHandlerFreq')}>
                        PnR Freq% (Stima) {getSortIcon('pnrHandlerFreq')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('pnrRollPpp')}>
                        Roll Man PPP (Stima) {getSortIcon('pnrRollPpp')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('spotUpPpp')}>
                        Spot-Up PPP (Stima) {getSortIcon('spotUpPpp')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('isoPpp')}>
                        Isolation PPP (Stima) {getSortIcon('isoPpp')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('transPpp')}>
                        Transizione PPP (Stima) {getSortIcon('transPpp')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('postUpPpp')}>
                        Post-Up PPP (Stima) {getSortIcon('postUpPpp')}
                      </th>
                    </>
                  )}

                  {viewMode === 'origin_clutch' && (
                    <>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('pointsInPaint')}>
                        PITP (Pitturato) {getSortIcon('pointsInPaint')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('pointsOffTurnovers')}>
                        POT (da Perse) {getSortIcon('pointsOffTurnovers')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('fastbreakPoints')}>
                        Fastbreak {getSortIcon('fastbreakPoints')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('secondChancePoints')}>
                        2nd Chance {getSortIcon('secondChancePoints')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('clutchNetRtg')}>
                        Clutch NetRtg {getSortIcon('clutchNetRtg')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('clutchEfgPct')}>
                        Clutch eFG% {getSortIcon('clutchEfgPct')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('clutchPts')}>
                        Clutch PPG {getSortIcon('clutchPts')}
                      </th>
                    </>
                  )}

                  {viewMode === 'shot_quality' && (
                    <>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('efgPct')}>
                        eFG% Reale {getSortIcon('efgPct')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('xefgPct')}>
                        xeFG% Atteso {getSortIcon('xefgPct')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('shotMakingDiff')}>
                        Shot Making (+/-) {getSortIcon('shotMakingDiff')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('shotQualityRating')}>
                        Shot Quality (0-100) {getSortIcon('shotQualityRating')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('rimFrequencyPct')}>
                        Rim Freq% {getSortIcon('rimFrequencyPct')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('moreyballRate')}>
                        Moreyball% {getSortIcon('moreyballRate')}
                      </th>
                    </>
                  )}

                  {viewMode === 'situational' && (
                    <>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('onCourtNetRtg')}>
                        On-Court Net {getSortIcon('onCourtNetRtg')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('offCourtNetRtg')}>
                        Off-Court Net {getSortIcon('offCourtNetRtg')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('netSwing')}>
                        On/Off Swing {getSortIcon('netSwing')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('onCourtMinutes')}>
                        Min PBP {getSortIcon('onCourtMinutes')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('clutchNetRtg')}>
                        Clutch NetRtg {getSortIcon('clutchNetRtg')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('volatilitySigma')}>
                        Volatilità σ {getSortIcon('volatilitySigma')}
                      </th>
                    </>
                  )}

                  <th className="py-3 px-3 text-center">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {paginatedPlayers.map((p, idx) => {
                  const globalIdx = (page - 1) * pageSize + idx + 1;
                  const metrics = getOrComputePlayerMetrics(p);

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 text-slate-500 text-[11px] font-sans">{globalIdx}</td>
                      <td
                        className="py-2.5 px-3 font-sans font-bold text-white hover:text-indigo-400 cursor-pointer"
                        onClick={() => onSelectPlayer(p)}
                      >
                        <div className="flex items-center gap-2">
                          <span>{p.name}</span>
                          {p.tsPct >= 62 && p.usgPct >= 25 && <span className="text-[10px] text-amber-400">⭐</span>}
                          {metrics.shotQuality.shotMakingDiff >= 3 && <span className="text-[10px] text-rose-400">🎯</span>}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 font-sans text-slate-400 truncate max-w-[140px]">{p.team}</td>
                      <td className="py-2.5 px-2 font-sans">
                        <span className="text-[11px] text-slate-400">{p.position}</span>
                      </td>

                      {/* VALORI PER VIEW MODE */}
                      {viewMode === 'advanced' && (
                        <>
                          <td className="py-2.5 px-2 text-right text-slate-400">{p.mpg}</td>
                          <td className="py-2.5 px-2 text-right font-bold text-white">{p.pts}</td>
                          <td className={`py-2.5 px-2 text-right font-bold ${p.tsPct >= 60 ? 'text-emerald-400' : p.tsPct <= 50 ? 'text-rose-400' : 'text-slate-300'}`}>
                            {p.tsPct}%
                          </td>
                          <td className={`py-2.5 px-2 text-right font-bold ${p.usgPct >= 25 ? 'text-amber-400' : 'text-slate-300'}`}>
                            {p.usgPct}%
                          </td>
                          <td className="py-2.5 px-2 text-right text-slate-300">{p.astPct}%</td>
                          <td className={`py-2.5 px-2 text-right ${p.astToRatio >= 2.0 ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}>
                            {p.astToRatio}
                          </td>
                          <td className="py-2.5 px-2 text-right text-slate-300">{p.ortg}</td>
                          <td className={`py-2.5 px-2 text-right font-bold ${(p.netRtg || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {(p.netRtg || 0) >= 0 ? `+${p.netRtg}` : p.netRtg}
                          </td>
                          <td className="py-2.5 px-2 text-right text-indigo-300">{p.shotSelection?.moreyballRate}%</td>
                        </>
                      )}

                      {viewMode === 'playtypes' && (
                        <>
                          <td className="py-2.5 px-2 text-right font-bold text-amber-300">
                            {metrics.playTypes.pnrBallHandler.ppp}
                          </td>
                          <td className="py-2.5 px-2 text-right text-slate-400">
                            {metrics.playTypes.pnrBallHandler.freqPct}%
                          </td>
                          <td className="py-2.5 px-2 text-right text-cyan-300 font-bold">
                            {metrics.playTypes.pnrRollMan.ppp}
                          </td>
                          <td className="py-2.5 px-2 text-right text-emerald-300 font-bold">
                            {metrics.playTypes.spotUp.ppp}
                          </td>
                          <td className="py-2.5 px-2 text-right text-purple-300 font-bold">
                            {metrics.playTypes.isolation.ppp}
                          </td>
                          <td className="py-2.5 px-2 text-right text-rose-300 font-bold">
                            {metrics.playTypes.transition.ppp}
                          </td>
                          <td className="py-2.5 px-2 text-right text-slate-300">
                            {metrics.playTypes.postUp.ppp}
                          </td>
                        </>
                      )}

                      {viewMode === 'origin_clutch' && (
                        <>
                          <td className="py-2.5 px-2 text-right font-bold text-blue-300">
                            {metrics.scoreOrigin.pointsInPaint}
                          </td>
                          <td className="py-2.5 px-2 text-right text-amber-300">
                            {metrics.scoreOrigin.pointsOffTurnovers}
                          </td>
                          <td className="py-2.5 px-2 text-right text-emerald-300">
                            {metrics.scoreOrigin.fastbreakPoints}
                          </td>
                          <td className="py-2.5 px-2 text-right text-indigo-300">
                            {metrics.scoreOrigin.secondChancePoints}
                          </td>
                          <td
                            className={`py-2.5 px-2 text-right font-bold ${
                              metrics.clutchStats.clutchNetRtg >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {metrics.clutchStats.clutchNetRtg >= 0
                              ? `+${metrics.clutchStats.clutchNetRtg}`
                              : metrics.clutchStats.clutchNetRtg}
                          </td>
                          <td className="py-2.5 px-2 text-right text-slate-300">
                            {metrics.clutchStats.clutchEfgPct}%
                          </td>
                          <td className="py-2.5 px-2 text-right font-bold text-white">
                            {metrics.clutchStats.clutchPts}
                          </td>
                        </>
                      )}

                      {viewMode === 'shot_quality' && (
                        <>
                          <td className="py-2.5 px-2 text-right font-bold text-white">{p.efgPct}%</td>
                          <td className="py-2.5 px-2 text-right text-slate-400">
                            {metrics.shotQuality.xefgPct}%
                          </td>
                          <td
                            className={`py-2.5 px-2 text-right font-black ${
                              metrics.shotQuality.shotMakingDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {metrics.shotQuality.shotMakingDiff >= 0
                              ? `+${metrics.shotQuality.shotMakingDiff}%`
                              : `${metrics.shotQuality.shotMakingDiff}%`}
                          </td>
                          <td className="py-2.5 px-2 text-right font-bold text-cyan-300">
                            {metrics.shotQuality.shotQualityRating}
                          </td>
                          <td className="py-2.5 px-2 text-right text-indigo-300">
                            {metrics.shotQuality.rimFrequencyPct}%
                          </td>
                          <td className="py-2.5 px-2 text-right text-slate-400">
                            {p.shotSelection?.moreyballRate}%
                          </td>
                        </>
                      )}

                      {viewMode === 'situational' && (
                        <>
                          <td className="py-2.5 px-2 text-right tabular-nums">
                            {p.realOnOff ? (
                              <span className={`font-bold ${p.realOnOff.onCourtNetRtg >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {p.realOnOff.onCourtNetRtg >= 0 ? `+${p.realOnOff.onCourtNetRtg}` : p.realOnOff.onCourtNetRtg}
                              </span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-right tabular-nums text-slate-300">
                            {p.realOnOff ? (
                              <span>
                                {p.realOnOff.offCourtNetRtg >= 0 ? `+${p.realOnOff.offCourtNetRtg}` : p.realOnOff.offCourtNetRtg}
                              </span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-right tabular-nums">
                            {p.realOnOff ? (
                              <span className={`font-bold ${p.realOnOff.netSwing >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {p.realOnOff.netSwing >= 0 ? `+${p.realOnOff.netSwing}` : p.realOnOff.netSwing}
                              </span>
                            ) : (
                              <span className="text-slate-600 font-sans text-[10px]">No PBP</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-right tabular-nums text-slate-400">
                            {p.realOnOff ? `${p.realOnOff.onCourtMinutes}m` : '—'}
                          </td>
                          <td className="py-2.5 px-2 text-right tabular-nums">
                            <div className="flex items-center justify-end gap-1.5">
                              <span className={`font-bold ${metrics.clutchStats.clutchNetRtg >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {metrics.clutchStats.clutchNetRtg >= 0 ? `+${metrics.clutchStats.clutchNetRtg}` : metrics.clutchStats.clutchNetRtg}
                              </span>
                              <span className="text-[9px] font-sans text-slate-500">
                                {metrics.clutchStats.source === 'pbp' ? 'PBP' : 'Stima'}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-right tabular-nums text-amber-300">
                            {p.volatilitySigma !== undefined ? `±${p.volatilitySigma}` : '—'}
                          </td>
                        </>
                      )}

                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onCompareWithH2H('players', p.id)}
                            title="Invia al generatore Card Testa a Testa"
                            className="p-1 rounded bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-colors cursor-pointer"
                          >
                            <Swords className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSelectPlayer(p)}
                            title="Apri scheda dettagliata"
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginazione */}
          {totalPages > 1 && (
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>
                Visualizzati {paginatedPlayers.length} di {filteredPlayers.length} giocatori
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                >
                  Indietro
                </button>
                <span className="px-2 font-mono text-white">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                >
                  Avanti
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TABELLA SQUADRE */}
      {/* ============================================================ */}
      {tableType === 'teams' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 select-none">
                <tr>
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3 cursor-pointer hover:text-white" onClick={() => handleSort('name')}>
                    Squadra {getSortIcon('name')}
                  </th>
                  <th className="py-3 px-2">Lega</th>
                  <th className="py-3 px-2 text-center cursor-pointer hover:text-white" onClick={() => handleSort('wins')}>
                    Record {getSortIcon('wins')}
                  </th>

                  {viewMode === 'advanced' && (
                    <>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('pace')}>
                        Pace {getSortIcon('pace')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('ortg')}>
                        {excludeGarbageTime ? 'ORtg (No-G)' : 'Off. Rtg'} {getSortIcon('ortg')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('drtg')}>
                        {excludeGarbageTime ? 'DRtg (No-G)' : 'Def. Rtg'} {getSortIcon('drtg')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('netRtg')}>
                        {excludeGarbageTime ? 'NetRtg (No-G)' : 'Net Rtg'} {getSortIcon('netRtg')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('orbOff')}>
                        ORB% {getSortIcon('orbOff')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('drbPct')}>
                        DRB% {getSortIcon('drbPct')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('efgOff')}>
                        eFG% Off {getSortIcon('efgOff')}
                      </th>
                      <th className="py-3 px-2 text-right">Morey%</th>
                    </>
                  )}

                  {viewMode === 'situational' && (
                    <>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('ngOrtg')}>
                        No-G ORtg {getSortIcon('ngOrtg')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('ngDrtg')}>
                        No-G DRtg {getSortIcon('ngDrtg')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('ngNetRtg')}>
                        No-G NetRtg {getSortIcon('ngNetRtg')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('ngOrbPct')}>
                        No-G ORB% {getSortIcon('ngOrbPct')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('ngDrbPct')}>
                        No-G DRB% {getSortIcon('ngDrbPct')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('garbageTimePossPct')}>
                        Garbage% {getSortIcon('garbageTimePossPct')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('q3AdjustmentIndex')}>
                        Q3 Coach Adj {getSortIcon('q3AdjustmentIndex')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('killShotsPerGame')}>
                        Kill Shots/G {getSortIcon('killShotsPerGame')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('volatilitySigma')}>
                        Volatilità σ {getSortIcon('volatilitySigma')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('netRtgVsTop500')}>
                        Net vs &gt;.500 {getSortIcon('netRtgVsTop500')}
                      </th>
                    </>
                  )}

                  {viewMode === 'playtypes' && (
                    <>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('pnrHandlerPpp')}>
                        PnR Handler PPP (Stima) {getSortIcon('pnrHandlerPpp')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('pnrRollPpp')}>
                        PnR Roll PPP (Stima) {getSortIcon('pnrRollPpp')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('spotUpPpp')}>
                        Spot-Up PPP (Stima) {getSortIcon('spotUpPpp')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('transPpp')}>
                        Transizione PPP (Stima) {getSortIcon('transPpp')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('isoPpp')}>
                        Isolation PPP (Stima) {getSortIcon('isoPpp')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('postUpPpp')}>
                        Post-Up PPP (Stima) {getSortIcon('postUpPpp')}
                      </th>
                    </>
                  )}

                  {viewMode === 'origin_clutch' && (
                    <>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('pointsInPaint')}>
                        PITP (Pitturato) {getSortIcon('pointsInPaint')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('pointsOffTurnovers')}>
                        POT (da Perse) {getSortIcon('pointsOffTurnovers')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('fastbreakPoints')}>
                        Fastbreak {getSortIcon('fastbreakPoints')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('secondChancePoints')}>
                        2nd Chance {getSortIcon('secondChancePoints')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('clutchNetRtg')}>
                        Clutch NetRtg {getSortIcon('clutchNetRtg')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('clutchEfgPct')}>
                        Clutch eFG% {getSortIcon('clutchEfgPct')}
                      </th>
                    </>
                  )}

                  {viewMode === 'shot_quality' && (
                    <>
                      <th className="py-3 px-2 text-right">eFG% Reale</th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('xefgPct')}>
                        xeFG% Atteso {getSortIcon('xefgPct')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('shotMakingDiff')}>
                        Shot Making (+/-) {getSortIcon('shotMakingDiff')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('shotQualityRating')}>
                        Shot Quality Index {getSortIcon('shotQualityRating')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('rimFrequencyPct')}>
                        Rim Freq% {getSortIcon('rimFrequencyPct')}
                      </th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('moreyballRate')}>
                        Moreyball% {getSortIcon('moreyballRate')}
                      </th>
                    </>
                  )}

                  <th className="py-3 px-3 text-center">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredTeams.map((t, idx) => {
                  const wins = t.record?.wins ?? t.wins ?? 0;
                  const losses = t.record?.losses ?? t.losses ?? 0;
                  const metrics = getOrComputeTeamMetrics(t);

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 text-slate-500 text-[11px] font-sans">{idx + 1}</td>
                      <td
                        className="py-2.5 px-3 font-sans font-bold text-white hover:text-indigo-400 cursor-pointer"
                        onClick={() => onSelectTeam(t)}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: t.logoColor || '#6366f1' }}
                          ></span>
                          <span>{t.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 font-sans text-slate-400">{t.league}</td>
                      <td className="py-2.5 px-2 text-center font-bold text-white">
                        {wins} - {losses}
                      </td>

                      {viewMode === 'advanced' && (() => {
                        const dispOrtg = excludeGarbageTime && t.nonGarbage ? t.nonGarbage.ortg : t.ortg;
                        const dispDrtg = excludeGarbageTime && t.nonGarbage ? t.nonGarbage.drtg : t.drtg;
                        const dispNet = excludeGarbageTime && t.nonGarbage ? t.nonGarbage.netRtg : t.netRtg;
                        const dispOrb = excludeGarbageTime && t.nonGarbage ? t.nonGarbage.orbPct : t.fourFactorsOffense.orbPct;
                        const rawDrb = Number((100 - t.fourFactorsDefense.orbPct).toFixed(1));
                        const dispDrb = excludeGarbageTime && t.nonGarbage ? t.nonGarbage.drbPct : (t.nonGarbage?.drbPct ?? rawDrb);
                        const dispEfg = excludeGarbageTime && t.nonGarbage ? t.nonGarbage.efgPct : t.fourFactorsOffense.efgPct;
                        const netDelta = Number((dispNet - t.netRtg).toFixed(1));

                        return (
                          <>
                            <td className="py-2.5 px-2 text-right tabular-nums text-slate-300">{t.pace}</td>
                            <td className="py-2.5 px-2 text-right tabular-nums font-bold text-sky-400">{dispOrtg}</td>
                            <td className="py-2.5 px-2 text-right tabular-nums text-slate-300">{dispDrtg}</td>
                            <td
                              className={`py-2.5 px-2 text-right tabular-nums font-bold ${
                                dispNet >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              <span>{dispNet >= 0 ? `+${dispNet}` : dispNet}</span>
                              {excludeGarbageTime && netDelta !== 0 && (
                                <span className="ml-1 text-[10px] font-normal text-slate-400">
                                  ({netDelta > 0 ? `+${netDelta}` : netDelta})
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-right tabular-nums text-cyan-300">{dispOrb}%</td>
                            <td className="py-2.5 px-2 text-right tabular-nums text-emerald-300">{dispDrb}%</td>
                            <td className="py-2.5 px-2 text-right tabular-nums text-slate-300">{dispEfg}%</td>
                            <td className="py-2.5 px-2 text-right tabular-nums text-indigo-300">
                              {t.shotSelection.moreyballRate}%
                            </td>
                          </>
                        );
                      })()}

                      {viewMode === 'situational' && (() => {
                        const ng = t.nonGarbage;
                        const qs = t.quarterSplits;
                        const sit = t.situational;
                        const ngNet = ng?.netRtg ?? t.netRtg;
                        const q3Adj = qs?.q3AdjustmentIndex ?? 0;
                        const netTop = sit?.netRtgVsTop500 ?? t.netRtg;
                        const drbFallback = Number((100 - t.fourFactorsDefense.orbPct).toFixed(1));

                        return (
                          <>
                            <td className="py-2.5 px-2 text-right tabular-nums font-bold text-sky-400">
                              {ng?.ortg ?? t.ortg}
                            </td>
                            <td className="py-2.5 px-2 text-right tabular-nums text-slate-300">
                              {ng?.drtg ?? t.drtg}
                            </td>
                            <td className={`py-2.5 px-2 text-right tabular-nums font-bold ${ngNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {ngNet >= 0 ? `+${ngNet}` : ngNet}
                            </td>
                            <td className="py-2.5 px-2 text-right tabular-nums text-cyan-300">
                              {ng?.orbPct ?? t.fourFactorsOffense.orbPct}%
                            </td>
                            <td className="py-2.5 px-2 text-right tabular-nums text-emerald-300">
                              {ng?.drbPct ?? drbFallback}%
                            </td>
                            <td className="py-2.5 px-2 text-right tabular-nums text-slate-400">
                              {ng?.garbageTimePossPct ?? 0}%
                            </td>
                            <td className={`py-2.5 px-2 text-right tabular-nums font-bold ${q3Adj >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {q3Adj >= 0 ? `+${q3Adj}` : q3Adj}
                            </td>
                            <td className="py-2.5 px-2 text-right tabular-nums text-amber-300">
                              {sit && sit.pbpGamesCount > 0 ? sit.killShotsPerGame.toFixed(2) : '—'}
                            </td>
                            <td className="py-2.5 px-2 text-right tabular-nums text-slate-300">
                              {sit ? `±${sit.volatilitySigma}` : '—'}
                            </td>
                            <td className={`py-2.5 px-2 text-right tabular-nums font-bold ${netTop >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {netTop >= 0 ? `+${netTop}` : netTop}
                              {sit && (sit.winsVsTop500 + sit.lossesVsTop500) > 0 && (
                                <span className="ml-1 text-[10px] font-normal text-slate-400">
                                  ({sit.winsVsTop500}-{sit.lossesVsTop500})
                                </span>
                              )}
                            </td>
                          </>
                        );
                      })()}

                      {viewMode === 'playtypes' && (
                        <>
                          <td className="py-2.5 px-2 text-right font-bold text-amber-300">
                            {metrics.playTypes.pnrBallHandler.ppp}
                          </td>
                          <td className="py-2.5 px-2 text-right font-bold text-cyan-300">
                            {metrics.playTypes.pnrRollMan.ppp}
                          </td>
                          <td className="py-2.5 px-2 text-right font-bold text-emerald-300">
                            {metrics.playTypes.spotUp.ppp}
                          </td>
                          <td className="py-2.5 px-2 text-right font-bold text-rose-300">
                            {metrics.playTypes.transition.ppp}
                          </td>
                          <td className="py-2.5 px-2 text-right font-bold text-purple-300">
                            {metrics.playTypes.isolation.ppp}
                          </td>
                          <td className="py-2.5 px-2 text-right text-slate-300">
                            {metrics.playTypes.postUp.ppp}
                          </td>
                        </>
                      )}

                      {viewMode === 'origin_clutch' && (
                        <>
                          <td className="py-2.5 px-2 text-right font-bold text-blue-300">
                            {metrics.scoreOrigin.pointsInPaint}
                          </td>
                          <td className="py-2.5 px-2 text-right text-amber-300">
                            {metrics.scoreOrigin.pointsOffTurnovers}
                          </td>
                          <td className="py-2.5 px-2 text-right text-emerald-300">
                            {metrics.scoreOrigin.fastbreakPoints}
                          </td>
                          <td className="py-2.5 px-2 text-right text-indigo-300">
                            {metrics.scoreOrigin.secondChancePoints}
                          </td>
                          <td
                            className={`py-2.5 px-2 text-right font-bold ${
                              metrics.clutchStats.clutchNetRtg >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {metrics.clutchStats.clutchNetRtg >= 0
                              ? `+${metrics.clutchStats.clutchNetRtg}`
                              : metrics.clutchStats.clutchNetRtg}
                          </td>
                          <td className="py-2.5 px-2 text-right text-slate-300">
                            {metrics.clutchStats.clutchEfgPct}%
                          </td>
                        </>
                      )}

                      {viewMode === 'shot_quality' && (
                        <>
                          <td className="py-2.5 px-2 text-right font-bold text-white">
                            {t.fourFactorsOffense.efgPct}%
                          </td>
                          <td className="py-2.5 px-2 text-right text-slate-400">
                            {metrics.shotQuality.xefgPct}%
                          </td>
                          <td
                            className={`py-2.5 px-2 text-right font-black ${
                              metrics.shotQuality.shotMakingDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {metrics.shotQuality.shotMakingDiff >= 0
                              ? `+${metrics.shotQuality.shotMakingDiff}%`
                              : `${metrics.shotQuality.shotMakingDiff}%`}
                          </td>
                          <td className="py-2.5 px-2 text-right font-bold text-cyan-300">
                            {metrics.shotQuality.shotQualityRating}
                          </td>
                          <td className="py-2.5 px-2 text-right text-indigo-300">
                            {metrics.shotQuality.rimFrequencyPct}%
                          </td>
                          <td className="py-2.5 px-2 text-right text-slate-400">
                            {t.shotSelection.moreyballRate}%
                          </td>
                        </>
                      )}

                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onCompareWithH2H('teams', t.id)}
                            title="Invia al generatore Card Testa a Testa"
                            className="p-1 rounded bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-colors cursor-pointer"
                          >
                            <Swords className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSelectTeam(t)}
                            title="Apri scheda squadra"
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
