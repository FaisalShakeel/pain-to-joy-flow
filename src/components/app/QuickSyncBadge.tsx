import { useState } from "react";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import QuickSyncSlotsDialog from "./QuickSyncSlotsDialog";

export interface SyncWindow { start: string; end: string; }

interface Props {
  windows: SyncWindow[];
  contactName?: string;
  size?: "sm" | "md";
  className?: string;
}

/** Premium overlay badge — sits at bottom-right of avatar showing next Quick Sync windows. */
const QuickSyncBadge = ({ windows, contactName = "this contact", size = "sm", className }: Props) => {
  if (!windows || windows.length === 0) return null;
  const [open, setOpen] = useState(false);
  const compact = windows.slice(0, 2).map((w) => `${w.start}–${w.end}`).join(" | ");
  return (
    <>
      <button
        type="button"
        aria-label="Open Quick Sync slots"
        onClick={() => setOpen(true)}
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
      <QuickSyncSlotsDialog
        open={open}
        onOpenChange={setOpen}
        contactName={contactName}
        windows={windows}
      />
    </>
  );
};

export default QuickSyncBadge;
