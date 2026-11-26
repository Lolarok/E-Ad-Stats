import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ROOT_DIR = typeof process !== 'undefined' && typeof process.cwd === 'function' ? process.cwd() : '.';
const TRAFFIC_STORE_PATH = path.join(ROOT_DIR, 'data_traffic_analytics.json');

export type TrafficEventType = 'session_start' | 'tab_view' | 'heartbeat' | 'interaction';

export interface TrafficEventPayload {
  type: TrafficEventType;
  visitorId?: string;
  sessionId?: string;
  tab?: string;
  action?: string;
  referrer?: string;
  lang?: string;
  screenWidth?: number;
}

export interface SessionRecord {
  sessionId: string;
  visitorId: string;
  startedAt: number;
  lastSeenAt: number;
  pageViews: number;
  interactionsCount: number;
  currentTab: string;
  device: 'Desktop' | 'Mobile' | 'Tablet';
  browser: string;
  os: string;
  lang: string;
  referrer: string;
}

interface DailyBucket {
  pageViews: number;
  sessions: number;
  visitors: string[];
}

interface TrafficStoreSchema {
  startedAt: string;
  totalPageViews: number;
  totalSessions: number;
  uniqueVisitors: string[];
  daily: Record<string, DailyBucket>;
  hourly: number[];
  tabViews: Record<string, number>;
  interactions: Record<string, number>;
  devices: Record<'Desktop' | 'Mobile' | 'Tablet', number>;
  browsers: Record<string, number>;
  osCounts: Record<string, number>;
  referrers: Record<string, number>;
  languages: Record<string, number>;
  recentSessions: SessionRecord[];
}

export interface TrafficDashboardSummary {
  startedAt: string;
  activeNow: number;
  totalUniqueVisitors: number;
  totalSessions: number;
  totalPageViews: number;
  todayVisitors: number;
  todaySessions: number;
  todayPageViews: number;
  avgSessionDurationSec: number;
  avgPagesPerSession: number;
  dailySeries: Array<{
    date: string;
    label: string;
    pageViews: number;
    sessions: number;
    uniqueVisitors: number;
  }>;
  hourlySeries: Array<{
    hour: number;
    label: string;
    hits: number;
  }>;
  topTabs: Array<{ key: string; label: string; count: number; pct: number }>;
  topInteractions: Array<{ key: string; label: string; count: number }>;
  devices: Array<{ label: string; count: number; pct: number }>;
  browsers: Array<{ label: string; count: number; pct: number }>;
  referrers: Array<{ label: string; count: number; pct: number }>;
  languages: Array<{ label: string; count: number; pct: number }>;
  recentSessions: Array<SessionRecord & { durationSec: number; isActive: boolean }>;
}

const TAB_LABELS: Record<string, string> = {
  shot_selection: 'Shot Selection Lab',
  players: 'Giocatori',
  teams: 'Squadre & Four Factors',
  lineup_analytics: 'Lineup Analytics (Quintetti)',
  round_updater: 'Aggiorna Turno (Live Sync)',
  h2h: 'Testa a Testa (H2H)',
  scatter: 'Scatter & Hoopology Studio',
  calculator: 'Calcolatore Box Score',
  traffic: 'Accessi & Contatti App',
};

const INTERACTION_LABELS: Record<string, string> = {
  team_modal_open: 'Apertura Scheda Squadra',
  player_modal_open: 'Apertura Scheda Giocatore',
  garbage_time_toggle: 'Toggle Escludi Garbage Time',
  manual_sync_trigger: 'Sync Manuale Turni',
  h2h_compare_jump: 'Confronto Rapido H2H',
  csv_export: 'Esportazione CSV',
  pbp_sync: 'Sync Play-by-Play',
};

function createEmptyStore(): TrafficStoreSchema {
  return {
    startedAt: new Date().toISOString(),
    totalPageViews: 0,
    totalSessions: 0,
    uniqueVisitors: [],
    daily: {},
    hourly: Array.from({ length: 24 }, () => 0),
    tabViews: {},
    interactions: {},
    devices: { Desktop: 0, Mobile: 0, Tablet: 0 },
    browsers: {},
    osCounts: {},
    referrers: {},
    languages: {},
    recentSessions: [],
  };
}

let cachedStore: TrafficStoreSchema | null = null;
let flushTimer: NodeJS.Timeout | null = null;

function loadStore(): TrafficStoreSchema {
  if (cachedStore) return cachedStore;
  try {
    if (fs.existsSync(TRAFFIC_STORE_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(TRAFFIC_STORE_PATH, 'utf-8'));
      const base = createEmptyStore();
      cachedStore = {
        ...base,
        ...parsed,
        hourly: Array.isArray(parsed.hourly) && parsed.hourly.length === 24 ? parsed.hourly : base.hourly,
        devices: { ...base.devices, ...(parsed.devices || {}) },
        uniqueVisitors: Array.isArray(parsed.uniqueVisitors) ? parsed.uniqueVisitors : [],
        recentSessions: Array.isArray(parsed.recentSessions) ? parsed.recentSessions : [],
      };
      return cachedStore!;
    }
  } catch (e) {}
  cachedStore = createEmptyStore();
  return cachedStore;
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    if (!cachedStore) return;
    try {
      const tmp = `${TRAFFIC_STORE_PATH}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(cachedStore, null, 2), 'utf-8');
      fs.renameSync(tmp, TRAFFIC_STORE_PATH);
    } catch (e) {}
  }, 1500);
}

function parseUserAgent(uaRaw: string, screenWidth?: number): {
  device: 'Desktop' | 'Mobile' | 'Tablet';
  browser: string;
  os: string;
} {
  const ua = uaRaw || '';
  let device: 'Desktop' | 'Mobile' | 'Tablet' = 'Desktop';
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) {
    device = 'Tablet';
  } else if (/Mobile|iPhone|iPod|Android.*Mobile|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    device = 'Mobile';
  } else if (typeof screenWidth === 'number' && screenWidth > 0 && screenWidth < 768) {
    device = 'Mobile';
  } else if (typeof screenWidth === 'number' && screenWidth >= 768 && screenWidth <= 1024 && /Touch/i.test(ua)) {
    device = 'Tablet';
  }

  let browser = 'Altro';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/OPR\/|Opera/i.test(ua)) browser = 'Opera';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Chrome\/|CriOS\//i.test(ua)) browser = 'Chrome';
  else if (/Safari\//i.test(ua)) browser = 'Safari';

  let os = 'Altro';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  return { device, browser, os };
}

function normalizeReferrer(refRaw?: string, selfHost?: string): string {
  if (!refRaw || !refRaw.trim()) return 'Accesso Diretto';
  try {
    const parsed = new URL(refRaw);
    const host = parsed.hostname.replace(/^www\./, '');
    if (!host) return 'Accesso Diretto';
    if (selfHost && selfHost.includes(host)) return 'Accesso Diretto';
    return host;
  } catch {
    return 'Accesso Diretto';
  }
}

function normalizeLanguage(langRaw?: string): string {
  if (!langRaw) return 'N/D';
  const code = langRaw.split(',')[0].split(';')[0].trim().slice(0, 5).toLowerCase();
  if (!code) return 'N/D';
  if (code.startsWith('it')) return 'Italiano (it)';
  if (code.startsWith('en')) return 'Inglese (en)';
  if (code.startsWith('es')) return 'Spagnolo (es)';
  if (code.startsWith('fr')) return 'Francese (fr)';
  if (code.startsWith('de')) return 'Tedesco (de)';
  if (code.startsWith('el')) return 'Greco (el)';
  if (code.startsWith('sr') || code.startsWith('hr')) return 'Serbo/Croato';
  if (code.startsWith('tr')) return 'Turco (tr)';
  return code;
}

function formatDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function recordTrafficEvent(params: {
  payload: TrafficEventPayload;
  userAgent?: string;
  ip?: string;
  acceptLanguage?: string;
  host?: string;
}): { ok: boolean; activeNow: number } {
  const store = loadStore();
  const now = Date.now();
  const nowDate = new Date(now);
  const dateKey = formatDateKey(nowDate);
  const hour = nowDate.getHours();

  const { payload, userAgent = '', ip = '0.0.0.0', acceptLanguage = '', host = '' } = params;

  // Ignora crawler/bot noti
  if (/bot|crawler|spider|headless|healthcheck/i.test(userAgent)) {
    return { ok: true, activeNow: countActiveSessions(store, now) };
  }

  const visitorId =
    payload.visitorId && payload.visitorId.trim().length >= 6
      ? payload.visitorId.trim().slice(0, 48)
      : crypto.createHash('sha256').update(`${ip}|${userAgent}`).digest('hex').slice(0, 16);

  const sessionId =
    payload.sessionId && payload.sessionId.trim().length >= 6
      ? payload.sessionId.trim().slice(0, 48)
      : `${visitorId}_${dateKey}`;

  const { device, browser, os } = parseUserAgent(userAgent, payload.screenWidth);
  const referrer = normalizeReferrer(payload.referrer, host);
  const lang = normalizeLanguage(payload.lang || acceptLanguage);

  // Registra visitatore unico globale
  if (!store.uniqueVisitors.includes(visitorId)) {
    store.uniqueVisitors.push(visitorId);
    if (store.uniqueVisitors.length > 5000) {
      store.uniqueVisitors.shift();
    }
  }

  // Bucket giornaliero
  if (!store.daily[dateKey]) {
    store.daily[dateKey] = { pageViews: 0, sessions: 0, visitors: [] };
  }
  const dayBucket = store.daily[dateKey];
  if (!dayBucket.visitors.includes(visitorId)) {
    dayBucket.visitors.push(visitorId);
    if (dayBucket.visitors.length > 3000) {
      dayBucket.visitors.shift();
    }
  }

  // Cerca sessione esistente
  let session = store.recentSessions.find((s) => s.sessionId === sessionId);
  const isNewSession = !session;

  if (!session) {
    session = {
      sessionId,
      visitorId,
      startedAt: now,
      lastSeenAt: now,
      pageViews: 0,
      interactionsCount: 0,
      currentTab: payload.tab || 'shot_selection',
      device,
      browser,
      os,
      lang,
      referrer,
    };
    store.recentSessions.unshift(session);
    if (store.recentSessions.length > 100) {
      store.recentSessions = store.recentSessions.slice(0, 100);
    }

    store.totalSessions += 1;
    dayBucket.sessions += 1;
    store.devices[device] = (store.devices[device] || 0) + 1;
    store.browsers[browser] = (store.browsers[browser] || 0) + 1;
    store.osCounts[os] = (store.osCounts[os] || 0) + 1;
    store.referrers[referrer] = (store.referrers[referrer] || 0) + 1;
    store.languages[lang] = (store.languages[lang] || 0) + 1;
  } else {
    session.lastSeenAt = now;
    if (payload.tab) {
      session.currentTab = payload.tab;
    }
  }

  if (payload.type === 'session_start' || payload.type === 'tab_view') {
    // Evita doppio conteggio immediato al boot se tab_view arriva insieme a session_start entro 1s
    if (!(payload.type === 'tab_view' && isNewSession)) {
      store.totalPageViews += 1;
      dayBucket.pageViews += 1;
      store.hourly[hour] = (store.hourly[hour] || 0) + 1;
      session.pageViews += 1;
    } else if (session.pageViews === 0) {
      store.totalPageViews += 1;
      dayBucket.pageViews += 1;
      store.hourly[hour] = (store.hourly[hour] || 0) + 1;
      session.pageViews = 1;
    }

    if (payload.tab) {
      store.tabViews[payload.tab] = (store.tabViews[payload.tab] || 0) + 1;
    }
  } else if (payload.type === 'interaction') {
    session.interactionsCount += 1;
    if (payload.action) {
      store.interactions[payload.action] = (store.interactions[payload.action] || 0) + 1;
    }
  }

  // Riordina recentSessions per ultimo heartbeat
  store.recentSessions.sort((a, b) => b.lastSeenAt - a.lastSeenAt);

  // Mantieni massimo 60 giorni nello storico giornaliero
  const dayKeys = Object.keys(store.daily).sort();
  if (dayKeys.length > 60) {
    for (const oldKey of dayKeys.slice(0, dayKeys.length - 60)) {
      delete store.daily[oldKey];
    }
  }

  scheduleFlush();
  return { ok: true, activeNow: countActiveSessions(store, now) };
}

function countActiveSessions(store: TrafficStoreSchema, now = Date.now()): number {
  const ACTIVE_WINDOW_MS = 3 * 60 * 1000;
  return store.recentSessions.filter((s) => now - s.lastSeenAt <= ACTIVE_WINDOW_MS).length;
}

export function getTrafficDashboardSummary(daysCount = 14): TrafficDashboardSummary {
  const store = loadStore();
  const now = Date.now();
  const todayKey = formatDateKey(new Date(now));
  const todayBucket = store.daily[todayKey] || { pageViews: 0, sessions: 0, visitors: [] };

  const activeNow = countActiveSessions(store, now);

  // Serie giornaliera ultimi N giorni continui
  const dailySeries: TrafficDashboardSummary['dailySeries'] = [];
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now - i * 86_400_000);
    const key = formatDateKey(d);
    const bucket = store.daily[key];
    const label = d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
    dailySeries.push({
      date: key,
      label,
      pageViews: bucket?.pageViews || 0,
      sessions: bucket?.sessions || 0,
      uniqueVisitors: bucket?.visitors?.length || 0,
    });
  }

  // Serie oraria 00..23
  const hourlySeries = store.hourly.map((hits, hour) => ({
    hour,
    label: `${String(hour).padStart(2, '0')}:00`,
    hits,
  }));

  // Medie sessioni
  const sessionsSample = store.recentSessions;
  const avgSessionDurationSec =
    sessionsSample.length > 0
      ? Math.round(
          sessionsSample.reduce((sum, s) => sum + Math.max(0, Math.round((s.lastSeenAt - s.startedAt) / 1000)), 0) /
            sessionsSample.length
        )
      : 0;

  const avgPagesPerSession =
    store.totalSessions > 0 ? Number((store.totalPageViews / store.totalSessions).toFixed(1)) : 0;

  const totalTabHits = Object.values(store.tabViews).reduce((a, b) => a + b, 0) || 1;
  const topTabs = Object.entries(store.tabViews)
    .map(([key, count]) => ({
      key,
      label: TAB_LABELS[key] || key,
      count,
      pct: Number(((count / totalTabHits) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.count - a.count);

  const topInteractions = Object.entries(store.interactions)
    .map(([key, count]) => ({
      key,
      label: INTERACTION_LABELS[key] || key,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const toRankedBreakdown = (record: Record<string, number>) => {
    const sum = Object.values(record).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(record)
      .filter(([, count]) => count > 0)
      .map(([label, count]) => ({
        label,
        count,
        pct: Number(((count / sum) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.count - a.count);
  };

  const ACTIVE_WINDOW_MS = 3 * 60 * 1000;
  const recentSessions = store.recentSessions.slice(0, 30).map((s) => ({
    ...s,
    currentTab: TAB_LABELS[s.currentTab] || s.currentTab,
    durationSec: Math.max(0, Math.round((s.lastSeenAt - s.startedAt) / 1000)),
    isActive: now - s.lastSeenAt <= ACTIVE_WINDOW_MS,
  }));

  return {
    startedAt: store.startedAt,
    activeNow,
    totalUniqueVisitors: store.uniqueVisitors.length,
    totalSessions: store.totalSessions,
    totalPageViews: store.totalPageViews,
    todayVisitors: todayBucket.visitors.length,
    todaySessions: todayBucket.sessions,
    todayPageViews: todayBucket.pageViews,
    avgSessionDurationSec,
    avgPagesPerSession,
    dailySeries,
    hourlySeries,
    topTabs,
    topInteractions,
    devices: toRankedBreakdown(store.devices),
    browsers: toRankedBreakdown(store.browsers),
    referrers: toRankedBreakdown(store.referrers),
    languages: toRankedBreakdown(store.languages),
    recentSessions,
  };
}

export function resetTrafficAnalytics(): TrafficDashboardSummary {
  cachedStore = createEmptyStore();
  try {
    fs.writeFileSync(TRAFFIC_STORE_PATH, JSON.stringify(cachedStore, null, 2), 'utf-8');
  } catch (e) {}
  return getTrafficDashboardSummary(14);
}

export function exportRawTrafficStore(): TrafficStoreSchema {
  const store = loadStore();
  return {
    ...store,
    uniqueVisitors: store.uniqueVisitors.slice(-1000),
    hourly: store.hourly.length === 24 ? [...store.hourly] : Array.from({ length: 24 }, () => 0),
    recentSessions: store.recentSessions.slice(0, 50),
  };
}

export function mergeOrHydrateTrafficStore(
  incoming: Partial<TrafficStoreSchema>
): TrafficDashboardSummary {
  const store = loadStore();
  if (!incoming || typeof incoming !== 'object') {
    return getTrafficDashboardSummary(14);
  }

  // Keep earliest startedAt
  if (typeof incoming.startedAt === 'string' && incoming.startedAt.length >= 10) {
    if (!store.startedAt || incoming.startedAt < store.startedAt) {
      store.startedAt = incoming.startedAt;
    }
  }

  // Merge unique visitors set
  if (Array.isArray(incoming.uniqueVisitors)) {
    const mergedVisitors = new Set<string>([...store.uniqueVisitors, ...incoming.uniqueVisitors.map(String)]);
    store.uniqueVisitors = Array.from(mergedVisitors).slice(-5000);
  }

  // Keep max cumulative totals so restarts never reset counters
  if (typeof incoming.totalPageViews === 'number' && incoming.totalPageViews > store.totalPageViews) {
    store.totalPageViews = incoming.totalPageViews;
  }
  if (typeof incoming.totalSessions === 'number' && incoming.totalSessions > store.totalSessions) {
    store.totalSessions = incoming.totalSessions;
  }

  // Merge hourly distribution taking max per hour
  if (Array.isArray(incoming.hourly) && incoming.hourly.length === 24) {
    for (let h = 0; h < 24; h++) {
      const incVal = Number(incoming.hourly[h] || 0);
      if (incVal > (store.hourly[h] || 0)) {
        store.hourly[h] = incVal;
      }
    }
  }

  // Merge daily buckets
  if (incoming.daily && typeof incoming.daily === 'object') {
    for (const [dateKey, bucket] of Object.entries(incoming.daily)) {
      if (!bucket || typeof bucket !== 'object') continue;
      const existing = store.daily[dateKey];
      if (!existing) {
        store.daily[dateKey] = {
          pageViews: Number(bucket.pageViews || 0),
          sessions: Number(bucket.sessions || 0),
          visitors: Array.isArray(bucket.visitors) ? bucket.visitors.map(String).slice(-3000) : [],
        };
      } else {
        existing.pageViews = Math.max(existing.pageViews, Number(bucket.pageViews || 0));
        existing.sessions = Math.max(existing.sessions, Number(bucket.sessions || 0));
        if (Array.isArray(bucket.visitors)) {
          existing.visitors = Array.from(
            new Set<string>([...existing.visitors, ...bucket.visitors.map(String)])
          ).slice(-3000);
        }
      }
    }
  }

  const mergeRecordMax = (
    target: Record<string, number>,
    source?: Record<string, number>
  ) => {
    if (!source || typeof source !== 'object') return;
    for (const [k, v] of Object.entries(source)) {
      const num = Number(v || 0);
      if (num > (target[k] || 0)) {
        target[k] = num;
      }
    }
  };

  mergeRecordMax(store.tabViews, incoming.tabViews);
  mergeRecordMax(store.interactions, incoming.interactions);
  mergeRecordMax(store.devices as unknown as Record<string, number>, incoming.devices as unknown as Record<string, number>);
  mergeRecordMax(store.browsers, incoming.browsers);
  mergeRecordMax(store.osCounts, incoming.osCounts);
  mergeRecordMax(store.referrers, incoming.referrers);
  mergeRecordMax(store.languages, incoming.languages);

  // Merge recentSessions by sessionId
  if (Array.isArray(incoming.recentSessions)) {
    const byId = new Map<string, SessionRecord>();
    for (const s of store.recentSessions) {
      if (s && s.sessionId) byId.set(s.sessionId, s);
    }
    for (const raw of incoming.recentSessions) {
      if (!raw || typeof raw.sessionId !== 'string') continue;
      const prev = byId.get(raw.sessionId);
      if (!prev || (raw.lastSeenAt || 0) > prev.lastSeenAt) {
        byId.set(raw.sessionId, raw as SessionRecord);
      }
    }
    store.recentSessions = Array.from(byId.values())
      .sort((a, b) => b.lastSeenAt - a.lastSeenAt)
      .slice(0, 100);
  }

  try {
    const tmp = `${TRAFFIC_STORE_PATH}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf-8');
    fs.renameSync(tmp, TRAFFIC_STORE_PATH);
  } catch (e) {}

  return getTrafficDashboardSummary(14);
}

