import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Inbox, Check, X, ArrowRight, ArrowLeft, ListChecks, ShieldCheck,
  Mic, MessageSquare, CalendarDays, Sparkles, AlertTriangle, Clock3,
  Lock, Shield, Phone, Briefcase, MonitorPlay, Building2, Zap, Eye,
  Globe, MapPin, Layers, Undo2, ChevronRight, Filter,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import AppShell from "@/components/app/AppShell";
import Avatar from "@/components/app/Avatar";
import StatusPill from "@/components/app/StatusPill";
import EmptyState from "@/components/app/EmptyState";
import { contacts, type AccessRequest } from "@/lib/mockData";
import { useRequests } from "@/components/app/RequestsContext";
import { toast } from "@/hooks/use-toast";
import { useRole } from "@/lib/role";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";

type Channel = "voice" | "message" | "calendar" | "quicksync";
type Lane = "priority" | "standard" | "scheduled" | "silent";
type Duration = "once" | "30m" | "1h" | "today" | "custom";
type Visibility = "status" | "limited" | "full" | "contact";
type Venue = "online" | "onsite" | "hybrid";
type ActState = "approved" | "denied" | "scheduled";

const channelMeta: Record<Channel, { icon: typeof Mic; label: string }> = {
  voice: { icon: Mic, label: "Call" },
  message: { icon: MessageSquare, label: "Message" },
  calendar: { icon: CalendarDays, label: "Meeting" },
  quicksync: { icon: Zap, label: "Quick Sync" },
};

const laneOptions: { id: Lane; label: string; hint: string; icon: typeof Shield }[] = [
  { id: "priority", label: "Priority Lane", hint: "Bypass rules", icon: AlertTriangle },
  { id: "standard", label: "Standard Lane", hint: "Normal flow", icon: ListChecks },
  { id: "scheduled", label: "Scheduled Only", hint: "Booking required", icon: CalendarDays },
  { id: "silent", label: "Silent / Message First", hint: "Async first", icon: MessageSquare },
];

const durationOptions: { id: Duration; label: string }[] = [
  { id: "once", label: "One-time" },
  { id: "30m", label: "30 min" },
  { id: "1h", label: "1 hour" },
  { id: "today", label: "Today only" },
  { id: "custom", label: "Custom" },
];

const visibilityOptions: { id: Visibility; label: string; icon: typeof Eye }[] = [
  { id: "status", label: "Status only", icon: Eye },
  { id: "limited", label: "Limited availability", icon: Layers },
  { id: "full", label: "Full availability", icon: CalendarDays },
  { id: "contact", label: "Contact details", icon: Phone },
];

const venueMeta: Record<Venue, { icon: typeof Globe; label: string }> = {
  online: { icon: Globe, label: "Online" },
  onsite: { icon: MapPin, label: "Onsite" },
  hybrid: { icon: Layers, label: "Hybrid" },
};

const stateTone = (s: AccessRequest["state"]) =>
  s === "pending" ? "bg-amber-500/10 text-amber-700"
  : s === "approved" ? "bg-emerald-500/10 text-emerald-700"
  : s === "denied" ? "bg-rose-500/10 text-rose-700"
  : "bg-sky-500/10 text-sky-700";

const AccessRequests = () => {
  const { list, act: actCtx, setList } = useRequests();
  const [tab, setTab] = useState<"incoming" | "outgoing">("incoming");
  const [role] = useRole();
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get("id");

  const pending = useMemo(
    () => list.filter((r) => r.direction === tab && r.state === "pending"),
    [list, tab],
  );

  const [cursorId, setCursorId] = useState<string | null>(initialId ?? pending[0]?.id ?? null);

  // Keep cursor valid; auto-pick first pending if current is no longer pending
  useEffect(() => {
    if (!pending.find((r) => r.id === cursorId)) {
      setCursorId(pending[0]?.id ?? null);
    }
  }, [pending, cursorId]);

  useEffect(() => {
    if (initialId) setCursorId(initialId);
  }, [initialId]);

  const currentIndex = Math.max(0, pending.findIndex((r) => r.id === cursorId));
  const current = pending[currentIndex] ?? pending[0] ?? null;

  // Undo support
  const undoRef = useRef<{ snapshot: AccessRequest[]; id: string } | null>(null);

  const handleAct = useCallback(
    (id: string, state: ActState) => {
      undoRef.current = { snapshot: list, id };
      // pre-pick next so the UI advances smoothly
      const idx = pending.findIndex((r) => r.id === id);
      const nextId = pending[idx + 1]?.id ?? pending[idx - 1]?.id ?? null;
      actCtx(id, state);
      setCursorId(nextId);
      toast({
        title:
          state === "approved" ? "Approved" :
          state === "denied" ? "Declined" : "Scheduled",
        description: "Tap Undo to reverse.",
        action: (
          <button
            onClick={() => {
              if (undoRef.current) {
                setList(undoRef.current.snapshot);
                setCursorId(undoRef.current.id);
                undoRef.current = null;
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold"
          >
            <Undo2 className="w-3 h-3" /> Undo
          </button>
        ) as any,
      });
    },
    [list, pending, actCtx, setList],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!current) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "Enter") { e.preventDefault(); handleAct(current.id, "approved"); }
      else if (e.key === "Escape") { e.preventDefault(); handleAct(current.id, "denied"); }
      else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        const next = pending[currentIndex + 1];
        if (next) setCursorId(next.id);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        const prev = pending[currentIndex - 1];
        if (prev) setCursorId(prev.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, currentIndex, pending, handleAct]);

  return (
    <AppShell
      subtitle={role === "provider" ? "Provider control" : "Your activity"}
      title="Access requests"
      actions={
        <div className="flex items-center gap-2">
          <InboxSheet
            list={list.filter((r) => r.direction === tab)}
            onPick={(id) => setCursorId(id)}
          />
          <Link
            to="/app/requests/manage"
            className="hidden md:inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-elevated hover:opacity-95 transition"
          >
            <ShieldCheck className="w-4 h-4" /> Approval flow
          </Link>
        </div>
      }
    >
      {/* Tab + queue indicator */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div className="inline-flex p-1 rounded-full bg-surface-low ghost-border">
          {(["incoming", "outgoing"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full capitalize ${
                tab === t ? "bg-primary text-primary-foreground shadow-glass" : "text-muted-foreground hover:text-primary"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {current && pending.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => pending[currentIndex - 1] && setCursorId(pending[currentIndex - 1].id)}
              disabled={currentIndex === 0}
              className="p-1.5 rounded-full ghost-border bg-surface-lowest disabled:opacity-40 hover:bg-surface-low"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-bold text-primary">
              Request {currentIndex + 1} of {pending.length}
            </span>
            <button
              onClick={() => pending[currentIndex + 1] && setCursorId(pending[currentIndex + 1].id)}
              disabled={currentIndex >= pending.length - 1}
              className="p-1.5 rounded-full ghost-border bg-surface-lowest disabled:opacity-40 hover:bg-surface-low"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {!current ? (
        <div className="rounded-3xl bg-surface-lowest p-10 ghost-border">
          <EmptyState
            icon={Inbox}
            title="No pending requests"
            description="You're all caught up. New requests will appear here automatically."
          />
          <div className="mt-4 flex items-center justify-center gap-2">
            <Link to="/app/dashboard" className="px-4 py-2 rounded-full bg-gradient-primary text-primary-foreground text-xs font-semibold">
              Go to Dashboard
            </Link>
            <InboxSheet
              list={list.filter((r) => r.direction === tab)}
              onPick={(id) => setCursorId(id)}
              triggerLabel="View History"
            />
          </div>
        </div>
      ) : tab === "outgoing" ? (
        <OutgoingView request={current} />
      ) : (
        <DecisionInterface
          key={current.id}
          request={current}
          onAct={handleAct}
        />
      )}
    </AppShell>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   DECISION INTERFACE — two-panel layout
   ───────────────────────────────────────────────────────────────────────── */

const DecisionInterface = ({
  request,
  onAct,
}: {
  request: AccessRequest;
  onAct: (id: string, s: ActState) => void;
}) => {
  const c = contacts.find((x) => x.id === request.contactId)!;

  // Smart defaults derived from request
  const defaultChannels: Channel[] = useMemo(() => {
    const base: Channel[] = request.channel ? [request.channel as Channel] : ["voice"];
    if (request.urgency !== "low" && !base.includes("message")) base.push("message");
    return base;
  }, [request]);

  const defaultLane: Lane =
    request.urgency === "high" ? "priority"
    : request.urgency === "medium" ? "standard"
    : "scheduled";

  const defaultDuration: Duration =
    request.urgency === "high" ? "1h" :
    request.relation === "client" || request.relation === "investor" ? "today" :
    "30m";

  const defaultVisibility: Visibility =
    request.relation === "client" || request.relation === "investor" ? "limited" :
    request.relation === "family" || request.relation === "friend" ? "full" :
    "status";

  const [channels, setChannels] = useState<Channel[]>(defaultChannels);
  const [lane, setLane] = useState<Lane>(defaultLane);
  const [duration, setDuration] = useState<Duration>(defaultDuration);
  const [visibility, setVisibility] = useState<Visibility>(defaultVisibility);

  const venue: Venue = (request as any).venue ?? "online";

  // Progressive unlock
  const step1Done = channels.length > 0;
  const step2Done = step1Done; // lane has a default; advances once channel chosen
  const step3Done = step2Done;
  const step4Done = step3Done;

  const toggleChannel = (ch: Channel) =>
    setChannels((p) => (p.includes(ch) ? p.filter((x) => x !== ch) : [...p, ch]));

  const quickApprove = () => onAct(request.id, "approved");

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-6">
      {/* LEFT — Request Context */}
      <section className="rounded-3xl bg-surface-lowest ghost-border p-6 md:p-7 self-start lg:sticky lg:top-6">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-primary/60">
          <Inbox className="w-3.5 h-3.5" /> Request
        </div>

        {/* 1. Identity */}
        <div className="mt-3 flex items-start gap-4">
          <Avatar initials={c.initials} accent={c.accent} size="lg" />
          <div className="min-w-0">
            <Link to={`/app/contact/${c.id}`} className="font-headline font-extrabold text-primary text-2xl leading-tight hover:underline">
              {c.name}
            </Link>
            <p className="text-sm text-muted-foreground truncate">{c.title} · {c.org}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                request.urgency === "high" ? "bg-rose-500/10 text-rose-700"
                : request.urgency === "medium" ? "bg-amber-500/10 text-amber-700"
                : "bg-muted text-muted-foreground"
              }`}>
                {request.urgency === "high" ? "Urgent" : request.urgency === "medium" ? "Priority" : "Routine"}
              </span>
              {request.relation && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {request.relation}
                </span>
              )}
              {c.frequent && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                  Frequent
                </span>
              )}
              {request.senderType === "guest" && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700">
                  New
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
              <Clock3 className="w-3 h-3" /> {request.receivedAt}
            </p>
          </div>
        </div>

        {/* 2. Intent */}
        <div className="mt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary/60">Wants to connect via</p>
          <div className="mt-2 flex items-center gap-2">
            {request.channel && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-low text-sm font-semibold text-primary">
                {(() => {
                  const Icon = channelMeta[(request.channel as Channel)].icon;
                  return <Icon className="w-3.5 h-3.5" />;
                })()}
                {channelMeta[(request.channel as Channel)].label}
              </span>
            )}
            {request.purpose && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-low text-xs text-muted-foreground">
                <Briefcase className="w-3 h-3" /> {request.purpose}
              </span>
            )}
          </div>
        </div>

        {/* 3. Channel venue */}
        <div className="mt-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary/60">Requested channel</p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-low text-sm font-semibold text-primary">
            {(() => {
              const Icon = venueMeta[venue].icon;
              return <Icon className="w-3.5 h-3.5" />;
            })()}
            {venueMeta[venue].label}
          </div>
        </div>

        {/* 4. Optional Note */}
        {request.reason && (
          <div className="mt-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary/60">Note</p>
            <blockquote className="mt-2 rounded-2xl bg-surface-low p-4 italic text-sm text-foreground/80 leading-relaxed">
              "{request.reason}"
            </blockquote>
          </div>
        )}

        {request.referredBy && (
          <div className="mt-4 flex items-center gap-2 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-muted-foreground">Referred by</span>
            <span className="font-semibold text-primary">{request.referredBy}</span>
          </div>
        )}
      </section>

      {/* RIGHT — Approval Controls */}
      <section className="space-y-4">
        {/* Quick approve banner */}
        <div className="rounded-3xl bg-gradient-primary text-primary-foreground p-4 flex items-center justify-between gap-3 shadow-elevated">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-80">Smart defaults ready</p>
            <p className="text-sm font-semibold">Approve with safe settings instantly.</p>
          </div>
          <button
            onClick={quickApprove}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-surface-lowest text-primary text-xs font-bold hover:opacity-95 transition"
          >
            <Zap className="w-3.5 h-3.5" /> Quick Approve
          </button>
        </div>

        {/* STEP 1 — Channels */}
        <Step n={1} title="Access Channels" subtitle="What are you allowing?" done={step1Done}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.keys(channelMeta) as Channel[]).map((ch) => {
              const Icon = channelMeta[ch].icon;
              const active = channels.includes(ch);
              return (
                <button
                  key={ch}
                  onClick={() => toggleChannel(ch)}
                  className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-2xl text-xs font-semibold transition ${
                    active
                      ? "bg-primary/5 ring-2 ring-primary text-primary"
                      : "bg-surface-low text-muted-foreground hover:text-primary"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {channelMeta[ch].label}
                </button>
              );
            })}
          </div>
        </Step>

        {/* STEP 2 — Protocol Lane */}
        <Step n={2} title="Protocol Lane" subtitle="How can they reach you?" locked={!step1Done} done={step2Done}>
          <div className="grid sm:grid-cols-2 gap-2">
            {laneOptions.map((l) => {
              const active = lane === l.id;
              return (
                <button
                  key={l.id}
                  onClick={() => setLane(l.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition ${
                    active ? "bg-primary/5 ring-2 ring-primary text-primary" : "bg-surface-low text-muted-foreground hover:text-primary"
                  }`}
                >
                  <l.icon className="w-4 h-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold">{l.label}</p>
                    <p className="text-[10px] opacity-70">{l.hint}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </Step>

        {/* STEP 3 — Duration */}
        <Step n={3} title="Access Duration" subtitle="How long is this valid?" locked={!step2Done} done={step3Done}>
          <div className="flex flex-wrap gap-2">
            {durationOptions.map((d) => {
              const active = duration === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setDuration(d.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                    active
                      ? "bg-primary text-primary-foreground shadow-glass"
                      : "bg-surface-low text-muted-foreground hover:text-primary ghost-border"
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </Step>

        {/* STEP 4 — Visibility */}
        <Step n={4} title="Contact Visibility" subtitle="What can they see?" locked={!step3Done} done={step4Done}>
          <div className="grid sm:grid-cols-2 gap-2">
            {visibilityOptions.map((v) => {
              const active = visibility === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setVisibility(v.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    active ? "bg-primary/5 ring-2 ring-primary text-primary" : "bg-surface-low text-muted-foreground hover:text-primary"
                  }`}
                >
                  <v.icon className="w-3.5 h-3.5" /> {v.label}
                </button>
              );
            })}
          </div>
        </Step>

        {/* STEP 5 — Approval actions */}
        <div className="rounded-3xl bg-surface-lowest ghost-border p-5">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-primary/60">
            <ShieldCheck className="w-3.5 h-3.5" /> Final approval
          </div>
          <div className="mt-3 grid sm:grid-cols-3 gap-2">
            <button
              onClick={() => onAct(request.id, "approved")}
              disabled={!step4Done}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-primary text-primary-foreground text-sm font-bold shadow-elevated hover:opacity-95 disabled:opacity-50 transition"
            >
              <Check className="w-4 h-4" /> Approve
            </button>
            <button
              onClick={() => onAct(request.id, "scheduled")}
              disabled={!step4Done}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl ghost-border bg-surface-low text-sm font-semibold text-primary hover:bg-surface disabled:opacity-50 transition"
            >
              <CalendarDays className="w-4 h-4" /> With Conditions
            </button>
            <button
              onClick={() => onAct(request.id, "denied")}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold text-rose-600 hover:bg-rose-500/5 transition"
            >
              <X className="w-4 h-4" /> Decline
            </button>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground text-center">
            <kbd className="px-1.5 py-0.5 rounded bg-surface-low text-[10px] font-mono">Enter</kbd> approve ·
            <kbd className="ml-1 px-1.5 py-0.5 rounded bg-surface-low text-[10px] font-mono">Esc</kbd> decline ·
            <kbd className="ml-1 px-1.5 py-0.5 rounded bg-surface-low text-[10px] font-mono">↑↓</kbd> navigate
          </p>
        </div>
      </section>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   Step wrapper
   ───────────────────────────────────────────────────────────────────────── */
const Step = ({
  n, title, subtitle, children, locked, done,
}: {
  n: number; title: string; subtitle: string;
  children: React.ReactNode; locked?: boolean; done?: boolean;
}) => (
  <div className={`rounded-3xl bg-surface-lowest ghost-border p-5 transition ${locked ? "opacity-50 pointer-events-none" : ""}`}>
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className={`grid place-items-center w-7 h-7 rounded-full text-[11px] font-bold ${
          done ? "bg-primary text-primary-foreground" : "bg-surface-low text-muted-foreground"
        }`}>
          {done ? <Check className="w-3.5 h-3.5" /> : n}
        </span>
        <div>
          <p className="text-sm font-bold text-primary">{title}</p>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </div>
    <div className="mt-4">{children}</div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────
   Inbox panel (sheet)
   ───────────────────────────────────────────────────────────────────────── */
const InboxSheet = ({
  list, onPick, triggerLabel = "View All",
}: {
  list: AccessRequest[];
  onPick: (id: string) => void;
  triggerLabel?: string;
}) => {
  const [filter, setFilter] = useState<"pending" | "approved" | "denied">("pending");
  const [open, setOpen] = useState(false);

  const filtered = list.filter((r) =>
    filter === "pending" ? r.state === "pending" :
    filter === "approved" ? r.state === "approved" || r.state === "scheduled" :
    r.state === "denied"
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full ghost-border bg-surface-lowest text-sm font-semibold text-primary hover:bg-surface-low transition">
          <Inbox className="w-4 h-4" /> {triggerLabel}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md bg-surface-lowest">
        <SheetHeader>
          <SheetTitle>Request Inbox</SheetTitle>
        </SheetHeader>

        <div className="mt-4 inline-flex p-1 rounded-full bg-surface-low ghost-border">
          {(["pending", "approved", "denied"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full capitalize ${
                filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <ul className="mt-4 space-y-2 overflow-y-auto max-h-[calc(100vh-180px)]">
          {filtered.length === 0 && (
            <li className="text-xs text-muted-foreground text-center py-8">
              No {filter} requests.
            </li>
          )}
          {filtered.map((r) => {
            const c = contacts.find((x) => x.id === r.contactId)!;
            const Icon = r.channel ? channelMeta[r.channel as Channel].icon : MessageSquare;
            return (
              <li key={r.id}>
                <button
                  onClick={() => { onPick(r.id); setOpen(false); }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-surface-low hover:shadow-ambient transition text-left"
                >
                  <Avatar initials={c.initials} accent={c.accent} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-primary truncate">{c.name}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 truncate">
                      <Icon className="w-3 h-3" />
                      {r.purpose ?? r.reason}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${stateTone(r.state)}`}>
                      {r.state}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{r.receivedAt}</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </SheetContent>
    </Sheet>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   Outgoing view (read-only summary)
   ───────────────────────────────────────────────────────────────────────── */
const OutgoingView = ({ request }: { request: AccessRequest }) => {
  const c = contacts.find((x) => x.id === request.contactId)!;
  return (
    <div className="rounded-3xl bg-surface-lowest ghost-border p-6">
      <div className="flex items-start gap-4">
        <Avatar initials={c.initials} accent={c.accent} size="lg" />
        <div className="min-w-0 flex-1">
          <Link to={`/app/contact/${c.id}`} className="font-headline font-extrabold text-primary text-2xl hover:underline">
            {c.name}
          </Link>
          <p className="text-sm text-muted-foreground">{c.title} · {c.org}</p>
          <div className="mt-3">
            <StatusPill
              tone={
                request.state === "pending" ? "pending" :
                request.state === "approved" ? "approved" :
                request.state === "denied" ? "denied" : "scheduled"
              }
            />
          </div>
          <blockquote className="mt-4 rounded-2xl bg-surface-low p-4 italic text-sm text-foreground/80">
            "{request.reason}"
          </blockquote>
          <Link
            to={`/app/contact/${c.id}`}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
          >
            View profile <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccessRequests;
