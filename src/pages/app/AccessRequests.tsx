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
import ApprovalProtocolPanel from "@/components/app/ApprovalProtocolPanel";
import AccessRequestDetailsPanel from "@/components/app/AccessRequestDetailsPanel";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRelayState, AUDIENCE_LABEL, type Audience } from "@/lib/relayStore";

type Channel = "voice" | "message" | "calendar" | "quicksync";
type Venue = "online" | "onsite" | "hybrid";
type ActState = "approved" | "denied" | "scheduled";

const channelMeta: Record<Channel, { icon: typeof Mic; label: string }> = {
  voice: { icon: Mic, label: "Call" },
  message: { icon: MessageSquare, label: "Message" },
  calendar: { icon: CalendarDays, label: "Meeting" },
  quicksync: { icon: Zap, label: "Quick Sync" },
};

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
  const { assignAudience } = useRelayState();

  const handleAct = useCallback(
    (id: string, state: ActState, audience?: Audience) => {
      undoRef.current = { snapshot: list, id };
      // pre-pick next so the UI advances smoothly
      const idx = pending.findIndex((r) => r.id === id);
      const nextId = pending[idx + 1]?.id ?? pending[idx - 1]?.id ?? null;
      actCtx(id, state);
      if (state === "approved") {
        const r = list.find((x) => x.id === id);
        if (r) assignAudience(r.contactId, audience ?? "colleague");
      }
      setCursorId(nextId);
      toast({
        title:
          state === "approved" ? "Approved" :
          state === "denied" ? "Declined" : "Scheduled",
        description: state === "approved" && audience
          ? `Audience set to ${AUDIENCE_LABEL[audience]}. Tap Undo to reverse.`
          : "Tap Undo to reverse.",
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
    [list, pending, actCtx, setList, assignAudience],
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
      headerInline={
        <div className="inline-flex p-0.5 rounded-full bg-surface-low ghost-border">
          {(["incoming", "outgoing"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1 text-[11px] font-semibold rounded-full capitalize ${
                tab === t ? "bg-primary text-primary-foreground shadow-glass" : "text-muted-foreground hover:text-primary"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      }
      actions={
        <div className="flex items-center gap-2">
          {current && pending.length > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full ghost-border bg-surface-lowest">
              <button
                onClick={() => pending[currentIndex - 1] && setCursorId(pending[currentIndex - 1].id)}
                disabled={currentIndex === 0}
                className="p-1 rounded-full disabled:opacity-40 hover:bg-surface-low"
                aria-label="Previous request"
              >
                <ArrowLeft className="w-3 h-3" />
              </button>
              <span className="font-bold text-primary whitespace-nowrap">
                Request {currentIndex + 1} of {pending.length}
              </span>
              <button
                onClick={() => pending[currentIndex + 1] && setCursorId(pending[currentIndex + 1].id)}
                disabled={currentIndex >= pending.length - 1}
                className="p-1 rounded-full disabled:opacity-40 hover:bg-surface-low"
                aria-label="Next request"
              >
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
          <Link
            to="/app/requests/manage"
            className="hidden md:inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-elevated hover:opacity-95 transition"
          >
            <ShieldCheck className="w-4 h-4" /> Approval flow
          </Link>
        </div>
      }
    >
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
        <div className="relative grid lg:grid-cols-2 gap-0 items-stretch w-full rounded-3xl bg-surface-lowest ghost-border shadow-ambient overflow-hidden">
          <div className="lg:pr-8 p-5 md:p-6">
            <AccessRequestDetailsPanel
              key={current.id}
              request={current}
              variant="outgoing"
              onSend={() => toast({ title: "Request sent", description: "Your access request has been dispatched." })}
            />
          </div>
          <div className="hidden lg:block absolute left-1/2 top-6 bottom-6 w-px bg-gradient-to-b from-transparent via-border to-transparent" aria-hidden />
          <aside className="p-5 md:p-6 lg:pl-8 bg-surface-low/40">
            <header className="flex items-center justify-between mb-3">
              <h3 className="font-headline font-bold text-primary text-sm">Pending outgoing</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700">
                {pending.length}
              </span>
            </header>
            <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
              {pending.map((r) => {
                const c = contacts.find((x) => x.id === r.contactId)!;
                const active = r.id === current.id;
                return (
                  <li key={r.id}>
                    <button
                      onClick={() => setCursorId(r.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition ${
                        active ? "bg-primary/10 ring-1 ring-primary/30" : "bg-surface-low hover:shadow-ambient"
                      }`}
                    >
                      <Avatar initials={c.initials} accent={c.accent} status={c.status} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-primary truncate">{c.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{r.purpose ?? r.reason}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{r.receivedAt}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>
        </div>
      ) : (
        <div className="relative grid lg:grid-cols-2 gap-0 items-stretch w-full rounded-3xl bg-surface-lowest ghost-border shadow-ambient overflow-hidden">
          <div className="p-5 md:p-6 lg:pr-8">
            <AccessRequestDetailsPanel key={current.id} request={current} />
          </div>
          <div className="hidden lg:block absolute left-1/2 top-6 bottom-6 w-px bg-gradient-to-b from-transparent via-border to-transparent" aria-hidden />
          <div className="p-5 md:p-6 lg:pl-8 bg-surface-low/40">
            <ApprovalProtocolPanel
              contactName={contacts.find((x) => x.id === current.contactId)?.name}
              onAuthorize={() => handleAct(current.id, "approved")}
              onDecline={() => handleAct(current.id, "denied")}
            />
          </div>
        </div>
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
  onAct: (id: string, s: ActState, audience?: Audience) => void;
}) => {
  const c = contacts.find((x) => x.id === request.contactId)!;
  const venue: Venue = (request as any).venue ?? "online";
  const ChannelIcon = request.channel ? channelMeta[request.channel as Channel].icon : MessageSquare;
  const channelLabel = request.channel ? channelMeta[request.channel as Channel].label : "Message";
  const VenueIcon = venueMeta[venue].icon;

  // Source classification — what type of incoming request this is.
  const source: { label: string; icon: typeof Mic; tone: string } = (() => {
    switch (request.channel as Channel | undefined) {
      case "voice":
        return { label: "Call Sync", icon: Phone, tone: "bg-rose-500/10 text-rose-700 ring-1 ring-rose-500/20" };
      case "message":
        return { label: "Instant Message", icon: MessageSquare, tone: "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20" };
      case "calendar":
        return { label: "Scheduled Booking", icon: CalendarDays, tone: "bg-sky-500/10 text-sky-700 ring-1 ring-sky-500/20" };
      case "quicksync":
        return { label: "Quick Sync", icon: Zap, tone: "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20" };
      default:
        return { label: "Message", icon: MessageSquare, tone: "bg-surface-low text-primary ring-1 ring-border" };
    }
  })();
  const SourceIcon = source.icon;
  const isPriorityBypass =
    request.urgency === "high" && (request.channel === "voice" || request.channel === "message");

  const urgencyTone =
    request.urgency === "high" ? "bg-rose-500/10 text-rose-700"
    : request.urgency === "medium" ? "bg-amber-500/10 text-amber-700"
    : "bg-muted text-muted-foreground";
  const urgencyLabel =
    request.urgency === "high" ? "Urgent" : request.urgency === "medium" ? "Priority" : "Routine";

  return (
    <article className="max-w-2xl mx-auto rounded-3xl bg-surface-lowest ghost-border p-5 md:p-6 shadow-ambient">
      {/* Identity row */}
      <header className="flex items-start gap-3">
        <Avatar initials={c.initials} accent={c.accent} status={c.status} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/app/contact/${c.id}`}
              className="font-headline font-bold text-primary text-lg leading-tight hover:underline truncate"
            >
              {c.name}
            </Link>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${urgencyTone}`}>
              {urgencyLabel}
            </span>
            {request.senderType === "guest" && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700">
                New
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{c.title} · {c.org}</p>
          <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
            <Clock3 className="w-3 h-3" /> {request.receivedAt}
          </p>
        </div>
      </header>

      {/* Source highlight + date/time */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${source.tone}`}>
          <SourceIcon className="w-3.5 h-3.5" /> {source.label}
        </span>
        {isPriorityBypass && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500/15 to-rose-500/15 text-amber-800 ring-1 ring-amber-500/30">
            <Zap className="w-3.5 h-3.5" /> Priority Bypass
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/5 text-primary ring-1 ring-primary/10">
          <Clock3 className="w-3.5 h-3.5" /> {request.receivedAt}
        </span>
      </div>

      {/* Essentials row */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-low text-xs font-semibold text-primary">
          <VenueIcon className="w-3.5 h-3.5" /> {venueMeta[venue].label}
        </span>
        {request.purpose && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-low text-xs text-muted-foreground">
            <Briefcase className="w-3 h-3" /> {request.purpose}
          </span>
        )}
        {request.relation && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {request.relation}
          </span>
        )}
      </div>

      {/* Note */}
      {request.reason && (
        <blockquote className="mt-4 rounded-2xl bg-surface-low p-3.5 italic text-sm text-foreground/80 leading-relaxed">
          "{request.reason}"
        </blockquote>
      )}

      {request.referredBy && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span className="text-muted-foreground">Referred by</span>
          <span className="font-semibold text-primary">{request.referredBy}</span>
        </div>
      )}

      {/* Actions */}
      <div className="mt-5 grid grid-cols-2 gap-2">
        <button
          onClick={() => onAct(request.id, "approved")}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl bg-gradient-primary text-primary-foreground text-sm font-bold shadow-elevated hover:opacity-95 transition"
        >
          <Check className="w-4 h-4" /> Approve
        </button>
        <button
          onClick={() => onAct(request.id, "denied")}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl ghost-border bg-surface-low text-sm font-bold text-rose-600 hover:bg-rose-500/5 transition"
        >
          <X className="w-4 h-4" /> Decline
        </button>
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground text-center">
        <kbd className="px-1.5 py-0.5 rounded bg-surface-low text-[10px] font-mono">Enter</kbd> approve ·
        <kbd className="ml-1 px-1.5 py-0.5 rounded bg-surface-low text-[10px] font-mono">Esc</kbd> decline ·
        <kbd className="ml-1 px-1.5 py-0.5 rounded bg-surface-low text-[10px] font-mono">↑↓</kbd> navigate
      </p>
    </article>
  );
};

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
                  <Avatar initials={c.initials} accent={c.accent} status={c.status} size="sm" />
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
        <Avatar initials={c.initials} accent={c.accent} status={c.status} size="lg" />
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
