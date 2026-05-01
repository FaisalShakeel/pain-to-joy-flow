import { QrCode, Megaphone, SplitSquareHorizontal, Zap, Eye, BellRing, Sparkles, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Feature = {
  id: string;
  label: string;
  micro: string;
  icon: LucideIcon;
  /** Tailwind text color used as the on-hover accent for the icon. */
  accent: string;
  /** A unique micro-animation hint applied to the icon on hover. */
  motion: string;
};

const FEATURES: Feature[] = [
  { id: "qr",       label: "QR Privacy",  micro: "Share access, not your number",        icon: QrCode,                 accent: "text-emerald-600", motion: "group-hover:animate-pulse" },
  { id: "spot",     label: "Spotlight",   micro: "Broadcast how to reach you",           icon: Megaphone,              accent: "text-accent",      motion: "group-hover:-rotate-6" },
  { id: "dual",     label: "Dual Slot",   micro: "One slot, two ways to connect",        icon: SplitSquareHorizontal,  accent: "text-primary",     motion: "group-hover:scale-110" },
  { id: "quick",    label: "Quick Sync",  micro: "Batch short calls without interruptions", icon: Zap,                 accent: "text-orange-500",  motion: "group-hover:translate-y-[-2px]" },
  { id: "birds",    label: "Bird's Eye",  micro: "See availability at a glance",         icon: Eye,                    accent: "text-violet-600",  motion: "group-hover:scale-110" },
  { id: "ping",     label: "Ping",        micro: "Get alerted when they're available",   icon: BellRing,               accent: "text-rose-500",    motion: "group-hover:animate-bounce" },
];

const FeatureMicroGrid = () => {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section id="feature-grid" className="relative py-20 md:py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-mist pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-6 md:px-10">
        <div className="max-w-2xl mb-12">
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-accent mb-3 inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> The toolkit
          </p>
          <h2 className="font-headline font-extrabold text-primary text-3xl md:text-5xl leading-[1.05] text-balance">
            Six tools. One philosophy:
            <br />
            <span className="italic font-medium text-outline-variant">availability you control.</span>
          </h2>
        </div>

        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            const isOpen = openId === f.id;
            return (
              <li key={f.id} className="relative">
                <button
                  type="button"
                  onClick={() => setOpenId((cur) => (cur === f.id ? null : f.id))}
                  className={cn(
                    "group w-full h-full flex flex-col items-start gap-3 rounded-2xl bg-surface-lowest ghost-border p-4 md:p-5 shadow-ambient text-left transition-all duration-200",
                    "hover:-translate-y-0.5 hover:shadow-elevated hover:scale-[1.03] active:scale-[0.97]",
                  )}
                  aria-expanded={isOpen}
                  aria-describedby={`feat-${f.id}-tip`}
                >
                  <span className="grid place-items-center w-10 h-10 rounded-xl bg-surface-low ghost-border text-muted-foreground group-hover:bg-primary/5 transition-colors">
                    <Icon
                      className={cn(
                        "w-5 h-5 transition-all duration-200",
                        "group-hover:" + f.accent.replace("text-", "text-"),
                        f.accent && `group-hover:${f.accent}`,
                        f.motion,
                      )}
                      strokeWidth={1.75}
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="font-headline font-bold text-primary text-sm md:text-[15px] leading-tight group-hover:text-primary transition-colors">
                      {f.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1 hidden md:block">
                      {f.micro}
                    </p>
                  </div>
                </button>

                {/* Hover tooltip (desktop) */}
                <div
                  id={`feat-${f.id}-tip`}
                  role="tooltip"
                  className={cn(
                    "pointer-events-none absolute z-20 left-1/2 -translate-x-1/2 -top-2 -translate-y-full w-56",
                    "rounded-xl bg-primary text-primary-foreground text-xs px-3 py-2 shadow-elevated",
                    "opacity-0 translate-y-1 transition-all duration-150",
                    "hidden md:block group-hover/none:opacity-100",
                    isOpen && "opacity-100 translate-y-0",
                  )}
                >
                  <span className="font-semibold">{f.label}</span>
                  <span className="block text-primary-foreground/85 mt-0.5">{f.micro}</span>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="mt-8 text-xs text-muted-foreground">
          Tap a tool to learn more. On desktop, hover to reveal the micro-tip.
        </p>
      </div>
    </section>
  );
};

export default FeatureMicroGrid;