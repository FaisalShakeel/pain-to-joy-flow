import { useEffect, useRef, useState } from "react";
import { Bell, PhoneCall, MessageSquare, Check, Car, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import type { Contact, AvailabilityStatus } from "@/lib/mockData";

type PingKind = "callback" | "message";

interface Props {
  contact: Contact;
  drivingOverride?: boolean;
  size?: "sm" | "md";
  className?: string;
}

const DAILY_LIMIT = 3;
const COOLDOWN_MS = 60 * 1000; // 1 minute mock cooldown

const storageKey = (id: string) => `availock:ping:${id}`;

type PingRecord = { lastAt: number; today: number; day: string };

const today = () => new Date().toISOString().slice(0, 10);

const readRecord = (id: string): PingRecord => {
  try {
    const raw = localStorage.getItem(storageKey(id));
    if (!raw) return { lastAt: 0, today: 0, day: today() };
    const r = JSON.parse(raw) as PingRecord;
    if (r.day !== today()) return { lastAt: 0, today: 0, day: today() };
    return r;
  } catch {
    return { lastAt: 0, today: 0, day: today() };
  }
};

const writeRecord = (id: string, r: PingRecord) => {
  try { localStorage.setItem(storageKey(id), JSON.stringify(r)); } catch { /* ignore */ }
};

const isPriority = (c: Contact) =>
  c.favorite || c.relationship === "family" || c.relationship === "investor";

const statusCopy = (
  status: AvailabilityStatus | "driving",
  name: string,
  kind: PingKind,
) => {
  const verb = kind === "callback" ? "call back" : "message";
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

const PingButton = ({ contact, drivingOverride, size = "sm", className }: Props) => {
  const [open, setOpen] = useState(false);
  const [sentKind, setSentKind] = useState<PingKind | null>(null);
  const [record, setRecord] = useState<PingRecord>(() => readRecord(contact.id));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const status: AvailabilityStatus | "driving" = drivingOverride ? "driving" : contact.status;
  const priority = isPriority(contact);
  const cooldownLeft = Math.max(0, COOLDOWN_MS - (Date.now() - record.lastAt));
  const limited = !priority && record.today >= DAILY_LIMIT;
  const cooling = !priority && cooldownLeft > 0;

  const sendPing = (kind: PingKind) => {
    if (limited) {
      toast({ title: "Daily ping limit reached", description: `You've sent ${DAILY_LIMIT} pings to ${contact.name} today. Try again tomorrow.` });
      return;
    }
    if (cooling) {
      const secs = Math.ceil(cooldownLeft / 1000);
      toast({ title: "Cooldown active", description: `Wait ${secs}s before pinging ${contact.name} again.` });
      return;
    }
    const next: PingRecord = { lastAt: Date.now(), today: record.today + 1, day: today() };
    writeRecord(contact.id, next);
    setRecord(next);
    setSentKind(kind);
    const copy = statusCopy(status, contact.name.split(" ")[0], kind);
    toast({ title: copy.title, description: copy.body });
    setTimeout(() => { setOpen(false); setSentKind(null); }, 1400);
  };

  const sizing = size === "md" ? "w-10 h-10" : "w-8 h-8";
  const iconSize = size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";

  return (
    <div ref={ref} className={cn("relative inline-flex", className)}>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }}
        title={`Quick Ping ${contact.name.split(" ")[0]}`}
        aria-label={`Quick Ping ${contact.name}`}
        className={cn(
          "grid place-items-center rounded-full transition relative",
          sizing,
          priority
            ? "bg-gradient-to-br from-amber-400/25 to-rose-500/25 text-amber-700 hover:from-amber-400/40 hover:to-rose-500/40 ring-1 ring-amber-400/40"
            : "bg-primary/10 text-primary hover:bg-primary/20",
        )}
      >
        <Bell className={cn(iconSize, open && "animate-pulse")} />
        {priority && (
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500 ring-2 ring-surface-lowest" />
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 z-40 w-60 rounded-2xl ghost-border bg-surface-lowest shadow-elevated p-2 animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-2 py-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">Quick Ping</p>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-primary" aria-label="Close">
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="px-2 pb-2 text-[11px] text-muted-foreground leading-snug">
            Silent signal — no message needed.
            {priority && <span className="ml-1 font-semibold text-amber-700">Priority delivery.</span>}
          </p>

          {status === "driving" && (
            <div className="mx-1 mb-2 flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-orange-500/10 text-orange-700 text-[11px]">
              <Car className="w-3 h-3" /> Driving — delivered safely later
            </div>
          )}

          <button
            disabled={!!sentKind}
            onClick={() => sendPing("callback")}
            className={cn(
              "w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition",
              sentKind === "callback" ? "bg-emerald-500/15" : "hover:bg-surface-low",
            )}
          >
            <span className="grid place-items-center w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-700">
              {sentKind === "callback" ? <Check className="w-4 h-4" /> : <PhoneCall className="w-4 h-4" />}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-xs font-semibold text-primary">Call Back Ping</span>
              <span className="block text-[10px] text-muted-foreground">Please call when you're free</span>
            </span>
          </button>

          <button
            disabled={!!sentKind}
            onClick={() => sendPing("message")}
            className={cn(
              "mt-1 w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition",
              sentKind === "message" ? "bg-sky-500/15" : "hover:bg-surface-low",
            )}
          >
            <span className="grid place-items-center w-8 h-8 rounded-full bg-sky-500/15 text-sky-700">
              {sentKind === "message" ? <Check className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-xs font-semibold text-primary">Message Ping</span>
              <span className="block text-[10px] text-muted-foreground">Please check &amp; reply</span>
            </span>
          </button>

          <p className="mt-2 px-2 pb-1 text-[10px] text-muted-foreground/80">
            {priority ? "Priority bypass · no daily cap" : `${Math.max(0, DAILY_LIMIT - record.today)} of ${DAILY_LIMIT} pings left today`}
          </p>
        </div>
      )}
    </div>
  );
};

export default PingButton;