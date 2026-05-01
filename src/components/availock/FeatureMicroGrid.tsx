import { QrCode, Megaphone, SplitSquareHorizontal, Zap, Eye, BellRing, Sparkles, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Feature = {
  id: string;
  label: string;
  micro: string;
  icon: LucideIcon;
  /** Full Tailwind class, statically present so JIT keeps it. */
  accentText: string;
  accentBg: string;
  /** Idle motion class applied on hover. */
  motion: string;
};

const FEATURES: Feature[] = [
  { id: "qr",    label: "QR Privacy", micro: "Share access, not your number",          icon: QrCode,                accentText: "group-hover:text-emerald-600", accentBg: "group-hover:bg-emerald-500/10", motion: "group-hover:animate-pulse" },
  { id: "spot",  label: "Spotlight",  micro: "Broadcast how to reach you",             icon: Megaphone,             accentText: "group-hover:text-accent",      accentBg: "group-hover:bg-accent/10",      motion: "group-hover:-rotate-6" },
  { id: "dual",  label: "Dual Slot",  micro: "One slot, two ways to connect",          icon: SplitSquareHorizontal, accentText: "group-hover:text-primary",     accentBg: "group-hover:bg-primary/10",     motion: "group-hover:scale-110" },
  { id: "quick", label: "Quick Sync", micro: "Batch short calls without interruptions",icon: Zap,                   accentText: "group-hover:text-orange-500",  accentBg: "group-hover:bg-orange-500/10",  motion: "group-hover:-translate-y-0.5" },
  { id: "birds", label: "Bird's Eye", micro: "See availability at a glance",           icon: Eye,                   accentText: "group-hover:text-violet-600",  accentBg: "group-hover:bg-violet-500/10",  motion: "group-hover:scale-110" },
  { id: "ping",  label: "Ping",       micro: "Get alerted when they're available",     icon: BellRing,              accentText: "group-hover:text-rose-500",    accentBg: "group-hover:bg-rose-500/10",    motion: "group-hover:animate-bounce" },
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

        <TooltipProvider delayDuration={120}>
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              const isOpen = openId === f.id;
              return (
                <li key={f.id}>
                  <Tooltip open={isOpen || undefined}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setOpenId((cur) => (cur === f.id ? null : f.id))}
                        className={cn(
                          "group w-full h-full flex flex-col items-start gap-3 rounded-2xl bg-surface-lowest ghost-border p-4 md:p-5 shadow-ambient text-left",
                          "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated hover:scale-[1.03] active:scale-[0.97]",
                        )}
                        aria-label={`${f.label} — ${f.micro}`}
                      >
                        <span
                          className={cn(
                            "grid place-items-center w-10 h-10 rounded-xl bg-surface-low ghost-border text-muted-foreground transition-colors duration-200",
                            f.accentBg,
                          )}
                        >
                          <Icon
                            strokeWidth={1.75}
                            className={cn(
                              "w-5 h-5 transition-all duration-200",
                              f.accentText,
                              f.motion,
                            )}
                          />
                        </span>
                        <div className="min-w-0">
                          <p className="font-headline font-bold text-primary text-sm md:text-[15px] leading-tight">
                            {f.label}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-1 hidden md:block">
                            {f.micro}
                          </p>
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-primary text-primary-foreground border-primary">
                      <span className="font-semibold">{f.label}</span>
                      <span className="block text-primary-foreground/85 mt-0.5 text-xs">{f.micro}</span>
                    </TooltipContent>
                  </Tooltip>
                </li>
              );
            })}
          </ul>
        </TooltipProvider>

        <p className="mt-8 text-xs text-muted-foreground md:hidden">
          Tap a tool to reveal its micro-tip.
        </p>
      </div>
    </section>
  );
};

export default FeatureMicroGrid;