import { useMemo, useState } from "react";
import { Megaphone, Lock, Clock, AlertCircle, ShieldCheck, Hourglass } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
  const takenAll = allSlots.filter((s) => isMockBooked(s) || locallyBooked.has(s)).length;
  const freeAll = totalAll - takenAll;
  const utilPct = totalAll ? Math.round((takenAll / totalAll) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-0 p-0 overflow-hidden bg-card text-foreground">
        <div className="relative">
          <div className="absolute inset-0 pointer-events-none bg-gradient-mist" />
          <div className="relative p-5 md:p-6 max-h-[85vh] overflow-y-auto">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl md:text-2xl font-headline font-bold tracking-tight text-foreground">
                Quick Sync slots
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Same-day 3-minute calls with {contactName}. Tap an open slot to book, or join the waiting list.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {expanded.flatMap(({ window: w, slots }) =>
                slots.map((s) => {
                  const booked = isMockBooked(s) || locallyBooked.has(s);
                  const waiting = waitlisted.has(s);
                  // Deterministically mark a couple as waiting-list when booked
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
                        "group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all hover:-translate-y-0.5",
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
                          "grid place-items-center w-8 h-8 rounded-full ring-1 shrink-0",
                          state === "available" && "bg-primary/10 ring-primary/30 text-primary",
                          state === "booked" && "bg-muted ring-outline-variant/60 text-muted-foreground",
                          state === "waiting" && "bg-gold-soft ring-gold/60 text-foreground",
                        )}
                      >
                        {state === "available" && <Clock className="w-4 h-4" />}
                        {state === "booked" && <Lock className="w-4 h-4" />}
                        {state === "waiting" && <AlertCircle className="w-4 h-4" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground tabular-nums">
                          3 min · {s}
                        </p>
                        <p
                          className={cn(
                            "text-sm font-bold mt-0.5",
                            state === "available" && "text-primary",
                            state === "booked" && "text-foreground",
                            state === "waiting" && "text-foreground",
                          )}
                        >
                          {state === "available" && "Available"}
                          {state === "booked" && "Booked"}
                          {state === "waiting" && "Waiting list"}
                        </p>
                      </div>
                    </button>
                  );
                }),
              )}
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="rounded-xl bg-surface-low border border-outline-variant/40 p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Hourglass className="w-3.5 h-3.5 text-primary" />
                  <h4 className="text-xs font-semibold text-foreground">Session efficiency</h4>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {freeAll > 0
                    ? `${freeAll} of ${totalAll} micro-slots open. Availability refreshes every cycle.`
                    : "Window fully booked. Join the waiting list to be notified instantly."}
                </p>
                <div className="mt-2 h-1 rounded-full bg-surface-high overflow-hidden">
                  <div className="h-full bg-gradient-primary" style={{ width: `${utilPct}%` }} />
                </div>
              </div>
              <div className="rounded-xl bg-surface-low border border-outline-variant/40 p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                  <h4 className="text-xs font-semibold text-foreground">Protocol active</h4>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Times shown in your local timezone · 3-min same-day calls.
                </p>
              </div>
            </div>

            <DialogFooter className="mt-5 sm:justify-end">
              <button
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold border border-outline-variant/60 bg-surface-lowest text-foreground hover:bg-surface-low transition"
              >
                Close
              </button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickSyncSlotsDialog;