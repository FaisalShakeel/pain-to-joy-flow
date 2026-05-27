import { useMemo, useState } from "react";
import { Zap, Lock, CalendarClock, ShieldCheck, AlertCircle, Inbox, CheckCircle2, Flame, X } from "lucide-react";
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
  const [globalWaitJoined, setGlobalWaitJoined] = useState(false);
  // Track THIS user's single active reservation (slot string) and which window it belongs to.
  const [mySlot, setMySlot] = useState<string | null>(null);
  const [myWindow, setMyWindow] = useState<string | null>(null);
  const [windowWaitJoined, setWindowWaitJoined] = useState<Set<string>>(new Set());

  const expanded = useMemo(
    () => windows.map((w) => ({ window: w, slots: expandWindow(w) })),
    [windows],
  );

  const bookSlot = (slot: string, windowLabel: string) => {
    if (mySlot) {
      toast({
        title: "You already hold an active sync reservation",
        description: "Cancel or reschedule your current slot before booking another.",
      });
      return;
    }
    setLocallyBooked((prev) => {
      const next = new Set(prev);
      next.add(slot);
      return next;
    });
    setMySlot(slot);
    setMyWindow(windowLabel);
    trackMetric("quick_sync_completed", { dedupeKey: `qs:${slot}` });
    trackMetric("qs_batched", { dedupeKey: `qs-batch:${slot}` });
    toast({
      title: "Quick Sync booked",
      description: `${contactName} · 3-min call at ${slot} today.`,
    });
  };

  const cancelMySlot = () => {
    if (!mySlot) return;
    const slot = mySlot;
    setLocallyBooked((prev) => {
      const next = new Set(prev);
      next.delete(slot);
      return next;
    });
    setMySlot(null);
    setMyWindow(null);
    toast({
      title: "Reservation cancelled",
      description: `Your ${slot} Quick Sync with ${contactName} was released. Waitlisted users will be notified.`,
    });
  };

  const joinWindowWaitlist = (windowLabel: string) => {
    joinWaitingList({ name: contactName, note: `Waiting window · ${windowLabel}` });
    setWindowWaitJoined((prev) => {
      const n = new Set(prev);
      n.add(windowLabel);
      return n;
    });
    toast({
      title: "Joined waiting window",
      description: `We'll notify you the second a ${windowLabel} slot opens.`,
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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 grid place-items-center rounded-full bg-primary text-primary-foreground">
              <Zap className="w-3.5 h-3.5 text-gold" />
            </div>
            <div>
              <DialogTitle className="text-base">Quick Sync with {contactName}</DialogTitle>
              <DialogDescription className="text-xs">
                Tap an open slot to book a 3-min call. Booked? Join the waiting list.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Summary chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ghost-border bg-surface-low/60 text-[11px]">
            <CalendarClock className="w-3 h-3 text-accent" />
            <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[9px]">Open</span>
            <span className="font-bold text-primary tabular-nums">{freeAll}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ghost-border bg-surface-low/60 text-[11px]">
            <Lock className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[9px]">Booked</span>
            <span className="font-bold text-primary tabular-nums">{takenAll}</span>
          </span>
          <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ghost-border text-[11px]",
            waitingCount > 0 ? "bg-amber-500/15" : "bg-surface-low/60",
          )}>
            <AlertCircle className="w-3 h-3 text-accent" />
            <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[9px]">Waiting</span>
            <span className="font-bold text-primary tabular-nums">{waitingCount}</span>
          </span>
        </div>

        {/* Windows + slot occupancy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
          {expanded.map(({ window: w, slots }) => {
            const taken = slots.filter((s) => isMockBooked(s) || locallyBooked.has(s)).length;
            const free = slots.length - taken;
            const wLabel = `${w.start}–${w.end}`;
            const windowFull = free <= 0;
            const joinedWindow = windowWaitJoined.has(wLabel);
            const highDemand = taken / slots.length >= 0.7;
            return (
              <div key={`${w.start}-${w.end}`} className="rounded-xl ghost-border bg-surface-lowest p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <CalendarClock className="w-3.5 h-3.5 text-accent" />
                    <span className="text-xs font-semibold tabular-nums text-primary">
                      {w.start} – {w.end}
                    </span>
                    {highDemand && !windowFull && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 text-[9px] font-bold uppercase tracking-wider">
                        <Flame className="w-2.5 h-2.5" /> High demand
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {free}/{slots.length} free
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {slots.map((s) => {
                    const booked = isMockBooked(s) || locallyBooked.has(s);
                    const waiting = waitlisted.has(s);
                    const isMine = mySlot === s;
                    const state: "available" | "booked" | "waiting" | "mine" = isMine
                      ? "mine"
                      : waiting
                        ? "waiting"
                        : booked
                          ? "booked"
                          : "available";
                    const disabledByMine = !!mySlot && state === "available";
                    const onClick = () => {
                      if (state === "mine") return cancelMySlot();
                      if (state === "available") {
                        if (disabledByMine) return;
                        return bookSlot(s, wLabel);
                      }
                      if (state === "booked") return joinQueue(wLabel, s);
                    };
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={onClick}
                        disabled={state === "waiting" || disabledByMine}
                        title={
                          state === "mine"
                            ? "Your reservation — tap to cancel"
                            : disabledByMine
                              ? "You already hold an active reservation"
                              : state === "available"
                                ? "Open — tap to book"
                                : state === "booked"
                                  ? "Booked — tap to join waiting list"
                                  : "On waiting list"
                        }
                        className={cn(
                          "inline-flex items-center justify-center gap-0.5 px-1.5 py-1 rounded-md text-[10px] font-semibold tabular-nums transition",
                          state === "available" && !disabledByMine &&
                            "bg-emerald-500/10 text-emerald-700 ghost-border hover:bg-emerald-500/20 hover:scale-[1.03] active:scale-[0.97]",
                          state === "available" && disabledByMine &&
                            "bg-surface-low text-muted-foreground/60 ghost-border cursor-not-allowed opacity-60",
                          state === "booked" &&
                            "bg-surface-low text-muted-foreground ghost-border hover:bg-amber-500/15 hover:text-amber-700",
                          state === "waiting" &&
                            "bg-amber-500/15 text-amber-700 ghost-border cursor-default",
                          state === "mine" &&
                            "bg-primary text-primary-foreground ring-2 ring-primary/40 shadow-elevated hover:bg-primary/90",
                        )}
                      >
                        {state === "booked" && <Lock className="w-2.5 h-2.5" />}
                        {state === "waiting" && <AlertCircle className="w-2.5 h-2.5" />}
                        {state === "mine" && <CheckCircle2 className="w-2.5 h-2.5" />}
                        {s}
                      </button>
                    );
                  })}
                </div>

                {/* Per-window waiting window CTA */}
                {windowFull && (
                  <button
                    type="button"
                    onClick={() => !joinedWindow && joinWindowWaitlist(wLabel)}
                    disabled={joinedWindow}
                    className={cn(
                      "mt-2 w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition",
                      joinedWindow
                        ? "ghost-border bg-surface-lowest text-muted-foreground cursor-default"
                        : "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 ghost-border",
                    )}
                  >
                    <Inbox className="w-3 h-3" />
                    {joinedWindow ? "You're in the waiting window" : "Join Waiting Window"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* My active reservation banner */}
        {mySlot && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 ghost-border">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            <p className="text-[11px] text-primary flex-1">
              You already hold an active sync reservation at{" "}
              <span className="font-bold tabular-nums">{mySlot}</span>
              {myWindow && <span className="text-muted-foreground"> · {myWindow}</span>}
            </p>
            <button
              type="button"
              onClick={cancelMySlot}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 transition"
            >
              <X className="w-3 h-3" /> Cancel / Reschedule
            </button>
          </div>
        )}

        <DialogFooter className="mt-2 gap-2 flex-wrap sm:justify-between">
          <p className="text-[10px] text-muted-foreground mr-auto inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Local timezone · 3-min calls
          </p>
          {allBooked && (
            <button
              onClick={joinGlobalQueue}
              disabled={globalWaitJoined}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold transition",
                globalWaitJoined
                  ? "ghost-border bg-surface-lowest text-muted-foreground"
                  : "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25",
              )}
            >
              <Inbox className="w-3 h-3 inline-block mr-1" />
              {globalWaitJoined ? "On waiting list" : "Join Waiting List"}
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

export default QuickSyncSlotsDialog;