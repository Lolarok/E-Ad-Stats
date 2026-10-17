import React, { useState, useMemo } from 'react';
import { PlayerStats, TeamStats } from '../types/basketball';
import { RadarComparisonChart } from './RadarComparisonChart';

interface Props {
  players: PlayerStats[];
  teams: TeamStats[];
}

export const HeadToHeadComparison: React.FC<Props> = ({ players, teams }) => {
  const [compareType, setCompareType] = useState<'players' | 'teams'>('players');

  // Selezione Giocatori
  const [player1Id, setPlayer1Id] = useState<string>(players[0]?.id || '');
  const [player2Id, setPlayer2Id] = useState<string>(players[1]?.id || '');

  // Selezione Squadre
  const [team1Id, setTeam1Id] = useState<string>(teams[0]?.id || '');
  const [team2Id, setTeam2Id] = useState<string>(teams[1]?.id || '');

  const uniqueTeams: TeamStats[] = useMemo(() => {
    const map = new Map<string, TeamStats>();
    teams.forEach((t: TeamStats) => {
      if (t && t.id && !map.has(t.id)) map.set(t.id, t);
    });
    return Array.from(map.values());
  }, [teams]);

  const p1 = players.find((p) => p.id === player1Id) || players[0];
  const p2 = players.find((p) => p.id === player2Id) || players[1];

  const t1 = uniqueTeams.find((t: TeamStats) => t.id === team1Id) || uniqueTeams[0] || teams[0];
  const t2 = uniqueTeams.find((t: TeamStats) => t.id === team2Id) || uniqueTeams[1] || teams[1];

  // Metriche Radar per Giocatori (normalizzate su scala congrua)
  const playerMetrics = [
    { label: 'TS% (Efficienza)', val1: p1.tsPct, val2: p2.tsPct, max: 70, unit: '%' },
    { label: 'USG% (Carico)', val1: p1.usgPct, val2: p2.usgPct, max: 35, unit: '%' },
    { label: 'AST% (Regia)', val1: p1.astPct, val2: p2.astPct, max: 45, unit: '%' },
    { label: 'TRB% (Rimbalzi)', val1: p1.trbPct, val2: p2.trbPct, max: 20, unit: '%' },
    { label: 'Moreyball (Tiro)', val1: p1.shotSelection.moreyballRate, val2: p2.shotSelection.moreyballRate, max: 95, unit: '%' },
    { label: 'Game Score', val1: p1.gameScore, val2: p2.gameScore, max: 20, unit: '' },
  ];

  // Metriche Radar per Squadre
  const teamMetrics = [
    { label: 'Offensive Rating', val1: t1.ortg, val2: t2.ortg, max: 130, unit: '' },
    { label: 'Defensive Rating', val1: 130 - t1.drtg, val2: 130 - t2.drtg, max: 40, unit: ' (Inv)' },
    { label: 'Pace (Ritmo)', val1: t1.pace, val2: t2.pace, max: 80, unit: '' },
    { label: 'eFG% (Tiro)', val1: t1.fourFactorsOffense.efgPct, val2: t2.fourFactorsOffense.efgPct, max: 62, unit: '%' },
    { label: 'Moreyball Rate', val1: t1.shotSelection.moreyballRate, val2: t2.shotSelection.moreyballRate, max: 95, unit: '%' },
    { label: 'FT Rate (FTR)', val1: Math.round(t1.shotSelection.ftr * 100), val2: Math.round(t2.shotSelection.ftr * 100), max: 40, unit: '%' },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>⚔️</span> Confronto Testa a Testa (Head-to-Head Analytics)
          </h2>
          <p className="text-xs text-slate-400">
            Compara due giocatori o due squadre con Radar Chart multi-dimensionale e differenziale statistico avanzato.
          </p>
        </div>

        {/* Switch Giocatori vs Squadre */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setCompareType('players')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              compareType === 'players' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Confronto Giocatori
          </button>
          <button
            onClick={() => setCompareType('teams')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              compareType === 'teams' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Confronto Squadre
          </button>
        </div>
      </div>

      {compareType === 'players' ? (
        <div className="space-y-6">
          {/* Selettori dei Giocatori */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-blue-500/30">
              <label className="text-xs font-bold text-blue-400 uppercase tracking-wider block mb-1.5">
                Giocatore 1
              </label>
              <select
                value={player1Id}
                onChange={(e) => setPlayer1Id(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.team} - {p.league})
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-amber-500/30">
              <label className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1.5">
                Giocatore 2
              </label>
              <select
                value={player2Id}
                onChange={(e) => setPlayer2Id(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.team} - {p.league})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Griglia Comparativa Radar & Selezione Tiro */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Radar Chart */}
            <div className="lg:col-span-6 bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex justify-center">
              <RadarComparisonChart
                entity1Name={p1.name}
                entity2Name={p2.name}
                metrics={playerMetrics}
                color1="#3b82f6"
                color2="#f59e0b"
              />
            </div>

            {/* Confronto Dettagliato Selezione di Tiro & Impatto */}
            <div className="lg:col-span-6 space-y-3">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                  Confronto Selezione di Tiro (Shot Profile)
                </h3>

                <div className="space-y-3 text-xs">
                  {/* Moreyball Rate */}
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span className="font-semibold text-blue-400">{p1.shotSelection.moreyballRate}%</span>
                      <span className="text-slate-300 font-medium">Moreyball % (Al Ferro + 3P)</span>
                      <span className="font-semibold text-amber-400">{p2.shotSelection.moreyballRate}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full flex overflow-hidden">
                      <div
                        className="bg-blue-500 h-full"
                        style={{ width: `${p1.shotSelection.moreyballRate / 2}%` }}
                      ></div>
                      <div className="flex-1"></div>
                      <div
                        className="bg-amber-500 h-full"
                        style={{ width: `${p2.shotSelection.moreyballRate / 2}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* 3P Attempt Rate */}
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span className="font-semibold text-blue-400">{p1.shotSelection.threePointAttemptRate}%</span>
                      <span className="text-slate-300 font-medium">3-Point Attempt Rate (3PAr)</span>
                      <span className="font-semibold text-amber-400">{p2.shotSelection.threePointAttemptRate}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full flex overflow-hidden">
                      <div
                        className="bg-blue-500 h-full"
                        style={{ width: `${p1.shotSelection.threePointAttemptRate / 1.5}%` }}
                      ></div>
                      <div className="flex-1"></div>
                      <div
                        className="bg-amber-500 h-full"
                        style={{ width: `${p2.shotSelection.threePointAttemptRate / 1.5}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Free Throw Rate */}
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span className="font-semibold text-blue-400">{p1.shotSelection.ftr}</span>
                      <span className="text-slate-300 font-medium">Free Throw Rate (FTA/FGA)</span>
                      <span className="font-semibold text-amber-400">{p2.shotSelection.ftr}</span>
                    </div>
                  </div>

                  {/* Realizzazione al Ferro */}
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span className="font-semibold text-blue-400">{p1.shotSelection.rim.fgPct}%</span>
                      <span className="text-slate-300 font-medium">% FG al Ferro (&lt; 1.5m)</span>
                      <span className="font-semibold text-amber-400">{p2.shotSelection.rim.fgPct}%</span>
                    </div>
                  </div>

                  {/* Realizzazione Triple Frontali */}
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span className="font-semibold text-blue-400">{p1.shotSelection.aboveBreak3.fgPct}%</span>
                      <span className="text-slate-300 font-medium">% Triple 6.75m</span>
                      <span className="font-semibold text-amber-400">{p2.shotSelection.aboveBreak3.fgPct}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Differenziale Globale */}
              <div className="grid grid-cols-2 gap-3 text-center text-xs">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Valutazione PIR vs Game Score</div>
                  <div className="font-bold text-blue-400 mt-1">
                    {p1.name.split(' ').pop()}: PIR {p1.pir} | GS {p1.gameScore}
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Valutazione PIR vs Game Score</div>
                  <div className="font-bold text-amber-400 mt-1">
                    {p2.name.split(' ').pop()}: PIR {p2.pir} | GS {p2.gameScore}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Selettori Squadre */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-blue-500/30">
              <label className="text-xs font-bold text-blue-400 uppercase tracking-wider block mb-1.5">
                Squadra 1
              </label>
              <select
                value={team1Id}
                onChange={(e) => setTeam1Id(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {uniqueTeams.map((t: TeamStats) => (
                  <option key={`${t.id}-${t.league}`} value={t.id}>
                    {t.name} ({t.league})
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-amber-500/30">
              <label className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1.5">
                Squadra 2
              </label>
              <select
                value={team2Id}
                onChange={(e) => setTeam2Id(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                {uniqueTeams.map((t: TeamStats) => (
                  <option key={`${t.id}-${t.league}`} value={t.id}>
                    {t.name} ({t.league})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Radar Squadre */}
            <div className="lg:col-span-6 bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex justify-center">
              <RadarComparisonChart
                entity1Name={t1.shortName}
                entity2Name={t2.shortName}
                metrics={teamMetrics}
                color1="#3b82f6"
                color2="#f59e0b"
              />
            </div>

            {/* Four Factors Testa a Testa */}
            <div className="lg:col-span-6 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                I Four Factors a Confronto
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="font-bold text-blue-400">{t1.fourFactorsOffense.efgPct}%</span>
                  <span className="text-slate-300">Tiro Effettivo (eFG%)</span>
                  <span className="font-bold text-amber-400">{t2.fourFactorsOffense.efgPct}%</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="font-bold text-blue-400">{t1.fourFactorsOffense.tovPct}%</span>
                  <span className="text-slate-300">Palle Perse (TOV% - minore è meglio)</span>
                  <span className="font-bold text-amber-400">{t2.fourFactorsOffense.tovPct}%</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="font-bold text-blue-400">{t1.fourFactorsOffense.orbPct}%</span>
                  <span className="text-slate-300">Rimbalzo d'Attacco (ORB%)</span>
                  <span className="font-bold text-amber-400">{t2.fourFactorsOffense.orbPct}%</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="font-bold text-blue-400">{t1.fourFactorsOffense.ftr}</span>
                  <span className="text-slate-300">Frequenza Liberi (FTR)</span>
                  <span className="font-bold text-amber-400">{t2.fourFactorsOffense.ftr}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="font-bold text-blue-400">{t1.ortg}</span>
                  <span className="text-slate-300 font-semibold">Offensive Rating (Pts/100p)</span>
                  <span className="font-bold text-amber-400">{t2.ortg}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="font-bold text-blue-400">{t1.drtg}</span>
                  <span className="text-slate-300 font-semibold">Defensive Rating (Subiti/100p)</span>
                  <span className="font-bold text-amber-400">{t2.drtg}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="font-bold text-blue-400">{t1.pace}</span>
                  <span className="text-slate-300">Ritmo (Pace: Possessi / Partita)</span>
                  <span className="font-bold text-amber-400">{t2.pace}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="font-bold text-blue-400">{t1.netRtg}</span>
                  <span className="text-slate-300 font-bold">Net Rating (Differenziale / 100 Poss.)</span>
                  <span className="font-bold text-amber-400">{t2.netRtg}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
