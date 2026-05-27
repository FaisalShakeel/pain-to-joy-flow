import { Check, X, MessageCircle, UserPlus, Clock3, Users, CalendarClock, CalendarDays, Building2, Radio, Zap, Phone, BellOff } from "lucide-react";
import { useWaitingList } from "@/hooks/use-metrics";
import { updateWaitingStatus, trackMetric } from "@/lib/metrics";
import { useRequests } from "@/components/app/RequestsContext";
import { contacts } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useCallWatch } from "@/lib/callWatchStore";
import { Link } from "react-router-dom";

type PAChannel = "Meeting" | "Webinar" | "Venue" | "QS";

const channelMeta: Record<PAChannel, { icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  Meeting: { icon: CalendarDays, tone: "bg-sky-500/15 text-sky-700" },
  Webinar: { icon: Radio,        tone: "bg-violet-500/15 text-violet-700" },
  Venue:   { icon: Building2,    tone: "bg-emerald-500/15 text-emerald-700" },
  QS:      { icon: Zap,          tone: "bg-amber-500/15 text-amber-700" },
};

// Deterministic channel assignment for mock variety.
const assignChannel = (id: string): PAChannel => {
  const channels: PAChannel[] = ["Meeting", "Webinar", "Venue", "QS"];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i)) % 7;
  return channels[h % channels.length];
};

// Parse "Xh ago" / "Xd ago" / "Yesterday" → epoch ms (approx) for sorting.
const parseReceived = (s: string): number => {
  const now = Date.now();
  if (/yesterday/i.test(s)) return now - 86_400_000;
  const m = s.match(/(\d+)\s*(h|d|m)/i);
  if (!m) return now;
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  const ms = unit === "d" ? 86_400_000 : unit === "h" ? 3_600_000 : 60_000;
  return now - n * ms;
};

const fmtAgo = (at: number) => {
  const s = Math.max(1, Math.floor((Date.now() - at) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
};

const fmtExpiry = (at: number) => {
  const s = Math.max(0, Math.floor((at - Date.now()) / 1000));
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m left` : "expiring";
};

const WaitingList = () => {
  const list = useWaitingList();
  const qs = list
    .filter((w) => w.status === "waiting")
    .sort((a, b) => a.joinedAt - b.joinedAt);

  const { list: requests, act } = useRequests();
  const pending = requests
    .filter((r) => r.direction === "incoming" && r.state === "pending")
    .map((r) => ({ r, channel: assignChannel(r.id), at: parseReceived(r.receivedAt) }))
    .sort((a, b) => b.at - a.at);

  const { ids: watchIds, disableWatch, toggleWatch } = useCallWatch();
  const watched = watchIds
    .map((id) => contacts.find((c) => c.id === id))
    .filter(Boolean) as typeof contacts;

  const total = qs.length + pending.length + watched.length;

  return (
    <div className="dashboard-module p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center w-7 h-7 rounded-full bg-primary/10 text-primary">
            <Users className="w-3.5 h-3.5" />
          </span>
          <div>
            <h3 className="font-headline font-bold text-primary text-sm">Waiting List</h3>
            <p className="text-[11px] text-muted-foreground">Demand in one place — overflow & approval</p>
          </div>
        </div>
        <span className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold",
          total ? "bg-amber-500/15 text-amber-700" : "bg-surface-low text-muted-foreground",
        )}>
          {total} waiting
        </span>
      </div>

      {/* Section A — QS Wait */}
      <SubHeader label="QS Wait" hint="Overflow demand · expires in 30 min" count={qs.length} />
      {qs.length === 0 ? (
        <EmptyRow text="No QS overflow. Seekers will queue here when slots fill up." />
      ) : (
        <ul className="space-y-2 mb-3">
          {qs.map((w) => (
            <li key={w.id} className="flex items-center gap-2.5 p-2 rounded-xl nested-surface">
              <span className="grid place-items-center w-9 h-9 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                {w.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm font-semibold text-primary truncate">{w.name}</p>
                  <ChannelChip channel="QS" />
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  {w.note || "No note"} · <span className="inline-flex items-center gap-0.5"><Clock3 className="w-2.5 h-2.5" />joined {fmtAgo(w.joinedAt)} · {fmtExpiry(w.expiresAt)}</span>
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <ActionBtn title="Approve — create extra slot" tone="emerald" onClick={() => {
                  updateWaitingStatus(w.id, "approved");
                  toast({ title: "Approved", description: `Extra Quick Sync slot offered to ${w.name}.` });
                }}><Check className="w-3.5 h-3.5" /></ActionBtn>
                <ActionBtn title="Invite to connect now" tone="sky" onClick={() => {
                  updateWaitingStatus(w.id, "approved");
                  trackMetric("ping_to_connect", { dedupeKey: `wait-invite:${w.id}` });
                  toast({ title: "Invitation sent", description: `${w.name} can join the call now.` });
                }}><UserPlus className="w-3.5 h-3.5" /></ActionBtn>
                <ActionBtn title="Send message" tone="muted" onClick={() => toast({ title: "Message sent", description: `Reply delivered to ${w.name}.` })}>
                  <MessageCircle className="w-3.5 h-3.5" />
                </ActionBtn>
                <ActionBtn title="Cancel — remove from queue" tone="rose" onClick={() => {
                  updateWaitingStatus(w.id, "cancelled");
                  toast({ title: "Removed", description: `${w.name} removed from the waiting list.` });
                }}><X className="w-3.5 h-3.5" /></ActionBtn>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="my-3 h-px bg-border/60" aria-hidden />

      {/* Section B — Pending Approval */}
      <SubHeader label="Pending Approval" hint="Booking only after approval" count={pending.length} />
      {pending.length === 0 ? (
        <EmptyRow text="No pending approval requests right now." />
      ) : (
        <ul className="space-y-2">
          {pending.map(({ r, channel }) => {
            const c = contacts.find((x) => x.id === r.contactId);
            const name = c?.name || "Unknown";
            const initials = c?.initials || name.split(" ").map((s) => s[0]).slice(0, 2).join("");
            return (
              <li key={r.id} className="flex items-center gap-2.5 p-2 rounded-xl nested-surface">
                <span className="grid place-items-center w-9 h-9 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                  {initials}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-semibold text-primary truncate">{name}</p>
                    <ChannelChip channel={channel} />
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 text-[9px] font-bold uppercase tracking-wider">Pending</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {r.reason} · <span className="inline-flex items-center gap-0.5"><CalendarClock className="w-2.5 h-2.5" />{r.receivedAt}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <ActionBtn title="Approve — move to Reserved" tone="emerald" onClick={() => {
                    act(r.id, "scheduled");
                    trackMetric("approved_interaction", { dedupeKey: `req:${r.id}` });
                    toast({ title: "Approved", description: `${name} moved to Reserved.` });
                  }}><Check className="w-3.5 h-3.5" /></ActionBtn>
                  <ActionBtn title="Reschedule — suggest alternate" tone="sky" onClick={() => toast({ title: "Reschedule sent", description: `Alternate time suggested to ${name}.` })}>
                    <CalendarClock className="w-3.5 h-3.5" />
                  </ActionBtn>
                  <ActionBtn title="Message" tone="muted" onClick={() => toast({ title: "Message sent", description: `Reply delivered to ${name}.` })}>
                    <MessageCircle className="w-3.5 h-3.5" />
                  </ActionBtn>
                  <ActionBtn title="Reject" tone="rose" onClick={() => {
                    act(r.id, "denied");
                    toast({ title: "Rejected", description: `${name}'s request was declined.` });
                  }}><X className="w-3.5 h-3.5" /></ActionBtn>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="my-3 h-px bg-border/60" aria-hidden />

      {/* Section C — Call Watch */}
      <SubHeader
        label="Call Watch"
        hint="Alerts when a watched contact becomes available"
        count={watched.length}
      />
      {watched.length === 0 ? (
        <EmptyRow text="Tap the phone icon on any Explore contact to watch their availability." />
      ) : (
        <ul className="space-y-2">
          {watched.map((c) => {
            const available = c.status === "available";
            return (
              <li key={c.id} className="flex items-center gap-2.5 p-2 rounded-xl nested-surface">
                <span className="relative grid place-items-center w-9 h-9 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                  {c.initials}
                  {available && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-semibold text-primary truncate">{c.name}</p>
                    <span
                      className={cn(
                        "inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
                        available
                          ? "bg-emerald-500/15 text-emerald-700"
                          : "bg-surface-low text-muted-foreground",
                      )}
                    >
                      {available ? "Available now" : c.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {available
                      ? `${c.name} is now available for a direct call`
                      : `${c.title || "Contact"} · waiting for availability`}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {available && (
                    <Link
                      to={`/app/contact/${c.id}`}
                      onClick={() => {
                        disableWatch(c.id);
                        trackMetric("ping_to_connect", { dedupeKey: `callwatch:${c.id}` });
                        toast({ title: "Calling now", description: `Opening direct call with ${c.name}.` });
                      }}
                      title="Call now"
                      aria-label="Call now"
                      className="inline-flex items-center gap-1 px-2.5 h-7 rounded-full bg-emerald-500 text-white text-[11px] font-semibold hover:bg-emerald-500/90 transition"
                    >
                      <Phone className="w-3 h-3" />
                      Call now
                    </Link>
                  )}
                  <ActionBtn
                    title="Stop watching"
                    tone="muted"
                    onClick={() => {
                      toggleWatch(c.id);
                      toast({ title: "Call Watch removed", description: `${c.name} removed from your Call Watch list.` });
                    }}
                  >
                    <BellOff className="w-3.5 h-3.5" />
                  </ActionBtn>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

function SubHeader({ label, hint, count }: { label: string; hint: string; count: number }) {
  return (
    <div className="flex items-baseline justify-between mb-2 px-1">
      <div className="flex items-baseline gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary/80">{label}</span>
        <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">({count})</span>
      </div>
      <span className="text-[10px] text-muted-foreground italic">{hint}</span>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <p className="text-xs text-muted-foreground italic px-2 py-2.5">{text}</p>;
}

function ChannelChip({ channel }: { channel: PAChannel }) {
  const meta = channelMeta[channel];
  const Icon = meta.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider", meta.tone)}>
      <Icon className="w-2.5 h-2.5" />
      {channel}
    </span>
  );
}

function ActionBtn({
  children, onClick, title, tone,
}: { children: React.ReactNode; onClick: () => void; title: string; tone: "emerald" | "sky" | "rose" | "muted" }) {
  const map = {
    emerald: "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25",
    sky:     "bg-sky-500/15 text-sky-700 hover:bg-sky-500/25",
    rose:    "bg-rose-500/15 text-rose-700 hover:bg-rose-500/25",
    muted:   "bg-surface-low text-muted-foreground hover:bg-surface-low/70 hover:text-primary",
  } as const;
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={cn("grid place-items-center w-7 h-7 rounded-full transition", map[tone])}
    >
      {children}
    </button>
  );
}

export default WaitingList;