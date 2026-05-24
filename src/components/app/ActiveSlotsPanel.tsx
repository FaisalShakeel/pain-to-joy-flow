import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft, Video, MapPin, Zap, Users, Share2, Pencil, Trash2, Copy,
  Maximize2, Minimize2, Lock,
} from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useAvailability, useConflictHighlight, availabilityStore, type AvailabilityBlock } from "@/lib/availabilityStore";

export type ActiveSlotStatus = "active" | "upcoming" | "expired";
export type ActiveSlotMode = "hybrid" | "online" | "onsite" | "quicksync";

export interface ActiveSlotHandlers {
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: (kind: "tomorrow" | "nextweek" | "custom", customDate?: string) => void;
  onShare?: () => void;
}

/** Legacy item shape — kept so existing callers compile. */
export interface ActiveSlotItem extends ActiveSlotHandlers {
  id: string;
  date: string;
  startMin: number;
  endMin: number;
  bufferMin: number;
  mode: ActiveSlotMode;
  typeLabel?: string;
}

const fmtTime = (m: number) => {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const period = h >= 12 ? "PM" : "AM";
  const hh = ((h + 11) % 12) + 1;
  return `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")} ${period}`;
};

const modeMeta: Record<ActiveSlotMode, { label: string; icons: React.ComponentType<any>[] }> = {
  hybrid:    { label: "Hybrid",     icons: [Video, MapPin] },
  online:    { label: "Online",     icons: [Video] },
  onsite:    { label: "On-site",    icons: [MapPin] },
  quicksync: { label: "Quick Sync", icons: [Zap] },
};

const sourceMeta: Record<string, { label: string; cls: string; icon: React.ComponentType<any> }> = {
  focus:          { label: "Focus Sync",   cls: "bg-indigo-500/15 text-indigo-700",  icon: Video },
  quicksync:      { label: "Quick Sync",   cls: "bg-amber-500/15 text-amber-800",    icon: Zap },
  "event-access": { label: "Event Access", cls: "bg-violet-500/15 text-violet-700",  icon: Users },
};

const statusMeta = (s: ActiveSlotStatus) => {
  if (s === "active")   return { label: "Available", dot: "bg-emerald-500" };
  if (s === "upcoming") return { label: "Pending",   dot: "bg-amber-500" };
  return { label: "Expired", dot: "bg-rose-500" };
};

const computeStatus = (iso: string): ActiveSlotStatus => {
  const today = new Date(new Date().toDateString());
  const d = new Date(iso);
  if (d < today) return "expired";
  if (format(d, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")) return "active";
  return "upcoming";
};

interface Props {
  /** Eyebrow for the heading; defaults to "UNIFIED AVAILABILITY". */
  eyebrow?: string;
  /** Per-block handlers, keyed by block id. */
  handlers?: Record<string, ActiveSlotHandlers>;
  /** Legacy: extra items to merge in (still rendered). */
  items?: ActiveSlotItem[];
  emptyText?: string;
}

type Row = {
  id: string;
  source: "focus" | "quicksync" | "event-access" | "legacy";
  date: string;
  startMin: number;
  endMin: number;
  bufferMin: number;
  mode: ActiveSlotMode;
  typeLabel: string;
  handlers: ActiveSlotHandlers;
  callMin?: number;
  bookedSubSlots?: number[];
};

const ActiveSlotsPanel = ({
  eyebrow = "UNIFIED AVAILABILITY",
  handlers = {},
  items = [],
  emptyText = "No slots yet — create one above.",
}: Props) => {
  const [view, setView] = useState<"time" | "type">("time");
  const [modeFilter, setModeFilter] = useState<"all" | "focus" | "quicksync" | "event-access">("all");
  const [dayOffset, setDayOffset] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const blocks = useAvailability();
  const highlightId = useConflictHighlight();

  const rows: Row[] = useMemo(() => {
    const fromStore: Row[] = blocks.map((b: AvailabilityBlock) => ({
      id: b.id,
      source: b.source,
      date: b.date,
      startMin: b.startMin,
      endMin: b.endMin,
      bufferMin: b.bufferMin,
      mode: b.mode,
      typeLabel: b.typeLabel,
      handlers: handlers[b.id] ?? {},
      callMin: b.callMin,
      bookedSubSlots: b.bookedSubSlots,
    }));
    const seen = new Set(fromStore.map((r) => r.id));
    const fromItems: Row[] = items
      .filter((i) => !seen.has(i.id))
      .map((i) => ({
        id: i.id,
        source: "legacy" as const,
        date: i.date,
        startMin: i.startMin,
        endMin: i.endMin,
        bufferMin: i.bufferMin,
        mode: i.mode,
        typeLabel: i.typeLabel ?? modeMeta[i.mode].label,
        handlers: {
          onEdit: i.onEdit, onDelete: i.onDelete,
          onDuplicate: i.onDuplicate, onShare: i.onShare,
        },
      }));
    return [...fromStore, ...fromItems];
  }, [blocks, items, handlers]);

  const filteredRows = useMemo(
    () => (modeFilter === "all" ? rows : rows.filter((r) => r.source === modeFilter)),
    [rows, modeFilter],
  );

  const dates = useMemo(() => Array.from(new Set(filteredRows.map((r) => r.date))).sort(), [filteredRows]);
  const focusDate = dates.length
    ? dates[Math.min(dates.length - 1, Math.max(0, dayOffset))]
    : new Date().toISOString().slice(0, 10);

  const summary = useMemo(() => {
    const acc: Record<string, number> = {};
    filteredRows.forEach((r) => {
      const key = r.source === "legacy" ? modeMeta[r.mode].label : sourceMeta[r.source].label;
      acc[key] = (acc[key] ?? 0) + 1;
    });
    return Object.entries(acc);
  }, [filteredRows]);

  const sorted = useMemo(() => {
    const list = [...filteredRows];
    if (view === "time") {
      list.sort(
        (a, b) => (a.date + a.startMin).localeCompare(b.date + b.startMin) || a.startMin - b.startMin,
      );
    } else {
      list.sort((a, b) => a.source.localeCompare(b.source) || a.startMin - b.startMin);
    }
    return list;
  }, [filteredRows, view]);

  const headerDate = new Date(focusDate);

  const dayRows = useMemo(
    () => filteredRows.filter((r) => r.date === focusDate),
    [filteredRows, focusDate],
  );

  const content = (
    <section
      className={cn(
        "rounded-3xl bg-surface-lowest ghost-border p-5 md:p-7 shadow-ambient",
        expanded && "rounded-none border-0 shadow-none h-full overflow-y-auto",
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">{eyebrow}</p>
          <h2 className="font-headline font-extrabold text-primary text-2xl md:text-4xl mt-1 leading-none">
            {format(headerDate, "MMMM d")}{" "}
            <span className="text-muted-foreground/60 font-bold">{format(headerDate, "yyyy")}</span>
          </h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setDayOffset((v) => Math.max(0, v - 1))}
            className="grid place-items-center w-9 h-9 rounded-xl ghost-border bg-surface-lowest hover:bg-surface-low text-primary"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="grid place-items-center w-9 h-9 rounded-xl bg-primary text-primary-foreground hover:opacity-90"
            aria-label={expanded ? "Collapse" : "Expand to full page"}
            title={expanded ? "Collapse" : "Expand to full page"}
          >
            {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Sub-header */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="font-headline font-extrabold text-primary text-lg">Active Slots</h3>
          <p className="text-[11px] text-muted-foreground">
            {summary.map(([k, v], i) => (
              <span key={k}>
                {i > 0 && <span className="px-1.5 text-muted-foreground/50">|</span>}
                {k}: <span className="font-bold text-primary/80">{v}</span>
              </span>
            ))}
            {summary.length === 0 && <span>No active slots</span>}
          </p>
        </div>
        <div className="inline-flex items-center rounded-full ghost-border bg-surface-lowest p-1">
          <button
            onClick={() => setView("time")}
            className={cn("px-3 py-1.5 rounded-full text-[11px] font-bold transition", view === "time" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary")}
          >View by Time</button>
          <button
            onClick={() => setView("type")}
            className={cn("px-3 py-1.5 rounded-full text-[11px] font-bold transition", view === "type" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary")}
          >View by Type</button>
        </div>
      </div>

      {/* Mode Filter */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1">Filter</span>
        {([
          ["all", "All Modes"],
          ["focus", "Focused Scheduling"],
          ["quicksync", "Quick Sync"],
          ["event-access", "Event Access"],
        ] as const).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setModeFilter(k)}
            className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-bold transition ghost-border",
              modeFilter === k
                ? "bg-primary text-primary-foreground border-transparent"
                : "bg-surface-lowest text-muted-foreground hover:text-primary",
            )}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Rows */}
      {sorted.length === 0 ? (
        <p className="text-xs text-muted-foreground py-12 text-center">{emptyText}</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {sorted.map((s) => <SlotRow key={s.id} row={s} highlight={highlightId === s.id} />)}
        </ul>
      )}
    </section>
  );

  if (!expanded) return content;
  return createPortal(
    <div className="fixed inset-0 z-[100] bg-background overflow-y-auto">{content}</div>,
    document.body,
  );
};

const SlotRow = ({ row, highlight = false }: { row: Row; highlight?: boolean }) => {
  const [dupOpen, setDupOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const status = computeStatus(row.date);
  const sm = statusMeta(status);
  const mm = modeMeta[row.mode];
  const srcMeta = row.source !== "legacy" ? sourceMeta[row.source] : null;
  const h = row.handlers;

  return (
    <li
      className={cn(
        "rounded-2xl bg-surface-lowest ghost-border shadow-ambient/40 hover:shadow-ambient transition",
        highlight && "ring-2 ring-rose-500/70 animate-[shake_0.45s_ease-in-out_2] bg-rose-500/5",
      )}
    >
      <div className="grid grid-cols-12 items-center gap-3 px-5 py-4">
        {/* SLOT TYPE */}
        <div className="col-span-12 md:col-span-3">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Slot Type</p>
          <p className="font-headline font-extrabold text-primary text-base mt-1">{row.typeLabel}</p>
          {srcMeta && (
            <span className={cn("mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold", srcMeta.cls)}>
              <srcMeta.icon className="w-3 h-3" /> {srcMeta.label}
            </span>
          )}
        </div>

        {/* STATUS */}
        <div className="col-span-6 md:col-span-2">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Status</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
            <span className={cn("w-2 h-2 rounded-full", sm.dot)} />
            {sm.label}
          </p>
        </div>

        {/* TIMING */}
        <div className="col-span-6 md:col-span-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Timing</p>
          <p className="font-headline font-extrabold text-primary text-base mt-1 tabular-nums">
            {fmtTime(row.startMin).replace(/\s.*/, "")} <span className="text-muted-foreground">—</span>{" "}
            {fmtTime(row.endMin)}
          </p>
          <p className="text-[10px] italic text-muted-foreground tracking-wider uppercase mt-0.5">
            {row.bufferMin}-m flexible buffer
          </p>
        </div>

        {/* MODE & ACTION */}
        <div className="col-span-12 md:col-span-3 md:text-right">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Mode &amp; Action</p>
          <div className="mt-1.5 flex md:justify-end items-center gap-1.5">
            {mm.icons.map((Ic, i) => (
              <span key={i} className="grid place-items-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                <Ic className="w-3.5 h-3.5" />
              </span>
            ))}
            <Popover open={dupOpen} onOpenChange={setDupOpen}>
              <PopoverTrigger asChild>
                <button className="grid place-items-center w-8 h-8 rounded-full ghost-border bg-surface-lowest hover:bg-primary/10 text-primary" aria-label="Duplicate">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-44 p-1 z-[60]" align="end">
                <button onClick={() => { h.onDuplicate?.("tomorrow"); setDupOpen(false); }} className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-surface-low">To tomorrow</button>
                <button onClick={() => { h.onDuplicate?.("nextweek"); setDupOpen(false); }} className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-surface-low">To next week</button>
                <button onClick={() => { setDupOpen(false); setCustomOpen(true); }} className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-surface-low">Custom date…</button>
              </PopoverContent>
            </Popover>
            <Popover open={customOpen} onOpenChange={setCustomOpen}>
              <PopoverTrigger asChild><span /></PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[60]" align="end">
                <Calendar
                  mode="single"
                  onSelect={(d) => { if (d) { h.onDuplicate?.("custom", d.toISOString().slice(0, 10)); setCustomOpen(false); } }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <button onClick={h.onEdit} className="grid place-items-center w-8 h-8 rounded-full ghost-border bg-surface-lowest hover:bg-primary/10 text-primary" aria-label="Edit">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={h.onShare} className="grid place-items-center w-8 h-8 rounded-full ghost-border bg-surface-lowest hover:bg-primary/10 text-primary" aria-label="Share">
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={h.onDelete} className="grid place-items-center w-8 h-8 rounded-full ghost-border bg-surface-lowest hover:bg-destructive/10 text-destructive" aria-label="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {/* GENERATED SUB-SLOTS — individually interactive */}
        <div className="col-span-12">
          <SubSlotsStrip row={row} />
        </div>
      </div>
    </li>
  );
};

// ---------- Sub-slots strip (auto-generated, individually bookable) ----------
const SubSlotsStrip = ({ row }: { row: Row }) => {
  const callMin = row.callMin ?? 0;
  if (!callMin || callMin <= 0) return null;

  const todayISO = new Date().toISOString().slice(0, 10);
  const isToday = row.date === todayISO;
  const isFuture = row.date > todayISO;
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const booked = new Set(row.bookedSubSlots ?? []);

  type Sub = { start: number; end: number; state: "available" | "booked" | "expired" };
  const subs: Sub[] = [];
  for (let t = row.startMin; t + callMin <= row.endMin; t += callMin) {
    const expired = !isFuture && (row.date < todayISO || (isToday && t < nowMin));
    const state: Sub["state"] = expired ? "expired" : booked.has(t) ? "booked" : "available";
    subs.push({ start: t, end: t + callMin, state });
  }

  if (subs.length === 0) return null;

  const available = subs.filter((s) => s.state === "available").length;
  const bookedN = subs.filter((s) => s.state === "booked").length;
  const expiredN = subs.filter((s) => s.state === "expired").length;

  return (
    <div className="mt-3 rounded-xl bg-surface-low/40 ghost-border p-2.5">
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Sub-slots · {callMin}-min each
        </p>
        <div className="flex items-center gap-2 text-[9px] font-bold">
          <span className="text-emerald-700">{available} open</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-amber-700">{bookedN} booked</span>
          {expiredN > 0 && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground/70">{expiredN} expired</span>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {subs.map((s) => {
          const label = `${fmtTime(s.start).replace(/\s.*/, "")} – ${fmtTime(s.end).replace(/\s.*/, "")}`;
          if (s.state === "expired") {
            return (
              <span
                key={s.start}
                title="Expired"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold tabular-nums bg-surface-lowest text-muted-foreground/60 ghost-border line-through"
              >
                {label}
              </span>
            );
          }
          const onClick = () => availabilityStore.toggleSubSlot(row.id, s.start);
          if (s.state === "booked") {
            return (
              <button
                key={s.start}
                type="button"
                onClick={onClick}
                title="Booked — tap to release"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold tabular-nums bg-amber-500/15 text-amber-800 ghost-border hover:bg-amber-500/25"
              >
                <Lock className="w-2.5 h-2.5" />
                {label}
              </button>
            );
          }
          return (
            <button
              key={s.start}
              type="button"
              onClick={onClick}
              title="Open — tap to book"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold tabular-nums bg-emerald-500/10 text-emerald-700 ghost-border hover:bg-emerald-500/25"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ActiveSlotsPanel;

// ---------- Daily Occupancy Rail ----------
const RAIL_START = 8 * 60;   // 08:00
const RAIL_END = 20 * 60;    // 20:00
const RAIL_SPAN = RAIL_END - RAIL_START;

const sourceColor: Record<string, string> = {
  focus: "bg-indigo-500",
  quicksync: "bg-amber-500",
  "event-access": "bg-violet-500",
  legacy: "bg-slate-400",
};

const OccupancyRail = ({ rows, dateLabel, hideHeader = false }: { rows: Row[]; dateLabel: string; hideHeader?: boolean }) => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  const ticks = Array.from({ length: 7 }, (_, i) => 8 + i * 2); // 8,10,12,14,16,18,20
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowPct =
    nowMin >= RAIL_START && nowMin <= RAIL_END
      ? ((nowMin - RAIL_START) / RAIL_SPAN) * 100
      : null;

  return (
    <div className={cn("rounded-2xl bg-surface-low/60 ghost-border", hideHeader ? "p-1.5" : "p-3 mt-5")}> 
      {!hideHeader && (
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Daily Occupancy · {dateLabel}
        </p>
        <div className="flex items-center gap-2 text-[9px] font-bold">
          <Legend color="bg-indigo-500" label="Focus" />
          <Legend color="bg-amber-500" label="Quick Sync" />
          <Legend color="bg-violet-500" label="Event" />
        </div>
      </div>
      )}
      <div className={cn("relative rounded-lg bg-surface-lowest ghost-border overflow-hidden", hideHeader ? "h-4" : "h-9")}>
        {/* Tick grid */}
        {ticks.slice(1, -1).map((h) => {
          const pct = ((h * 60 - RAIL_START) / RAIL_SPAN) * 100;
          return (
            <div
              key={h}
              className="absolute top-0 bottom-0 w-px bg-border/60"
              style={{ left: `${pct}%` }}
            />
          );
        })}
        {/* Occupied blocks */}
        {rows.map((r) => {
          const s = Math.max(RAIL_START, r.startMin);
          const e = Math.min(RAIL_END, r.endMin);
          if (e <= s) return null;
          const left = ((s - RAIL_START) / RAIL_SPAN) * 100;
          const width = ((e - s) / RAIL_SPAN) * 100;
          return (
            <div
              key={r.id}
              title={`${r.typeLabel} · ${fmtTime(r.startMin)} – ${fmtTime(r.endMin)}`}
              className={cn(
                "absolute top-0.5 bottom-0.5 rounded-md opacity-90 hover:opacity-100 transition",
                sourceColor[r.source] ?? "bg-primary",
              )}
              style={{ left: `${left}%`, width: `${Math.max(0.6, width)}%` }}
            />
          );
        })}
        {/* Now indicator */}
        {nowPct !== null && (
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-rose-500"
            style={{ left: `${nowPct}%` }}
          >
            <span className="absolute -top-1.5 -left-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-background" />
          </div>
        )}
      </div>
      <div className={cn("flex justify-between text-[9px] font-bold text-muted-foreground tabular-nums", hideHeader ? "mt-1" : "mt-1.5") }>
        {ticks.map((h) => (
          <span key={h}>{((h + 11) % 12) + 1}{h < 12 ? "a" : "p"}</span>
        ))}
      </div>
    </div>
  );
};

const Legend = ({ color, label }: { color: string; label: string }) => (
  <span className="inline-flex items-center gap-1 text-muted-foreground">
    <span className={cn("w-2 h-2 rounded-sm", color)} />
    {label}
  </span>
);

// ---------- Standalone Daily Occupancy (header + rail) ----------
export const DailyOccupancy = ({ date }: { date?: string }) => {
  const blocks = useAvailability();
  const iso = date ?? new Date().toISOString().slice(0, 10);
  const dayBlocks = blocks.filter((b) => b.date === iso);

  const rows: Row[] = dayBlocks.map((b) => ({
    id: b.id,
    source: b.source,
    date: b.date,
    startMin: b.startMin,
    endMin: b.endMin,
    bufferMin: b.bufferMin,
    mode: b.mode,
    typeLabel: b.typeLabel,
    handlers: {},
  }));

  const countBy = (src: string) => dayBlocks.filter((b) => b.source === src).length;
  const focusN = countBy("focus");
  const qsN = countBy("quicksync");
  const evN = countBy("event-access");
  const total = dayBlocks.length;
  // bookedSlots is optional on the block; fall back to 0 if not tracked yet
  const booked = dayBlocks.reduce(
    (acc, b: any) => acc + (typeof b.bookedSlots === "number" ? b.bookedSlots : 0),
    0,
  );

  return (
    <section className="rounded-2xl bg-surface-lowest ghost-border px-3 py-2 md:px-4 md:py-2.5 shadow-ambient">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-1.5">
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">
            Daily Occupancy
          </p>
          <span className="text-[11px] font-bold text-muted-foreground">
            {format(new Date(iso), "EEE, MMM d")}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold">
          <Stat color="bg-indigo-500" label="Focus" value={focusN} />
          <Stat color="bg-amber-500" label="Quick Sync" value={qsN} />
          <Stat color="bg-violet-500" label="Event Access" value={evN} />
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            Total: <span className="tabular-nums">{total}</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700">
            Booked: <span className="tabular-nums">{booked}</span>
          </span>
        </div>
      </div>
      <OccupancyRail rows={rows} dateLabel={format(new Date(iso), "EEE, MMM d")} hideHeader />
    </section>
  );
};

const Stat = ({ color, label, value }: { color: string; label: string; value: number }) => (
  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
    <span className={cn("w-2 h-2 rounded-sm", color)} />
    {label}: <span className="text-primary tabular-nums">{value}</span>
  </span>
);