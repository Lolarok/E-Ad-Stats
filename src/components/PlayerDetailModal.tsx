import React from 'react';
import { PlayerStats } from '../types/basketball';
import { HalfCourtShotChart } from './HalfCourtShotChart';
import { getOrComputePlayerMetrics } from '../utils/advancedAnalyticsCalculator';
import { X, Award, Flame, Shield, TrendingUp, Crosshair, Zap, Target, Activity } from 'lucide-react';

interface Props {
  player: PlayerStats | null;
  onClose: () => void;
  onCompareWith?: (player: PlayerStats) => void;
}

export const PlayerDetailModal: React.FC<Props> = ({ player, onClose, onCompareWith }) => {
  if (!player) return null;

  const metrics = getOrComputePlayerMetrics(player);

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

          {/* REAL ON/OFF COURT IMPACT (WOWY) & CONSISTENZA */}
          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Impatto Reale On/Off Court (WOWY) &amp; Costanza Rendimento</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                {player.realOnOff
                  ? `Play-by-Play Reale · ${player.realOnOff.pbpGamesCount} gare (${player.realOnOff.onCourtMinutes} min tracciati)`
                  : 'Dati Play-by-Play WOWY non disponibili per questa competizione'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono tabular-nums">
              <div className="bg-slate-900 border border-slate-800/80 p-2.5 rounded-lg">
                <div className="font-sans text-[11px] text-slate-400">On-Court NetRtg</div>
                <div className={`text-base font-black ${(player.realOnOff?.onCourtNetRtg ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {player.realOnOff
                    ? player.realOnOff.onCourtNetRtg >= 0
                      ? `+${player.realOnOff.onCourtNetRtg}`
                      : player.realOnOff.onCourtNetRtg
                    : '—'}
                </div>
                <div className="font-sans text-[10px] text-slate-500">
                  {player.realOnOff ? `ORtg ${player.realOnOff.onCourtOrtg} / DRtg ${player.realOnOff.onCourtDrtg}` : 'Solo EuroLeague/Cup PBP'}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800/80 p-2.5 rounded-lg">
                <div className="font-sans text-[11px] text-slate-400">Off-Court NetRtg</div>
                <div className="text-base font-black text-slate-200">
                  {player.realOnOff
                    ? player.realOnOff.offCourtNetRtg >= 0
                      ? `+${player.realOnOff.offCourtNetRtg}`
                      : player.realOnOff.offCourtNetRtg
                    : '—'}
                </div>
                <div className="font-sans text-[10px] text-slate-500">Squadra senza giocatore</div>
              </div>

              <div className="bg-slate-900 border border-slate-800/80 p-2.5 rounded-lg">
                <div className="font-sans text-[11px] text-slate-400">On/Off Net Swing</div>
                <div className={`text-base font-black ${(player.realOnOff?.netSwing ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {player.realOnOff
                    ? player.realOnOff.netSwing >= 0
                      ? `+${player.realOnOff.netSwing}`
                      : player.realOnOff.netSwing
                    : '—'}
                </div>
                <div className="font-sans text-[10px] text-slate-500">Differenziale ON - OFF</div>
              </div>

              <div className="bg-slate-900 border border-slate-800/80 p-2.5 rounded-lg">
                <div className="font-sans text-[11px] text-slate-400">Volatilità GameScore (σ)</div>
                <div className="text-base font-black text-amber-300">
                  {player.volatilitySigma !== undefined ? `±${player.volatilitySigma}` : '—'}
                </div>
                <div className="font-sans text-[10px] text-slate-500">Deviazione standard gare</div>
              </div>
            </div>
          </div>

          {/* NOVITÀ ANALITICA: Play Types Synergy, Genesi Punti & Shot Making */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Metriche Granulari Synergy &amp; Shot Quality
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {/* Play Types */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-amber-300 text-[11px] flex items-center justify-between">
                  <span>Play Types (Stima Analitica)</span>
                  <span className="text-[10px] text-slate-500 font-mono">PPP / Freq%</span>
                </div>
                <div className="space-y-1 text-slate-300">
                  <div className="flex justify-between py-0.5 border-b border-slate-850">
                    <span className="text-slate-400">PnR Handler:</span>
                    <span className="font-mono font-bold text-white">
                      {metrics.playTypes.pnrBallHandler.ppp} <span className="text-slate-500 font-normal">({metrics.playTypes.pnrBallHandler.freqPct}%)</span>
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-850">
                    <span className="text-slate-400">PnR Roll Man:</span>
                    <span className="font-mono font-bold text-white">
                      {metrics.playTypes.pnrRollMan.ppp} <span className="text-slate-500 font-normal">({metrics.playTypes.pnrRollMan.freqPct}%)</span>
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-850">
                    <span className="text-slate-400">Spot-Up:</span>
                    <span className="font-mono font-bold text-white">
                      {metrics.playTypes.spotUp.ppp} <span className="text-slate-500 font-normal">({metrics.playTypes.spotUp.freqPct}%)</span>
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-850">
                    <span className="text-slate-400">Transizione:</span>
                    <span className="font-mono font-bold text-white">
                      {metrics.playTypes.transition.ppp} <span className="text-slate-500 font-normal">({metrics.playTypes.transition.freqPct}%)</span>
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-400">Isolation:</span>
                    <span className="font-mono font-bold text-white">
                      {metrics.playTypes.isolation.ppp} <span className="text-slate-500 font-normal">({metrics.playTypes.isolation.freqPct}%)</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Genesi Punti */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-sky-300 text-[11px] flex items-center justify-between">
                  <span>Genesi dei Punti</span>
                  <span className="text-[10px] text-slate-500 font-mono">Media/Partita</span>
                </div>
                <div className="space-y-1 text-slate-300">
                  <div className="flex justify-between py-0.5 border-b border-slate-850">
                    <span className="text-slate-400">Nel Pitturato (PITP):</span>
                    <span className="font-mono font-bold text-sky-400">{metrics.scoreOrigin.pointsInPaint}</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-850">
                    <span className="text-slate-400">Da Palle Perse (POT):</span>
                    <span className="font-mono font-bold text-amber-400">{metrics.scoreOrigin.pointsOffTurnovers}</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-850">
                    <span className="text-slate-400">In Contropiede:</span>
                    <span className="font-mono font-bold text-emerald-400">{metrics.scoreOrigin.fastbreakPoints}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-400">Seconda Opportunità:</span>
                    <span className="font-mono font-bold text-indigo-400">{metrics.scoreOrigin.secondChancePoints}</span>
                  </div>
                </div>
              </div>

              {/* Shot Quality & Clutch */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-rose-300 text-[11px] flex items-center justify-between">
                  <span>Shot Making &amp; Clutch</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {metrics.clutchStats.source === 'pbp' ? `Clutch PBP (${metrics.clutchStats.clutchPossessions}p)` : 'Modello FIBA'}
                  </span>
                </div>
                <div className="space-y-1 text-slate-300">
                  <div className="flex justify-between py-0.5 border-b border-slate-850">
                    <span className="text-slate-400">xeFG% Atteso:</span>
                    <span className="font-mono font-bold text-slate-300">{metrics.shotQuality.xefgPct}%</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-850">
                    <span className="text-slate-400">Shot Making Over Exp:</span>
                    <span
                      className={`font-mono font-black ${
                        metrics.shotQuality.shotMakingDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {metrics.shotQuality.shotMakingDiff >= 0
                        ? `+${metrics.shotQuality.shotMakingDiff}%`
                        : `${metrics.shotQuality.shotMakingDiff}%`}
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-850">
                    <span className="text-slate-400">
                      Clutch NetRtg ({metrics.clutchStats.source === 'pbp' ? 'PBP' : 'Stima'}):
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        metrics.clutchStats.clutchNetRtg >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {metrics.clutchStats.clutchNetRtg >= 0
                        ? `+${metrics.clutchStats.clutchNetRtg}`
                        : metrics.clutchStats.clutchNetRtg}
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-400">Clutch Punti / Gara:</span>
                    <span className="font-mono font-bold text-white">{metrics.clutchStats.clutchPts}</span>
                  </div>
                </div>
              </div>
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
