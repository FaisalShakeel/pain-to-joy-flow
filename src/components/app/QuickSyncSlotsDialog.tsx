import { useMemo, useState } from "react";
import { Lock, Clock, AlertCircle, ShieldCheck, Inbox } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { SyncWindow } from "./QuickSyncBadge";
import { joinWaitingList, trackMetric } from "@/lib/metrics";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contactName: string;
  windows: SyncWindow[];
}

const STEP_MIN = 3;

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const toHHMM = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

const expandWindow = (w: SyncWindow): string[] => {
  const start = toMin(w.start);
  const end = toMin(w.end);
  const out: string[] = [];
  for (let t = start; t + STEP_MIN <= end; t += STEP_MIN) out.push(toHHMM(t));
  return out;
};

// Deterministic pseudo-random booked seed per slot string.
const isMockBooked = (slot: string) => {
  let h = 0;
  for (let i = 0; i < slot.length; i++) h = (h * 31 + slot.charCodeAt(i)) >>> 0;
  return h % 10 < 3; // ~30% booked
};

const QuickSyncSlotsDialog = ({ open, onOpenChange, contactName, windows }: Props) => {
  const [locallyBooked, setLocallyBooked] = useState<Set<string>>(new Set());
  const [waitlisted, setWaitlisted] = useState<Set<string>>(new Set());
  const [globalWaitJoined, setGlobalWaitJoined] = useState(false);

  const expanded = useMemo(
    () => windows.map((w) => ({ window: w, slots: expandWindow(w) })),
    [windows],
  );

  const bookSlot = (slot: string) => {
    setLocallyBooked((prev) => {
      const next = new Set(prev);
      next.add(slot);
      return next;
    });
    trackMetric("quick_sync_completed", { dedupeKey: `qs:${slot}` });
    trackMetric("qs_batched", { dedupeKey: `qs-batch:${slot}` });
    toast({
      title: "Quick Sync booked",
      description: `${contactName} · 3-min call at ${slot} today.`,
    });
  };

  const joinQueue = (windowLabel: string, slot?: string) => {
    joinWaitingList({
      name: contactName,
      note: `Wants Quick Sync in ${windowLabel} window`,
    });
    if (slot) {
      setWaitlisted((prev) => {
        const n = new Set(prev);
        n.add(slot);
        return n;
      });
    }
    toast({
      title: "You're on the waiting list",
      description: `${contactName} will manually approve and offer you a slot if one opens.`,
    });
  };

  const allSlots = expanded.flatMap(({ slots }) => slots);
  const totalAll = allSlots.length;
  const takenAll = allSlots.filter((s) => (isMockBooked(s) || locallyBooked.has(s)) && !waitlisted.has(s)).length;
  const waitingCount = waitlisted.size;
  const freeAll = totalAll - takenAll - waitingCount;
  const allBooked = freeAll <= 0;
  const windowLabel = windows.length
    ? `${windows[0].start} – ${windows[windows.length - 1].end}`
    : "";

  const joinGlobalQueue = () => {
    joinWaitingList({ name: contactName, note: `Quick Sync waiting list · ${windowLabel}` });
    setGlobalWaitJoined(true);
    toast({
      title: "Added to waiting list",
      description: `${contactName} will be notified the moment a slot opens.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl border-0 p-0 overflow-hidden bg-card text-foreground">
        <div className="relative">
          <div className="absolute inset-0 pointer-events-none bg-gradient-mist" />
          <div className="relative p-5 md:p-7 max-h-[85vh] overflow-y-auto">
            <DialogHeader className="space-y-1 text-center sm:text-center items-center">
              <DialogTitle className="text-2xl md:text-3xl font-headline font-bold tracking-tight text-foreground">
                Quick Sync
              </DialogTitle>
              <DialogDescription className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Based on 30 min time window
              </DialogDescription>
              {windowLabel && (
                <p className="text-sm font-semibold tabular-nums text-foreground/80 pt-0.5">{windowLabel}</p>
              )}
              <p className="text-[11px] text-muted-foreground pt-0.5">with {contactName}</p>
            </DialogHeader>

            {/* Summary chips */}
            <div className="mt-4 grid grid-cols-3 gap-2.5 max-w-md mx-auto">
              <div className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-center">
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-primary/80">Available</p>
                <p className="text-lg font-bold text-primary tabular-nums">{freeAll}</p>
              </div>
              <div className="rounded-xl border border-outline-variant/50 bg-surface-low px-3 py-2 text-center">
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Booked</p>
                <p className="text-lg font-bold text-foreground tabular-nums">{takenAll}</p>
              </div>
              <div className="rounded-xl border border-gold/40 bg-gold-soft/40 px-3 py-2 text-center">
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-foreground/70">Waiting list</p>
                <p className="text-lg font-bold text-foreground tabular-nums">{waitingCount}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {expanded.flatMap(({ window: w, slots }) =>
                slots.map((s) => {
                  const booked = isMockBooked(s) || locallyBooked.has(s);
                  const waiting = waitlisted.has(s);
                  const isWaitTile = waiting;
                  const state: "available" | "booked" | "waiting" = isWaitTile
                    ? "waiting"
                    : booked
                      ? "booked"
                      : "available";

                  const onClick = () => {
                    if (state === "available") return bookSlot(s);
                    if (state === "booked") return joinQueue(`${w.start}–${w.end}`, s);
                  };

                  return (
                    <button
                      key={`${w.start}-${s}`}
                      type="button"
                      onClick={onClick}
                      title={`${s} · ${state}`}
                      className={cn(
                        "group relative flex flex-col items-start gap-1.5 px-3 py-3 rounded-2xl border text-left transition-all hover:-translate-y-0.5",
                        state === "available" &&
                          "bg-surface-lowest border-primary/30 hover:border-primary/60 hover:shadow-ambient",
                        state === "booked" &&
                          "bg-surface-low border-outline-variant/40 cursor-pointer hover:border-accent/40",
                        state === "waiting" &&
                          "bg-gold-soft/40 border-gold/50 hover:border-gold",
                      )}
                    >
                      <span
                        className={cn(
                          "grid place-items-center w-9 h-9 rounded-full ring-1 shrink-0",
                          state === "available" && "bg-primary/10 ring-primary/30 text-primary",
                          state === "booked" && "bg-muted ring-outline-variant/60 text-muted-foreground",
                          state === "waiting" && "bg-gold-soft ring-gold/60 text-foreground",
                        )}
                      >
                        {state === "available" && <Clock className="w-4 h-4" />}
                        {state === "booked" && <Lock className="w-4 h-4" />}
                        {state === "waiting" && <AlertCircle className="w-4 h-4" />}
                      </span>
                      <p className="text-[11px] font-bold tabular-nums text-foreground">
                        {s}
                        <span className="text-muted-foreground font-medium"> – {toHHMM(toMin(s) + STEP_MIN)}</span>
                      </p>
                      <p
                        className={cn(
                          "text-xs font-semibold",
                          state === "available" && "text-primary",
                          state === "booked" && "text-muted-foreground",
                          state === "waiting" && "text-foreground",
                        )}
                      >
                        {state === "available" && "Available"}
                        {state === "booked" && "Booked"}
                        {state === "waiting" && "Waiting List"}
                      </p>
                    </button>
                  );
                }),
              )}
            </div>

            {allBooked ? (
              <div className="mt-5 rounded-2xl border border-outline-variant/50 bg-surface-low p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid place-items-center w-9 h-9 rounded-full bg-primary/10 text-primary ring-1 ring-primary/30">
                    <Inbox className="w-4 h-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">All slots are booked for this time window.</p>
                    <p className="text-[11px] text-muted-foreground">Join the waiting list to express your interest.</p>
                  </div>
                </div>
                <button
                  onClick={joinGlobalQueue}
                  disabled={globalWaitJoined}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-semibold transition shrink-0",
                    globalWaitJoined
                      ? "bg-surface-lowest text-muted-foreground border border-outline-variant/60"
                      : "bg-primary text-primary-foreground hover:opacity-90",
                  )}
                >
                  {globalWaitJoined ? "On waiting list" : "Join Waiting List"}
                </button>
              </div>
            ) : (
              <div className="mt-5 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                  Times shown in your local timezone · 3-min calls
                </span>
                <button
                  onClick={() => onOpenChange(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold border border-outline-variant/60 bg-surface-lowest text-foreground hover:bg-surface-low transition"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickSyncSlotsDialog;