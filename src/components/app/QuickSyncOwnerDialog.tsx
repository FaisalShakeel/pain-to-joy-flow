import { useMemo } from "react";
import { Zap, Lock, CalendarClock, Users, Eye, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { SyncWindow } from "./QuickSyncBadge";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  windows: SyncWindow[];
  reservedCount: number;
  waitingCount: number;
  onJumpWaiting?: () => void;
  onJumpReserved?: () => void;
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

// Same deterministic seed used in the seeker dialog so occupancy mirrors what others see.
const isReserved = (slot: string) => {
  let h = 0;
  for (let i = 0; i < slot.length; i++) h = (h * 31 + slot.charCodeAt(i)) >>> 0;
  return h % 10 < 3;
};

const QuickSyncOwnerDialog = ({
  open, onOpenChange, windows, reservedCount, waitingCount, onJumpWaiting, onJumpReserved,
}: Props) => {
  const expanded = useMemo(
    () => windows.map((w) => ({ window: w, slots: expandWindow(w) })),
    [windows],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 grid place-items-center rounded-full bg-primary text-primary-foreground">
              <Zap className="w-3.5 h-3.5 text-gold" />
            </div>
            <div>
              <DialogTitle className="text-base inline-flex items-center gap-2">
                Your Quick Sync overview
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-sky-500/15 text-sky-700 text-[9px] font-bold uppercase tracking-wider">
                  <Eye className="w-2.5 h-2.5" /> View only
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                You can't book your own slots. This is how seekers see your day.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Summary chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ghost-border bg-surface-low/60 text-[11px]">
            <CalendarClock className="w-3 h-3 text-accent" />
            <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[9px]">Reserved</span>
            <span className="font-bold text-primary tabular-nums">{reservedCount}</span>
          </span>
          <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ghost-border text-[11px]",
            waitingCount > 0 ? "bg-amber-500/15" : "bg-surface-low/60",
          )}>
            <Users className="w-3 h-3 text-accent" />
            <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[9px]">Waiting</span>
            <span className="font-bold text-primary tabular-nums">{waitingCount}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ghost-border bg-surface-low/60 text-[11px]">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[9px]">Self-booking</span>
            <span className="font-bold text-primary">Disabled</span>
          </span>
        </div>

        {/* Windows + slot occupancy (read-only) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
          {expanded.map(({ window: w, slots }) => {
            const taken = slots.filter(isReserved).length;
            const free = slots.length - taken;
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
                    {free}/{slots.length} free
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {slots.map((s) => {
                    const reserved = isReserved(s);
                    return (
                      <span
                        key={s}
                        title={reserved ? "Reserved" : "Open"}
                        className={cn(
                          "inline-flex items-center justify-center gap-0.5 px-1.5 py-1 rounded-md text-[10px] font-semibold tabular-nums cursor-default",
                          reserved
                            ? "bg-surface-low text-muted-foreground ghost-border"
                            : "bg-emerald-500/10 text-emerald-700 ghost-border",
                        )}
                      >
                        {reserved && <Lock className="w-2.5 h-2.5" />}
                        {s}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="mt-2 gap-2 flex-wrap sm:justify-between">
          <p className="text-[10px] text-muted-foreground mr-auto">
            Owner view · seekers can book any open slot.
          </p>
          {onJumpReserved && (
            <button
              onClick={() => { onOpenChange(false); onJumpReserved(); }}
              className="px-3 py-1.5 rounded-full text-xs font-semibold ghost-border bg-surface-lowest hover:bg-surface-low text-primary"
            >
              View Reserved
            </button>
          )}
          {onJumpWaiting && (
            <button
              onClick={() => { onOpenChange(false); onJumpWaiting(); }}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 hover:bg-amber-500/25"
            >
              Open Waiting List
            </button>
          )}
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

export default QuickSyncOwnerDialog;