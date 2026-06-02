import { useState } from "react";
import { format, addDays } from "date-fns";
import { Calendar as CalIcon, ChevronRight, ChevronLeft, RotateCcw } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const toISO = (d: Date) => format(d, "yyyy-MM-dd");

interface Props {
  from: string;
  to?: string;
  onChange: (from: string, to?: string) => void;
  /** When true, only a single date is captured (to === from). */
  singleOnly?: boolean;
  className?: string;
  triggerLabel?: (from: string, to?: string) => string;
}

const defaultLabel = (from: string, to?: string) => {
  const f = new Date(from);
  if (!to || to === from) return format(f, "EEEE, MMMM d, yyyy");
  const t = new Date(to);
  return `${format(f, "MMM d")} → ${format(t, "MMM d, yyyy")}`;
};

const DateRangePopover = ({ from, to, onChange, singleOnly, className, triggerLabel }: Props) => {
  const [open, setOpen] = useState(false);
  const fromDate = new Date(from);
  const toDate = to ? new Date(to) : undefined;
  const hasRange = !!toDate && to !== from;

  const goToday = () => {
    const today = toISO(new Date());
    onChange(today, singleOnly ? undefined : today);
  };

  const shiftBy = (days: number) => {
    const next = toISO(addDays(fromDate, days));
    onChange(next, singleOnly ? undefined : next);
  };

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <button
        type="button"
        onClick={goToday}
        title="Jump to today"
        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-[11px] font-bold hover:opacity-90"
      >
        <RotateCcw className="w-3 h-3" /> Today
      </button>
      <div className="inline-flex items-stretch rounded-xl bg-surface-low ghost-border overflow-hidden">
        <button
          type="button"
          onClick={() => shiftBy(-1)}
          title="Previous day"
          aria-label="Previous day"
          className="px-2 py-2 text-muted-foreground hover:text-primary hover:bg-surface-low/80"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              title="Open calendar"
              aria-label="Open calendar"
              className="px-2 py-2 border-l border-r border-border/60 text-muted-foreground hover:text-primary hover:bg-surface-low/80"
            >
              <CalIcon className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-[60]" align="start">
            <div className="px-3 pt-3 pb-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
                {singleOnly ? "Pick a date" : "Click = single date · Shift+Click = range"}
              </p>
            </div>
            <Calendar
              mode="single"
              selected={hasRange ? undefined : fromDate}
              modifiers={
                hasRange && toDate
                  ? {
                      range_start: fromDate,
                      range_end: toDate,
                      range_middle: { after: fromDate, before: toDate },
                    }
                  : undefined
              }
              modifiersClassNames={{
                range_start: "bg-primary text-primary-foreground rounded-l-md",
                range_end: "bg-primary text-primary-foreground rounded-r-md",
                range_middle: "bg-accent text-accent-foreground",
              }}
              onDayClick={(day, _m, e) => {
                const iso = toISO(day);
                const shift = !singleOnly && (e as React.MouseEvent).shiftKey;
                if (shift) {
                  const anchor = new Date(from);
                  if (day < anchor) {
                    onChange(iso, from);
                  } else {
                    onChange(from, iso);
                  }
                  setOpen(false);
                } else {
                  onChange(iso, singleOnly ? undefined : iso);
                  setOpen(false);
                }
              }}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        <div className="px-3 py-2 text-sm font-bold text-primary whitespace-nowrap flex items-center">
          {(triggerLabel ?? defaultLabel)(from, to)}
        </div>
        <button
          type="button"
          onClick={() => shiftBy(1)}
          title="Next day"
          aria-label="Next day"
          className="px-2 py-2 border-l border-border/60 text-muted-foreground hover:text-primary hover:bg-surface-low/80"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default DateRangePopover;