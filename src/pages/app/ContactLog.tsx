import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Phone,
  MessageSquare,
  Inbox,
  CalendarDays,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Check,
  Ban,
  Zap,
  Radio,
  Users,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Activity,
  Clock3,
  TrendingUp,
  Filter,
  Sparkles,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import Avatar from "@/components/app/Avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { findContact } from "@/lib/mockData";

// ─────────────────────────────────────────────
// Interaction model
// ─────────────────────────────────────────────
type EntryKind =
  | "access_request"
  | "approval"
  | "rejection"
  | "message"
  | "call"
  | "quick_sync"
  | "ping"
  | "schedule"
  | "waiting"
  | "access_change"
  | "missed";

interface Entry {
  id: string;
  kind: EntryKind;
  title: string;
  detail?: string;
  at: number; // epoch ms
  duration?: string;
  source?: string;
  outcome?: "success" | "pending" | "failed";
  resolved?: boolean;
  link?: string;
}

const KIND_META: Record<
  EntryKind,
  { label: string; icon: any; tone: string; ring: string; group: string }
> = {
  access_request: { label: "Access Request", icon: Shield,       tone: "bg-amber-100 text-amber-700",       ring: "ring-amber-200",   group: "Approvals" },
  approval:       { label: "Approval",       icon: Check,        tone: "bg-emerald-100 text-emerald-700",   ring: "ring-emerald-200", group: "Approvals" },
  rejection:      { label: "Rejected",       icon: Ban,          tone: "bg-rose-100 text-rose-700",         ring: "ring-rose-200",    group: "Approvals" },
  message:        { label: "Message",        icon: MessageSquare, tone: "bg-sky-100 text-sky-700",          ring: "ring-sky-200",     group: "Messages" },
  call:           { label: "Call Sync",      icon: Phone,        tone: "bg-indigo-100 text-indigo-700",     ring: "ring-indigo-200",  group: "Call Syncs" },
  quick_sync:     { label: "Quick Sync",     icon: Zap,          tone: "bg-violet-100 text-violet-700",     ring: "ring-violet-200",  group: "Quick Syncs" },
  ping:           { label: "Ping",           icon: Radio,        tone: "bg-blue-100 text-blue-700",         ring: "ring-blue-200",    group: "Pings" },
  schedule:       { label: "Schedule",       icon: CalendarDays, tone: "bg-teal-100 text-teal-700",         ring: "ring-teal-200",    group: "Schedules" },
  waiting:        { label: "Waiting List",   icon: Users,        tone: "bg-fuchsia-100 text-fuchsia-700",   ring: "ring-fuchsia-200", group: "Waiting List" },
  access_change:  { label: "Access Change",  icon: ShieldCheck,  tone: "bg-amber-100 text-amber-800",       ring: "ring-amber-200",   group: "Access Changes" },
  missed:         { label: "Missed Sync",    icon: AlertCircle,  tone: "bg-orange-100 text-orange-700",     ring: "ring-orange-200",  group: "Signals" },
};

// Deterministic seed timeline per contact id
const buildTimeline = (contactId: string, contactName: string): Entry[] => {
  const now = Date.now();
  const day = 86_400_000;
  const first = contactName.split(" ")[0];
  const seed = contactId.length;
  const j = (n: number) => (seed * 13 + n * 7) % 9; // small jitter
  const entries: Entry[] = [
    { id: "e1",  kind: "access_request", title: `${first} requested access`, detail: "Reason: Strategic intro via Sarah Jenkins.", at: now - day * (62 + j(1)), source: "Inbound", outcome: "success", resolved: true },
    { id: "e2",  kind: "approval",       title: "Access approved",           detail: "Standard access granted. Voice & message channels open.", at: now - day * (60 + j(2)), source: "You", outcome: "success", resolved: true },
    { id: "e3",  kind: "ping",           title: "Message Ping sent",         detail: "Subject: Quick intro question — replied within 12m.", at: now - day * (45 + j(3)), source: "Outbound", outcome: "success", resolved: true },
    { id: "e4",  kind: "quick_sync",     title: "First Quick Sync completed",detail: "Topic: alignment on Q2 plan.", duration: "5 min", at: now - day * (40 + j(4)), source: "QS slot", outcome: "success", resolved: true },
    { id: "e5",  kind: "waiting",        title: `${first} joined waiting list`, detail: "Slot opened in 14m — auto-promoted.", at: now - day * (28 + j(5)), source: "Queue", outcome: "success", resolved: true },
    { id: "e6",  kind: "schedule",       title: "Calendar booking approved", detail: "30-min review window confirmed.", duration: "30 min", at: now - day * (21 + j(6)), source: "Calendar", outcome: "success", resolved: true, link: `/app/schedule/${contactId}` },
    { id: "e7",  kind: "call",           title: "Call Sync completed",       detail: "Notes captured. Action items shared by message.", duration: "22 min", at: now - day * (14 + j(7)), source: "Initiated via Call Ping", outcome: "success", resolved: true },
    { id: "e8",  kind: "message",        title: `${first} sent a message`,   detail: "“Sharing the revised brief — let me know your thoughts.”", at: now - day * (9 + j(1)), source: "Inbound", outcome: "success", resolved: true },
    { id: "e9",  kind: "access_change",  title: "Priority Access granted",   detail: "Bypass enabled for urgent calls.", at: now - day * (6 + j(2)), source: "You", outcome: "success", resolved: true },
    { id: "e10", kind: "missed",         title: "Missed Quick Sync slot",    detail: "Slot expired — no party joined.", at: now - day * (4 + j(3)), source: "QS slot", outcome: "failed", resolved: false },
    { id: "e11", kind: "ping",           title: "Calendar Ping requested",   detail: "Booking approval requested for next Tue 14:00.", at: now - day * (2 + j(4)), source: "Outbound", outcome: "pending", resolved: false },
    { id: "e12", kind: "quick_sync",     title: "Quick Sync scheduled",      detail: "Auto-confirmed within QS window.", duration: "5 min", at: now - day * 1 + j(5) * 60_000, source: "QS slot", outcome: "success", resolved: true },
    { id: "e13", kind: "message",        title: "You replied",               detail: "“Confirmed — talk soon.”", at: now - 4 * 3600_000 - j(6) * 60_000, source: "Outbound", outcome: "success", resolved: true },
  ];
  return entries;
};

const FILTERS: { id: string; label: string; kinds?: EntryKind[] }[] = [
  { id: "all",          label: "All" },
  { id: "messages",     label: "Messages",       kinds: ["message"] },
  { id: "calls",        label: "Call Syncs",     kinds: ["call"] },
  { id: "qs",           label: "Quick Syncs",    kinds: ["quick_sync"] },
  { id: "pings",        label: "Pings",          kinds: ["ping"] },
  { id: "schedules",    label: "Schedules",      kinds: ["schedule"] },
  { id: "approvals",    label: "Approvals",      kinds: ["access_request", "approval", "rejection"] },
  { id: "signals",      label: "Signals",        kinds: ["missed"] },
  { id: "waiting",      label: "Waiting List",   kinds: ["waiting"] },
  { id: "access",       label: "Access Changes", kinds: ["access_change"] },
];

const fmtDate = (ts: number) =>
  new Date(ts).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
const fmtTime = (ts: number) =>
  new Date(ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
const dayKey = (ts: number) => new Date(ts).toDateString();
const relDay = (ts: number) => {
  const diff = Math.floor((Date.now() - ts) / 86_400_000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return fmtDate(ts);
};

const ContactLog = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const contact = useMemo(() => findContact(id), [id]);
  const [filter, setFilter] = useState<string>("all");
  const [order, setOrder] = useState<"newest" | "oldest">("newest");
  const [unresolvedOnly, setUnresolvedOnly] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (!contact) {
    return (
      <AppShell title="Contact not found">
        <Link to="/app/contacts" className="text-accent hover:underline">← Back to contacts</Link>
      </AppShell>
    );
  }

  const all = useMemo(() => buildTimeline(contact.id, contact.name), [contact.id, contact.name]);

  const filtered = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter);
    let list = !f?.kinds ? all : all.filter((e) => f.kinds!.includes(e.kind));
    if (unresolvedOnly) list = list.filter((e) => e.resolved === false);
    list = [...list].sort((a, b) => (order === "newest" ? b.at - a.at : a.at - b.at));
    return list;
  }, [all, filter, order, unresolvedOnly]);

  // group by day
  const grouped = useMemo(() => {
    const m = new Map<string, Entry[]>();
    filtered.forEach((e) => {
      const k = dayKey(e.at);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(e);
    });
    return Array.from(m.entries());
  }, [filtered]);

  // insights
  const insights = useMemo(() => {
    const counts: Record<string, number> = {};
    all.forEach((e) => { counts[KIND_META[e.kind].group] = (counts[KIND_META[e.kind].group] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    const last = [...all].sort((a, b) => b.at - a.at).find((e) => e.outcome === "success");
    return {
      mostUsed: top,
      avgResponse: "≈ 18 min",
      lastSync: last ? relDay(last.at) : "—",
      activeHours: "2 PM – 5 PM",
    };
  }, [all]);

  const stats = {
    since: fmtDate(all[0]?.at ?? Date.now()),
    last: relDay(all[all.length - 1]?.at ?? Date.now()),
    syncs: all.filter((e) => e.kind === "quick_sync" || e.kind === "call").length,
    response: "92%",
  };

  const onEntryClick = (e: Entry) => {
    if (e.link) { navigate(e.link); return; }
    if (e.kind === "message") { navigate("/app/messages"); return; }
    if (e.kind === "schedule" || e.kind === "ping") { navigate(`/app/schedule/${contact.id}`); return; }
    setExpanded((m) => ({ ...m, [e.id]: !m[e.id] }));
  };

  return (
    <AppShell hideBell={false}>
      {/* Back link */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-3"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* SECTION A — Relationship Header */}
      <section className="rounded-3xl bg-surface-lowest ghost-border shadow-ambient p-5 md:p-6 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-5">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <Avatar initials={contact.initials} accent={contact.accent} size="lg" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent inline-flex items-center gap-1.5">
                <Activity className="w-3 h-3" /> Connection Log
              </p>
              <h1 className="font-headline font-extrabold text-primary text-xl md:text-2xl truncate">
                {contact.name}
              </h1>
              <p className="text-sm text-muted-foreground truncate">
                {contact.title} · {contact.org}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="rounded-full text-[10px]">
                  <ShieldCheck className="w-3 h-3 mr-1" /> {contact.syncStatus === "approved" ? "Approved" : contact.syncStatus === "pending" ? "Pending" : "Locked"}
                </Badge>
                {contact.favorite && (
                  <Badge variant="outline" className="rounded-full text-[10px] border-gold/60 text-amber-700">
                    <Sparkles className="w-3 h-3 mr-1" /> Priority
                  </Badge>
                )}
                {contact.relationship === "client" && (
                  <Badge variant="outline" className="rounded-full text-[10px]">Vault</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 lg:max-w-2xl w-full">
            {[
              { label: "Connected since", value: stats.since },
              { label: "Last interaction", value: stats.last },
              { label: "Total syncs", value: String(stats.syncs) },
              { label: "Response rate", value: stats.response },
              { label: "Access level", value: "Standard" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-surface-low/60 ghost-border px-3 py-2">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{s.label}</p>
                <p className="text-sm font-semibold text-primary mt-0.5 truncate">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-[1fr_300px] gap-5">
        <div className="min-w-0">
          {/* SECTION B — Sticky filter bar */}
          <div className="sticky top-[112px] z-20 -mx-1 px-1 mb-3">
            <div className="rounded-2xl bg-surface-lowest/95 backdrop-blur ghost-border shadow-ambient p-2 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1 min-w-0">
                <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0 mx-1" />
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={cn(
                      "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition",
                      filter === f.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-low/60 text-muted-foreground hover:text-primary",
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUnresolvedOnly((v) => !v)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition inline-flex items-center gap-1",
                    unresolvedOnly ? "bg-amber-100 text-amber-800" : "ghost-border text-muted-foreground hover:text-primary",
                  )}
                  title="Show unresolved only"
                >
                  <AlertCircle className="w-3 h-3" /> Unresolved
                </button>
                <button
                  onClick={() => setOrder((o) => (o === "newest" ? "oldest" : "newest"))}
                  className="px-2.5 py-1.5 rounded-full text-[11px] font-semibold ghost-border text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                  title="Toggle order"
                >
                  {order === "newest" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                  {order === "newest" ? "Newest" : "Oldest"}
                </button>
              </div>
            </div>
          </div>

          {/* SECTION C — Timeline */}
          {grouped.length === 0 ? (
            <div className="rounded-2xl ghost-border bg-surface-lowest p-8 text-center text-sm text-muted-foreground">
              No interactions match these filters.
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map(([k, items]) => (
                <div key={k}>
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      {relDay(items[0].at)}
                    </p>
                    <div className="flex-1 h-px bg-border/60" />
                    <p className="text-[10px] text-muted-foreground">{fmtDate(items[0].at)}</p>
                  </div>

                  <ol className="relative pl-5 border-l border-border/60 space-y-3">
                    {items.map((e) => {
                      const meta = KIND_META[e.kind];
                      const Icon = meta.icon;
                      const open = !!expanded[e.id];
                      return (
                        <li key={e.id} className="relative">
                          <span className={cn(
                            "absolute -left-[27px] top-3 grid place-items-center w-8 h-8 rounded-full ring-4 ring-background",
                            meta.tone,
                          )}>
                            <Icon className="w-3.5 h-3.5" />
                          </span>
                          <button
                            type="button"
                            onClick={() => onEntryClick(e)}
                            className={cn(
                              "w-full text-left rounded-2xl ghost-border bg-surface-lowest p-3.5 hover:shadow-ambient transition",
                              e.outcome === "failed" && "ring-1 ring-rose-200/70",
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    {meta.label}
                                  </span>
                                  {e.duration && (
                                    <span className="text-[10px] inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-surface-low/80 text-muted-foreground">
                                      <Clock3 className="w-2.5 h-2.5" /> {e.duration}
                                    </span>
                                  )}
                                  {e.outcome === "pending" && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">Pending</span>
                                  )}
                                  {e.outcome === "failed" && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-semibold">Unresolved</span>
                                  )}
                                </div>
                                <p className="text-sm font-semibold text-primary mt-1 leading-tight">
                                  {e.title}
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  {fmtTime(e.at)}{e.source ? ` · ${e.source}` : ""}
                                </p>
                                {open && e.detail && (
                                  <p className="text-[12px] text-foreground/80 mt-2 leading-relaxed">
                                    {e.detail}
                                  </p>
                                )}
                              </div>
                              <ChevronDown className={cn("w-4 h-4 text-muted-foreground shrink-0 transition", open && "rotate-180")} />
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right rail — insights + CTA */}
        <aside className="space-y-4">
          <div className="rounded-2xl ghost-border bg-surface-lowest p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent inline-flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" /> Relationship intelligence
            </p>
            <ul className="mt-3 space-y-2.5">
              {[
                { k: "Most used channel", v: insights.mostUsed },
                { k: "Average response time", v: insights.avgResponse },
                { k: "Last successful sync", v: insights.lastSync },
                { k: "Most active hours", v: insights.activeHours },
              ].map((r) => (
                <li key={r.k} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">{r.k}</span>
                  <span className="font-semibold text-primary text-right">{r.v}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl bg-gradient-vault text-primary-foreground p-5 shadow-elevated">
            <ShieldAlert className="w-5 h-5 text-gold" />
            <p className="mt-2 font-headline font-bold text-base">Open a new connection</p>
            <p className="mt-1 text-xs text-primary-foreground/80">
              Pick a slot in {contact.name.split(" ")[0]}'s next available window.
            </p>
            <Link
              to={`/app/schedule/${contact.id}`}
              className="mt-3 inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-gold text-primary text-xs font-bold hover:bg-gold/90 transition"
            >
              Schedule <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </aside>
      </div>
    </AppShell>
  );
};

export default ContactLog;