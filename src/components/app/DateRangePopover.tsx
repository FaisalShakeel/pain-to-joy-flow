import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalIcon, ChevronRight, RotateCcw } from "lucide-react";
import type { DateRange } from "react-day-picker";
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
  const range: DateRange = { from: new Date(from), to: to ? new Date(to) : undefined };

  const goToday = () => {
    const today = toISO(new Date());
    onChange(today, singleOnly ? undefined : today);
    if (singleOnly) setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full md:w-auto inline-flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-surface-low ghost-border text-sm font-bold text-primary hover:bg-surface-low/80",
            className,
          )}
        >
          <CalIcon className="w-4 h-4 text-muted-foreground" />
          <span>{(triggerLabel ?? defaultLabel)(from, to)}</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-[60]" align="start">
        <div className="flex items-center justify-between gap-2 px-3 pt-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
            {singleOnly ? "Pick a date" : "Pick date or range"}
          </p>
          <button
            type="button"
            onClick={goToday}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold hover:opacity-90"
          >
            <RotateCcw className="w-3 h-3" /> Today
          </button>
        </div>
        {singleOnly ? (
          <Calendar
            mode="single"
            selected={new Date(from)}
            onSelect={(d) => {
              if (!d) return;
              onChange(toISO(d), undefined);
              setOpen(false);
            }}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        ) : (
          <Calendar
            mode="range"
            selected={range}
            onSelect={(r) => {
              if (!r?.from) return;
              const f = toISO(r.from);
              const t = r.to ? toISO(r.to) : undefined;
              onChange(f, t);
              if (r.from && r.to) setOpen(false);
            }}
            numberOfMonths={1}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        )}
      </PopoverContent>
    </Popover>
  );
};

export default DateRangePopover;