import React, { useState } from 'react';
import {
  calculateTS,
  calculateEFG,
  calculatePossessions,
  calculateRating,
  calculateGameScore,
  calculatePIR,
  calculateShotProfile,
} from '../utils/statsCalculator';

export const BoxScoreCalculator: React.FC = () => {
  // Esempio precaricato: Partita reale Euroleague (es. Panathinaikos vs Real Madrid)
  const [pts, setPts] = useState(85);
  const [fgm, setFgm] = useState(30);
  const [fga, setFga] = useState(62);
  const [fg3m, setFg3m] = useState(10);
  const [fg3a, setFg3a] = useState(24);
  const [ftm, setFtm] = useState(15);
  const [fta, setFta] = useState(18);
  const [orb, setOrb] = useState(9);
  const [drb, setDrb] = useState(24);
  const [ast, setAst] = useState(20);
  const [stl, setStl] = useState(7);
  const [blk, setBlk] = useState(4);
  const [tov, setTov] = useState(11);
  const [pf, setPf] = useState(19);

  // Dati avversario per ratings e four factors
  const [oppPts, setOppPts] = useState(80);
  const [oppFga, setOppFga] = useState(65);
  const [oppFta, setOppFta] = useState(16);
  const [oppOrb, setOppOrb] = useState(10);
  const [oppTov, setOppTov] = useState(13);

  // Calcoli Live
  const fg2m = fgm - fg3m;
  const fg2a = fga - fg3a;

  const tsPct = calculateTS(pts, fga, fta);
  const efgPct = calculateEFG(fgm, fg3m, fga);
  const teamPoss = calculatePossessions(fga, fta, orb, tov);
  const oppPoss = calculatePossessions(oppFga, oppFta, oppOrb, oppTov);
  const gamePace = Number(((teamPoss + oppPoss) / 2).toFixed(1));

  const ortg = calculateRating(pts, teamPoss);
  const drtg = calculateRating(oppPts, oppPoss);
  const netRtg = Number((ortg - drtg).toFixed(1));

  const shotProfile = calculateShotProfile(fga, fg2a, fg3a, fta, pts);

  const gameScore = calculateGameScore({
    min: 40,
    pts,
    fgm,
    fga,
    fg3m,
    fg3a,
    ftm,
    fta,
    orb,
    drb,
    reb: orb + drb,
    ast,
    stl,
    blk,
    tov,
    pf,
  });

  const pir = calculatePIR({
    min: 40,
    pts,
    fgm,
    fga,
    fg3m,
    fg3a,
    ftm,
    fta,
    orb,
    drb,
    reb: orb + drb,
    ast,
    stl,
    blk,
    tov,
    pf,
  });

  const loadPreset = (presetName: string) => {
    if (presetName === 'virtus_milano') {
      // Derby LBA / Euroleague
      setPts(80);
      setFga(64);
      setFgm(28);
      setFg3a(22);
      setFg3m(8);
      setFta(20);
      setFtm(16);
      setOrb(10);
      setDrb(26);
      setAst(18);
      setStl(6);
      setBlk(3);
      setTov(14);
      setPf(21);
      setOppPts(75);
      setOppFga(60);
      setOppFta(18);
      setOppOrb(8);
      setOppTov(16);
    } else if (presetName === 'run_and_gun') {
      // Valencia o Trapani ad alto ritmo
      setPts(95);
      setFga(72);
      setFgm(36);
      setFg3a(32);
      setFg3m(13);
      setFta(14);
      setFtm(10);
      setOrb(12);
      setDrb(25);
      setAst(25);
      setStl(9);
      setBlk(2);
      setTov(10);
      setPf(18);
      setOppPts(88);
      setOppFga(69);
      setOppFta(22);
      setOppOrb(11);
      setOppTov(15);
    } else if (presetName === 'euroleague_grind') {
      // Match difensivo a metà campo
      setPts(68);
      setFga(55);
      setFgm(23);
      setFg3a(18);
      setFg3m(5);
      setFta(22);
      setFtm(17);
      setOrb(7);
      setDrb(28);
      setAst(14);
      setStl(5);
      setBlk(5);
      setTov(16);
      setPf(24);
      setOppPts(65);
      setOppFga(58);
      setOppFta(19);
      setOppOrb(9);
      setOppTov(17);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🧮</span> Calcolatore & Convertitore Box Score FIBA
          </h2>
          <p className="text-xs text-slate-400">
            Inserisci i dati grezzi del tabellino ufficiale (Euroleague, Eurocup o LBA) e genera istantaneamente tutte
            le statistiche avanzate.
          </p>
        </div>

        {/* Preset Partite */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Carica Esempio:</span>
          <button
            onClick={() => loadPreset('virtus_milano')}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
          >
            Derby Italiano
          </button>
          <button
            onClick={() => loadPreset('run_and_gun')}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
          >
            Alto Ritmo (Run & Gun)
          </button>
          <button
            onClick={() => loadPreset('euroleague_grind')}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
          >
            Difensivo (Grind)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Input Dati Tabellino */}
        <div className="lg:col-span-6 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-400">
            Dati Grezzi Tabellino Ufficiale
          </h3>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Punti (PTS)</label>
              <input
                type="number"
                value={pts}
                onChange={(e) => setPts(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Tiri Totali (FGM / FGA)</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={fgm}
                  onChange={(e) => setFgm(Number(e.target.value))}
                  className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-sm text-center text-white"
                />
                <span className="text-slate-500">/</span>
                <input
                  type="number"
                  value={fga}
                  onChange={(e) => setFga(Number(e.target.value))}
                  className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-sm text-center text-white"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Triple (3PM / 3PA)</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={fg3m}
                  onChange={(e) => setFg3m(Number(e.target.value))}
                  className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-sm text-center text-white"
                />
                <span className="text-slate-500">/</span>
                <input
                  type="number"
                  value={fg3a}
                  onChange={(e) => setFg3a(Number(e.target.value))}
                  className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-sm text-center text-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Tiri Liberi (FTM / FTA)</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={ftm}
                  onChange={(e) => setFtm(Number(e.target.value))}
                  className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-sm text-center text-white"
                />
                <span className="text-slate-500">/</span>
                <input
                  type="number"
                  value={fta}
                  onChange={(e) => setFta(Number(e.target.value))}
                  className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-sm text-center text-white"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Rimbalzi (Off / Dif)</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={orb}
                  onChange={(e) => setOrb(Number(e.target.value))}
                  className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-sm text-center text-white"
                />
                <span className="text-slate-500">+</span>
                <input
                  type="number"
                  value={drb}
                  onChange={(e) => setDrb(Number(e.target.value))}
                  className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-sm text-center text-white"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Assist (AST)</label>
              <input
                type="number"
                value={ast}
                onChange={(e) => setAst(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Recuperi (STL)</label>
              <input
                type="number"
                value={stl}
                onChange={(e) => setStl(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-sm text-white text-center"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Stoppate (BLK)</label>
              <input
                type="number"
                value={blk}
                onChange={(e) => setBlk(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-sm text-white text-center"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Perse (TOV)</label>
              <input
                type="number"
                value={tov}
                onChange={(e) => setTov(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-sm text-white text-center"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Falli (PF)</label>
              <input
                type="number"
                value={pf}
                onChange={(e) => setPf(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-sm text-white text-center"
              />
            </div>
          </div>

          {/* Dati Avversario per Ratings */}
          <div className="pt-3 border-t border-slate-800/80">
            <span className="text-xs font-semibold text-slate-300 block mb-2">
              Dati Avversario (per Calcolo Pace e Defensive Rating)
            </span>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 block">Punti Subiti</label>
                <input
                  type="number"
                  value={oppPts}
                  onChange={(e) => setOppPts(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">Tiri Avv. (FGA)</label>
                <input
                  type="number"
                  value={oppFga}
                  onChange={(e) => setOppFga(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">Rim. Off Avv.</label>
                <input
                  type="number"
                  value={oppOrb}
                  onChange={(e) => setOppOrb(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">Perse Avv.</label>
                <input
                  type="number"
                  value={oppTov}
                  onChange={(e) => setOppTov(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Statistiche Avanzate Calcolate */}
        <div className="lg:col-span-6 bg-slate-950 rounded-xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
                Risultati Metriche Avanzate
              </h3>
              <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-medium">
                Pace: {gamePace} Possessi/Gara
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">True Shooting</div>
                <div className="text-xl font-black text-emerald-400">{tsPct}%</div>
                <div className="text-[10px] text-slate-500">eFG%: {efgPct}%</div>
              </div>

              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Offensive Rating</div>
                <div className="text-xl font-black text-indigo-400">{ortg}</div>
                <div className="text-[10px] text-slate-500">Pts/100 poss</div>
              </div>

              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Net Rating</div>
                <div
                  className={`text-xl font-black ${
                    netRtg >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {netRtg >= 0 ? `+${netRtg}` : netRtg}
                </div>
                <div className="text-[10px] text-slate-500">DRtg: {drtg}</div>
              </div>
            </div>

            {/* Confronto Cruciale: PIR vs Hollinger Game Score */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-300">Confronto Valutazione: PIR vs Game Score</span>
                <span className="text-[10px] text-amber-400 font-semibold">Perché il PIR inganna</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center py-1">
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">PIR (Valutazione Euroleague)</div>
                  <div className="text-lg font-bold text-slate-300">{pir}</div>
                  <div className="text-[9px] text-slate-500">Formula grezza a pesi uguali</div>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-emerald-500/40">
                  <div className="text-[10px] text-emerald-400 uppercase font-bold">FIBA Game Score</div>
                  <div className="text-lg font-bold text-emerald-400">{gameScore}</div>
                  <div className="text-[9px] text-emerald-500/80">Ponderato scientificamente</div>
                </div>
              </div>
            </div>

            {/* Selezione di Tiro & Profilo Efficienza */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Profilo di Tiro (Shot Selection)
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">3P Attempt Rate</span>
                  <span className="font-bold text-white">{shotProfile.threePointAttemptRate}%</span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">FT Rate (FTR)</span>
                  <span className="font-bold text-amber-400">{shotProfile.ftr}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Punti Per Tiro (PPS)</span>
                  <span className="font-bold text-emerald-400">{shotProfile.pointsPerShot}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-900/40 text-[11px] text-indigo-200">
            ℹ️ <strong>Nota metodologica:</strong> A differenza del tabellino Euroleague standard, il calcolo normalizza il
            totale punti sul numero effettivo di possessi giocati ({teamPoss.toFixed(1)} possessi stimati), evitando distorsioni
            dovute al ritmo veloce o lento della partita.
          </div>
        </div>
      </div>
    </div>
  );
};
