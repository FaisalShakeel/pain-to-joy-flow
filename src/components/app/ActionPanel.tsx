import { ReactNode } from "react";
import { CalendarDays, Zap, Bell, ShieldCheck, Phone, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AvailabilityStatus } from "@/lib/mockData";

export interface ActionItem {
  key: string;
  label: string;
  icon: typeof CalendarDays;
  onClick: () => void;
  variant?: "primary" | "secondary" | "ghost" | "warn";
  disabled?: boolean;
}

interface Props {
  status: AvailabilityStatus;
  actions: ActionItem[];
  /** Sticky bottom on mobile */
  stickyMobile?: boolean;
  className?: string;
}

const variantClass = (v: ActionItem["variant"]) => {
  switch (v) {
    case "primary":
      return "bg-primary text-primary-foreground hover:opacity-95";
    case "warn":
      return "bg-amber-500 text-white hover:bg-amber-400";
    case "ghost":
      return "bg-surface-low ghost-border text-primary hover:bg-surface";
    default:
      return "bg-surface-lowest ghost-border text-primary hover:bg-surface-low";
  }
};

/** Compact horizontal action panel; sticky on mobile when enabled. */
const ActionPanel = ({ actions, stickyMobile = true, className }: Props) => {
  return (
    <>
      {/* Desktop / inline */}
      <div className={cn("hidden md:flex items-center gap-2 flex-wrap", className)}>
        {actions.map((a) => (
          <button
            key={a.key}
            onClick={a.onClick}
            disabled={a.disabled}
            className={cn(
              "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed",
              variantClass(a.variant),
            )}
          >
            <a.icon className="w-3.5 h-3.5" />
            {a.label}
          </button>
        ))}
      </div>

      {/* Mobile inline (non-sticky placement) */}
      {!stickyMobile && (
        <div className={cn("md:hidden grid grid-cols-2 gap-2", className)}>
          {actions.map((a) => (
            <button
              key={a.key}
              onClick={a.onClick}
              disabled={a.disabled}
              className={cn(
                "inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition disabled:opacity-50",
                variantClass(a.variant),
              )}
            >
              <a.icon className="w-3.5 h-3.5" />
              {a.label}
            </button>
          ))}
        </div>
      )}

      {/* Mobile sticky bottom CTA */}
      {stickyMobile && (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-40 px-3 pb-3 pt-2 bg-gradient-to-t from-surface-low via-surface-low/95 to-surface-low/0 pointer-events-none">
          <div className="pointer-events-auto rounded-2xl bg-surface-lowest ghost-border shadow-elevated p-2 flex items-center gap-1.5 overflow-x-auto">
            {actions.slice(0, 4).map((a) => (
              <button
                key={a.key}
                onClick={a.onClick}
                disabled={a.disabled}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-semibold transition whitespace-nowrap disabled:opacity-50",
                  variantClass(a.variant),
                )}
              >
                <a.icon className="w-3.5 h-3.5" />
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export { CalendarDays, Zap, Bell, ShieldCheck, Phone, MessageSquare };
export default ActionPanel;
