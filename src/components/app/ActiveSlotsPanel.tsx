import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Video, MapPin, Zap, Share2, Pencil, Trash2, Copy } from "lucide-react";
import { format, addDays } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export type ActiveSlotStatus = "active" | "upcoming" | "expired";
export type ActiveSlotMode = "hybrid" | "online" | "onsite" | "quicksync";

export interface ActiveSlotItem {
  id: string;
  /** ISO yyyy-mm-dd */
  date: string;
  /** minutes from 00:00 */
  startMin: number;
  endMin: number;
  bufferMin: number;
  mode: ActiveSlotMode;
  /** Optional override for the SLOT TYPE label (defaults derived from mode) */
  typeLabel?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: (kind: "tomorrow" | "nextweek" | "custom", customDate?: string) => void;
  onShare?: () => void;
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
  /** Eyebrow for the heading; defaults to "SCHEDULE VIEW". */
  eyebrow?: string;
  items: ActiveSlotItem[];
  emptyText?: string;
}

const ActiveSlotsPanel = ({ eyebrow = "SCHEDULE VIEW", items, emptyText = "No slots yet — create one above." }: Props) => {
  const [view, setView] = useState<"time" | "type">("time");
  const [dayOffset, setDayOffset] = useState(0);

  const dates = useMemo(() => Array.from(new Set(items.map((i) => i.date))).sort(), [items]);
  const focusDate = dates.length
    ? dates[Math.min(dates.length - 1, Math.max(0, dayOffset))]
    : new Date().toISOString().slice(0, 10);

  const summary = useMemo(() => {
    const acc: Record<string, number> = {};
    items.forEach((i) => {
      const k = modeMeta[i.mode].label;
      acc[k] = (acc[k] ?? 0) + 1;
    });
    return Object.entries(acc);
  }, [items]);

  const sorted = useMemo(() => {
    const list = [...items];
    if (view === "time") {
      list.sort((a, b) => (a.date + a.startMin).localeCompare(b.date + b.startMin) || a.startMin - b.startMin);
    } else {
      list.sort((a, b) => a.mode.localeCompare(b.mode) || a.startMin - b.startMin);
    }
    return list;
  }, [items, view]);

  const headerDate = new Date(focusDate);

  return (
    <section className="rounded-3xl bg-surface-lowest ghost-border p-5 md:p-7 shadow-ambient">
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
            onClick={() => setDayOffset((v) => Math.min(Math.max(0, dates.length - 1), v + 1))}
            className="grid place-items-center w-9 h-9 rounded-xl bg-primary text-primary-foreground hover:opacity-90"
            aria-label="Next day"
          >
            <ChevronRight className="w-4 h-4" />
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

      {/* Rows */}
      {sorted.length === 0 ? (
        <p className="text-xs text-muted-foreground py-12 text-center">{emptyText}</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {sorted.map((s) => <SlotRow key={s.id} item={s} />)}
        </ul>
      )}
    </section>
  );
};

const SlotRow = ({ item }: { item: ActiveSlotItem }) => {
  const [dupOpen, setDupOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const status = computeStatus(item.date);
  const sm = statusMeta(status);
  const mm = modeMeta[item.mode];

  return (
    <li className="rounded-2xl bg-surface-lowest ghost-border shadow-ambient/40 hover:shadow-ambient transition">
      <div className="grid grid-cols-12 items-center gap-3 px-5 py-4">
        {/* SLOT TYPE */}
        <div className="col-span-12 md:col-span-3">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Slot Type</p>
          <p className="font-headline font-extrabold text-primary text-base mt-1">{item.typeLabel ?? mm.label}</p>
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
            {fmtTime(item.startMin).replace(/\s.*/, "")} <span className="text-muted-foreground">—</span>{" "}
            {fmtTime(item.endMin)}
          </p>
          <p className="text-[10px] italic text-muted-foreground tracking-wider uppercase mt-0.5">
            {item.bufferMin}-m flexible buffer
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
                <button onClick={() => { item.onDuplicate?.("tomorrow"); setDupOpen(false); }} className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-surface-low">To tomorrow</button>
                <button onClick={() => { item.onDuplicate?.("nextweek"); setDupOpen(false); }} className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-surface-low">To next week</button>
                <button onClick={() => { setDupOpen(false); setCustomOpen(true); }} className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-surface-low">Custom date…</button>
              </PopoverContent>
            </Popover>
            <Popover open={customOpen} onOpenChange={setCustomOpen}>
              <PopoverTrigger asChild><span /></PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[60]" align="end">
                <Calendar
                  mode="single"
                  onSelect={(d) => { if (d) { item.onDuplicate?.("custom", d.toISOString().slice(0, 10)); setCustomOpen(false); } }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <button onClick={item.onEdit} className="grid place-items-center w-8 h-8 rounded-full ghost-border bg-surface-lowest hover:bg-primary/10 text-primary" aria-label="Edit">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={item.onShare} className="grid place-items-center w-8 h-8 rounded-full ghost-border bg-surface-lowest hover:bg-primary/10 text-primary" aria-label="Share">
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={item.onDelete} className="grid place-items-center w-8 h-8 rounded-full ghost-border bg-surface-lowest hover:bg-destructive/10 text-destructive" aria-label="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
};

export default ActiveSlotsPanel;