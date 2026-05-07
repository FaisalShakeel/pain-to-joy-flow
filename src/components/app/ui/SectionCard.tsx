import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * SectionCard — the canonical surface used across the app.
 *
 * Mirrors the profile page's master design language:
 *   bg-surface-lowest · rounded-2xl · ghost-border · shadow-ambient
 *
 * Use for: contact cards, vault tiles, availability panels, comms blocks,
 * status sections, waiting lists, booking displays.
 *
 * Variants:
 *  - "surface" (default): primary canvas surface
 *  - "low":     nested/secondary surface (bg-surface-low)
 *  - "portal":  dark "Connection Portal" surface (bg-primary text-primary-foreground)
 */
export interface SectionCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "surface" | "low" | "portal";
  padding?: "sm" | "md" | "lg";
  interactive?: boolean;
}

const padMap = { sm: "p-4", md: "p-5", lg: "p-6 md:p-7" } as const;

const SectionCard = forwardRef<HTMLDivElement, SectionCardProps>(
  ({ variant = "surface", padding = "md", interactive, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl ghost-border shadow-ambient",
          variant === "surface" && "bg-surface-lowest",
          variant === "low" && "bg-surface-low/60",
          variant === "portal" &&
            "bg-primary text-primary-foreground shadow-elevated overflow-hidden relative",
          padMap[padding],
          interactive && "transition hover:shadow-elevated hover:-translate-y-0.5",
          className,
        )}
        {...props}
      />
    );
  },
);
SectionCard.displayName = "SectionCard";

export default SectionCard;