import { Shield, ShieldCheck, ShieldAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * AccessChip — single source of truth for the Locked / Pending / Approved
 * connection state shield indicator used on profiles, contact cards, and vault.
 * Renders a subtle shield icon (green = approved, amber = pending, red = locked/denied)
 * with a native tooltip on hover.
 */
export type AccessState = "locked" | "pending" | "approved";

interface Props {
  state: AccessState;
  size?: "sm" | "md";
  className?: string;
}

const map: Record<AccessState, { label: string; icon: LucideIcon; cls: string }> = {
  locked: {
    label: "Denied / Restricted access",
    icon: Shield,
    cls: "bg-rose-500/10 ring-1 ring-rose-500/30 text-rose-600 dark:text-rose-300",
  },
  pending: {
    label: "Pending access",
    icon: ShieldAlert,
    cls: "bg-amber-500/10 ring-1 ring-amber-500/30 text-amber-600 dark:text-amber-300",
  },
  approved: {
    label: "Access approved",
    icon: ShieldCheck,
    cls: "bg-emerald-500/10 ring-1 ring-emerald-500/30 text-emerald-600 dark:text-emerald-300",
  },
};

const AccessChip = ({ state, size = "sm", className }: Props) => {
  const m = map[state];
  const Icon = m.icon;
  return (
    <span
      title={m.label}
      aria-label={m.label}
      className={cn(
        "inline-grid place-items-center rounded-full",
        size === "sm" ? "w-5 h-5" : "w-6 h-6",
        m.cls,
        className,
      )}
    >
      <Icon className={cn(size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5")} strokeWidth={2.25} />
    </span>
  );
};

export default AccessChip;