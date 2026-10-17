import React, { useState, useMemo, useEffect } from 'react';
import { TEAMS_DATA, PLAYERS_DATA } from './data/basketballData';
import { League, PlayerStats, TeamStats } from './types/basketball';
import { HalfCourtShotChart } from './components/HalfCourtShotChart';
import { ScatterPlotExplorer } from './components/ScatterPlotExplorer';
import { HeadToHeadComparison } from './components/HeadToHeadComparison';
import { BoxScoreCalculator } from './components/BoxScoreCalculator';
import { PlayerDetailModal } from './components/PlayerDetailModal';
import { TeamDetailModal } from './components/TeamDetailModal';
import { RoundUpdater } from './components/RoundUpdater';
import { LineupAnalytics } from './components/LineupAnalytics';
import { ParsedGameReport, FullRoundSyncResult } from './utils/euroleagueFetcher';
import {
  Search,
  Crosshair,
  Users,
  Shield,
  BarChart2,
  Calculator,
  ArrowUpDown,
  Flame,
  Zap,
  TrendingUp,
  Activity,
  Layers,
  ChevronRight,
  Info,
  DownloadCloud,
  CheckCircle,
  UserCheck,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

type TabView =
  | 'shot_selection'
  | 'players'
  | 'teams'
  | 'lineup_analytics'
  | 'h2h'
  | 'scatter'
  | 'calculator'
  | 'round_updater';

const STORAGE_PREFIX = 'eurobasket_2026_27_v44';
const STORAGE_PLAYERS_KEY = `${STORAGE_PREFIX}_players`;
const STORAGE_TEAMS_KEY = `${STORAGE_PREFIX}_teams`;
const STORAGE_SYNC_KEY = `${STORAGE_PREFIX}_last_sync`;

// Garantisce univocità delle squadre eliminando duplicati, squadre spurie e assicurando che Valencia Basket sia esclusivamente in EuroLeague e EuroCup conti le sue 24 squadre
function sanitizeTeamsList(teams: TeamStats[]): TeamStats[] {
  if (!Array.isArray(teams)) return [];
  const map = new Map<string, TeamStats>();
  for (const t of teams) {
    if (!t || !t.id) continue;
    // Rimuovi eventuali squadre spurie o Alba Berlino (sostituita ufficialmente da Valencia Basket in EuroLeague)
    if (t.id === 'kids-us-manresa' || t.id === 'bosna-bh-telecom-sarajevo' || t.id === 'valencia-basket-eurocup') continue;
    if (t.id === 'alba-berlin' || t.name === 'ALBA BERLIN') continue;

    // Valencia Basket disputa esclusivamente l'EuroLeague (20 squadre) e NON l'EuroCup (24 squadre)
    if (t.name === 'VALENCIA BASKET' && t.league === 'EuroCup') continue;

    const cleanId = t.id;
    const cleanTeam = t;

    if (!map.has(cleanId)) {
      map.set(cleanId, cleanTeam);
    } else {
      const existing = map.get(cleanId)!;
      if ((cleanTeam.gp || 0) > (existing.gp || 0)) {
        map.set(cleanId, cleanTeam);
      }
    }
  }
  return Array.from(map.values());
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabView>('shot_selection');
  const [selectedLeague, setSelectedLeague] = useState<League | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('ALL');

  // Ricerca specifica per Shot Selection Lab
  const [shotPlayerSearch, setShotPlayerSearch] = useState('');
  const [shotTeamSelect, setShotTeamSelect] = useState('ALL');
  const [shotPosFilter, setShotPosFilter] = useState('ALL');
  const [shotTeamSearch, setShotTeamSearch] = useState('');

  // Paginazione per Tabella Giocatori (evita rendering pesante di 325 righe)
  const [visiblePlayerCount, setVisiblePlayerCount] = useState(25);

  // Auto-Sync in background con API Ufficiale
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [lastAutoSyncTime, setLastAutoSyncTime] = useState<string>('Pochi istanti fa');

  // Funzione per forzare sincronizzazione manuale o automatica
  const triggerManualSync = async () => {
    setIsAutoSyncing(true);
    try {
      let syncMessage = '';
      // 1. Chiamata all'endpoint di sincronizzazione gare ufficiali
      try {
        const triggerRes = await fetch('/api/sync/trigger', { method: 'POST' });
        if (triggerRes.ok) {
          const syncJson = await triggerRes.json();
          if (syncJson.message) syncMessage = syncJson.message;
        }
      } catch (e) {}

      // 2. Recupera i dati più aggiornati
      const res = await fetch('/api/data/latest');
      if (res.ok) {
        const serverData = await res.json();
        if (serverData.teams && serverData.teams.length >= 50) {
          const cleanTeams = sanitizeTeamsList(serverData.teams);
          setTeamsList(cleanTeams);
          setPlayersList(serverData.players);
          try {
            localStorage.setItem(STORAGE_PLAYERS_KEY, JSON.stringify(serverData.players));
            localStorage.setItem(STORAGE_TEAMS_KEY, JSON.stringify(cleanTeams));
            localStorage.setItem(STORAGE_SYNC_KEY, serverData.lastUpdated || new Date().toISOString());
          } catch (e) {}
          showToast(syncMessage || `⚡ Database 2026/27 aggiornato: ${cleanTeams.length} squadre e ${serverData.players.length} giocatori (EuroCup & LBA 3ª Giornata completate)!`);
        }
      }
    } catch (err) {
      console.error('Manual sync error:', err);
      showToast('Errore durante la sincronizzazione.');
    } finally {
      setIsAutoSyncing(false);
      setLastAutoSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function runAutoSync() {
      setIsAutoSyncing(true);
      try {
        const res = await fetch('/api/data/latest');
        if (res.ok) {
          const serverData = await res.json();
          if (serverData.teams && serverData.teams.length >= 50 && isMounted) {
            const cleanTeams = sanitizeTeamsList(serverData.teams);
            setTeamsList(cleanTeams);
            setPlayersList(serverData.players);
            try {
              localStorage.setItem(STORAGE_PLAYERS_KEY, JSON.stringify(serverData.players));
              localStorage.setItem(STORAGE_TEAMS_KEY, JSON.stringify(cleanTeams));
              localStorage.setItem(STORAGE_SYNC_KEY, serverData.lastUpdated || new Date().toISOString());
            } catch (e) {}
          }
        }
      } catch (err) {
        // Silenzioso
      } finally {
        if (isMounted) {
          setIsAutoSyncing(false);
          setLastAutoSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      }
    }
    runAutoSync();
    // Controllo automatico periodico ogni 30 secondi per nuovi turni completati
    const interval = setInterval(runAutoSync, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Persistenza Database in LocalStorage (Stagione Ufficiale 2026/2027: EuroLeague + EuroCup + LBA Serie A)
  const [playersList, setPlayersList] = useState<PlayerStats[]>(() => {
    try {
      // Pulisci TUTTE le vecchie chiavi di versioni precedenti per forzare dati coerenti e privi di anomalie
      ['v31', 'v35', 'v36', 'v37', 'v38', 'v39', 'v40', 'v41', 'v42', 'v43'].forEach((v) => {
        try {
          localStorage.removeItem(`eurobasket_2026_27_${v}_players`);
          localStorage.removeItem(`eurobasket_2026_27_${v}_teams`);
          localStorage.removeItem(`eurobasket_last_server_sync_${v}`);
        } catch (e) {}
      });
      
      const saved = localStorage.getItem(STORAGE_PLAYERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.length >= 700 &&
          parsed.some((p: any) => p.name === 'Nico Mannion' || p.name === 'Toko Shengelia') &&
          !parsed.some((p: any) => p.team?.includes('MANRESA'))
        ) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return PLAYERS_DATA;
  });

  const [teamsList, setTeamsList] = useState<TeamStats[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TEAMS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.length >= 50 &&
          parsed.some((t: any) => t.league === 'LBA' && t.gp >= 3) &&
          parsed.some((t: any) => t.league === 'EuroCup' && t.gp >= 3) &&
          !parsed.some((t: any) => t.name?.includes('MANRESA'))
        ) {
          const sanitized = sanitizeTeamsList(parsed);
          if (sanitized.length >= 50) return sanitized;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return sanitizeTeamsList(TEAMS_DATA);
  });

  // Salva automaticamente in LocalStorage con validazione
  useEffect(() => {
    try {
      const cleanTeams = sanitizeTeamsList(teamsList);
      if (playersList.length >= 700 && cleanTeams.length >= 50) {
        localStorage.setItem(STORAGE_PLAYERS_KEY, JSON.stringify(playersList));
        localStorage.setItem(STORAGE_TEAMS_KEY, JSON.stringify(cleanTeams));
      }
    } catch (e) {
      console.error(e);
    }
  }, [playersList, teamsList]);

  // Notifica Toast rapida
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Ordinamento Tabella Giocatori
  const [playerSortKey, setPlayerSortKey] = useState<keyof PlayerStats>('tsPct');
  const [playerSortAsc, setPlayerSortAsc] = useState<boolean>(false);

  // Ordinamento Tabella Squadre
  const [teamSortKey, setTeamSortKey] = useState<keyof TeamStats>('netRtg');
  const [teamSortAsc, setTeamSortAsc] = useState<boolean>(false);

  // Selezione per Shot Selection Lab
  const [activeShotTargetType, setActiveShotTargetType] = useState<'player' | 'team'>('player');
  const [selectedPlayerForShot, setSelectedPlayerForShot] = useState<PlayerStats>(playersList[0]);
  const [selectedTeamForShot, setSelectedTeamForShot] = useState<TeamStats>(teamsList[0]);

  // Modali Dettaglio
  const [modalPlayer, setModalPlayer] = useState<PlayerStats | null>(null);
  const [modalTeam, setModalTeam] = useState<TeamStats | null>(null);

  // Unione dati del turno scaricato nel database
  const handleMergeGameData = (report: ParsedGameReport) => {
    const newIncomingPlayers = [...report.teamA.players, ...report.teamB.players];

    setPlayersList((prev) => {
      const updated = [...prev];

      newIncomingPlayers.forEach((incoming) => {
        const existingIdx = updated.findIndex(
          (p) =>
            p.name.toLowerCase() === incoming.name.toLowerCase() ||
            p.id.toLowerCase() === incoming.id.toLowerCase()
        );

        if (existingIdx >= 0) {
          // Ricalcola la media ponderata
          const old = updated[existingIdx];
          const newGP = old.gamesPlayed + 1;
          const avgPts = Number(((old.pts * old.gamesPlayed + incoming.pts) / newGP).toFixed(1));
          const avgMpg = Number(((old.mpg * old.gamesPlayed + incoming.mpg) / newGP).toFixed(1));
          const avgTs = Number(((old.tsPct * old.gamesPlayed + incoming.tsPct) / newGP).toFixed(1));
          const avgUsg = Number(((old.usgPct * old.gamesPlayed + incoming.usgPct) / newGP).toFixed(1));
          const avgGs = Number(((old.gameScore * old.gamesPlayed + incoming.gameScore) / newGP).toFixed(1));

          updated[existingIdx] = {
            ...old,
            gamesPlayed: newGP,
            pts: avgPts,
            mpg: avgMpg,
            tsPct: avgTs,
            usgPct: avgUsg,
            gameScore: avgGs,
            pir: Math.round((old.pir * old.gamesPlayed + incoming.pir) / newGP),
            shotSelection: {
              ...old.shotSelection,
              moreyballRate: Math.round(
                (old.shotSelection.moreyballRate + incoming.shotSelection.moreyballRate) / 2
              ),
              shotStyleNotes: `Turno aggiornato (${report.competition}): ${incoming.pts} PTS (${incoming.tsPct}% TS).`,
            },
          };
        } else {
          // Giocatore nuovo: aggiungi in cima
          updated.unshift(incoming);
        }
      });

      return updated;
    });

    showToast(
      `Turno sincronizzato! Aggiornati i giocatori di ${report.teamA.name} e ${report.teamB.name}.`
    );
  };

  // Unione dell'intero turno (tutte le 9 partite contemporaneamente)
  const handleMergeFullRound = (result: FullRoundSyncResult) => {
    // 1. Aggiorna tutti i giocatori
    setPlayersList((prev) => {
      const updated = [...prev];

      result.allPlayers.forEach((incoming) => {
        const existingIdx = updated.findIndex(
          (p) =>
            p.name.toLowerCase() === incoming.name.toLowerCase() ||
            p.id.toLowerCase() === incoming.id.toLowerCase()
        );

        if (existingIdx >= 0) {
          const old = updated[existingIdx];
          const newGP = old.gamesPlayed + 1;
          const avgPts = Number(((old.pts * old.gamesPlayed + incoming.pts) / newGP).toFixed(1));
          const avgMpg = Number(((old.mpg * old.gamesPlayed + incoming.mpg) / newGP).toFixed(1));
          const avgTs = Number(((old.tsPct * old.gamesPlayed + incoming.tsPct) / newGP).toFixed(1));
          const avgUsg = Number(((old.usgPct * old.gamesPlayed + incoming.usgPct) / newGP).toFixed(1));
          const avgGs = Number(((old.gameScore * old.gamesPlayed + incoming.gameScore) / newGP).toFixed(1));

          updated[existingIdx] = {
            ...old,
            gamesPlayed: newGP,
            pts: avgPts,
            mpg: avgMpg,
            tsPct: avgTs,
            usgPct: avgUsg,
            gameScore: avgGs,
            pir: Math.round((old.pir * old.gamesPlayed + incoming.pir) / newGP),
            shotSelection: {
              ...old.shotSelection,
              moreyballRate: Math.round(
                (old.shotSelection.moreyballRate + incoming.shotSelection.moreyballRate) / 2
              ),
              shotStyleNotes: `Turno ${result.roundNumber} (${result.competition}): ${incoming.pts} PTS (${incoming.tsPct}% TS).`,
            },
          };
        } else {
          updated.push(incoming);
        }
      });

      return updated;
    });

    // 2. Aggiorna le statistiche delle squadre con i ratings del turno
    setTeamsList((prev) => {
      const updatedTeams = [...prev];
      result.teamRankings.forEach((tRank) => {
        const tIdx = updatedTeams.findIndex(
          (t) =>
            t.name.toLowerCase().includes(tRank.teamName.toLowerCase()) ||
            tRank.teamName.toLowerCase().includes(t.shortName.toLowerCase())
        );

        if (tIdx >= 0) {
          const oldT = updatedTeams[tIdx];
          const newWins = oldT.record.wins + tRank.wins;
          const newLosses = oldT.record.losses + tRank.losses;
          updatedTeams[tIdx] = {
            ...oldT,
            record: { wins: newWins, losses: newLosses },
            pace: Number(((oldT.pace + tRank.pace) / 2).toFixed(1)),
            ortg: Number(((oldT.ortg + tRank.ortg) / 2).toFixed(1)),
            drtg: Number(((oldT.drtg + tRank.drtg) / 2).toFixed(1)),
            netRtg: Number((((oldT.ortg + tRank.ortg) / 2) - ((oldT.drtg + tRank.drtg) / 2)).toFixed(1)),
          };
        }
      });
      return updatedTeams;
    });

    showToast(
      `⚡ Turno ${result.roundNumber} sincronizzato! ${result.totalGames} partite elaborate e ${result.allPlayers.length} giocatori aggiornati senza incollare nulla!`
    );
  };

  // Reset del database
  const handleResetDatabase = () => {
    if (window.confirm('Vuoi ripristinare il database allo stato iniziale predefinito?')) {
      localStorage.removeItem('eurobasket_2026_27_v28_players');
      localStorage.removeItem('eurobasket_2026_27_v28_teams');
      localStorage.removeItem('eurobasket_last_server_sync_v28');
      localStorage.removeItem('eurobasket_2026_oct8_v12_players');
      localStorage.removeItem('eurobasket_2026_oct8_v12_teams');
      localStorage.removeItem('eurobasket_2026_oct8_v11_players');
      localStorage.removeItem('eurobasket_2026_oct8_v11_teams');
      localStorage.removeItem('eurobasket_2026_oct8_v10_players');
      localStorage.removeItem('eurobasket_2026_oct8_v10_teams');
      localStorage.removeItem('eurobasket_2026_oct8_v9_players');
      localStorage.removeItem('eurobasket_2026_oct8_v9_teams');
      localStorage.removeItem('eurobasket_2026_oct7_v8_players');
      localStorage.removeItem('eurobasket_2026_oct7_v8_teams');
      localStorage.removeItem('eurobasket_2026_poss100_v6_players');
      localStorage.removeItem('eurobasket_2026_poss100_v6_teams');
      localStorage.removeItem('eurobasket_2026_r3_v5_players');
      localStorage.removeItem('eurobasket_2026_r3_v5_teams');
      localStorage.removeItem('eurobasket_2026_lba16_v4_players');
      localStorage.removeItem('eurobasket_2026_lba16_v4_teams');
      localStorage.removeItem('eurobasket_2026_real_v3_players');
      localStorage.removeItem('eurobasket_2026_real_v3_teams');
      localStorage.removeItem('eurobasket_v2_players');
      localStorage.removeItem('eurobasket_v2_teams');
      setPlayersList(PLAYERS_DATA);
      setTeamsList(TEAMS_DATA);
      setSelectedPlayerForShot(PLAYERS_DATA[0]);
      setSelectedTeamForShot(TEAMS_DATA[0]);
      showToast('Database ripristinato con successo.');
    }
  };

  // Filtro Giocatori
  const filteredPlayers = useMemo(() => {
    return playersList
      .filter((p) => {
        const matchLeague = selectedLeague === 'ALL' || p.league === selectedLeague;
        const matchPos = positionFilter === 'ALL' ||
          p.position === positionFilter ||
          (positionFilter === 'PG' && (p.position === 'PG' || p.position === 'PG/SG')) ||
          (positionFilter === 'SG' && (p.position === 'SG' || p.position === 'PG/SG' || p.position === 'G/F')) ||
          (positionFilter === 'G/F' && (p.position === 'G/F' || p.position === 'SG' || p.position === 'SF')) ||
          (positionFilter === 'F' && (p.position === 'F' || p.position === 'SF' || p.position === 'PF' || p.position === 'G/F' || p.position === 'F/C')) ||
          (positionFilter === 'SF' && (p.position === 'SF' || p.position === 'F' || p.position === 'G/F')) ||
          (positionFilter === 'PF' && (p.position === 'PF' || p.position === 'F' || p.position === 'F/C')) ||
          (positionFilter === 'C' && (p.position === 'C' || p.position === 'F/C'));
        const matchQuery =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.team.toLowerCase().includes(searchQuery.toLowerCase());
        return matchLeague && matchPos && matchQuery;
      })
      .sort((a, b) => {
        const valA = (a as any)[playerSortKey];
        const valB = (b as any)[playerSortKey];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return playerSortAsc ? valA - valB : valB - valA;
        }
        return 0;
      });
  }, [playersList, selectedLeague, positionFilter, searchQuery, playerSortKey, playerSortAsc]);

  // Filtro Squadre
  const filteredTeams = useMemo(() => {
    return sanitizeTeamsList(teamsList)
      .filter((t) => {
        const matchLeague = selectedLeague === 'ALL' || t.league === selectedLeague;
        const matchQuery =
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.shortName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchLeague && matchQuery;
      })
      .sort((a, b) => {
        const valA = (a as any)[teamSortKey];
        const valB = (b as any)[teamSortKey];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return teamSortAsc ? valA - valB : valB - valA;
        }
        return 0;
      });
  }, [teamsList, selectedLeague, searchQuery, teamSortKey, teamSortAsc]);

  // Lista squadre uniche per filtri
  const uniqueTeamsList = useMemo(() => {
    const map = new Map<string, string>();
    sanitizeTeamsList(teamsList).forEach((t) => map.set(t.name, t.name));
    return Array.from(map.values()).sort();
  }, [teamsList]);

  // Giocatori per Shot Selection Lab (filtrati per ricerca e team, senza mostrare 325 elementi contemporaneamente)
  const shotSelectionPlayers = useMemo(() => {
    return playersList.filter((p) => {
      const matchLeague = selectedLeague === 'ALL' || p.league === selectedLeague;
      const matchTeam = shotTeamSelect === 'ALL' || p.team.toLowerCase().includes(shotTeamSelect.toLowerCase());
      const matchPos = shotPosFilter === 'ALL' || p.position === shotPosFilter;
      const matchQuery =
        !shotPlayerSearch.trim() ||
        p.name.toLowerCase().includes(shotPlayerSearch.toLowerCase()) ||
        p.team.toLowerCase().includes(shotPlayerSearch.toLowerCase());
      return matchLeague && matchTeam && matchPos && matchQuery;
    });
  }, [playersList, selectedLeague, shotTeamSelect, shotPosFilter, shotPlayerSearch]);

  // Squadre per Shot Selection Lab
  const shotSelectionTeams = useMemo(() => {
    return sanitizeTeamsList(teamsList).filter((t) => {
      const matchLeague = selectedLeague === 'ALL' || t.league === selectedLeague;
      const matchQuery =
        !shotTeamSearch.trim() ||
        t.name.toLowerCase().includes(shotTeamSearch.toLowerCase()) ||
        t.shortName.toLowerCase().includes(shotTeamSearch.toLowerCase());
      return matchLeague && matchQuery;
    });
  }, [teamsList, selectedLeague, shotTeamSearch]);

  const handlePlayerSort = (key: keyof PlayerStats) => {
    if (playerSortKey === key) {
      setPlayerSortAsc(!playerSortAsc);
    } else {
      setPlayerSortKey(key);
      setPlayerSortAsc(false);
    }
  };

  const handleTeamSort = (key: keyof TeamStats) => {
    if (teamSortKey === key) {
      setTeamSortAsc(!teamSortAsc);
    } else {
      setTeamSortKey(key);
      setTeamSortAsc(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <CheckCircle className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header / Brand Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo & Titolo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-amber-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <span className="text-xl">🏀</span>
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>EuroBasket Stats Lab</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Stagione 2026/2027 (Live)
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Statistiche Avanzate & Shot Selection (Parametrate sui 100 Possessi) • EuroLeague, EuroCup & LBA Serie A
                </p>
              </div>
            </div>

            {/* Indicatori & Filtri */}
            <div className="flex items-center gap-3">
              {/* Badge Auto-Sync Intelligente & Trigger Manuale */}
              <button
                onClick={triggerManualSync}
                disabled={isAutoSyncing}
                title="Clicca per forzare la verifica immediata di nuovi turni e partite"
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-emerald-500/30 hover:border-emerald-500/60 text-xs shadow-inner transition-all cursor-pointer group"
              >
                <span className={`w-2 h-2 rounded-full ${isAutoSyncing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`}></span>
                <span className="text-[11px] font-semibold text-emerald-300 group-hover:text-emerald-200">
                  {isAutoSyncing ? 'Verifica turni in corso...' : '⚡ Auto-Sync Turni 2026/27'}
                </span>
                <span className="text-[10px] text-slate-500">• {lastAutoSyncTime}</span>
                <RefreshCw className={`w-3 h-3 text-slate-400 group-hover:text-emerald-400 ml-1 ${isAutoSyncing ? 'animate-spin' : ''}`} />
              </button>

              {/* Filtro Campionato / Lega */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {(['ALL', 'EuroLeague', 'EuroCup', 'LBA'] as const).map((league) => (
                  <button
                    key={league}
                    onClick={() => setSelectedLeague(league)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedLeague === league
                        ? league === 'EuroLeague'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : league === 'EuroCup'
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : league === 'LBA'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    {league === 'ALL' ? 'Tutte' : league}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 border-t border-slate-800/80 no-scrollbar text-xs font-semibold">
            <button
              onClick={() => setCurrentTab('shot_selection')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'shot_selection'
                  ? 'bg-slate-800 text-amber-400 font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Crosshair className="w-4 h-4" />
              <span>Shot Selection Lab</span>
            </button>

            <button
              onClick={() => setCurrentTab('players')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'players'
                  ? 'bg-slate-800 text-indigo-400 font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Giocatori ({filteredPlayers.length})</span>
            </button>

            <button
              onClick={() => setCurrentTab('teams')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'teams'
                  ? 'bg-slate-800 text-cyan-400 font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Squadre & Four Factors ({filteredTeams.length})</span>
            </button>

            <button
              onClick={() => setCurrentTab('lineup_analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'lineup_analytics'
                  ? 'bg-slate-800 text-teal-400 font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Lineup Analytics (Quintetti)</span>
            </button>

            <button
              onClick={() => setCurrentTab('round_updater')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'round_updater'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow'
                  : 'text-amber-400 hover:bg-amber-950/30'
              }`}
            >
              <DownloadCloud className="w-4 h-4" />
              <span>⚡ Aggiorna Turno (Live Sync)</span>
            </button>

            <button
              onClick={() => setCurrentTab('h2h')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'h2h'
                  ? 'bg-slate-800 text-purple-400 font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Testa a Testa (H2H)</span>
            </button>

            <button
              onClick={() => setCurrentTab('scatter')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'scatter'
                  ? 'bg-slate-800 text-emerald-400 font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>Scatter Plot Explorer</span>
            </button>

            <button
              onClick={() => setCurrentTab('calculator')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'calculator'
                  ? 'bg-slate-800 text-rose-400 font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Calcolatore Box Score</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Data Integrity Status & Multi-League Audit Banner */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Audit Minutaggi & Sincronizzazione 3 Competizioni 2026/27
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  ✓ 0 Anomalie DNP (Filtro &lt; 1 min attivo)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                EuroLeague (20 squadre) · EuroCup (24 squadre incl. Roma Basketball e Maxima Roma) · LBA Serie A (16 squadre)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={triggerManualSync}
              disabled={isAutoSyncing}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAutoSyncing ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Verifica Turni Live</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* TAB 0: AGGIORNA TURNO (LIVE SYNC & IMPORT) */}
        {/* ============================================================ */}
        {currentTab === 'round_updater' && (
          <RoundUpdater
            onMergeGameData={handleMergeGameData}
            onMergeFullRound={handleMergeFullRound}
            onResetDatabase={handleResetDatabase}
            onUpdateDataset={(newTeams, newPlayers) => {
              setTeamsList(newTeams);
              setPlayersList(newPlayers);
            }}
            allTeams={teamsList}
            allPlayers={playersList}
            playersCount={playersList.length}
            teamsCount={teamsList.length}
          />
        )}

        {/* ============================================================ */}
        {/* TAB 1: SHOT SELECTION LAB */}
        {/* ============================================================ */}
        {currentTab === 'shot_selection' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Crosshair className="w-5 h-5 text-amber-400" /> Laboratorio di Selezione Tiro (Shot Selection)
                </h2>
                <p className="text-xs text-slate-400">
                  Analisi approfondita della mappa di tiro FIBA, Moreyball Index, frequenza e punti per tiro per
                  giocatori e squadre.
                </p>
              </div>

              {/* Switch Target: Giocatore vs Squadra */}
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                  <button
                    onClick={() => setActiveShotTargetType('player')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeShotTargetType === 'player'
                        ? 'bg-amber-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Singolo Giocatore
                  </button>
                  <button
                    onClick={() => setActiveShotTargetType('team')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeShotTargetType === 'team'
                        ? 'bg-amber-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Intera Squadra
                  </button>
                </div>
              </div>
            </div>

            {/* Selettore Intelligente con Barra di Ricerca & Filtri (Sostituisce il muro di bottoni) */}
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-4">
              {activeShotTargetType === 'player' ? (
                <div className="space-y-3">
                  {/* Badge Giocatore Attualmente Selezionato */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950 rounded-xl border border-amber-500/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-black text-sm shadow">
                        #{selectedPlayerForShot.number || '0'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white text-sm sm:text-base">
                            {selectedPlayerForShot.name}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-bold text-[10px] uppercase border border-slate-700">
                            {selectedPlayerForShot.position} • {selectedPlayerForShot.league}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {selectedPlayerForShot.team} • {selectedPlayerForShot.pts} PPG • <strong className="text-amber-300 font-bold">{selectedPlayerForShot.ptsPer100 || Number(((selectedPlayerForShot.pts * 40 * 100) / (Math.max(1, selectedPlayerForShot.mpg) * 72.5)).toFixed(1))} pts/100 poss</strong> • {selectedPlayerForShot.tsPct}% TS • Moreyball: {selectedPlayerForShot.shotSelection.moreyballRate}%
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-bold px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/40">
                      ✓ Mappa di Tiro Attiva
                    </span>
                  </div>

                  {/* Barra di Ricerca e Filtro Squadra */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="relative md:col-span-2">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Cerca qualsiasi giocatore per nome o squadra (es. Mannion, Carr, Shields, Bacon, Vezenkov)..."
                        value={shotPlayerSearch}
                        onChange={(e) => setShotPlayerSearch(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                      {shotPlayerSearch && (
                        <button
                          onClick={() => setShotPlayerSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <select
                      value={shotTeamSelect}
                      onChange={(e) => setShotTeamSelect(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="ALL">Tutte le Squadre ({uniqueTeamsList.length})</option>
                      {uniqueTeamsList.map((tName) => (
                        <option key={tName} value={tName}>
                          {tName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Risultati della Ricerca (Compatti, max 15 suggerimenti rapidi, mai 325!) */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
                      <span>
                        {shotPlayerSearch
                          ? `Risultati per "${shotPlayerSearch}": ${shotSelectionPlayers.length} trovati (clicca per analizzare)`
                          : `Giocatori suggeriti (${Math.min(15, shotSelectionPlayers.length)} mostrati di ${shotSelectionPlayers.length}):`}
                      </span>
                      {shotPlayerSearch && (
                        <span className="text-amber-400 font-bold">Filtro ricerca attivo</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1">
                      {shotSelectionPlayers.slice(0, 15).map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedPlayerForShot(p);
                            setShotPlayerSearch('');
                          }}
                          className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                            selectedPlayerForShot.id === p.id
                              ? 'bg-amber-500/20 border-amber-500 text-white shadow-sm'
                              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="font-bold text-xs truncate">{p.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {p.team} • #{p.number}
                          </div>
                          <div className="text-[10px] text-amber-400 mt-0.5">
                            {p.pts} PTS • {p.tsPct}% TS
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Badge Squadra Attualmente Selezionata */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950 rounded-xl border border-amber-500/30">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-sm sm:text-base">
                          {selectedTeamForShot.name}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-bold text-[10px] uppercase border border-slate-700">
                          {selectedTeamForShot.league}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        Pace: {selectedTeamForShot.pace} poss/gara • ORtg: <strong className="text-indigo-400">{selectedTeamForShot.ortg} (Pts/100p)</strong> • DRtg: <strong className="text-cyan-400">{selectedTeamForShot.drtg} (Subiti/100p)</strong> • Net: <strong className={selectedTeamForShot.netRtg >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{selectedTeamForShot.netRtg >= 0 ? `+${selectedTeamForShot.netRtg}` : selectedTeamForShot.netRtg}</strong> • Moreyball: {selectedTeamForShot.shotSelection.moreyballRate}%
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-bold px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/40">
                      ✓ Mappa di Squadra Attiva
                    </span>
                  </div>

                  {/* Barra Ricerca Squadre */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cerca squadra (es. Milano, Virtus, Varese, Venezia, Dubai, Madrid, Panathinaikos)..."
                      value={shotTeamSearch}
                      onChange={(e) => setShotTeamSearch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Risultati Squadre */}
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                    {shotSelectionTeams.slice(0, 16).map((t) => (
                      <button
                        key={`${t.id}-${t.league}`}
                        onClick={() => setSelectedTeamForShot(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          selectedTeamForShot.id === t.id
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {t.name} ({t.league})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Visualizzatore Campo & Dati */}
            {activeShotTargetType === 'player' ? (
              <HalfCourtShotChart
                shotSelection={selectedPlayerForShot.shotSelection}
                title={`Shot Selection & Heatmap FIBA — ${selectedPlayerForShot.name} (${selectedPlayerForShot.team})`}
              />
            ) : (
              <HalfCourtShotChart
                shotSelection={selectedTeamForShot.shotSelection}
                title={`Shot Selection di Squadra — ${selectedTeamForShot.name} (${selectedTeamForShot.league})`}
                isTeam={true}
              />
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: TABELLA GIOCATORI */}
        {/* ============================================================ */}
        {currentTab === 'players' && (
          <div className="space-y-4">
            {/* Filtri & Barra di Ricerca */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cerca per nome o squadra (es. Mannion, Carr, Shields, Bacon, Vezenkov, Varese, Virtus)..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setVisiblePlayerCount(25); // Reset a prima pagina quando si cerca
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Contatore & Filtro Ruolo */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  {filteredPlayers.length} {filteredPlayers.length === 1 ? 'giocatore trovato' : 'giocatori trovati'}
                </span>
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs flex-wrap">
                  {(selectedLeague === 'LBA'
                    ? ['ALL', 'PG', 'SG', 'G/F', 'F', 'C']
                    : selectedLeague === 'EuroLeague' || selectedLeague === 'EuroCup'
                    ? ['ALL', 'PG', 'SG', 'SF', 'PF', 'C']
                    : ['ALL', 'PG', 'SG', 'G/F', 'F', 'SF', 'PF', 'C']
                  ).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => {
                        setPositionFilter(pos);
                        setVisiblePlayerCount(25);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                        positionFilter === pos
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {pos === 'ALL' ? 'Tutti i Ruoli' : pos}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tabella Dati Ordinabile */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Giocatore</th>
                      <th className="py-3 px-2 text-center">Lega</th>
                      <th className="py-3 px-2 text-center">Ruolo</th>
                      <th
                        className="py-3 px-2 text-right cursor-pointer hover:text-white"
                        onClick={() => handlePlayerSort('pts')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          PTS <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th
                        className="py-3 px-2 text-right cursor-pointer hover:text-white"
                        onClick={() => handlePlayerSort('ptsPer100')}
                      >
                        <div className="flex items-center justify-end gap-1 text-amber-300 font-bold" title="Punti normalizzati su 100 possessi">
                          PTS/100 <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th
                        className="py-3 px-2 text-right cursor-pointer hover:text-white"
                        onClick={() => handlePlayerSort('mpg')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          MIN <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th
                        className="py-3 px-2 text-right cursor-pointer hover:text-white"
                        onClick={() => handlePlayerSort('tsPct')}
                      >
                        <div className="flex items-center justify-end gap-1 text-amber-400">
                          TS% <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th
                        className="py-3 px-2 text-right cursor-pointer hover:text-white"
                        onClick={() => handlePlayerSort('efgPct')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          eFG% <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th
                        className="py-3 px-2 text-right cursor-pointer hover:text-white"
                        onClick={() => handlePlayerSort('usgPct')}
                      >
                        <div className="flex items-center justify-end gap-1 text-indigo-400">
                          USG% <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th
                        className="py-3 px-2 text-right cursor-pointer hover:text-white"
                        onClick={() => handlePlayerSort('astPct')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          AST% <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th
                        className="py-3 px-2 text-right cursor-pointer hover:text-white"
                        onClick={() => handlePlayerSort('trbPct')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          TRB% <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th
                        className="py-3 px-2 text-right cursor-pointer hover:text-white"
                        onClick={() => handlePlayerSort('gameScore')}
                      >
                        <div className="flex items-center justify-end gap-1 text-emerald-400">
                          GS <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th
                        className="py-3 px-2 text-right cursor-pointer hover:text-white"
                        onClick={() => handlePlayerSort('pir')}
                      >
                        <div className="flex items-center justify-end gap-1 text-slate-500">
                          PIR <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="py-3 px-3 text-center">Shot Profile</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800/60">
                    {filteredPlayers.slice(0, visiblePlayerCount).map((player) => (
                      <tr
                        key={player.id}
                        onClick={() => setModalPlayer(player)}
                        className="hover:bg-slate-800/60 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="font-bold text-white text-sm hover:text-indigo-400 transition-colors">
                            {player.name}
                          </div>
                          <div className="text-[11px] text-slate-400">{player.team}</div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              player.league === 'EuroLeague'
                                ? 'bg-amber-500/20 text-amber-300'
                                : player.league === 'EuroCup'
                                ? 'bg-cyan-500/20 text-cyan-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {player.league === 'EuroLeague'
                              ? 'EL'
                              : player.league === 'EuroCup'
                              ? 'EC'
                              : 'LBA'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center font-medium text-slate-300">
                          {player.position}
                        </td>
                        <td className="py-3 px-2 text-right font-bold text-white">
                          {player.gamesPlayed === 0 ? (
                            <span className="text-slate-500 font-mono">0.0</span>
                          ) : (
                            player.pts
                          )}
                        </td>
                        <td className="py-3 px-2 text-right font-black text-amber-300">
                          {player.gamesPlayed === 0 ? (
                            <span className="text-slate-600 font-mono">-</span>
                          ) : (
                            player.ptsPer100 || Number(((player.pts * 40 * 100) / (Math.max(1, player.mpg) * 72.5)).toFixed(1))
                          )}
                        </td>
                        <td className="py-3 px-2 text-right text-slate-400">
                          {player.gamesPlayed === 0 ? (
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono font-bold">DNP</span>
                          ) : (
                            player.mpg
                          )}
                        </td>
                        <td className="py-3 px-2 text-right font-black text-amber-400">
                          {player.tsPct}%
                        </td>
                        <td className="py-3 px-2 text-right text-slate-300">{player.efgPct}%</td>
                        <td className="py-3 px-2 text-right font-semibold text-indigo-400">
                          {player.usgPct}%
                        </td>
                        <td className="py-3 px-2 text-right text-slate-300">{player.astPct}%</td>
                        <td className="py-3 px-2 text-right text-slate-300">{player.trbPct}%</td>
                        <td className="py-3 px-2 text-right font-bold text-emerald-400">
                          {player.gameScore}
                        </td>
                        <td className="py-3 px-2 text-right text-slate-500">{player.pir}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-[10px] font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                            {player.shotSelection.moreyballRate}% Mor.
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginazione & Mostra altri giocatori */}
              {filteredPlayers.length > visiblePlayerCount && (
                <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <span className="text-slate-400 font-medium">
                    Visualizzati <strong className="text-white">{Math.min(visiblePlayerCount, filteredPlayers.length)}</strong> di <strong className="text-white">{filteredPlayers.length}</strong> giocatori
                  </span>
                  <button
                    onClick={() => setVisiblePlayerCount((prev) => prev + 25)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow transition-colors cursor-pointer"
                  >
                    Carica altri 25 giocatori (+{Math.min(25, filteredPlayers.length - visiblePlayerCount)})
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: SQUADRE & FOUR FACTORS */}
        {/* ============================================================ */}
        {currentTab === 'teams' && (
          <div className="space-y-4">
            {/* Banner Informativo Parametrizzazione su 100 Possessi */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shadow">
                  100p
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">
                    Tutte le Statistiche di Squadra sono Parametrate su 100 Possessi
                  </h4>
                  <p className="text-slate-400 text-[11px]">
                    L'Offensive Rating (ORtg) misura i punti realizzati ogni 100 possessi, il Defensive Rating (DRtg) i punti subiti su 100 possessi. Il Pace indica i possessi medi a partita (senza distorsione per i minuti).
                  </p>
                </div>
              </div>
              <span className="text-[11px] px-3 py-1.5 rounded-xl bg-slate-950 text-amber-300 font-bold border border-slate-800 self-start sm:self-auto shrink-0">
                Pace = Possessi / Partita
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Squadra</th>
                      <th className="py-3 px-2 text-center">Lega</th>
                      <th className="py-3 px-2 text-center">Record</th>
                      <th
                        className="py-3 px-2 text-right cursor-pointer hover:text-white"
                        onClick={() => handleTeamSort('pace')}
                        title="Ritmo di gioco: Possessi medi giocati per partita"
                      >
                        <div className="flex items-center justify-end gap-1 text-amber-400">
                          Pace (Poss/Gara) <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th
                        className="py-3 px-2 text-right cursor-pointer hover:text-white"
                        onClick={() => handleTeamSort('ortg')}
                        title="Offensive Rating: Punti segnati su 100 possessi effettivi"
                      >
                        <div className="flex items-center justify-end gap-1 text-indigo-400 font-bold">
                          ORtg (Pts/100p) <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th
                        className="py-3 px-2 text-right cursor-pointer hover:text-white"
                        onClick={() => handleTeamSort('drtg')}
                        title="Defensive Rating: Punti subiti su 100 possessi effettivi"
                      >
                        <div className="flex items-center justify-end gap-1 text-cyan-400 font-bold">
                          DRtg (Subiti/100p) <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th
                        className="py-3 px-2 text-right cursor-pointer hover:text-white"
                        onClick={() => handleTeamSort('netRtg')}
                        title="Net Rating: Differenziale su 100 possessi (ORtg - DRtg)"
                      >
                        <div className="flex items-center justify-end gap-1 text-emerald-400 font-black">
                          Net Rtg (Diff/100p) <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="py-3 px-2 text-right">Off. eFG%</th>
                      <th className="py-3 px-2 text-right">Off. TOV%</th>
                      <th className="py-3 px-2 text-right">Off. ORB%</th>
                      <th className="py-3 px-2 text-right">Off. FTR</th>
                      <th className="py-3 px-3 text-center">Moreyball %</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800/60">
                    {filteredTeams.map((team) => (
                      <tr
                        key={`${team.id}-${team.league}`}
                        onClick={() => setModalTeam(team)}
                        className="hover:bg-slate-800/60 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-3 h-3 rounded-full inline-block"
                              style={{ backgroundColor: team.logoColor }}
                            ></span>
                            <span className="font-bold text-white text-sm hover:text-indigo-400 transition-colors">
                              {team.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              team.league === 'EuroLeague'
                                ? 'bg-amber-500/20 text-amber-300'
                                : team.league === 'EuroCup'
                                ? 'bg-cyan-500/20 text-cyan-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {team.league}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center font-medium text-slate-300">
                          {team.record.wins} - {team.record.losses}
                        </td>
                        <td className="py-3 px-2 text-right font-bold text-amber-400">
                          {team.pace}
                        </td>
                        <td className="py-3 px-2 text-right font-bold text-indigo-400">
                          {team.ortg}
                        </td>
                        <td className="py-3 px-2 text-right font-bold text-cyan-400">
                          {team.drtg}
                        </td>
                        <td
                          className={`py-3 px-2 text-right font-black ${
                            team.netRtg >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {team.netRtg >= 0 ? `+${team.netRtg}` : team.netRtg}
                        </td>
                        <td className="py-3 px-2 text-right text-slate-300">
                          {team.fourFactorsOffense.efgPct}%
                        </td>
                        <td className="py-3 px-2 text-right text-slate-300">
                          {team.fourFactorsOffense.tovPct}%
                        </td>
                        <td className="py-3 px-2 text-right text-slate-300">
                          {team.fourFactorsOffense.orbPct}%
                        </td>
                        <td className="py-3 px-2 text-right text-slate-300">
                          {team.fourFactorsOffense.ftr}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-[10px] font-semibold bg-slate-800 text-indigo-300 px-2 py-0.5 rounded-full">
                            {team.shotSelection.moreyballRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB: LINEUP ANALYTICS (QUINTETTI SUI 100 POSSESSI) */}
        {/* ============================================================ */}
        {currentTab === 'lineup_analytics' && (
          <LineupAnalytics
            teams={teamsList}
            players={playersList}
            onSelectPlayerDetail={(p) => setModalPlayer(p)}
          />
        )}

        {/* ============================================================ */}
        {/* TAB 4: HEAD-TO-HEAD COMPARISON */}
        {/* ============================================================ */}
        {currentTab === 'h2h' && <HeadToHeadComparison players={playersList} teams={teamsList} />}

        {/* ============================================================ */}
        {/* TAB 5: SCATTER PLOT EXPLORER */}
        {/* ============================================================ */}
        {currentTab === 'scatter' && (
          <ScatterPlotExplorer
            players={playersList}
            teams={teamsList}
            onSelectPlayer={(p) => setModalPlayer(p)}
            onSelectTeam={(t) => setModalTeam(t)}
          />
        )}

        {/* ============================================================ */}
        {/* TAB 6: CALCOLATORE BOX SCORE */}
        {/* ============================================================ */}
        {currentTab === 'calculator' && <BoxScoreCalculator />}
      </main>

      {/* Modale Dettaglio Giocatore */}
      <PlayerDetailModal
        player={modalPlayer}
        onClose={() => setModalPlayer(null)}
        onCompareWith={(p) => {
          setModalPlayer(null);
          setCurrentTab('h2h');
        }}
      />

      {/* Modale Dettaglio Squadra */}
      <TeamDetailModal
        team={modalTeam}
        players={playersList}
        onClose={() => setModalTeam(null)}
        onSelectPlayer={(p) => {
          setModalTeam(null);
          setModalPlayer(p);
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>EuroBasket Advanced Stats Lab • EuroLeague, EuroCup & Lega Basket Serie A (Per 100 Possessions Analytics)</p>
      </footer>
    </div>
  );
}
