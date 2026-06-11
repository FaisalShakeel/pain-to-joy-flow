import { Zap, Clock } from "lucide-react";
import { Link } from "react-router-dom";

/** Quick Sync card with cooldown awareness. */
const QuickSyncWidget = ({ cooldown = false }: { cooldown?: boolean }) => {
  return (
    <section className="rounded-2xl ghost-border bg-gradient-to-br from-amber-500/10 via-surface-lowest to-surface-low/40 p-3 shadow-soft">
      <div className="flex items-center gap-2">
        <span className="grid place-items-center w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700">
          <Zap className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground leading-none">
            Quick Sync
          </p>
          <h4 className="text-sm font-bold text-primary leading-tight">
            {cooldown ? "Cooldown active" : "Quick Sync Open"}
          </h4>
        </div>
        {!cooldown && (
          <Link
            to="/app/availability/quick-sync"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider hover:opacity-95 transition"
          >
            Book Now
          </Link>
        )}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <div className="rounded-lg bg-surface-lowest ghost-border px-2 py-1.5">
          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground leading-none">
            {cooldown ? "Available In" : "Session"}
          </p>
          <p className="text-[12px] font-semibold text-primary leading-tight">
            {cooldown ? "23 Hours" : "10 Minute Session"}
          </p>
        </div>
        <div className="rounded-lg bg-surface-lowest ghost-border px-2 py-1.5">
          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground leading-none">
            {cooldown ? "Next Quick Sync" : "Next Slot"}
          </p>
          <p className="text-[12px] font-semibold text-primary leading-tight flex items-center gap-1">
            <Clock className="w-3 h-3 opacity-60" />
            {cooldown ? "Tomorrow 3:00 PM" : "Today 4:30 PM"}
          </p>
        </div>
      </div>
    </section>
  );
};

export default QuickSyncWidget;