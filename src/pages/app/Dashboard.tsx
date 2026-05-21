import { Link } from "react-router-dom";
import {
  CalendarDays, ArrowRight, Inbox, Clock, Users, ChevronDown, Check,
  Zap, CheckCircle2, Timer, Radio, Building2,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import StatusPill from "@/components/app/StatusPill";
import Avatar from "@/components/app/Avatar";
import MessagesPanel from "@/components/app/MessagesPanel";
import PriorityContactsWidget from "@/components/app/PriorityContactsWidget";
import SpotlightBoard from "@/components/app/SpotlightBoard";
import { me, contacts, threads } from "@/lib/mockData";
import { useRequests } from "@/components/app/RequestsContext";
import { useState } from "react";
import { useRole } from "@/lib/role";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import StatusContextPanel from "@/components/app/StatusContextPanel";
import QuickSyncOwnerDialog from "@/components/app/QuickSyncOwnerDialog";
import WaitingList from "@/components/app/WaitingList";
import { useMetrics, useWaitingList } from "@/hooks/use-metrics";
import { formatProtected } from "@/lib/metrics";

type StatusKey = "available" | "busy" | "focus" | "driving" | "offline";

const statusMeta: Record<StatusKey, { label: string; activeBg: string; activeText: string; ring: string; pillBg: string; pillText: string; dot: string }> = {
  available: { label: "Available", activeBg: "bg-emerald-500",  activeText: "text-white", ring: "ring-emerald-500/30",  pillBg: "bg-emerald-500/10",  pillText: "text-emerald-700",  dot: "bg-emerald-500" },
  busy:      { label: "Busy",      activeBg: "bg-orange-500",   activeText: "text-white", ring: "ring-orange-500/30",   pillBg: "bg-orange-500/10",   pillText: "text-orange-700",   dot: "bg-orange-500" },
  focus:     { label: "Focus",     activeBg: "bg-sky-500",      activeText: "text-white", ring: "ring-sky-500/30",      pillBg: "bg-sky-500/10",      pillText: "text-sky-700",      dot: "bg-sky-500" },
  driving:   { label: "Driving",   activeBg: "bg-violet-600",   activeText: "text-white", ring: "ring-violet-600/30",   pillBg: "bg-violet-600/10",   pillText: "text-violet-700",   dot: "bg-violet-600" },
  offline:   { label: "Offline",   activeBg: "bg-muted-foreground/70", activeText: "text-white", ring: "ring-muted-foreground/30", pillBg: "bg-muted",  pillText: "text-muted-foreground", dot: "bg-muted-foreground/60" },
};

// Auto status (Line 2) — system-synced based on current mode
const AUTO_STATUS: Record<StatusKey, string> = {
  available: "Available for technical sync",
  busy:      "In a meeting",
  focus:     "In deep work mode",
  driving:   "Driving — hands-free only",
  offline:   "Offline — back tomorrow",
};

// Default context (Line 3) — switches with status mode, brand-flavored
const DEFAULT_CONTEXT: Record<StatusKey, string> = {
  available: "HOPEN 4 Business.",
  busy:      "BUSY — Ping, don't call.",
  focus:     "FOCUS mode — no interruptions.",
  driving:   "DRIVING — hands-free only.",
  offline:   "OFFLINE — back tomorrow.",
};

// Quick context (Line 3) — grouped by current status mode
const CONTEXT_BY_MODE: Record<StatusKey, { label: string; items: string[] }[]> = {
  available: [
    { label: "Available", items: [
      "HOPEN 4 Business.",
      "Available for quick sync",
      "Ping me anytime",
      "Open for a 3-min call",
      "Quick ping works best",
    ]},
  ],
  busy: [
    { label: "Busy", items: [
      "In a meeting — back soon",
      "Leave a message if urgent",
      "Messages only right now",
      "Will revert back",
      "Between meetings",
    ]},
  ],
  focus: [
    { label: "Focus — Professional", items: [
      "Will revert back",
      "Ping or leave a note if urgent",
      "With my boss",
      "Will notify when available",
      "In deep focus",
    ]},
  ],
  driving: [
    { label: "Driving — Playful + Boundary", items: [
      "Call, but traffic fine is on you",
      "Only boss or wife can call 😄",
      "Don't call if you love me",
      "One can wait a bit",
      "Don't rush me",
      "Avoid calling",
    ]},
  ],
  offline: [
    { label: "Offline — Fun / Personal", items: [
      "Let me have fun",
      "Free bird for two days",
      "Replenishing my batteries",
      "Family time",
    ]},
  ],
};

// Mock raw Quick Sync slots from calendar (small granular slots)
const QUICK_SYNC_SLOTS: { start: string; end: string }[] = [
  { start: "10:00", end: "10:15" },
  { start: "10:15", end: "10:30" },
  { start: "14:00", end: "14:15" },
  { start: "14:15", end: "14:30" },
];
const RESERVED_COUNT = 5;

// Reserved — confirmed-only mock data, channel-grouped (fixed channel order).
type ReservedChannel = "Quick Sync" | "Meeting" | "Webinar" | "Venue";
const RESERVED_CHANNELS: ReservedChannel[] = ["Quick Sync", "Meeting", "Webinar", "Venue"];
const RESERVED_BY_CHANNEL: Record<ReservedChannel, { t: string; who: string; kind: string }[]> = {
  "Quick Sync": [
    { t: "10:00", who: "Sarah Jenkins", kind: "Board prep · 3 min" },
    { t: "14:15", who: "Priya Mehta",   kind: "Pricing check-in · 3 min" },
  ],
  "Meeting": [
    { t: "11:30", who: "Rashid Al-Amir", kind: "Technical sync · 30 min" },
    { t: "15:00", who: "David Cho",      kind: "Account review · 45 min" },
  ],
  "Webinar": [
    { t: "17:00", who: "Product Q&A",    kind: "Live audience · 60 min" },
  ],
  "Venue": [
    { t: "18:30", who: "Studio B — Tribe meet", kind: "On-site · 90 min" },
  ],
};
const CHANNEL_TONE: Record<ReservedChannel, string> = {
  "Quick Sync": "bg-amber-500/15 text-amber-700",
  "Meeting":    "bg-sky-500/15 text-sky-700",
  "Webinar":    "bg-violet-500/15 text-violet-700",
  "Venue":      "bg-emerald-500/15 text-emerald-700",
};
const CHANNEL_ICON: Record<ReservedChannel, JSX.Element> = {
  "Quick Sync": <Zap className="w-2.5 h-2.5" />,
  "Meeting":    <CalendarDays className="w-2.5 h-2.5" />,
  "Webinar":    <Radio className="w-2.5 h-2.5" />,
  "Venue":      <Building2 className="w-2.5 h-2.5" />,
};

// Convert "HH:MM" -> minutes
const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

// Group slots into accumulative windows. New window when gap between
// previous slot end and next slot start is >= 60 minutes.
const groupSyncWindows = (slots: { start: string; end: string }[]) => {
  if (!slots.length) return [];
  const sorted = [...slots].sort((a, b) => toMin(a.start) - toMin(b.start));
  const windows: { start: string; end: string }[] = [];
  let cur = { ...sorted[0] };
  for (let i = 1; i < sorted.length; i++) {
    const s = sorted[i];
    const gap = toMin(s.start) - toMin(cur.end);
    if (gap >= 60) {
      windows.push(cur);
      cur = { ...s };
    } else {
      if (toMin(s.end) > toMin(cur.end)) cur.end = s.end;
    }
  }
  windows.push(cur);
  return windows;
};

const Dashboard = () => {
  const [status, setStatus] = useState<StatusKey>("available");
  const [quickSyncOpen, setQuickSyncOpen] = useState(false);
  const [contextMessage, setContextMessage] = useState<string>(DEFAULT_CONTEXT.available);
  const [contextTouched, setContextTouched] = useState(false);
  const [lastCustom, setLastCustom] = useState<string>("");
  const [editingCustom, setEditingCustom] = useState(false);
  const [customDraft, setCustomDraft] = useState("");
  const [role] = useRole();
  const { list } = useRequests();
  const incoming = list.filter((r) => r.direction === "incoming" && r.state === "pending");
  const meta = statusMeta[status];
  const autoStatus = AUTO_STATUS[status];
  const metrics = useMetrics("week");
  const waitingList = useWaitingList();
  const qsWaitCount = waitingList.filter((w) => w.status === "waiting").length;
  const pendingApprovalCount = list.filter((r) => r.direction === "incoming" && r.state === "pending").length;
  const waitingCount = qsWaitCount + pendingApprovalCount;

  const scrollToWaiting = () => {
    document.getElementById("waiting-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleStatusChange = (s: StatusKey) => {
    setStatus(s);
    // Keep custom user-written messages; otherwise sync to the new mode's default
    const allPresets = new Set<string>([
      ...Object.values(DEFAULT_CONTEXT),
      ...Object.values(CONTEXT_BY_MODE).flatMap((groups) => groups.flatMap((g) => g.items)),
    ]);
    if (!contextTouched || allPresets.has(contextMessage)) {
      setContextMessage(DEFAULT_CONTEXT[s]);
      setContextTouched(false);
    }
  };

  const handleContextSelect = (m: string) => {
    setContextMessage(m);
    setContextTouched(true);
  };

  return (
    <AppShell
      subtitle="Control center"
      title={`Good morning, ${me.name.split(" ")[0]}`}
      hideBell
      headerInline={
        <div className="inline-flex items-center gap-2 rounded-full bg-surface-lowest/80 p-1 ghost-border shadow-soft backdrop-blur-md">
          <span className={cn("hidden lg:inline-flex p-0.5 rounded-full bg-surface-low/70 ring-1 transition-colors", meta.ring)}>
            {(Object.keys(statusMeta) as StatusKey[]).map((s) => {
              const m = statusMeta[s];
              const active = status === s;
              return (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-semibold rounded-full transition-all ease-premium inline-flex items-center gap-1.5",
                    active ? cn(m.activeBg, m.activeText, "shadow-glass") : "text-muted-foreground hover:text-primary",
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full", active ? "bg-current opacity-90" : m.dot)} />
                  {m.label}
                </button>
              );
            })}
          </span>
          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold lg:hidden", meta.pillBg, meta.pillText)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", meta.dot)} />
            {meta.label}
          </span>
        </div>
      }
    >
      <div className="dashboard-shell grid lg:grid-cols-3 gap-5 md:gap-7 animate-rise">
        {/* Compact full-width Status pane */}
        <div className={cn(
          "lg:col-span-3 command-band rounded-[1.35rem] px-4 md:px-5 py-4 md:py-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] items-center border-l-[3px] border-l-accent transition-all ease-premium",
        )}>
          <div className="flex items-center gap-3 min-w-0">
            <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold", meta.pillBg, meta.pillText)}>
              <span className={cn("w-1.5 h-1.5 rounded-full", meta.dot)} />
              {meta.label}
            </span>
            <div className="min-w-0">
              {/* Line 1 — Auto status (system-synced). The status pill on the left replaces the redundant label. */}
              <p className="font-headline font-extrabold text-sm md:text-base leading-tight text-primary truncate max-w-[60vw] md:max-w-[28rem]">
                {autoStatus}
              </p>
              {/* Line 3 — Quick context (styled like brand tagline) */}
              <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                {editingCustom ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const v = customDraft.trim();
                      if (v) {
                        const trimmed = v.slice(0, 60);
                        setContextMessage(trimmed);
                        setLastCustom(trimmed);
                        setContextTouched(true);
                      }
                      setEditingCustom(false);
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <Input
                      autoFocus
                      value={customDraft}
                      onChange={(e) => setCustomDraft(e.target.value)}
                      maxLength={60}
                      placeholder="Type a custom context…"
                      className="h-7 text-xs w-56"
                    />
                    <button type="submit" className="grid place-items-center w-7 h-7 rounded-md bg-primary text-primary-foreground hover:opacity-90" aria-label="Save context">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="inline-flex items-center gap-1.5 text-xs md:text-[13px] font-medium italic text-muted-foreground hover:text-primary transition max-w-full">
                        <span className="truncate max-w-[60vw] md:max-w-[28rem]">
                          {contextMessage}
                        </span>
                        <ChevronDown className="w-3 h-3 shrink-0 opacity-70" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-[min(92vw,28rem)] max-h-[75vh] overflow-y-auto p-3 rounded-2xl border border-outline-variant/40 bg-surface-lowest/95 backdrop-blur shadow-elevated"
                    >
                      <div className="px-1 pt-0.5 pb-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Set your context</p>
                        <p className="text-xs text-primary/80 mt-0.5">Write your own — or tap a preset.</p>
                      </div>
                      <StatusContextPanel
                        active={contextMessage}
                        lastCustom={lastCustom}
                        onSelect={(m) => handleContextSelect(m)}
                        onCustom={(m) => {
                          setContextMessage(m);
                          setLastCustom(m);
                          setContextTouched(true);
                        }}
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start lg:items-end gap-2 min-w-0">
            {(() => {
              const windows = [
                { start: "10:00", end: "10:30" },
                { start: "14:00", end: "14:30" },
              ];
              if (!windows.length) return null;
              return (
                <button
                  type="button"
                  onClick={() => setQuickSyncOpen(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full ghost-border bg-surface-lowest/75 hover:bg-surface-low transition-all ease-premium shadow-soft"
                >
                  <Zap className="w-3.5 h-3.5 text-gold" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Quick Sync
                  </span>
                  <span className="text-[11px] font-semibold text-primary tabular-nums">
                    {windows.map((w) => `${w.start}–${w.end}`).join(" | ")}
                  </span>
                </button>
              );
            })()}
            {/* Line 2: Reserved + Waiting List shortcut */}
            <div className="flex items-center gap-1.5">
              <a
                href="#reserved-time"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("reserved-time")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ghost-border bg-surface-lowest/65 text-[11px] hover:bg-surface-low transition-all ease-premium shadow-soft"
                aria-label="Jump to reserved time"
              >
                <CalendarDays className="w-3 h-3 text-accent" />
                <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[9px]">Reserved</span>
                <span className="font-bold text-primary">{RESERVED_COUNT}</span>
              </a>
              <button
                type="button"
                onClick={scrollToWaiting}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ghost-border text-[11px] transition-all ease-premium shadow-soft",
                  waitingCount > 0
                    ? "bg-amber-500/15 hover:bg-amber-500/25"
                    : "bg-surface-low/60 hover:bg-surface-low",
                )}
                aria-label="Jump to Waiting List"
              >
                <Users className="w-3 h-3 text-accent" />
                <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[9px]">Waiting List</span>
                <span className="font-bold text-primary tabular-nums">{waitingCount}</span>
              </button>
            </div>
            {/* Line 3: Impact metrics row — compact horizontal */}
            <div className="flex items-center gap-3 rounded-full bg-surface-lowest/60 px-3 py-1.5 ghost-border shadow-soft">
              <MiniMetric icon={<Zap className="w-3 h-3" />} tone="text-amber-700" label="avoided" value={`${metrics.avoided}`} />
              <span className="w-px h-4 bg-border/60" aria-hidden />
              <MiniMetric icon={<CheckCircle2 className="w-3 h-3" />} tone="text-emerald-700" label="connected" value={`${metrics.connected}`} />
              <span className="w-px h-4 bg-border/60" aria-hidden />
              <MiniMetric icon={<Timer className="w-3 h-3" />} tone="text-sky-700" label="protected" value={formatProtected(metrics.protectedMinutes)} />
            </div>
          </div>
        </div>

        <QuickSyncOwnerDialog
          open={quickSyncOpen}
          onOpenChange={setQuickSyncOpen}
          windows={[
            { start: "10:00", end: "10:30" },
            { start: "14:00", end: "14:30" },
          ]}
          reservedCount={RESERVED_COUNT}
          waitingCount={waitingCount}
          onJumpWaiting={scrollToWaiting}
          onJumpReserved={() =>
            document.getElementById("reserved-time")?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
        />

        {/* Spotlight + Signal (no outer title; new spotlight inside tile) */}
        <div className="lg:col-span-3">
          <SpotlightBoard />
        </div>

        {/* Priority Contacts */}
        <div className="lg:col-span-3">
          <PriorityContactsWidget />
        </div>

        {/* Unified Waiting List — placed AFTER Priority Contacts */}
        <div id="waiting-list" className="lg:col-span-3 scroll-mt-24">
          <WaitingList />
        </div>

        {/* Reserved — confirmed only, grouped by channel in fixed order */}
        <div id="reserved-time" className="lg:col-span-3 premium-card p-6 md:p-7 scroll-mt-24 animate-fade">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="module-eyebrow inline-flex items-center gap-1.5">
                <CalendarDays className="w-3 h-3 text-accent/80" /> Reserved · Confirmed only
              </p>
              <h3 className="module-title mt-1.5">Today's reserved time</h3>
              <p className="module-meta mt-1">Channel-grouped — Quick Sync, Meeting, Webinar, Venue.</p>
            </div>
            <Link to="/app/availability" className="text-[11px] font-semibold text-accent hover:underline tracking-wide uppercase shrink-0 mt-1">View all</Link>
          </div>
          <div className="module-divider mt-5" />
          {RESERVED_CHANNELS.map((ch) => {
            const items = RESERVED_BY_CHANNEL[ch].sort((a, b) => toMin(a.t) - toMin(b.t));
            return (
              <div key={ch} className="mt-5">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.14em]", CHANNEL_TONE[ch])}>
                    {CHANNEL_ICON[ch]}
                    {ch}
                  </span>
                  <span className="text-[10px] text-muted-foreground/80 num-tabular">{items.length} confirmed</span>
                </div>
                {items.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic px-1">No confirmed {ch.toLowerCase()} bookings.</p>
                ) : (
                  <ul className="grid md:grid-cols-3 gap-3">
                    {items.map((s) => (
                      <li key={`${ch}-${s.t}-${s.who}`} className="flex items-center gap-3 p-3 nested-surface">
                        <span className="grid place-items-center w-12 h-10 rounded-xl bg-primary/[0.06] text-primary text-[11px] font-semibold shrink-0 num-tabular ring-1 ring-inset ring-primary/10">
                          {s.t}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13.5px] font-semibold text-primary truncate tracking-[-0.005em]">{s.who}</p>
                          <p className="text-[11.5px] text-muted-foreground/85 truncate">{s.kind}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        {/* Messages panel */}
        <div className="lg:col-span-3">
          <MessagesPanel />
        </div>

        {/* Access requests */}
        <div className="lg:col-span-3 premium-card p-6 md:p-7 animate-fade">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="module-eyebrow inline-flex items-center gap-1.5">
                <Inbox className="w-3 h-3 text-accent/80" /> Inbound · Pending
              </p>
              <h3 className="module-title mt-1.5">Access requests</h3>
              <p className="module-meta mt-1">People asking to reach you — review, approve, or decline.</p>
            </div>
            <Link to="/app/requests" className="text-[11px] font-semibold text-accent hover:underline inline-flex items-center gap-1 uppercase tracking-wide shrink-0 mt-1">
              Manage all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="module-divider mt-5" />
          <ul className="mt-2 divide-y divide-outline-variant/25">
            {incoming.slice(0, 3).map((r) => {
              const c = contacts.find((x) => x.id === r.contactId)!;
              return (
                <li key={r.id}>
                  <Link
                    to={`/app/requests?id=${r.id}`}
                    className="py-3.5 flex items-center gap-3 hover:bg-surface-low/55 -mx-2 px-2 rounded-xl transition ease-premium"
                  >
                    <Avatar initials={c.initials} accent={c.accent} status={c.status} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-semibold text-primary truncate tracking-[-0.005em]">{c.name}</p>
                      <p className="text-[11.5px] text-muted-foreground/85 truncate">{r.reason}</p>
                    </div>
                    <StatusPill tone="pending" />
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Recent activity */}
        <div className="lg:col-span-3 premium-card p-6 md:p-7 animate-fade">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="module-eyebrow inline-flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-accent/80" /> Signal · Last 24h
              </p>
              <h3 className="module-title mt-1.5">Recent activity</h3>
              <p className="module-meta mt-1">Latest threads moving across your channels.</p>
            </div>
            <Link to="/app/messages" className="text-[11px] font-semibold text-accent hover:underline uppercase tracking-wide shrink-0 mt-1">Open messages</Link>
          </div>
          <div className="module-divider mt-5" />
          <ul className="mt-5 grid md:grid-cols-3 gap-3.5">
            {threads.map((t) => {
              const c = contacts.find((x) => x.id === t.contactId)!;
              return (
                <li key={t.id}>
                  <Link to="/app/messages" className="flex items-center gap-3 p-3.5 nested-surface">
                    <Avatar initials={c.initials} accent={c.accent} status={c.status} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-semibold text-primary truncate tracking-[-0.005em]">{c.name}</p>
                      <p className="text-[11.5px] text-muted-foreground/85 truncate">{t.preview}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground/80 inline-flex items-center gap-1 num-tabular">
                      <Clock className="w-3 h-3" /> {t.lastAt}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {role === "provider" && (
          <Link
            to="/app/analytics"
            className="lg:col-span-3 premium-card is-interactive p-5 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="grid place-items-center w-10 h-10 rounded-xl bg-accent/10 text-accent">
                <CalendarDays className="w-5 h-5" />
              </span>
              <div>
                <p className="font-semibold text-primary text-sm">See how Availock is protecting your time</p>
                <p className="text-xs text-muted-foreground">Provider analytics — interruptions saved, response time, request mix.</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-primary" />
          </Link>
        )}
        {role !== "provider" && (
          <Link
            to="/app/contacts"
            className="lg:col-span-3 premium-card is-interactive p-5 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="grid place-items-center w-10 h-10 rounded-xl bg-accent/10 text-accent">
                <Inbox className="w-5 h-5" />
              </span>
              <div>
                <p className="font-semibold text-primary text-sm">Find someone you want to reach</p>
                <p className="text-xs text-muted-foreground">Browse contacts and request access in one tap.</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-primary" />
          </Link>
        )}
      </div>
    </AppShell>
  );
};

function Stat({ label, value, hint, icon }: { label: string; value: string; hint: string; icon: React.ReactNode }) {
  return (
    <div className="p-3.5 rounded-2xl ghost-border bg-surface-low/50">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {icon} {label}
      </div>
      <p className="mt-1.5 font-headline font-extrabold text-primary text-2xl leading-none">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}

function Chip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ghost-border bg-surface-low/60 text-[11px]">
      <span className="text-accent">{icon}</span>
      <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[9px]">{label}</span>
      <span className="font-bold text-primary">{value}</span>
    </span>
  );
}

function MiniMetric({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  return (
    <span className="inline-flex items-baseline gap-1 text-[11px]">
      <span className={cn("inline-flex items-center", tone)}>{icon}</span>
      <span className="font-bold text-primary tabular-nums">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

export default Dashboard;