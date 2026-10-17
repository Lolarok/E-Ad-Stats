import React, { useState } from 'react';
import { PlayerShotSelection, TeamShotSelection } from '../types/basketball';

interface Props {
  shotSelection: PlayerShotSelection | TeamShotSelection;
  title?: string;
  isTeam?: boolean;
}

interface ZoneDisplayData {
  id: string;
  name: string;
  fgaPct: number;
  fgPct: number;
  pps: number;
  leagueAvg: number;
  diff: number;
  description: string;
}

export const HalfCourtShotChart: React.FC<Props> = ({ shotSelection, title, isTeam = false }) => {
  const [selectedZone, setSelectedZone] = useState<string | null>('rim');

  // Normalizza i dati tra PlayerShotSelection e TeamShotSelection
  const zones: Record<string, ZoneDisplayData> = isTeam
    ? {
        rim: {
          id: 'rim',
          name: 'Al Ferro (< 1.5m)',
          fgaPct: (shotSelection as TeamShotSelection).rimPct,
          fgPct: (shotSelection as TeamShotSelection).rimFgPct,
          pps: Number((((shotSelection as TeamShotSelection).rimFgPct / 100) * 2).toFixed(2)),
          leagueAvg: 62.0,
          diff: Number(((shotSelection as TeamShotSelection).rimFgPct - 62.0).toFixed(1)),
          description: 'Schiacciate, appoggi ravvicinati e tap-in. Zona a massima resa di tiro.',
        },
        midRange: {
          id: 'midRange',
          name: 'Mezzofondo / Mid-Range (2PT)',
          fgaPct: (shotSelection as TeamShotSelection).midRangePct,
          fgPct: (shotSelection as TeamShotSelection).midRangeFgPct,
          pps: Number((((shotSelection as TeamShotSelection).midRangeFgPct / 100) * 2).toFixed(2)),
          leagueAvg: 41.0,
          diff: Number(((shotSelection as TeamShotSelection).midRangeFgPct - 41.0).toFixed(1)),
          description: 'Tiri dal palleggio, arresto e tiro e isolamenti lunghi. Storicamente la zona meno efficiente.',
        },
        corner3: {
          id: 'corner3',
          name: 'Triple dagli Angoli (6.60m)',
          fgaPct: (shotSelection as TeamShotSelection).corner3Pct,
          fgPct: (shotSelection as TeamShotSelection).corner3FgPct,
          pps: Number((((shotSelection as TeamShotSelection).corner3FgPct / 100) * 3).toFixed(2)),
          leagueAvg: 39.5,
          diff: Number(((shotSelection as TeamShotSelection).corner3FgPct - 39.5).toFixed(1)),
          description: 'La tripla geometricamente più corta nel regolamento FIBA. Solitamente assistita da penetra-e-scarica.',
        },
        aboveBreak3: {
          id: 'aboveBreak3',
          name: 'Triple Frontali / 45° (6.75m)',
          fgaPct: (shotSelection as TeamShotSelection).aboveBreak3Pct,
          fgPct: (shotSelection as TeamShotSelection).aboveBreak3FgPct,
          pps: Number((((shotSelection as TeamShotSelection).aboveBreak3FgPct / 100) * 3).toFixed(2)),
          leagueAvg: 36.0,
          diff: Number(((shotSelection as TeamShotSelection).aboveBreak3FgPct - 36.0).toFixed(1)),
          description: 'Uscite dai blocchi, pick-and-pop e tiri dal palleggio dal perimetro frontale.',
        },
      }
    : {
        rim: {
          id: 'rim',
          name: 'Al Ferro (< 1.5m)',
          fgaPct: (shotSelection as PlayerShotSelection).rim.fgaPct,
          fgPct: (shotSelection as PlayerShotSelection).rim.fgPct,
          pps: (shotSelection as PlayerShotSelection).rim.pps,
          leagueAvg: (shotSelection as PlayerShotSelection).rim.leagueAvgFgPct,
          diff: Number(
            (
              (shotSelection as PlayerShotSelection).rim.fgPct -
              (shotSelection as PlayerShotSelection).rim.leagueAvgFgPct
            ).toFixed(1)
          ),
          description: 'Penetrazioni al ferro, tagli backdoor e transizione primaria.',
        },
        paintNonRim: {
          id: 'paintNonRim',
          name: 'Pitturato Fuori Ferro (Floater)',
          fgaPct: (shotSelection as PlayerShotSelection).paintNonRim.fgaPct,
          fgPct: (shotSelection as PlayerShotSelection).paintNonRim.fgPct,
          pps: (shotSelection as PlayerShotSelection).paintNonRim.pps,
          leagueAvg: (shotSelection as PlayerShotSelection).paintNonRim.leagueAvgFgPct,
          diff: Number(
            (
              (shotSelection as PlayerShotSelection).paintNonRim.fgPct -
              (shotSelection as PlayerShotSelection).paintNonRim.leagueAvgFgPct
            ).toFixed(1)
          ),
          description: 'Zona intermedia di floater, ganci e arresti in vernice prima del corpo a corpo.',
        },
        midRange: {
          id: 'midRange',
          name: 'Media Distanza / Long 2s',
          fgaPct: (shotSelection as PlayerShotSelection).midRange.fgaPct,
          fgPct: (shotSelection as PlayerShotSelection).midRange.fgPct,
          pps: (shotSelection as PlayerShotSelection).midRange.pps,
          leagueAvg: (shotSelection as PlayerShotSelection).midRange.leagueAvgFgPct,
          diff: Number(
            (
              (shotSelection as PlayerShotSelection).midRange.fgPct -
              (shotSelection as PlayerShotSelection).midRange.leagueAvgFgPct
            ).toFixed(1)
          ),
          description: 'Tiri da 2 punti tra i 4.5 metri e la linea da 3. Cruciali per scorer con pull-up d’élite.',
        },
        corner3: {
          id: 'corner3',
          name: 'Triple dall’Angolo (6.60m)',
          fgaPct: (shotSelection as PlayerShotSelection).corner3.fgaPct,
          fgPct: (shotSelection as PlayerShotSelection).corner3.fgPct,
          pps: (shotSelection as PlayerShotSelection).corner3.pps,
          leagueAvg: (shotSelection as PlayerShotSelection).corner3.leagueAvgFgPct,
          diff: Number(
            (
              (shotSelection as PlayerShotSelection).corner3.fgPct -
              (shotSelection as PlayerShotSelection).corner3.leagueAvgFgPct
            ).toFixed(1)
          ),
          description: 'Corner 3s: tiro assistito con valore atteso elevatissimo per gli specialisti.',
        },
        aboveBreak3: {
          id: 'aboveBreak3',
          name: 'Triple Frontali & Ali (6.75m)',
          fgaPct: (shotSelection as PlayerShotSelection).aboveBreak3.fgaPct,
          fgPct: (shotSelection as PlayerShotSelection).aboveBreak3.fgPct,
          pps: (shotSelection as PlayerShotSelection).aboveBreak3.pps,
          leagueAvg: (shotSelection as PlayerShotSelection).aboveBreak3.leagueAvgFgPct,
          diff: Number(
            (
              (shotSelection as PlayerShotSelection).aboveBreak3.fgPct -
              (shotSelection as PlayerShotSelection).aboveBreak3.leagueAvgFgPct
            ).toFixed(1)
          ),
          description: 'Triple frontali dal palleggio, pull-up oltre il blocco o catch-and-shoot.',
        },
      };

  const getZoneColor = (diff: number, isSelected: boolean) => {
    let base = 'fill-emerald-600/30 stroke-emerald-500';
    if (diff > 3.0) base = 'fill-emerald-500/40 stroke-emerald-400 hover:fill-emerald-500/60';
    else if (diff > 0.5) base = 'fill-emerald-600/30 stroke-emerald-500 hover:fill-emerald-600/50';
    else if (diff >= -2.0) base = 'fill-amber-500/30 stroke-amber-400 hover:fill-amber-500/50';
    else base = 'fill-rose-500/30 stroke-rose-400 hover:fill-rose-500/50';

    if (isSelected) {
      return base.replace('stroke-', 'stroke-[3] stroke-white ');
    }
    return base;
  };

  const activeZone = selectedZone && zones[selectedZone] ? zones[selectedZone] : zones['rim'];

  const moreyballRate = (shotSelection as any).moreyballRate ?? 80;
  const ftr = (shotSelection as any).ftr ?? 0.28;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div>
          <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
            <span>🎯</span> {title || 'Mappa & Selezione di Tiro (Shot Chart FIBA)'}
          </h3>
          <p className="text-xs text-slate-400">
            Frequenza di volume (% tiri), efficienza reale (% FG) e punti attesi per tiro (PPS) per zona
          </p>
        </div>

        {/* Metriche Chiave Moreyball e FTR */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-right">
            <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Moreyball Rate</div>
            <div className="text-sm font-bold text-indigo-400 flex items-center gap-1 justify-end">
              <span>{moreyballRate}%</span>
              <span className="text-[10px] text-slate-400 font-normal">(Ferro + 3P)</span>
            </div>
          </div>

          <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-right">
            <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">FT Rate (FTR)</div>
            <div className="text-sm font-bold text-amber-400">
              {typeof ftr === 'number' ? ftr.toFixed(3) : ftr}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Campo da Basket a Metà Campo SVG (Standard FIBA) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="relative w-full max-w-[420px] aspect-[15/14] bg-slate-950 rounded-xl p-3 border border-slate-800 shadow-inner">
            <svg
              viewBox="0 0 500 470"
              className="w-full h-full select-none cursor-pointer"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Bordo Campo FIBA */}
              <rect x="10" y="10" width="480" height="450" fill="#0b1120" stroke="#334155" strokeWidth="2.5" rx="8" />

              {/* Zona Above-the-break 3PT (Zona esterna oltre l'arco) */}
              <path
                d="M 10 10 L 490 10 L 490 140 L 440 140 A 225 225 0 0 0 60 140 L 10 140 Z"
                className={`transition-all duration-200 cursor-pointer ${getZoneColor(
                  zones.aboveBreak3.diff,
                  selectedZone === 'aboveBreak3'
                )}`}
                onClick={() => setSelectedZone('aboveBreak3')}
              />

              {/* Angolo 3PT Sinistro */}
              <rect
                x="10"
                y="10"
                width="50"
                height="130"
                className={`transition-all duration-200 cursor-pointer ${getZoneColor(
                  zones.corner3.diff,
                  selectedZone === 'corner3'
                )}`}
                onClick={() => setSelectedZone('corner3')}
              />

              {/* Angolo 3PT Destro */}
              <rect
                x="440"
                y="10"
                width="50"
                height="130"
                className={`transition-all duration-200 cursor-pointer ${getZoneColor(
                  zones.corner3.diff,
                  selectedZone === 'corner3'
                )}`}
                onClick={() => setSelectedZone('corner3')}
              />

              {/* Zona Mid-Range (Tra l'arco e la vernice) */}
              <path
                d="M 60 10 L 440 10 L 440 140 A 225 225 0 0 1 60 140 Z"
                className={`transition-all duration-200 cursor-pointer ${getZoneColor(
                  zones.midRange.diff,
                  selectedZone === 'midRange'
                )}`}
                onClick={() => setSelectedZone('midRange')}
              />

              {/* Pitturato FIBA (Key / Vernice: 4.9m x 5.8m) */}
              <rect
                x="170"
                y="10"
                width="160"
                height="190"
                fill="#1e293b"
                stroke="#475569"
                strokeWidth="2"
              />

              {/* Zona Pitturato Fuori Ferro (Floater / Paint non-rim) */}
              {zones.paintNonRim ? (
                <rect
                  x="170"
                  y="70"
                  width="160"
                  height="130"
                  className={`transition-all duration-200 cursor-pointer ${getZoneColor(
                    zones.paintNonRim.diff,
                    selectedZone === 'paintNonRim'
                  )}`}
                  onClick={() => setSelectedZone('paintNonRim')}
                />
              ) : null}

              {/* Zona Sotto Canestro / Ferro (< 1.5m - Semicerchio no sfondamento) */}
              <path
                d="M 205 10 A 45 45 0 0 0 295 10 Z"
                className={`transition-all duration-200 cursor-pointer ${getZoneColor(
                  zones.rim.diff,
                  selectedZone === 'rim'
                )}`}
                onClick={() => setSelectedZone('rim')}
              />

              {/* Linee del campo & Canestro FIBA */}
              {/* Tabellone e Ferro */}
              <line x1="220" y1="35" x2="280" y2="35" stroke="#94a3b8" strokeWidth="4" />
              <circle cx="250" cy="45" r="12" fill="none" stroke="#f97316" strokeWidth="3" />
              <line x1="250" y1="35" x2="250" y2="33" stroke="#cbd5e1" strokeWidth="3" />

              {/* Linea Tiro Libero & Cerchio */}
              <circle cx="250" cy="200" r="60" fill="none" stroke="#475569" strokeWidth="2" strokeDasharray="6 4" />
              <path d="M 190 200 A 60 60 0 0 1 310 200" fill="none" stroke="#475569" strokeWidth="2" />
              <line x1="170" y1="200" x2="330" y2="200" stroke="#64748b" strokeWidth="2" />

              {/* Arco da 3 Punti FIBA (6.75m / 6.60m negli angoli) */}
              <path
                d="M 60 10 L 60 140 A 225 225 0 0 0 440 140 L 440 10"
                fill="none"
                stroke="#64748b"
                strokeWidth="2.5"
              />

              {/* Cerchio di Centrocampo */}
              <path d="M 160 460 A 90 90 0 0 1 340 460" fill="none" stroke="#334155" strokeWidth="2" />

              {/* Etichette interattive sul campo */}
              <text x="250" y="28" fill="#f8fafc" fontSize="11" fontWeight="bold" textAnchor="middle" className="pointer-events-none">
                FERRO {zones.rim.fgPct}%
              </text>
              <text x="250" y="42" fill="#94a3b8" fontSize="9" textAnchor="middle" className="pointer-events-none">
                ({zones.rim.fgaPct}% tiri)
              </text>

              {zones.paintNonRim ? (
                <>
                  <text x="250" y="130" fill="#f8fafc" fontSize="11" fontWeight="bold" textAnchor="middle" className="pointer-events-none">
                    FLOATER {zones.paintNonRim.fgPct}%
                  </text>
                  <text x="250" y="145" fill="#94a3b8" fontSize="9" textAnchor="middle" className="pointer-events-none">
                    ({zones.paintNonRim.fgaPct}% tiri)
                  </text>
                </>
              ) : null}

              <text x="250" y="275" fill="#f8fafc" fontSize="11" fontWeight="bold" textAnchor="middle" className="pointer-events-none">
                MID-RANGE {zones.midRange.fgPct}%
              </text>
              <text x="250" y="290" fill="#94a3b8" fontSize="9" textAnchor="middle" className="pointer-events-none">
                ({zones.midRange.fgaPct}% tiri)
              </text>

              <text x="35" y="75" fill="#f8fafc" fontSize="10" fontWeight="bold" textAnchor="middle" className="pointer-events-none">
                C3 {zones.corner3.fgPct}%
              </text>
              <text x="465" y="75" fill="#f8fafc" fontSize="10" fontWeight="bold" textAnchor="middle" className="pointer-events-none">
                C3 {zones.corner3.fgPct}%
              </text>

              <text x="250" y="380" fill="#f8fafc" fontSize="13" fontWeight="bold" textAnchor="middle" className="pointer-events-none">
                TRIPLE 6.75m {zones.aboveBreak3.fgPct}%
              </text>
              <text x="250" y="398" fill="#94a3b8" fontSize="10" textAnchor="middle" className="pointer-events-none">
                ({zones.aboveBreak3.fgaPct}% del volume totale)
              </text>
            </svg>
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Sopra Media Lega (+{'>'}1%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span> In Media (±1%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span> Sotto Media ({'<'}-1%)
            </span>
          </div>
        </div>

        {/* Dettagli Zona Selezionata & Analisi Efficienza */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase font-bold tracking-wider text-indigo-400">Zona Selezionata</span>
              <span
                className={`text-xs px-2 py-0.5 rounded font-semibold ${
                  activeZone.diff >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {activeZone.diff >= 0 ? `+${activeZone.diff}% vs Lega` : `${activeZone.diff}% vs Lega`}
              </span>
            </div>

            <h4 className="text-base font-bold text-white mb-1">{activeZone.name}</h4>
            <p className="text-xs text-slate-300 mb-3">{activeZone.description}</p>

            <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-700">
              <div className="bg-slate-900/80 p-2 rounded-lg">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Volume</div>
                <div className="text-sm font-bold text-white">{activeZone.fgaPct}%</div>
                <div className="text-[9px] text-slate-500">dei tiri</div>
              </div>

              <div className="bg-slate-900/80 p-2 rounded-lg">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Realizzazione</div>
                <div className="text-sm font-bold text-emerald-400">{activeZone.fgPct}%</div>
                <div className="text-[9px] text-slate-500">Lega: {activeZone.leagueAvg}%</div>
              </div>

              <div className="bg-slate-900/80 p-2 rounded-lg">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Punti/Tiro</div>
                <div className="text-sm font-bold text-amber-300">{activeZone.pps}</div>
                <div className="text-[9px] text-slate-500">PPS atteso</div>
              </div>
            </div>
          </div>

          {/* Elenco Selettore Zone Rapido */}
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-800 space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-1">
              Esplora per area di campo
            </div>
            {Object.values(zones).map((zone) => (
              <button
                key={zone.id}
                onClick={() => setSelectedZone(zone.id)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  selectedZone === zone.id
                    ? 'bg-indigo-600 text-white font-medium shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80'
                }`}
              >
                <span>{zone.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] opacity-80">{zone.fgaPct}% vol</span>
                  <span
                    className={`font-semibold ${
                      zone.diff >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    } ${selectedZone === zone.id ? 'text-white' : ''}`}
                  >
                    {zone.fgPct}%
                  </span>
                </div>
              </button>
            ))}
          </div>

          {!isTeam && (shotSelection as PlayerShotSelection).shotStyleNotes && (
            <div className="text-xs bg-slate-950/60 p-3 rounded-lg border border-slate-800/70 text-slate-300 italic">
              💡 <span className="font-semibold text-slate-200 not-italic">Scouting Shot Selection:</span>{' '}
              {(shotSelection as PlayerShotSelection).shotStyleNotes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
