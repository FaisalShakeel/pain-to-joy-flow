import { cn } from "@/lib/utils";
import { statusFor, type StatusKey } from "@/lib/statusColors";

interface Props {
  initials: string;
  accent?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  /**
   * Availability status — renders a refined thin colored outline
   * + tiny status dot. Canonical AVAILOCK status system, used
   * consistently across dashboard, contacts, vault, search, profile.
   */
  status?: StatusKey | string;
  /** Hide the small corner dot (ring only). */
  hideDot?: boolean;
}

const sizes = {
  sm: "w-8 h-8 text-[11px]",
  md: "w-10 h-10 text-xs",
  lg: "w-14 h-14 text-sm",
  xl: "w-20 h-20 text-base",
};

const dotSizes = {
  sm: "w-2 h-2 ring-2",
  md: "w-2.5 h-2.5 ring-2",
  lg: "w-3 h-3 ring-[3px]",
  xl: "w-3.5 h-3.5 ring-[3px]",
};

const Avatar = ({
  initials,
  accent = "from-primary to-primary-glow",
  size = "md",
  className,
  status,
  hideDot,
}: Props) => {
  const tokens = status ? statusFor(status) : null;
  return (
    <div className={cn("relative inline-grid", className)}>
      <div
        className={cn(
          "grid place-items-center rounded-full font-semibold text-white bg-gradient-to-br shadow-sm",
          accent,
          sizes[size],
          tokens && "ring-2 ring-offset-2",
          tokens?.ring,
          tokens?.ringOffset,
        )}
        aria-hidden="true"
      >
        {initials}
      </div>
      {tokens && !hideDot && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-background",
            dotSizes[size],
            tokens.dot,
          )}
        />
      )}
    </div>
  );
};

export default Avatar;