import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SectionHeader — canonical eyebrow + title used across the app.
 * Matches the profile page hierarchy:
 *   tiny tracked eyebrow   →   font-headline extrabold title   →   subtle subtext
 */
interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  align?: "left" | "center";
  tone?: "default" | "onPortal";
  trailing?: React.ReactNode;
  className?: string;
}

const SectionHeader = ({
  eyebrow,
  title,
  description,
  icon: Icon,
  align = "left",
  tone = "default",
  trailing,
  className,
}: SectionHeaderProps) => {
  const onPortal = tone === "onPortal";
  return (
    <div
      className={cn(
        "flex gap-4 items-start",
        align === "center" ? "flex-col items-center text-center" : "justify-between",
        className,
      )}
    >
      <div className={cn(align === "center" && "items-center")}>
        {eyebrow && (
          <p
            className={cn(
              "text-[10px] font-bold uppercase tracking-[0.2em] inline-flex items-center gap-2",
              onPortal ? "text-primary-foreground/70" : "text-accent",
            )}
          >
            {Icon && <Icon className="w-3 h-3" />}
            {eyebrow}
          </p>
        )}
        <h3
          className={cn(
            "font-headline font-extrabold tracking-tight leading-tight mt-1",
            onPortal ? "text-primary-foreground text-2xl md:text-3xl" : "text-primary text-lg md:text-xl",
          )}
        >
          {title}
        </h3>
        {description && (
          <p
            className={cn(
              "mt-1.5 text-sm leading-relaxed",
              onPortal ? "text-primary-foreground/70" : "text-muted-foreground",
            )}
          >
            {description}
          </p>
        )}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  );
};

export default SectionHeader;