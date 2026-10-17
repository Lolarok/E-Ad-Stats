import React from 'react';
import { PlayerStats } from '../types/basketball';
import { HalfCourtShotChart } from './HalfCourtShotChart';
import { X, Award, Flame, Shield, TrendingUp, Crosshair } from 'lucide-react';

interface Props {
  player: PlayerStats | null;
  onClose: () => void;
  onCompareWith?: (player: PlayerStats) => void;
}

export const PlayerDetailModal: React.FC<Props> = ({ player, onClose, onCompareWith }) => {
  if (!player) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header Modal */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-lg font-black text-indigo-300">
              #{player.number}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black text-white">{player.name}</h2>
                <span className="text-xs px-2 py-0.5 rounded font-bold bg-slate-800 text-slate-300">
                  {player.position}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded font-bold ${
                    player.league === 'EuroLeague'
                      ? 'bg-amber-500/20 text-amber-300'
                      : player.league === 'EuroCup'
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {player.league}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {player.team} • {player.heightCm} cm •{' '}
                {player.gamesPlayed === 0 ? (
                  <span className="text-amber-400 font-semibold">DNP (0 minuti disputati a referto)</span>
                ) : (
                  `${player.gamesPlayed} GP • ${player.mpg} MPG • ${player.pts} PPG`
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onCompareWith && (
              <button
                onClick={() => onCompareWith(player)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
              >
                <span>⚔️</span> Confronta
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Modal Scrollabile */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Badge & Punti di Forza */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>True Shooting (TS%)</span>
                <Flame className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400">{player.tsPct}%</div>
              <div className="text-[10px] text-slate-500">
                {player.tsPct > 60 ? '🔥 Élite europea (>60%)' : 'Nella media'}
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Usage Rate (USG%)</span>
                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-indigo-400">{player.usgPct}%</div>
              <div className="text-[10px] text-slate-500">Possessi conclusi in campo</div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Game Score</span>
                <Award className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">{player.gameScore}</div>
              <div className="text-[10px] text-slate-500">vs PIR: {player.pir}</div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Net Rating Indiv.</span>
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div
                className={`text-2xl font-black ${
                  player.netRtg >= 0 ? 'text-cyan-400' : 'text-rose-400'
                }`}
              >
                {player.netRtg >= 0 ? `+${player.netRtg}` : player.netRtg}
              </div>
              <div className="text-[10px] text-slate-500">ORtg {player.ortg} / DRtg {player.drtg}</div>
            </div>
          </div>

          {/* CUORE ANALITICO: Shot Selection & Heatmap Campo */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-rose-400" /> Selezione di Tiro & Geometria del Campo
              </h3>
              <span className="text-xs text-slate-400">
                Moreyball: <strong className="text-indigo-400">{player.shotSelection.moreyballRate}%</strong> | 3PAr:{' '}
                <strong className="text-amber-400">{player.shotSelection.threePointAttemptRate}%</strong>
              </span>
            </div>

            <HalfCourtShotChart
              shotSelection={player.shotSelection}
              title={`Shot Selection & Efficienza per Zona — ${player.name}`}
            />
          </div>

          {/* Tabella Comparativa: Tradizionale vs Avanzato */}
          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
            <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">
              Quadro Statistico Completo
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-center text-xs">
              <div className="bg-slate-900 p-2 rounded">
                <div className="text-[10px] text-slate-400">PTS / Game</div>
                <div className="font-bold text-white text-sm">{player.pts}</div>
                <div className="text-[9px] text-amber-400 font-semibold">100 Poss: {player.ptsPer100}</div>
              </div>
              <div className="bg-slate-900 p-2 rounded">
                <div className="text-[10px] text-slate-400">eFG%</div>
                <div className="font-bold text-emerald-400 text-sm">{player.efgPct}%</div>
                <div className="text-[9px] text-slate-500">Tiro effettivo</div>
              </div>
              <div className="bg-slate-900 p-2 rounded">
                <div className="text-[10px] text-slate-400">AST%</div>
                <div className="font-bold text-indigo-400 text-sm">{player.astPct}%</div>
                <div className="text-[9px] text-slate-500">AST/TO: {player.astToRatio}</div>
              </div>
              <div className="bg-slate-900 p-2 rounded">
                <div className="text-[10px] text-slate-400">TRB%</div>
                <div className="font-bold text-cyan-400 text-sm">{player.trbPct}%</div>
                <div className="text-[9px] text-slate-500">ORB%: {player.orbPct}%</div>
              </div>
              <div className="bg-slate-900 p-2 rounded">
                <div className="text-[10px] text-slate-400">TOV%</div>
                <div className="font-bold text-amber-400 text-sm">{player.tovPct}%</div>
                <div className="text-[9px] text-slate-500">Perse su 100 poss</div>
              </div>
              <div className="bg-slate-900 p-2 rounded">
                <div className="text-[10px] text-slate-400">BPM (Impact)</div>
                <div className="font-bold text-purple-400 text-sm">{player.bpm}</div>
                <div className="text-[9px] text-slate-500">Box Plus-Minus</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Chiudi Scheda
          </button>
        </div>
      </div>
    </div>
  );
};
