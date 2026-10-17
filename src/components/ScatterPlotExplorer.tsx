import React, { useState } from 'react';
import { PlayerStats, TeamStats } from '../types/basketball';

interface Props {
  players: PlayerStats[];
  teams: TeamStats[];
  onSelectPlayer: (player: PlayerStats) => void;
  onSelectTeam: (team: TeamStats) => void;
}

type PlotMode = 'player_usg_ts' | 'player_morey_ts' | 'player_ast_tov' | 'team_pace_net';

export const ScatterPlotExplorer: React.FC<Props> = ({
  players,
  teams,
  onSelectPlayer,
  onSelectTeam,
}) => {
  const [mode, setMode] = useState<PlotMode>('player_usg_ts');
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  const width = 640;
  const height = 400;
  const padding = 55;

  let xKey: string = '';
  let yKey: string = '';
  let xLabel: string = '';
  let yLabel: string = '';
  let xMin = 0;
  let xMax = 100;
  let yMin = 0;
  let yMax = 100;
  let xAvg = 50;
  let yAvg = 50;
  let dataPoints: any[] = [];
  let isTeam = false;

  if (mode === 'player_usg_ts') {
    xKey = 'usgPct';
    yKey = 'tsPct';
    xLabel = 'Usage Rate (USG%)';
    yLabel = 'True Shooting (TS%)';
    xMin = 14;
    xMax = 32;
    yMin = 50;
    yMax = 72;
    xAvg = 24.5;
    yAvg = 58.5;
    dataPoints = players;
  } else if (mode === 'player_morey_ts') {
    xKey = 'shotSelection.moreyballRate';
    yKey = 'tsPct';
    xLabel = 'Moreyball Rate % (Tiri al Ferro + 3PT)';
    yLabel = 'True Shooting (TS%)';
    xMin = 55;
    xMax = 95;
    yMin = 50;
    yMax = 72;
    xAvg = 76;
    yAvg = 58.5;
    dataPoints = players.map((p) => ({
      ...p,
      'shotSelection.moreyballRate': p.shotSelection.moreyballRate,
    }));
  } else if (mode === 'player_ast_tov') {
    xKey = 'astPct';
    yKey = 'astToRatio';
    xLabel = 'Assist Rate (AST%)';
    yLabel = 'Rapporto Assist/Perse (AST/TO)';
    xMin = 5;
    xMax = 42;
    yMin = 0.5;
    yMax = 3.2;
    xAvg = 20;
    yAvg = 1.6;
    dataPoints = players;
  } else if (mode === 'team_pace_net') {
    isTeam = true;
    xKey = 'pace';
    yKey = 'netRtg';
    xLabel = 'Ritmo di Gioco (Possessi / Partita)';
    yLabel = 'Net Rating (Differenziale su 100 Possessi)';
    xMin = 68;
    xMax = 84;
    yMin = -15;
    yMax = 18;
    xAvg = 75;
    yAvg = 0;
    dataPoints = teams;
  }

  const getX = (val: number) => {
    return padding + ((val - xMin) / (xMax - xMin)) * (width - 2 * padding);
  };

  const getY = (val: number) => {
    return height - padding - ((val - yMin) / (yMax - yMin)) * (height - 2 * padding);
  };

  const avgXPos = getX(xAvg);
  const avgYPos = getY(yAvg);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800">
        <div>
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <span>📈</span> Scatter Plot Explorer & Quadranti d'Efficienza
          </h3>
          <p className="text-xs text-slate-400">
            Identifica i giocatori e le squadre d'élite incrociando volume, selezione di tiro ed efficienza pura.
          </p>
        </div>

        {/* Selettore Modalità */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setMode('player_usg_ts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'player_usg_ts'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            USG% vs TS% (Scorer Matrix)
          </button>
          <button
            onClick={() => setMode('player_morey_ts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'player_morey_ts'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Moreyball% vs TS% (Selezione Tiro)
          </button>
          <button
            onClick={() => setMode('player_ast_tov')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'player_ast_tov'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            AST% vs AST/TO (Playmaker Matrix)
          </button>
          <button
            onClick={() => setMode('team_pace_net')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'team_pace_net'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Squadre: Pace vs NetRtg (100p)
          </button>
        </div>
      </div>

      {/* Spiegazione Quadranti */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 text-[11px]">
        <div className="bg-emerald-950/40 border border-emerald-800/40 p-2 rounded-lg text-emerald-300">
          <span className="font-bold block">Quadrante Nord-Est (Top Right)</span>
          {mode === 'player_usg_ts' && '⭐ Super-Star: Alto carico offensivo con altissima efficienza.'}
          {mode === 'player_morey_ts' && '🎯 Massima efficienza guidata da tiri al ferro e triple.'}
          {mode === 'player_ast_tov' && '🪄 Registi d’élite: altissimo volume di assist e zero palle perse.'}
          {mode === 'team_pace_net' && '🚀 Macchine da canestri: ritmo vertiginoso ed efficienza suprema.'}
        </div>
        <div className="bg-sky-950/40 border border-sky-800/40 p-2 rounded-lg text-sky-300">
          <span className="font-bold block">Quadrante Nord-Ovest (Top Left)</span>
          {mode === 'player_usg_ts' && '⚡ Role Player Ultra-Efficienti: specialisti su scarico o al ferro.'}
          {mode === 'player_morey_ts' && '🎯 Tiratori tradizionali ad alta conversione (mid-range pulito).'}
          {mode === 'player_ast_tov' && '🛡️ Gestori sicuri: pochi assist forzati, palla sempre in cassaforte.'}
          {mode === 'team_pace_net' && '🏰 Fortezze a metà campo: controllo totale del ritmo e difesa solida.'}
        </div>
        <div className="bg-amber-950/40 border border-amber-800/40 p-2 rounded-lg text-amber-300">
          <span className="font-bold block">Quadrante Sud-Est (Bottom Right)</span>
          {mode === 'player_usg_ts' && '⚠️ Volume Scorer Inefficienti: alta mole di tiri ma basse percentuali.'}
          {mode === 'player_morey_ts' && '⚠️ Alto Moreyball ma bassa conversione nei pressi del ferro.'}
          {mode === 'player_ast_tov' && '⚠️ Creatori ad alto rischio: producono assist ma troppe palle perse.'}
          {mode === 'team_pace_net' && '⚠️ Transizione caotica senza controllo del punteggio.'}
        </div>
        <div className="bg-slate-800/40 border border-slate-700/40 p-2 rounded-lg text-slate-400">
          <span className="font-bold block">Quadrante Sud-Ovest (Bottom Left)</span>
          {mode === 'player_usg_ts' && 'Basso utilizzo ed efficienza limitata.'}
          {mode === 'player_morey_ts' && 'Tiri intermedi a basso rendimento atteso.'}
          {mode === 'player_ast_tov' && 'Coinvolgimento limitato nella costruzione di gioco.'}
          {mode === 'team_pace_net' && 'Ritmo controllato ma difficoltà offensive.'}
        </div>
      </div>

      {/* Grafico SVG */}
      <div className="relative w-full overflow-x-auto bg-slate-950 rounded-xl p-3 border border-slate-800">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-[850px] mx-auto select-none"
        >
          {/* Griglia & Linee Medie */}
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

          {/* Assi principali */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#64748b" strokeWidth="2" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#64748b" strokeWidth="2" />

          {/* Etichette assi */}
          <text
            x={width / 2}
            y={height - 15}
            fill="#94a3b8"
            fontSize="12"
            fontWeight="bold"
            textAnchor="middle"
          >
            {xLabel} →
          </text>
          <text
            x={-height / 2}
            y={18}
            fill="#94a3b8"
            fontSize="12"
            fontWeight="bold"
            textAnchor="middle"
            transform="rotate(-90)"
          >
            {yLabel} →
          </text>

          {/* Punti del grafico */}
          {dataPoints.map((item) => {
            const rawX = item[xKey] ?? item.shotSelection?.moreyballRate ?? 0;
            const rawY = item[yKey] ?? 0;

            const cx = getX(rawX);
            const cy = getY(rawY);

            const isHovered = hoveredPoint?.id === item.id;

            let pointColor = '#6366f1';
            if (item.league === 'EuroLeague') pointColor = '#f59e0b';
            else if (item.league === 'EuroCup') pointColor = '#06b6d4';
            else if (item.league === 'LBA') pointColor = '#10b981';

            return (
              <g
                key={item.id}
                className="cursor-pointer transition-transform duration-150"
                onClick={() => (isTeam ? onSelectTeam(item) : onSelectPlayer(item))}
                onMouseEnter={() => setHoveredPoint(item)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 8 : isTeam ? 7 : 5.5}
                  fill={pointColor}
                  stroke="#ffffff"
                  strokeWidth={isHovered ? 2.5 : 1}
                  className="hover:scale-125 transition-all"
                />
                <text
                  x={cx}
                  y={cy - 9}
                  fill="#f1f5f9"
                  fontSize={isHovered ? '11' : '9'}
                  fontWeight={isHovered ? 'bold' : 'normal'}
                  textAnchor="middle"
                  className="pointer-events-none drop-shadow"
                >
                  {isTeam ? item.shortName : item.name.split(' ').pop()}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip Hover Dettagliato */}
        {hoveredPoint && (
          <div className="absolute top-6 right-6 bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md pointer-events-none z-20 text-xs min-w-[200px]">
            <div className="font-bold text-white text-sm mb-1">{hoveredPoint.name}</div>
            <div className="text-[11px] text-slate-400 mb-2">
              {hoveredPoint.team || hoveredPoint.name} • {hoveredPoint.league}
            </div>
            <div className="space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span>{xLabel.split('(')[0]}:</span>
                <span className="font-bold text-indigo-400">
                  {hoveredPoint[xKey] ?? hoveredPoint.shotSelection?.moreyballRate}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{yLabel.split('(')[0]}:</span>
                <span className="font-bold text-emerald-400">{hoveredPoint[yKey]}</span>
              </div>
              {!isTeam && (
                <div className="flex justify-between pt-1 border-t border-slate-800 text-[10px] text-slate-400">
                  <span>Punti partita:</span>
                  <span>{hoveredPoint.pts} PPG</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legenda Colori Leghe */}
      <div className="flex items-center justify-center gap-6 mt-3 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> EuroLeague
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span> EuroCup
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> LBA Serie A
        </div>
        <span className="text-[11px] text-slate-500 italic ml-4">
          Clicca su un punto per aprire la scheda di approfondimento!
        </span>
      </div>
    </div>
  );
};
