import { useEffect, useRef, useState } from "react";
import { Bell, PhoneCall, MessageSquare, Calendar, Check, Car, X, Lock } from "lucide-react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import type { Contact, AvailabilityStatus } from "@/lib/mockData";
import { trackMetric } from "@/lib/metrics";

type PingKind = "call" | "message" | "calendar";

interface Props {
  contact: Contact;
  drivingOverride?: boolean;
  size?: "xs" | "sm" | "md";
  className?: string;
}

// Call Ping: lightweight live-intent signal.
// Rules: 2-hour cooldown, only ONE active Call Ping per contact, auto-expire after 30 min.
const CALL_COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2h between pings
const CALL_TTL_MS = 30 * 60 * 1000;          // active for 30m, then auto-expire

type CallPing = { sentAt: number; expiresAt: number; resolved: boolean };
const callKey = (id: string) => `availock:ping:call:${id}`;

const readCallPing = (id: string): CallPing | null => {
  try {
    const raw = localStorage.getItem(callKey(id));
    if (!raw) return null;
    return JSON.parse(raw) as CallPing;
  } catch { return null; }
};
const writeCallPing = (id: string, p: CallPing | null) => {
  try {
    if (!p) localStorage.removeItem(callKey(id));
    else localStorage.setItem(callKey(id), JSON.stringify(p));
  } catch { /* ignore */ }
};
const isCallPingActive = (p: CallPing | null) =>
  !!p && !p.resolved && p.expiresAt > Date.now();

const isPriority = (c: Contact) =>
  c.favorite || c.relationship === "family" || c.relationship === "investor";

const statusCopy = (
  status: AvailabilityStatus | "driving",
  name: string,
  kind: PingKind,
) => {
  const verb = kind === "call" ? "connect" : kind === "message" ? "check messages" : "review the booking";
  if (status === "driving")
    return { title: "Will alert safely later", body: `${name} is driving — they'll see your ${verb} ping when it's safe.` };
  if (status === "available")
    return { title: "Available now — connect?", body: `${name} is reachable. Ping delivered as a ${verb} request.` };
  if (status === "focus")
    return { title: "In focus mode", body: `Ping queued. ${name} will see it on their next break.` };
  if (status === "busy")
    return { title: "Ping delivered", body: `${name} is busy — they'll see it when free.` };
  return { title: "Ping delivered", body: `${name} will see it the next time they're online.` };
};

const fmtCountdown = (ms: number) => {
  const m = Math.ceil(ms / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
};

const PingButton = ({ contact, drivingOverride, size = "sm", className }: Props) => {
  const [open, setOpen] = useState(false);
  const [sentKind, setSentKind] = useState<PingKind | null>(null);
  const [callPing, setCallPing] = useState<CallPing | null>(() => readCallPing(contact.id));
  const [, setTick] = useState(0);

  // Tick every 30s while popover open so countdowns refresh.
  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, [open]);

  // Tick every 30s while popover open so countdowns refresh.
  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, [open]);

  const status: AvailabilityStatus | "driving" = drivingOverride ? "driving" : contact.status;
  const priority = isPriority(contact);
  const alerts = contact.alerts ?? [];
  // Eligibility for thread-bound pings (mocked off contact.alerts).
  const hasUnread = alerts.includes("message");
  const hasPendingBooking = alerts.includes("calendar");

  const callActive = isCallPingActive(callPing);
  const callCooldownLeft = callPing
    ? Math.max(0, CALL_COOLDOWN_MS - (Date.now() - callPing.sentAt))
    : 0;
  const callCooling = !priority && !callActive && callCooldownLeft > 0;

  const sendPing = (kind: PingKind) => {
    if (kind === "call") {
      if (callActive) {
        toast({ title: "Call Ping already active", description: `${contact.name.split(" ")[0]} has been notified. We'll let you know when they respond.` });
        return;
      }
      if (callCooling) {
        toast({ title: "Cooldown active", description: `Try again in ${fmtCountdown(callCooldownLeft)}. One Call Ping per 2 hours.` });
        return;
      }
      const now = Date.now();
      const p: CallPing = { sentAt: now, expiresAt: now + CALL_TTL_MS, resolved: false };
      writeCallPing(contact.id, p);
      setCallPing(p);
    }
    if (kind === "message" && !hasUnread) {
      toast({ title: "No unread thread", description: "Message Ping only nudges existing unread or unanswered messages." });
      return;
    }
    if (kind === "calendar" && !hasPendingBooking) {
      toast({ title: "No pending booking", description: "Calendar Ping only escalates a pending booking approval." });
      return;
    }
    setSentKind(kind);
    trackMetric("ping_used", {
      actor: contact.id,
      dedupeKey: `ping:${contact.id}:${kind}:${new Date().toISOString().slice(0, 10)}`,
    });
    const copy = statusCopy(status, contact.name.split(" ")[0], kind);
    toast({ title: copy.title, description: copy.body });
    setTimeout(() => { setOpen(false); setSentKind(null); }, 1400);
  };

  const dismissCallPing = () => {
    writeCallPing(contact.id, null);
    setCallPing(null);
    toast({ title: "Call Ping cleared", description: "You can send a new one anytime." });
  };

  const sizing = size === "md" ? "w-10 h-10" : size === "xs" ? "w-6 h-6" : "w-8 h-8";
  const iconSize = size === "md" ? "w-4 h-4" : size === "xs" ? "w-3 h-3" : "w-3.5 h-3.5";

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); }}
          title={`Quick Ping ${contact.name.split(" ")[0]}`}
          aria-label={`Quick Ping ${contact.name}`}
          className={cn(
            "grid place-items-center rounded-full transition relative",
            sizing,
            priority
              ? "bg-gradient-to-br from-amber-400/25 to-rose-500/25 text-amber-700 hover:from-amber-400/40 hover:to-rose-500/40 ring-1 ring-amber-400/40"
              : "bg-primary/10 text-primary hover:bg-primary/20",
            className,
          )}
        >
          <Bell className={cn(iconSize, "relative")} />
          {priority && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500 ring-2 ring-surface-lowest" />
          )}
          {callActive && (
            <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-surface-lowest animate-pulse" />
          )}
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          side="bottom"
          sideOffset={8}
          collisionPadding={16}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "z-[100] w-72 rounded-2xl ghost-border bg-surface-lowest shadow-elevated p-2 outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2",
            "data-[side=left]:slide-in-from-right-2",
            "data-[side=right]:slide-in-from-left-2",
            "data-[side=top]:slide-in-from-bottom-2",
          )}
        >
          <div className="flex items-center justify-between px-2 py-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">Quick Ping</p>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-primary" aria-label="Close">
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="px-2 pb-2 text-[11px] text-muted-foreground leading-snug">
            Silent signal — request connection without interrupting.
            {priority && <span className="ml-1 font-semibold text-amber-700">Priority delivery.</span>}
          </p>

          {status === "driving" && (
            <div className="mx-1 mb-2 flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-orange-500/10 text-orange-700 text-[11px]">
              <Car className="w-3 h-3" /> Driving — delivered safely later
            </div>
          )}

          {/* CALL PING — live intent, no thread required */}
          <button
            disabled={!!sentKind || callActive || callCooling}
            onClick={() => sendPing("call")}
            className={cn(
              "w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition",
              sentKind === "call" ? "bg-emerald-500/15"
                : callActive ? "bg-emerald-500/10"
                : callCooling ? "opacity-60"
                : "hover:bg-surface-low",
            )}
          >
            <span className="grid place-items-center w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-700">
              {sentKind === "call" || callActive ? <Check className="w-4 h-4" /> : <PhoneCall className="w-4 h-4" />}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-xs font-semibold text-primary">Call Ping</span>
              <span className="block text-[10px] text-muted-foreground">
                {callActive
                  ? `Active — expires in ${fmtCountdown(callPing!.expiresAt - Date.now())}`
                  : callCooling
                    ? `Cooldown — ${fmtCountdown(callCooldownLeft)} left`
                    : "Request connection without interrupting"}
              </span>
            </span>
            {callActive && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); dismissCallPing(); }}
                className="text-[10px] text-muted-foreground hover:text-primary px-1.5 py-1 rounded"
              >
                Clear
              </span>
            )}
          </button>

          {/* MESSAGE PING — reminder, only with unread thread */}
          <button
            disabled={!!sentKind || !hasUnread}
            onClick={() => sendPing("message")}
            className={cn(
              "mt-1 w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition",
              sentKind === "message" ? "bg-sky-500/15"
                : !hasUnread ? "opacity-50 cursor-not-allowed"
                : "hover:bg-surface-low",
            )}
          >
            <span className="grid place-items-center w-8 h-8 rounded-full bg-sky-500/15 text-sky-700">
              {sentKind === "message" ? <Check className="w-4 h-4" /> : hasUnread ? <MessageSquare className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-xs font-semibold text-primary">Message Ping</span>
              <span className="block text-[10px] text-muted-foreground">
                {hasUnread ? "Nudge an unread message" : "No unread thread to nudge"}
              </span>
            </span>
          </button>

          {/* CALENDAR PING — booking approval reminder */}
          <button
            disabled={!!sentKind || !hasPendingBooking}
            onClick={() => sendPing("calendar")}
            className={cn(
              "mt-1 w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition",
              sentKind === "calendar" ? "bg-violet-500/15"
                : !hasPendingBooking ? "opacity-50 cursor-not-allowed"
                : "hover:bg-surface-low",
            )}
          >
            <span className="grid place-items-center w-8 h-8 rounded-full bg-violet-500/15 text-violet-700">
              {sentKind === "calendar" ? <Check className="w-4 h-4" /> : hasPendingBooking ? <Calendar className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-xs font-semibold text-primary">Calendar Ping</span>
              <span className="block text-[10px] text-muted-foreground">
                {hasPendingBooking ? "Remind about pending booking" : "No booking awaiting approval"}
              </span>
            </span>
          </button>

          <p className="mt-2 px-2 pb-1 text-[10px] text-muted-foreground/80 leading-snug">
            Call Ping: 1 active per contact · 2h cooldown.
            {priority && " Priority bypass for cooldown."}
          </p>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
};

export default PingButton;