import React, { useState, useMemo } from 'react';
import { PlayerStats, TeamStats, League } from '../types/basketball';
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
} from 'lucide-react';

interface Props {
  players: PlayerStats[];
  teams: TeamStats[];
  onSelectPlayer: (player: PlayerStats) => void;
  onSelectTeam: (team: TeamStats) => void;
  onCompareWithH2H: (type: 'players' | 'teams', id: string) => void;
}

export const AdvancedDataTable: React.FC<Props> = ({
  players,
  teams,
  onSelectPlayer,
  onSelectTeam,
  onCompareWithH2H,
}) => {
  const [tableType, setTableType] = useState<'players' | 'teams'>('players');
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

  // Filtro Squadre
  const filteredTeams = useMemo(() => {
    return teams
      .filter((t) => {
        if (leagueFilter !== 'ALL' && t.league !== leagueFilter) return false;
        if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a: any, b: any) => {
        const valA = a[sortField] ?? a.fourFactorsOffense?.[sortField] ?? a.shotSelection?.[sortField] ?? 0;
        const valB = b[sortField] ?? b.fourFactorsOffense?.[sortField] ?? b.shotSelection?.[sortField] ?? 0;
        return sortAsc ? valA - valB : valB - valA;
      });
  }, [teams, leagueFilter, search, sortField, sortAsc]);

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
      .sort((a: any, b: any) => {
        let valA = a[sortField] ?? a.shotSelection?.[sortField] ?? 0;
        let valB = b[sortField] ?? b.shotSelection?.[sortField] ?? 0;
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
      headers = ['Nome', 'Squadra', 'Lega', 'Ruolo', 'GP', 'MPG', 'PTS', 'TS%', 'USG%', 'AST%', 'AST/TO', 'ORtg', 'DRtg', 'NetRtg', 'Moreyball%'];
      csvData = (rows as PlayerStats[]).map((p) => [
        `"${p.name}"`,
        `"${p.team}"`,
        p.league,
        p.position,
        String(p.gamesPlayed),
        String(p.mpg),
        String(p.pts),
        String(p.tsPct),
        String(p.usgPct),
        String(p.astPct),
        String(p.astToRatio),
        String(p.ortg),
        String(p.drtg),
        String(p.netRtg),
        String(p.shotSelection.moreyballRate),
      ]);
    } else {
      headers = ['Squadra', 'Lega', 'GP', 'V-S', 'Pace', 'ORtg', 'DRtg', 'NetRtg', 'PPG', 'OppPPG', 'eFG%', 'TOV%', 'ORB%', 'Moreyball%'];
      csvData = (rows as TeamStats[]).map((t) => [
        `"${t.name}"`,
        t.league,
        String(t.gp),
        `"${t.record?.wins ?? t.wins ?? 0}-${t.record?.losses ?? t.losses ?? 0}"`,
        String(t.pace),
        String(t.ortg),
        String(t.drtg),
        String(t.netRtg),
        String(t.ppg),
        String(t.oppPpg),
        String(t.fourFactorsOffense.efgPct),
        String(t.fourFactorsOffense.tovPct),
        String(t.fourFactorsOffense.orbPct),
        String(t.shotSelection.moreyballRate),
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...csvData.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hoopology_${isP ? 'giocatori' : 'squadre'}_2026_27.csv`);
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
        <div className="flex flex-wrap items-center justify-between gap-3">
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
              Classifica Giocatori ({filteredPlayers.length})
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
              Classifica Squadre ({filteredTeams.length})
            </button>
          </div>

          {/* Filtro Leghe */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            {(['ALL', 'EuroLeague', 'EuroCup', 'LBA'] as const).map((l) => (
              <button
                key={l}
                onClick={() => {
                  setLeagueFilter(l);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
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
                {l === 'ALL' ? 'Tutte le Leghe' : l}
              </button>
            ))}
          </div>

          {/* Esporta CSV */}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Esporta CSV</span>
          </button>
        </div>

        {/* Seconda riga: Search e Filtri avanzati */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800/80 text-xs">
          {/* Cerca Nome */}
          <div className="relative flex-1 min-w-[200px]">
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
        </div>
      </div>

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
                  <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('shotSelection.moreyballRate')}>
                    Morey% {getSortIcon('shotSelection.moreyballRate')}
                  </th>
                  <th className="py-3 px-3 text-center">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {paginatedPlayers.map((p, idx) => {
                  const globalIdx = (page - 1) * pageSize + idx + 1;
                  const isTsElite = p.tsPct >= 62;
                  const isUsgHigh = p.usgPct >= 26;
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 text-slate-500 text-[11px] font-sans">{globalIdx}</td>
                      <td className="py-2.5 px-3 font-sans font-bold text-white hover:text-indigo-400 cursor-pointer" onClick={() => onSelectPlayer(p)}>
                        <div className="flex items-center gap-2">
                          <span>{p.name}</span>
                          {isTsElite && isUsgHigh && (
                            <span className="text-[10px] text-amber-400 font-normal">⭐</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 font-sans text-slate-400 truncate max-w-[140px]">{p.team}</td>
                      <td className="py-2.5 px-2 font-sans">
                        <span className="text-[11px] text-slate-400">{p.position}</span>
                      </td>
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
                  <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('pace')}>
                    Pace {getSortIcon('pace')}
                  </th>
                  <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('ortg')}>
                    Off. Rtg {getSortIcon('ortg')}
                  </th>
                  <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('drtg')}>
                    Def. Rtg {getSortIcon('drtg')}
                  </th>
                  <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('netRtg')}>
                    Net Rtg {getSortIcon('netRtg')}
                  </th>
                  <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('ppg')}>
                    PPG {getSortIcon('ppg')}
                  </th>
                  <th className="py-3 px-2 text-right cursor-pointer hover:text-white" onClick={() => handleSort('oppPpg')}>
                    Opp. PPG {getSortIcon('oppPpg')}
                  </th>
                  <th className="py-3 px-2 text-right">eFG% Off</th>
                  <th className="py-3 px-2 text-right">TOV%</th>
                  <th className="py-3 px-2 text-right">ORB%</th>
                  <th className="py-3 px-2 text-right">Morey%</th>
                  <th className="py-3 px-3 text-center">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredTeams.map((t, idx) => {
                  const wins = t.record?.wins ?? t.wins ?? 0;
                  const losses = t.record?.losses ?? t.losses ?? 0;
                  return (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 text-slate-500 text-[11px] font-sans">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-sans font-bold text-white hover:text-indigo-400 cursor-pointer" onClick={() => onSelectTeam(t)}>
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
                      <td className="py-2.5 px-2 text-right text-slate-300">{t.pace}</td>
                      <td className="py-2.5 px-2 text-right font-bold text-sky-400">{t.ortg}</td>
                      <td className="py-2.5 px-2 text-right text-slate-300">{t.drtg}</td>
                      <td className={`py-2.5 px-2 text-right font-bold ${t.netRtg >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.netRtg >= 0 ? `+${t.netRtg}` : t.netRtg}
                      </td>
                      <td className="py-2.5 px-2 text-right text-white">{t.ppg}</td>
                      <td className="py-2.5 px-2 text-right text-slate-400">{t.oppPpg}</td>
                      <td className="py-2.5 px-2 text-right text-slate-300">{t.fourFactorsOffense.efgPct}%</td>
                      <td className="py-2.5 px-2 text-right text-slate-400">{t.fourFactorsOffense.tovPct}%</td>
                      <td className="py-2.5 px-2 text-right text-slate-400">{t.fourFactorsOffense.orbPct}%</td>
                      <td className="py-2.5 px-2 text-right text-indigo-300">{t.shotSelection.moreyballRate}%</td>
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
