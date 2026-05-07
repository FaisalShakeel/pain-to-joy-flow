import { Lock, ShieldCheck, Clock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * AccessChip — single source of truth for the Locked / Pending / Approved
 * connection state badge used on profiles, contact cards, and vault directory.
 */
export type AccessState = "locked" | "pending" | "approved";

interface Props {
  state: AccessState;
  size?: "sm" | "md";
  className?: string;
}

const map: Record<AccessState, { label: string; icon: LucideIcon; cls: string }> = {
  locked: {
    label: "Locked",
    icon: Lock,
    cls: "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-300",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    cls: "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300",
  },
  approved: {
    label: "Access Approved",
    icon: ShieldCheck,
    cls: "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300",
  },
};

const AccessChip = ({ state, size = "sm", className }: Props) => {
  const m = map[state];
  const Icon = m.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-bold uppercase tracking-[0.18em]",
        size === "sm" ? "px-2.5 py-1 text-[9px]" : "px-3 py-1.5 text-[10px]",
        m.cls,
        className,
      )}
    >
      <Icon className={cn(size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3")} />
      {m.label}
    </span>
  );
};

export default AccessChip;