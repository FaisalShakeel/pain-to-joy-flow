import { Link } from "react-router-dom";
import { Briefcase, Zap, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";

type Key = "hybrid" | "quicksync" | "event";

const TARGETS: Record<Key, { to: string; label: string; Icon: typeof Briefcase }> = {
  hybrid:    { to: "/app/availability/focus-meetings", label: "Focus Sync",      Icon: Briefcase },
  quicksync: { to: "/app/availability/quick-sync",     label: "Quick Sync",             Icon: Zap },
  event:     { to: "/app/availability/webinars",       label: "Event Access Scheduling", Icon: UsersRound },
};

interface Props {
  current: Key;
  className?: string;
}

/** Quick-jump icons to the two other scheduling builders. */
const SchedulingSwitcher = ({ current, className }: Props) => {
  const others = (Object.keys(TARGETS) as Key[]).filter((k) => k !== current);
  return (
    <div className={cn("inline-flex items-center gap-1.5", className)} aria-label="Switch scheduling type">
      {others.map((k) => {
        const { to, label, Icon } = TARGETS[k];
        return (
          <Link
            key={k}
            to={to}
            title={`Switch to ${label}`}
            aria-label={`Switch to ${label}`}
            className="grid place-items-center w-9 h-9 rounded-full ghost-border bg-surface-lowest text-primary hover:bg-primary hover:text-primary-foreground hover:scale-105 active:scale-95 transition shadow-ambient"
          >
            <Icon className="w-4 h-4" />
          </Link>
        );
      })}
    </div>
  );
};

export default SchedulingSwitcher;
