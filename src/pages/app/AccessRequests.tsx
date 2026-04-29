import { useMemo, useState } from "react";
import {
  Inbox, Check, X, CalendarPlus, ArrowRight, ListChecks, ShieldCheck,
  Mic, MessageSquare, CalendarDays, Sparkles, AlertTriangle, Clock3,
  Lock, Plus, Shield,
} from "lucide-react";
import { Link } from "react-router-dom";
import AppShell from "@/components/app/AppShell";
import Avatar from "@/components/app/Avatar";
import StatusPill from "@/components/app/StatusPill";
import EmptyState from "@/components/app/EmptyState";
import { contacts, requests as initial, type AccessRequest } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";
import { useRole } from "@/lib/role";

type QueueId = "high" | "regular" | "quarantine";

const channelMeta = {
  voice: { icon: Mic, label: "Voice Sync" },
  message: { icon: MessageSquare, label: "Messaging" },
  calendar: { icon: CalendarDays, label: "Schedule Time" },
} as const;

const AccessRequests = () => {
  const [list, setList] = useState(initial);
  const [tab, setTab] = useState<"incoming" | "outgoing">("incoming");
  const [queue, setQueue] = useState<QueueId>("high");
  const [role] = useRole();

  const filtered = useMemo(
    () =>
      list
        .filter((r) => r.direction === tab)
        .filter((r) =>
          queue === "high"
            ? r.urgency === "high" || r.urgency === "medium"
            : queue === "regular"
            ? r.urgency === "low"
            : r.state === "denied",
        ),
    [list, tab, queue],
  );

  const [selectedId, setSelectedId] = useState<string | null>(filtered[0]?.id ?? null);
  const selected = list.find((r) => r.id === (selectedId ?? filtered[0]?.id)) ?? filtered[0];

  const act = (id: string, state: "approved" | "denied" | "scheduled") => {
    setList((prev) => prev.map((r) => (r.id === id ? { ...r, state } : r)));
    toast({
      title:
        state === "approved" ? "Request approved" : state === "denied" ? "Request declined" : "Scheduled — invite sent",
    });
  };

  const queueCounts = {
    high: list.filter((r) => r.direction === tab && (r.urgency === "high" || r.urgency === "medium")).length,
    regular: list.filter((r) => r.direction === tab && r.urgency === "low").length,
    quarantine: list.filter((r) => r.direction === tab && r.state === "denied").length,
  };

  return (
    <AppShell
      subtitle={role === "provider" ? "Provider control" : "Your activity"}
      title="Access requests"
      actions={
        role === "provider" && (
          <div className="flex items-center gap-2">
            <Link
              to="/app/requests/queues"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full ghost-border bg-surface-lowest text-sm font-semibold text-primary hover:bg-surface-low transition"
            >
              <ListChecks className="w-4 h-4" /> Queues
            </Link>
            <Link
              to="/app/requests/manage"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-elevated hover:opacity-95 transition"
            >
              <ShieldCheck className="w-4 h-4" /> Approval flow
            </Link>
          </div>
        )
      }
    >
      <div className="inline-flex p-1 rounded-full bg-surface-low ghost-border mb-6">
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

      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        {/* Queue Sidebar */}
        <aside className="space-y-2">
          <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-4 text-primary-foreground shadow-elevated">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Approval Queues</span>
            </div>
            <p className="text-sm font-semibold">Provider dashboard</p>
          </div>

          {[
            { id: "high" as QueueId, label: "High Priority", icon: AlertTriangle, count: queueCounts.high },
            { id: "regular" as QueueId, label: "Regular", icon: ListChecks, count: queueCounts.regular },
            { id: "quarantine" as QueueId, label: "Quarantine", icon: Lock, count: queueCounts.quarantine },
          ].map((q) => (
            <button
              key={q.id}
              onClick={() => setQueue(q.id)}
              className={`w-full flex items-center justify-between gap-2 px-4 py-3 rounded-2xl text-sm font-semibold transition ${
                queue === q.id
                  ? "bg-surface-lowest text-primary shadow-ambient"
                  : "text-muted-foreground hover:bg-surface-low"
              }`}
            >
              <span className="flex items-center gap-2.5">
                {queue === q.id && q.id === "high" && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                <q.icon className="w-4 h-4" />
                {q.label}
              </span>
              <span className="text-[11px] opacity-70">{q.count}</span>
            </button>
          ))}

          <button className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-elevated hover:opacity-95 transition">
            <Plus className="w-4 h-4" /> New Protocol
          </button>
        </aside>

        {/* Detail Pane */}
        <section>
          {!selected ? (
            <EmptyState
              icon={Inbox}
              title="No requests in this queue"
              description="When new requests arrive they'll appear here in priority order."
            />
          ) : (
            <RequestDetail
              key={selected.id}
              request={selected}
              tab={tab}
              onAct={act}
              siblings={filtered}
              onPick={setSelectedId}
            />
          )}
        </section>
      </div>
    </AppShell>
  );
};

const RequestDetail = ({
  request,
  tab,
  onAct,
  siblings,
  onPick,
}: {
  request: AccessRequest;
  tab: "incoming" | "outgoing";
  onAct: (id: string, s: "approved" | "denied" | "scheduled") => void;
  siblings: AccessRequest[];
  onPick: (id: string) => void;
}) => {
  const c = contacts.find((x) => x.id === request.contactId)!;
  const ChannelIcon = channelMeta[request.channel ?? "voice"].icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-primary/70">
          <ShieldCheck className="w-3.5 h-3.5" /> Security protocol
        </div>
        <h1 className="font-headline font-extrabold text-primary text-4xl md:text-5xl mt-2 leading-[1.05]">
          Access Request
        </h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-xl">
          Review incoming access requests and establish secure connection parameters for this session.
        </p>
      </div>

      {/* Main Card */}
      <div className="rounded-3xl bg-surface-lowest p-6 md:p-8 shadow-ambient ghost-border">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <Avatar initials={c.initials} accent={c.accent} size="lg" />
            <div>
              <Link to={`/app/contact/${c.id}`} className="font-headline font-extrabold text-primary text-2xl hover:underline">
                {c.name}
              </Link>
              <p className="text-sm text-muted-foreground">{c.title}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {request.relation && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-primary/10 text-primary">
                    {request.relation}
                  </span>
                )}
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                    request.senderType === "guest" ? "bg-amber-500/10 text-amber-700" : "bg-emerald-500/10 text-emerald-700"
                  }`}
                >
                  {request.senderType === "guest" ? "Guest sender" : "Verified member"}
                </span>
                <StatusPill
                  tone={
                    request.state === "pending"
                      ? "pending"
                      : request.state === "approved"
                      ? "approved"
                      : request.state === "denied"
                      ? "denied"
                      : "scheduled"
                  }
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                request.urgency === "high"
                  ? "bg-rose-500/10 text-rose-700"
                  : request.urgency === "medium"
                  ? "bg-amber-500/10 text-amber-700"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {request.urgency === "high" ? "Urgent" : request.urgency === "medium" ? "Important" : "Routine"}
            </span>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock3 className="w-3 h-3" /> {request.receivedAt}
            </span>
          </div>
        </div>

        <div className="mt-7 space-y-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary/60">Purpose</p>
            <p className="font-headline font-bold text-primary text-xl mt-1">{request.purpose ?? "—"}</p>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary/60">Message</p>
            <blockquote className="mt-2 rounded-2xl bg-surface-low p-5 italic text-foreground/80 text-sm leading-relaxed">
              "{request.reason}"
            </blockquote>
          </div>

          {request.referredBy && (
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-muted-foreground">Referred by</span>
              <span className="font-semibold text-primary">{request.referredBy}</span>
            </div>
          )}
        </div>
      </div>

      {/* Connection Channels */}
      <div className="rounded-3xl bg-surface-lowest p-6 ghost-border">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary/60">Connection channels</p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {(["voice", "message", "calendar"] as const).map((ch) => {
            const meta = channelMeta[ch];
            const active = request.channel === ch;
            return (
              <div
                key={ch}
                className={`flex flex-col items-center gap-2 p-5 rounded-2xl transition ${
                  active ? "bg-primary/5 ring-2 ring-primary text-primary" : "bg-surface-low text-muted-foreground"
                }`}
              >
                <meta.icon className="w-5 h-5" />
                <span className="text-xs font-semibold">{meta.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      {tab === "incoming" && request.state === "pending" && (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onAct(request.id, "approved")}
            className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-elevated hover:opacity-95 transition"
          >
            <Check className="w-4 h-4" /> Approve
          </button>
          <Link
            to={`/app/schedule/${c.id}`}
            onClick={() => onAct(request.id, "scheduled")}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full ghost-border bg-surface-low text-sm font-semibold text-primary hover:bg-surface transition"
          >
            <CalendarPlus className="w-4 h-4" /> Schedule
          </Link>
          <button className="inline-flex items-center justify-center px-6 py-3.5 rounded-full ghost-border bg-surface-low text-sm font-semibold text-muted-foreground hover:bg-surface transition">
            Ignore
          </button>
          <button
            onClick={() => onAct(request.id, "denied")}
            className="inline-flex items-center justify-center px-6 py-3.5 rounded-full text-sm font-semibold text-rose-600 hover:bg-rose-500/5 transition"
          >
            Decline
          </button>
        </div>
      )}

      {tab === "outgoing" && (
        <Link
          to={`/app/contact/${c.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
        >
          View profile <ArrowRight className="w-3 h-3" />
        </Link>
      )}

      {/* Other requests */}
      {siblings.length > 1 && (
        <div className="rounded-3xl bg-surface-low p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary/60 mb-3">Other requests in queue</p>
          <ul className="space-y-2">
            {siblings.filter((s) => s.id !== request.id).map((s) => {
              const sc = contacts.find((x) => x.id === s.contactId)!;
              return (
                <li key={s.id}>
                  <button
                    onClick={() => onPick(s.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-surface-lowest hover:shadow-ambient transition text-left"
                  >
                    <Avatar initials={sc.initials} accent={sc.accent} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-primary truncate">{sc.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{s.purpose ?? s.reason}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{s.receivedAt}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AccessRequests;
