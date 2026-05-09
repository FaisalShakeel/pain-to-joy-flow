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
      <DialogContent className="max-w-3xl border-0 p-0 overflow-hidden bg-[#0b1020] text-slate-100">
        {/* Ambient backdrop */}
        <div className="relative">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_hsl(220_70%_25%/0.35),transparent_60%)]" />
          <div className="relative p-6 md:p-8">
            <DialogHeader className="space-y-1 text-center">
              <DialogTitle className="text-3xl md:text-4xl font-headline font-bold tracking-tight text-indigo-300">
                Quick Sync
              </DialogTitle>
              <DialogDescription className="text-[11px] uppercase tracking-[0.28em] text-slate-400">
                Based on 30 min time window · {contactName}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
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
                        "group relative flex items-center gap-4 px-5 py-5 rounded-2xl border text-left transition-all",
                        "hover:-translate-y-0.5",
                        state === "available" &&
                          "bg-emerald-950/40 border-emerald-500/40 hover:border-emerald-400/70 hover:shadow-[0_0_0_1px_rgba(16,185,129,0.35),0_18px_40px_-20px_rgba(16,185,129,0.6)]",
                        state === "booked" &&
                          "bg-slate-900/60 border-slate-700/70 cursor-pointer hover:border-amber-500/50",
                        state === "waiting" &&
                          "bg-amber-950/40 border-amber-500/50 hover:border-amber-400/80",
                      )}
                    >
                      <span
                        className={cn(
                          "grid place-items-center w-12 h-12 rounded-full ring-1 shrink-0",
                          state === "available" &&
                            "bg-emerald-500/15 ring-emerald-500/40 text-emerald-300",
                          state === "booked" &&
                            "bg-slate-800/80 ring-slate-700/80 text-slate-300",
                          state === "waiting" &&
                            "bg-amber-500/15 ring-amber-500/50 text-amber-300",
                        )}
                      >
                        {state === "available" && <Clock className="w-5 h-5" />}
                        {state === "booked" && <Lock className="w-5 h-5" />}
                        {state === "waiting" && <AlertCircle className="w-5 h-5" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 tabular-nums">
                          3 MIN · {s}
                        </p>
                        <p
                          className={cn(
                            "text-xl font-bold mt-0.5",
                            state === "available" && "text-emerald-300",
                            state === "booked" && "text-slate-100",
                            state === "waiting" && "text-amber-300",
                          )}
                        >
                          {state === "available" && "Available"}
                          {state === "booked" && "Booked"}
                          {state === "waiting" && "Waiting List"}
                        </p>
                      </div>
                    </button>
                  );
                }),
              )}
            </div>

            {/* Footer status panels */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Hourglass className="w-4 h-4 text-indigo-300" />
                  <h4 className="text-sm font-semibold text-indigo-300">Session Efficiency</h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {freeAll > 0
                    ? `${freeAll} of ${totalAll} micro-slots open. Availability refreshes every cycle.`
                    : "Window fully booked. Join the waiting list to be notified instantly."}
                </p>
                <div className="mt-3 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400"
                    style={{ width: `${utilPct}%` }}
                  />
                </div>
              </div>
              <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <h4 className="text-sm font-semibold text-emerald-300">Protocol Active</h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Times shown in your local timezone · 3-min same-day calls.
                </p>
              </div>
            </div>

            <DialogFooter className="mt-6 sm:justify-end">
              <button
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 transition"
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