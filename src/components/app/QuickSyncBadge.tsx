import { Zap, CalendarClock } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

export interface SyncWindow { start: string; end: string; }

interface Props {
  windows: SyncWindow[];
  onBook?: () => void;
  size?: "sm" | "md";
  className?: string;
}

/** Premium overlay badge — sits at bottom-right of avatar showing next Quick Sync windows. */
const QuickSyncBadge = ({ windows, onBook, size = "sm", className }: Props) => {
  if (!windows || windows.length === 0) return null;
  const compact = windows.slice(0, 2).map((w) => `${w.start}–${w.end}`).join(" | ");
  return (
    <HoverCard openDelay={120} closeDelay={80}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          aria-label="Quick Sync availability"
          className={cn(
            "inline-flex items-center gap-1 rounded-lg bg-primary text-primary-foreground shadow-elevated ring-2 ring-surface-lowest hover:scale-[1.04] active:scale-[0.97] transition-transform",
            size === "sm" ? "px-1.5 py-0.5" : "px-2 py-1",
            className,
          )}
        >
          <Zap className={cn(size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3", "text-gold")} />
          <span className={cn("font-bold uppercase tracking-[0.14em]", size === "sm" ? "text-[8px]" : "text-[9px]")}>QSync</span>
          <span className={cn("font-semibold tabular-nums", size === "sm" ? "text-[9px]" : "text-[10px]")}>{compact}</span>
        </button>
      </HoverCardTrigger>
      <HoverCardContent align="end" className="w-64 rounded-xl ghost-border bg-surface-lowest/95 backdrop-blur shadow-elevated p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <CalendarClock className="w-3.5 h-3.5 text-accent" />
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Quick Sync today</p>
        </div>
        <ul className="space-y-1">
          {windows.map((w) => (
            <li key={`${w.start}-${w.end}`} className="text-xs text-primary tabular-nums font-semibold">
              {w.start} – {w.end}
            </li>
          ))}
        </ul>
        {onBook && (
          <button
            onClick={onBook}
            className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold hover:opacity-95"
          >
            <Zap className="w-3 h-3 text-gold" /> Book Quick Sync
          </button>
        )}
      </HoverCardContent>
    </HoverCard>
  );
};

export default QuickSyncBadge;
