import { useMemo, useState } from "react";
import { Zap, Lock, CalendarClock, Hourglass } from "lucide-react";
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

  const joinQueue = (windowLabel: string) => {
    joinWaitingList({
      name: contactName,
      note: `Wants Quick Sync in ${windowLabel} window`,
    });
    toast({
      title: "You're on the waiting list",
      description: `${contactName} will manually approve and offer you a slot if one opens.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 grid place-items-center rounded-full bg-primary text-primary-foreground">
              <Zap className="w-3.5 h-3.5 text-gold" />
            </div>
            <div>
              <DialogTitle className="text-base">Quick Sync with {contactName}</DialogTitle>
              <DialogDescription className="text-xs">
                Same-day · 3-min calls · pick any open slot
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
          {expanded.map(({ window: w, slots }) => {
            const total = slots.length;
            const taken = slots.filter((s) => isMockBooked(s) || locallyBooked.has(s)).length;
            const free = total - taken;
            return (
              <div key={`${w.start}-${w.end}`} className="rounded-xl ghost-border bg-surface-lowest p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <CalendarClock className="w-3.5 h-3.5 text-accent" />
                    <span className="text-xs font-semibold tabular-nums text-primary">
                      {w.start} – {w.end}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {free}/{total} free
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {slots.map((s) => {
                    const booked = isMockBooked(s) || locallyBooked.has(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        disabled={booked}
                        onClick={() => bookSlot(s)}
                        title={booked ? "Already booked" : `Book ${s}`}
                        className={cn(
                          "inline-flex items-center justify-center gap-0.5 px-1.5 py-1 rounded-md text-[10px] font-semibold tabular-nums transition",
                          booked
                            ? "bg-surface-low text-muted-foreground ghost-border cursor-not-allowed"
                            : "bg-primary text-primary-foreground hover:opacity-95",
                        )}
                      >
                        {booked && <Lock className="w-2.5 h-2.5" />}
                        {s}
                      </button>
                    );
                  })}
                </div>
                {free === 0 && (
                  <button
                    type="button"
                    onClick={() => joinQueue(`${w.start}–${w.end}`)}
                    className="mt-2 w-full inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-semibold bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 transition"
                  >
                    <Hourglass className="w-3 h-3" />
                    Window full · Join waiting list
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter className="mt-2">
          <p className="text-[10px] text-muted-foreground mr-auto">
            Times shown in your local timezone.
          </p>
          <button
            onClick={() => onOpenChange(false)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold ghost-border bg-surface-lowest hover:bg-surface-low text-primary"
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuickSyncSlotsDialog;