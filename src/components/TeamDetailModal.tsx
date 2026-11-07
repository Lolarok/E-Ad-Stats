import React from 'react';
import { TeamStats, PlayerStats } from '../types/basketball';
import { HalfCourtShotChart } from './HalfCourtShotChart';
import { getOrComputeTeamMetrics } from '../utils/advancedAnalyticsCalculator';
import { X, ShieldAlert, Crosshair, Zap, Activity, Flame, Target } from 'lucide-react';

interface Props {
  team: TeamStats | null;
  players: PlayerStats[];
  onClose: () => void;
  onSelectPlayer: (player: PlayerStats) => void;
}

export const TeamDetailModal: React.FC<Props> = ({ team, players, onClose, onSelectPlayer }) => {
  if (!team) return null;

  const metrics = getOrComputeTeamMetrics(team);

  const teamPlayers = players.filter(
    (p) => (p.teamId === team.id || p.team === team.name) && p.league === team.league
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header Modal */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black text-white shadow-md"
              style={{ backgroundColor: team.logoColor }}
            >
              {team.shortName}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black text-white">{team.name}</h2>
                <span
                  className={`text-xs px-2 py-0.5 rounded font-bold ${
                    team.league === 'EuroLeague'
                      ? 'bg-amber-500/20 text-amber-300'
                      : team.league === 'EuroCup'
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {team.league}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Record: {team.record.wins}W - {team.record.losses}L • {team.gp} GP • Pace: {team.pace} Possessi/Gara • ORtg: {team.ortg} (Pts/100p)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Modal Scrollabile */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Card Ratings e Ritmo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Offensive Rating (ORtg)</span>
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-indigo-400">{team.ortg}</div>
              <div className="text-[10px] text-slate-400 font-semibold">Punti segnati su 100 possessi</div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Defensive Rating (DRtg)</span>
                <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-cyan-400">{team.drtg}</div>
              <div className="text-[10px] text-slate-400 font-semibold">Punti subiti su 100 possessi</div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Net Rating</span>
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div
                className={`text-2xl font-black ${
                  team.netRtg >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {team.netRtg >= 0 ? `+${team.netRtg}` : team.netRtg}
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">Differenziale su 100 possessi</div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-slate-400 text-xs mb-1">Ritmo di Gioco (Pace)</div>
              <div className="text-2xl font-black text-amber-400">{team.pace}</div>
              <div className="text-[10px] text-slate-400 font-semibold">Possessi medi per gara</div>
            </div>
          </div>

          {/* I FOUR FACTORS DI DEAN OLIVER */}
          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <span>🎯</span> I Four Factors di Dean Oliver (Offensivi vs Difensivi Concessi)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              I 4 pilastri statistici che spiegano oltre il 90% delle vittorie e sconfitte nel basket.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Offensivi */}
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <div className="text-xs uppercase font-bold text-indigo-400 mb-2">Four Factors Offensivi</div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">1. Tiro Effettivo (eFG%):</span>
                    <span className="font-bold text-emerald-400">{team.fourFactorsOffense.efgPct}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">2. Palle Perse (TOV%):</span>
                    <span className="font-bold text-amber-400">{team.fourFactorsOffense.tovPct}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">3. Rimbalzo d'Attacco (ORB%):</span>
                    <span className="font-bold text-cyan-400">{team.fourFactorsOffense.orbPct}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">4. Falli Subiti / Lunetta (FTR):</span>
                    <span className="font-bold text-purple-400">{team.fourFactorsOffense.ftr}</span>
                  </div>
                </div>
              </div>

              {/* Difensivi */}
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <div className="text-xs uppercase font-bold text-cyan-400 mb-2">Four Factors Difensivi Concessi</div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">1. Opponent eFG% (Concesso):</span>
                    <span className="font-bold text-emerald-400">{team.fourFactorsDefense.efgPct}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">2. Opponent TOV% (Provocate):</span>
                    <span className="font-bold text-amber-400">{team.fourFactorsDefense.tovPct}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">3. Opponent ORB% (Rimbalzi Concessi):</span>
                    <span className="font-bold text-cyan-400">{team.fourFactorsDefense.orbPct}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">4. Opponent FTR (Falli Spesi):</span>
                    <span className="font-bold text-purple-400">{team.fourFactorsDefense.ftr}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* NOVITÀ ANALITICA: Play Types Synergy, Genesi Punti & Shot Making */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Profilo Tattico Avanzato: Synergy, Genesi Punti & Clutch
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {/* Play Types */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-amber-300 text-[11px] flex items-center justify-between">
                  <span>Play Types (Stima Analitica)</span>
                  <span className="text-[10px] text-slate-500 font-mono">PPP Squadra</span>
                </div>
                <div className="space-y-1 text-slate-300">
                  <div className="flex justify-between py-0.5 border-b border-slate-850">
                    <span className="text-slate-400">PnR Ball Handler:</span>
                    <span className="font-mono font-bold text-amber-300">{metrics.playTypes.pnrBallHandler.ppp} PPP</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-850">
                    <span className="text-slate-400">PnR Roll Man:</span>
                    <span className="font-mono font-bold text-cyan-300">{metrics.playTypes.pnrRollMan.ppp} PPP</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-850">
                    <span className="text-slate-400">Spot-Up / Scarichi:</span>
                    <span className="font-mono font-bold text-emerald-300">{metrics.playTypes.spotUp.ppp} PPP</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-850">
                    <span className="text-slate-400">Transizione Primaria:</span>
                    <span className="font-mono font-bold text-rose-300">{metrics.playTypes.transition.ppp} PPP</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-400">Isolamenti:</span>
                    <span className="font-mono font-bold text-purple-300">{metrics.playTypes.isolation.ppp} PPP</span>
                  </div>
                </div>
              </div>

              {/* Genesi Punti */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-sky-300 text-[11px] flex items-center justify-between">
                  <span>Genesi dei Punti (PITP)</span>
                  <span className="text-[10px] text-slate-500 font-mono">Media / Gara</span>
                </div>
                <div className="space-y-1 text-slate-300">
                  <div className="flex justify-between py-0.5 border-b border-slate-850">
                    <span className="text-slate-400">Nel Pitturato (PITP):</span>
                    <span className="font-mono font-bold text-sky-400">
                      {metrics.scoreOrigin.pointsInPaint} <span className="text-slate-500 font-normal">({metrics.scoreOrigin.pitpRatio}%)</span>
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-850">
                    <span className="text-slate-400">Da Palle Perse (POT):</span>
                    <span className="font-mono font-bold text-amber-400">{metrics.scoreOrigin.pointsOffTurnovers} pts</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-850">
                    <span className="text-slate-400">In Contropiede:</span>
                    <span className="font-mono font-bold text-emerald-400">{metrics.scoreOrigin.fastbreakPoints} pts</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-400">2a Opportunità (ORB):</span>
                    <span className="font-mono font-bold text-indigo-400">{metrics.scoreOrigin.secondChancePoints} pts</span>
                  </div>
                </div>
              </div>

              {/* Shot Quality & Clutch */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-rose-300 text-[11px] flex items-center justify-between">
                  <span>Shot Making & Clutch</span>
                  <span className="text-[10px] text-slate-500 font-mono">Modello Expected</span>
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
                    <span className="text-slate-400">Clutch Net Rating:</span>
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
                    <span className="text-slate-400">Clutch Record Stima:</span>
                    <span className="font-mono font-bold text-white">
                      {metrics.clutchStats.clutchRecord?.wins ?? 0}V - {metrics.clutchStats.clutchRecord?.losses ?? 0}S
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Selezione di Tiro di Squadra */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-amber-400" /> Shot Selection & Geometria Offensiva di Squadra
            </h3>
            <HalfCourtShotChart
              shotSelection={team.shotSelection}
              title={`Shot Selection di Squadra — ${team.name}`}
              isTeam={true}
            />
          </div>

          {/* Roster & Giocatori Chiave */}
          {teamPlayers.length > 0 && (
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
              <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">
                Giocatori Chiave nel Database
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {teamPlayers.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onClose();
                      onSelectPlayer(p);
                    }}
                    className="p-3 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/50 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-sm text-white">{p.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {p.position} • {p.pts} PPG • {p.mpg} MPG
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-amber-400">{p.tsPct}% TS</div>
                      <div className="text-[10px] text-slate-500">{p.usgPct}% USG</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filosofia di Gioco */}
          <div className="p-3 bg-indigo-950/30 border border-indigo-900/40 rounded-xl text-xs text-indigo-200">
            💡 <strong>Stile Tattico:</strong> {team.playStyle}
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
