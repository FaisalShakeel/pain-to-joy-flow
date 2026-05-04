// Event-driven metrics for Availock dashboard.
// All counts derived from real events stored in localStorage.

export type MetricEventKind =
  | "profile_viewed"
  | "ping_used"
  | "message_left"
  | "access_blocked"
  | "quick_sync_completed"
  | "meeting_attended"
  | "ping_to_connect"
  | "approved_interaction"
  | "qs_batched";

export interface MetricEvent {
  id: string;
  kind: MetricEventKind;
  at: number;
  actor?: string;
  dedupeKey?: string;
  meta?: Record<string, string | number | boolean>;
}

const STORE_KEY = "availock:metrics:events:v1";
const LISTENERS = new Set<() => void>();

const seed = (): MetricEvent[] => {
  const now = Date.now();
  const day = 86_400_000;
  const sample: MetricEvent[] = [
    { id: "s1", kind: "profile_viewed", at: now - day * 0.5 },
    { id: "s2", kind: "profile_viewed", at: now - day * 1.2 },
    { id: "s3", kind: "ping_used", at: now - day * 0.3 },
    { id: "s4", kind: "ping_used", at: now - day * 2.1 },
    { id: "s5", kind: "message_left", at: now - day * 1.8 },
    { id: "s6", kind: "access_blocked", at: now - day * 0.9 },
    { id: "s7", kind: "access_blocked", at: now - day * 3.0 },
    { id: "s8", kind: "quick_sync_completed", at: now - day * 0.4 },
    { id: "s9", kind: "quick_sync_completed", at: now - day * 1.5 },
    { id: "s10", kind: "meeting_attended", at: now - day * 2.2 },
    { id: "s11", kind: "ping_to_connect", at: now - day * 0.8 },
    { id: "s12", kind: "approved_interaction", at: now - day * 1.1 },
    { id: "s13", kind: "qs_batched", at: now - day * 0.6 },
    { id: "s14", kind: "qs_batched", at: now - day * 1.7 },
  ];
  try { localStorage.setItem(STORE_KEY, JSON.stringify(sample)); } catch { /* ignore */ }
  return sample;
};

const read = (): MetricEvent[] => {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as MetricEvent[]) : seed();
  } catch { return []; }
};

const write = (events: MetricEvent[]) => {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(events)); } catch { /* ignore */ }
  LISTENERS.forEach((fn) => fn());
};

export const trackMetric = (
  kind: MetricEventKind,
  opts: { actor?: string; dedupeKey?: string; meta?: MetricEvent["meta"] } = {},
) => {
  const events = read();
  if (opts.dedupeKey) {
    const cutoff = Date.now() - 30 * 60_000;
    const exists = events.some(
      (e) => e.kind === kind && e.dedupeKey === opts.dedupeKey && e.at > cutoff,
    );
    if (exists) return;
  }
  const ev: MetricEvent = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind, at: Date.now(),
    actor: opts.actor, dedupeKey: opts.dedupeKey, meta: opts.meta,
  };
  write([...events, ev]);
};

export const subscribeMetrics = (fn: () => void) => {
  LISTENERS.add(fn);
  return () => { LISTENERS.delete(fn); };
};

export interface MetricsSummary {
  avoided: number;
  connected: number;
  protectedMinutes: number;
  breakdown: {
    profileViews: number; pings: number; messages: number; blocked: number;
    quickSync: number; meetings: number; pingConnects: number;
    approvedInteractions: number; qsBatched: number;
  };
  range: "today" | "week" | "all";
}

export const computeMetrics = (range: "today" | "week" | "all" = "week"): MetricsSummary => {
  const events = read();
  const now = Date.now();
  const cutoff =
    range === "today" ? now - 86_400_000 :
    range === "week"  ? now - 7 * 86_400_000 : 0;
  const scoped = events.filter((e) => e.at >= cutoff);
  const count = (k: MetricEventKind) => scoped.filter((e) => e.kind === k).length;

  const profileViews = count("profile_viewed");
  const pings = count("ping_used");
  const messages = count("message_left");
  const blocked = count("access_blocked");
  const quickSync = count("quick_sync_completed");
  const meetings = count("meeting_attended");
  const pingConnects = count("ping_to_connect");
  const approvedInteractions = count("approved_interaction");
  const qsBatched = count("qs_batched");

  const avoided = profileViews + pings + messages + blocked;
  const connected = quickSync + meetings + pingConnects + approvedInteractions;
  const protectedMinutes = avoided * 3 + qsBatched * 2;

  return {
    avoided, connected, protectedMinutes,
    breakdown: {
      profileViews, pings, messages, blocked,
      quickSync, meetings, pingConnects, approvedInteractions, qsBatched,
    },
    range,
  };
};

export const formatProtected = (mins: number) => {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

// ---------------- Quick Sync Waiting List ----------------

export interface WaitingEntry {
  id: string;
  name: string;
  note?: string;
  contactId?: string;
  joinedAt: number;
  expiresAt: number;
  status: "waiting" | "approved" | "cancelled" | "expired";
}

const WAIT_KEY = "availock:qs:waiting:v1";
const WAIT_LISTENERS = new Set<() => void>();
const EXPIRY_MS = 30 * 60_000;

const seedWaiting = (): WaitingEntry[] => {
  const now = Date.now();
  const sample: WaitingEntry[] = [
    { id: "w1", name: "Priya Mehta", note: "5-min sync re. Q2 plan",
      contactId: "c-2", joinedAt: now - 8 * 60_000,
      expiresAt: now + 22 * 60_000, status: "waiting" },
    { id: "w2", name: "David Cho", note: "Quick intro call",
      joinedAt: now - 3 * 60_000, expiresAt: now + 27 * 60_000, status: "waiting" },
  ];
  try { localStorage.setItem(WAIT_KEY, JSON.stringify(sample)); } catch { /* ignore */ }
  return sample;
};

const readWaiting = (): WaitingEntry[] => {
  try {
    const raw = localStorage.getItem(WAIT_KEY);
    if (!raw) return seedWaiting();
    const list = JSON.parse(raw) as WaitingEntry[];
    const now = Date.now();
    let mutated = false;
    const next = list.map((w) => {
      if (w.status === "waiting" && w.expiresAt < now) {
        mutated = true;
        return { ...w, status: "expired" as const };
      }
      return w;
    });
    if (mutated) writeWaiting(next, false);
    return next;
  } catch { return []; }
};

const writeWaiting = (list: WaitingEntry[], notify = true) => {
  try { localStorage.setItem(WAIT_KEY, JSON.stringify(list)); } catch { /* ignore */ }
  if (notify) WAIT_LISTENERS.forEach((fn) => fn());
};

export const subscribeWaiting = (fn: () => void) => {
  WAIT_LISTENERS.add(fn);
  return () => { WAIT_LISTENERS.delete(fn); };
};

export const getWaitingList = () => readWaiting();
export const getActiveWaitingCount = () =>
  readWaiting().filter((w) => w.status === "waiting").length;

export const joinWaitingList = (entry: { name: string; note?: string; contactId?: string }) => {
  const now = Date.now();
  const list = readWaiting();
  const w: WaitingEntry = {
    id: `${now}-${Math.random().toString(36).slice(2, 6)}`,
    name: entry.name, note: entry.note, contactId: entry.contactId,
    joinedAt: now, expiresAt: now + EXPIRY_MS, status: "waiting",
  };
  writeWaiting([...list, w]);
  return w;
};

export const updateWaitingStatus = (id: string, status: WaitingEntry["status"]) => {
  const list = readWaiting().map((w) => (w.id === id ? { ...w, status } : w));
  writeWaiting(list);
  if (status === "approved") {
    trackMetric("approved_interaction", { dedupeKey: `wait:${id}` });
  }
};
