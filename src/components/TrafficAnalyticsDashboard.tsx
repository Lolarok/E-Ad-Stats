import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Activity,
  Eye,
  Clock,
  RefreshCw,
  Download,
  Trash2,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
} from 'lucide-react';
import type { TrafficDashboardSummary } from '../utils/trafficAnalyticsEngine';

interface TrafficAnalyticsDashboardProps {
  onNotify?: (msg: string) => void;
}

function formatDuration(totalSec: number): string {
  if (!totalSec || totalSec < 1) return '< 1s';
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${String(secs).padStart(2, '0')}s`;
}

function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const TrafficAnalyticsDashboard: React.FC<TrafficAnalyticsDashboardProps> = ({ onNotify }) => {
  const [summary, setSummary] = useState<TrafficDashboardSummary | null>(null);
  const [daysWindow, setDaysWindow] = useState<7 | 14 | 30>(14);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  const fetchSummary = useCallback(
    async (silent = false) => {
      if (!silent) setRefreshing(true);
      setError(null);
      try {
        const res = await fetch(`/api/traffic/summary?days=${daysWindow}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: TrafficDashboardSummary = await res.json();
        setSummary(data);
      } catch (err: any) {
        setError(err?.message || 'Impossibile recuperare i dati di traffico.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [daysWindow]
  );

  useEffect(() => {
    fetchSummary(false);
    const interval = setInterval(() => fetchSummary(true), 20000);
    return () => clearInterval(interval);
  }, [fetchSummary]);

  const handleExportCsv = () => {
    if (!summary) return;
    const rows: string[] = [
      ['Data', 'Visualizzazioni', 'Sessioni', 'Contatti Unici'].join(','),
      ...summary.dailySeries.map((d) => [d.date, d.pageViews, d.sessions, d.uniqueVisitors].join(',')),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eurobasket_accessi_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    if (onNotify) onNotify('Report CSV accessi esportato.');
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/traffic/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Errore durante il reset');
      const fresh: TrafficDashboardSummary = await res.json();
      setSummary(fresh);
      setConfirmReset(false);
      if (onNotify) onNotify('Contatori traffico azzerati.');
    } catch (err: any) {
      setError(err?.message || 'Errore reset contatori.');
    } finally {
      setIsResetting(false);
    }
  };

  if (loading && !summary) {
    return (
      <div className="space-y-4">
        <div className="h-16 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
          <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="bg-slate-900 border border-rose-500/40 rounded-xl p-6 text-center space-y-3">
        <p className="text-sm font-semibold text-rose-300">{error}</p>
        <button
          onClick={() => fetchSummary(false)}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 cursor-pointer whitespace-nowrap"
        >
          Riprova
        </button>
      </div>
    );
  }

  if (!summary) return null;

  const maxDailyViews = Math.max(1, ...summary.dailySeries.map((d) => d.pageViews));
  const maxHourlyHits = Math.max(1, ...summary.hourlySeries.map((h) => h.hits));

  return (
    <div className="space-y-5">
      {/* Header Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">Dashboard Accessi & Contatti App</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitoraggio reale sessioni, visitatori unici, sezioni consultate e dispositivi · Attivo dal{' '}
            <span className="font-mono tabular-nums text-slate-300">
              {new Date(summary.startedAt).toLocaleDateString('it-IT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Finestra Giorni */}
          <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800">
            {([7, 14, 30] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDaysWindow(d)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  daysWindow === d ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {d} giorni
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchSummary(false)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Aggiorna</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Esporta CSV</span>
          </button>

          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-rose-950/50 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/40 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Azzera</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 bg-rose-950/40 border border-rose-500/40 rounded-lg px-2 py-1">
              <span className="text-[11px] text-rose-200 font-medium whitespace-nowrap">Confermi?</span>
              <button
                onClick={handleReset}
                disabled={isResetting}
                className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-bold cursor-pointer whitespace-nowrap"
              >
                {isResetting ? '...' : 'Sì, azzera'}
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium cursor-pointer whitespace-nowrap"
              >
                Annulla
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 5 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Utenti Online Ora</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
              {summary.activeNow}
            </span>
            <span className="text-[11px] text-slate-500">attivi ultimi 3 min</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Contatti Unici Totali</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {summary.totalUniqueVisitors.toLocaleString('it-IT')}
            </span>
            <span className="text-[11px] text-slate-500">visitatori distinti</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Sessioni Totali</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {summary.totalSessions.toLocaleString('it-IT')}
            </span>
            <span className="text-[11px] text-slate-400 font-mono tabular-nums">
              Ø {formatDuration(summary.avgSessionDurationSec)}
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Contatti Oggi</span>
            <Globe className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold text-cyan-300 font-mono tabular-nums">
              {summary.todayVisitors.toLocaleString('it-IT')}
            </span>
            <span className="text-[11px] text-slate-400 font-mono tabular-nums">
              {summary.todayPageViews} visite oggi
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Aperture Schede Totali</span>
            <Eye className="w-4 h-4 text-slate-300" />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {summary.totalPageViews.toLocaleString('it-IT')}
            </span>
            <span className="text-[11px] text-slate-400 font-mono tabular-nums">
              {summary.avgPagesPerSession} schede/sess.
            </span>
          </div>
        </div>
      </div>

      {/* Charts Row: Daily Trend & Hourly Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {/* Daily Series */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Andamento Giornaliero (Ultimi {daysWindow} giorni)</h3>
              <p className="text-[11px] text-slate-400">Confronto tra visualizzazioni totali e contatti unici</p>
            </div>
            {hoveredDay !== null && summary.dailySeries[hoveredDay] && (
              <div className="text-right text-[11px] font-mono tabular-nums text-slate-200">
                <span className="text-slate-400">{summary.dailySeries[hoveredDay].label}:</span>{' '}
                <strong className="text-indigo-300">{summary.dailySeries[hoveredDay].pageViews} visite</strong> ·{' '}
                <strong className="text-emerald-300">{summary.dailySeries[hoveredDay].uniqueVisitors} unici</strong>
              </div>
            )}
          </div>

          <div className="h-44 flex items-end gap-1.5 pt-4 border-b border-slate-800 pb-2">
            {summary.dailySeries.map((day, idx) => {
              const viewsH = Math.max(day.pageViews > 0 ? 6 : 2, Math.round((day.pageViews / maxDailyViews) * 100));
              const uniqH = Math.max(
                day.uniqueVisitors > 0 ? 4 : 0,
                Math.round((day.uniqueVisitors / maxDailyViews) * 100)
              );
              return (
                <div
                  key={day.date}
                  onMouseEnter={() => setHoveredDay(idx)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className="flex-1 h-full flex flex-col justify-end items-center gap-0.5 group cursor-default"
                  title={`${day.date}: ${day.pageViews} visite, ${day.uniqueVisitors} contatti unici, ${day.sessions} sessioni`}
                >
                  <div className="w-full h-full flex items-end justify-center gap-0.5">
                    <div
                      className="w-2/5 bg-indigo-500/80 group-hover:bg-indigo-400 rounded-t transition-colors"
                      style={{ height: `${viewsH}%` }}
                    />
                    {uniqH > 0 && (
                      <div
                        className="w-2/5 bg-emerald-500/80 group-hover:bg-emerald-400 rounded-t transition-colors"
                        style={{ height: `${uniqH}%` }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono tabular-nums pt-2">
            <span>{summary.dailySeries[0]?.label}</span>
            <span className="flex items-center gap-3 font-sans text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-sm inline-block" /> Visualizzazioni
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm inline-block" /> Contatti Unici
              </span>
            </span>
            <span>{summary.dailySeries[summary.dailySeries.length - 1]?.label}</span>
          </div>
        </div>

        {/* Hourly Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Distribuzione Oraria Accessi (00:00 – 23:00)</h3>
              <p className="text-[11px] text-slate-400">Fasce orarie di maggiore utilizzo dell'applicazione</p>
            </div>
            {hoveredHour !== null && summary.hourlySeries[hoveredHour] && (
              <div className="text-right text-[11px] font-mono tabular-nums text-amber-300">
                Ore {summary.hourlySeries[hoveredHour].label}:{' '}
                <strong>{summary.hourlySeries[hoveredHour].hits} aperture</strong>
              </div>
            )}
          </div>

          <div className="h-44 flex items-end gap-1 pt-4 border-b border-slate-800 pb-2">
            {summary.hourlySeries.map((h) => {
              const barH = Math.max(h.hits > 0 ? 6 : 2, Math.round((h.hits / maxHourlyHits) * 100));
              return (
                <div
                  key={h.hour}
                  onMouseEnter={() => setHoveredHour(h.hour)}
                  onMouseLeave={() => setHoveredHour(null)}
                  className="flex-1 h-full flex items-end justify-center group"
                  title={`${h.label}: ${h.hits} aperture`}
                >
                  <div
                    className={`w-full rounded-t transition-colors ${
                      h.hits > 0 ? 'bg-amber-500/80 group-hover:bg-amber-400' : 'bg-slate-800/70'
                    }`}
                    style={{ height: `${barH}%` }}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono tabular-nums pt-2">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:00</span>
          </div>
        </div>
      </div>

      {/* Breakdown Row: Sections, Devices & Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        {/* Top Sections */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Sezioni Più Visitate</h3>
            <span className="text-[11px] text-slate-400 font-mono tabular-nums">
              {summary.totalPageViews} tot.
            </span>
          </div>

          {summary.topTabs.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              Nessuna visualizzazione di sezione ancora registrata.
            </p>
          ) : (
            <div className="space-y-2.5">
              {summary.topTabs.map((item) => (
                <div key={item.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-200 truncate pr-2">{item.label}</span>
                    <span className="font-mono tabular-nums text-slate-300 shrink-0">
                      {item.count} <span className="text-slate-500">({item.pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${Math.min(100, item.pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Interactions & Features */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Azioni & Strumenti Usati</h3>
            <span className="text-[11px] text-slate-400">Eventi reali</span>
          </div>

          {summary.topInteractions.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              Apri schede giocatori/squadre o usa i filtri per registrare eventi di utilizzo.
            </p>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {summary.topInteractions.map((act) => (
                <div key={act.key} className="py-2 flex items-center justify-between text-xs">
                  <span className="text-slate-200">{act.label}</span>
                  <span className="font-mono tabular-nums font-semibold text-cyan-300">
                    {act.count.toLocaleString('it-IT')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Devices, Browsers, Referrers */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-semibold text-white">Dispositivi, Browser & Sorgenti</h3>

          {/* Devices */}
          <div className="space-y-1.5">
            <div className="text-[11px] text-slate-400 font-medium">Dispositivi</div>
            {summary.devices.length === 0 ? (
              <div className="text-xs text-slate-500">Nessun dato disponibile</div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {summary.devices.map((d) => {
                  const Icon =
                    d.label === 'Mobile' ? Smartphone : d.label === 'Tablet' ? Tablet : Monitor;
                  return (
                    <div
                      key={d.label}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 flex flex-col gap-1"
                    >
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Icon className="w-3.5 h-3.5 text-slate-300" />
                        <span>{d.label}</span>
                      </div>
                      <div className="text-xs font-mono tabular-nums font-semibold text-white">
                        {d.pct}% <span className="text-slate-500 font-normal">({d.count})</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Browsers & Languages */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 font-medium">Browser</div>
              {summary.browsers.slice(0, 4).map((b) => (
                <div key={b.label} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">{b.label}</span>
                  <span className="font-mono tabular-nums text-slate-400">{b.pct}%</span>
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 font-medium">Lingue</div>
              {summary.languages.slice(0, 4).map((l) => (
                <div key={l.label} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 truncate pr-1">{l.label}</span>
                  <span className="font-mono tabular-nums text-slate-400">{l.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Referrers */}
          <div className="pt-2 border-t border-slate-800 space-y-1">
            <div className="text-[11px] text-slate-400 font-medium">Provenienza Accessi</div>
            {summary.referrers.slice(0, 4).map((r) => (
              <div key={r.label} className="flex items-center justify-between text-xs">
                <span className="text-slate-300 truncate pr-2">{r.label}</span>
                <span className="font-mono tabular-nums text-slate-400">
                  {r.count} ({r.pct}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Sessions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Sessioni Recenti (Ultime 30)</h3>
            <p className="text-[11px] text-slate-400">
              Identificativi anonimizzati lato client, senza memorizzazione di IP in chiaro
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono tabular-nums">
            {summary.recentSessions.length} sessioni mostrate
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-2.5 px-4 whitespace-nowrap">Stato</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Ingresso</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Contatto</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Dispositivo / Browser</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Lingua</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Provenienza</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Ultima Sezione</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Schede</th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap">Durata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {summary.recentSessions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    Nessuna sessione registrata finora.
                  </td>
                </tr>
              ) : (
                summary.recentSessions.map((s) => (
                  <tr key={s.sessionId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span
                        className={`text-[11px] font-semibold ${
                          s.isActive ? 'text-emerald-400' : 'text-slate-400'
                        }`}
                      >
                        {s.isActive ? 'Online' : 'Conclusa'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-slate-300 whitespace-nowrap">
                      {formatDateTime(s.startedAt)}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-slate-400 whitespace-nowrap">
                      #{s.visitorId.slice(0, 8)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-200 whitespace-nowrap">
                      {s.device} · {s.browser} ({s.os})
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">{s.lang}</td>
                    <td className="py-2.5 px-3 text-slate-300 max-w-[160px] truncate">{s.referrer}</td>
                    <td className="py-2.5 px-3 text-indigo-300 whitespace-nowrap">{s.currentTab}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-200">
                      {s.pageViews}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-300 whitespace-nowrap">
                      {formatDuration(s.durationSec)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
