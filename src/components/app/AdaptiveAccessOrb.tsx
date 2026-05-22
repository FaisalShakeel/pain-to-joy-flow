import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Sparkles, Briefcase, Car, Brain, MoonStar, ChevronDown, Wand2, Check, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";

export type OrbStatus = "available" | "busy" | "focus" | "driving" | "offline";

type Meta = {
  label: string;
  signal: string;
  dot: string;
  chipBg: string;
  chipText: string;
  icon: React.ReactNode;
  /** circular floating button gradient + ring (status-first color) */
  ringBg: string;
  iconColor: string;
};

const META: Record<OrbStatus, Meta> = {
  available: { label: "Available", signal: "152 72% 45%", dot: "bg-emerald-500", chipBg: "bg-emerald-500/15", chipText: "text-emerald-700",
               icon: <Phone className="w-4 h-4" />,        ringBg: "bg-emerald-500 ring-emerald-300/60",       iconColor: "text-white" },
  busy:      { label: "Busy",      signal: "38 92% 55%",  dot: "bg-amber-500",   chipBg: "bg-amber-500/15",   chipText: "text-amber-700",
               icon: <Briefcase className="w-4 h-4" />,    ringBg: "bg-amber-500 ring-amber-300/60",            iconColor: "text-white" },
  focus:     { label: "Focus",     signal: "205 92% 55%", dot: "bg-sky-500",     chipBg: "bg-sky-500/15",     chipText: "text-sky-700",
               icon: <Brain className="w-4 h-4" />,        ringBg: "bg-sky-500 ring-sky-300/60",                iconColor: "text-white" },
  driving:   { label: "Driving",   signal: "265 85% 65%", dot: "bg-violet-500",  chipBg: "bg-violet-500/15",  chipText: "text-violet-700",
               icon: <Car className="w-4 h-4" />,          ringBg: "bg-violet-500 ring-violet-300/60",          iconColor: "text-white" },
  offline:   { label: "Offline",   signal: "215 15% 55%", dot: "bg-slate-400",   chipBg: "bg-slate-500/15",   chipText: "text-slate-600",
               icon: <MoonStar className="w-4 h-4" />,     ringBg: "bg-slate-400 ring-slate-300/60",            iconColor: "text-white" },
};

const ORDER: OrbStatus[] = ["available", "busy", "focus", "driving", "offline"];

type DurationKey = "30m" | "1h" | "event" | "off";
const DURATIONS: { key: DurationKey; label: string; ms: number | null }[] = [
  { key: "30m",   label: "30 Minutes",       ms: 30 * 60 * 1000 },
  { key: "1h",    label: "1 Hour",           ms: 60 * 60 * 1000 },
  { key: "event", label: "Until Event Ends", ms: 90 * 60 * 1000 },
  { key: "off",   label: "Until Turned Off", ms: null },
];

interface Props {
  status: OrbStatus;
  onChange: (s: OrbStatus) => void;
  /** kept for API compat — unused in compact rect variant */
  initials?: string;
  accent?: string;
}

export default function AdaptiveAccessOrb({ status, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [aiManaged, setAiManaged] = useState(true);
  const [pendingPick, setPendingPick] = useState<OrbStatus | null>(null);
  const [override, setOverride] = useState<{ status: OrbStatus; until: number | null } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const isMobile = useIsMobile();

  const meta = META[status];
  const signalStyle = useMemo(() => ({ "--orb-signal": meta.signal }) as CSSProperties, [meta.signal]);

  useEffect(() => {
    if (!override) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [override]);

  useEffect(() => {
    if (override?.until && now >= override.until) {
      setOverride(null);
      setAiManaged(true);
      onChange("available");
    }
  }, [now, override, onChange]);

  useEffect(() => { if (!open) setPendingPick(null); }, [open]);

  const confirmDuration = (d: typeof DURATIONS[number]) => {
    if (!pendingPick) return;
    onChange(pendingPick);
    setAiManaged(false);
    setOverride({ status: pendingPick, until: d.ms ? Date.now() + d.ms : null });
    setPendingPick(null);
    setOpen(false);
  };

  const revertToAI = () => {
    setOverride(null);
    setAiManaged(true);
    onChange("available");
    setOpen(false);
    setPendingPick(null);
  };

  const remaining = useMemo(() => {
    if (!override?.until) return null;
    const ms = Math.max(0, override.until - now);
    const m = Math.floor(ms / 60000);
    if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}m ${s.toString().padStart(2, "0")}s`;
  }, [override, now]);

  return (
    <div className="relative inline-flex" style={signalStyle}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Adaptive access control"
            className={cn(
          "group inline-flex items-center gap-1.5 sm:gap-2 h-8 pl-2 pr-1.5 sm:pl-2.5 sm:pr-2 rounded-lg",
          "bg-surface-lowest/80 backdrop-blur-xl ring-1 ring-border hover:ring-foreground/25",
          "transition-all duration-300 shadow-sm max-w-[220px]",
        )}
        title="Adaptive Access Active"
      >
        {/* signal dot */}
        <span className="relative flex h-2 w-2 shrink-0">
          {!aiManaged && (
            <span
              aria-hidden
              className="absolute inset-0 rounded-full animate-ping opacity-60"
              style={{ backgroundColor: `hsl(${meta.signal})` }}
            />
          )}
          <span className={cn("relative inline-flex h-2 w-2 rounded-full", meta.dot)} />
        </span>

        {/* mode chip */}
        {aiManaged ? (
          <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold tracking-wide text-indigo-700">
            <Sparkles className="w-2.5 h-2.5" />
            <span className="hidden xs:inline sm:inline">AI Managing</span>
            <span className="xs:hidden sm:hidden">AI</span>
          </span>
        ) : (
          <span className={cn("inline-flex items-center gap-1 text-[10.5px] font-semibold tracking-wide", meta.chipText)}>
            <span className="hidden sm:inline">Manual · {meta.label}</span>
            <span className="sm:hidden">{meta.label}</span>
            {remaining && <span className="opacity-70 tabular-nums hidden sm:inline">· {remaining}</span>}
          </span>
        )}

        <ChevronDown className={cn("w-3 h-3 text-muted-foreground shrink-0 transition-transform", open && "rotate-180")} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align={isMobile ? "start" : "end"}
          side="bottom"
          sideOffset={8}
          collisionPadding={12}
          avoidCollisions
          className={cn(
            "w-auto max-w-[calc(100vw-24px)] p-3 rounded-2xl",
            "bg-surface-lowest/95 backdrop-blur-xl border-border shadow-elevated",
          )}
        >
          {!pendingPick ? (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-3 px-1">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Manual override
                </p>
                {!aiManaged && (
                  <button onClick={revertToAI} className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 hover:underline">
                    <Wand2 className="w-3 h-3" /> Resume AI
                  </button>
                )}
              </div>
              {/* Circular floating action cluster — status-first colors */}
              <div className="flex items-center gap-2.5">
                {ORDER.map((k) => {
                  const m = META[k];
                  const active = !aiManaged && k === status;
                  return (
                    <button
                      key={k}
                      onClick={() => setPendingPick(k)}
                      title={m.label}
                      aria-label={m.label}
                      className={cn(
                        "relative grid place-items-center w-11 h-11 rounded-full shadow-md ring-2 ring-offset-2 ring-offset-surface-lowest transition-transform hover:scale-105 active:scale-95",
                        m.ringBg, m.iconColor,
                        active && "scale-110",
                      )}
                    >
                      {m.icon}
                      {active && (
                        <span className="absolute -top-1 -right-1 grid place-items-center w-4 h-4 rounded-full bg-surface-lowest ring-1 ring-border">
                          <Check className="w-2.5 h-2.5 text-primary" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between px-1 pt-0.5">
                <span className="text-[10px] text-muted-foreground">Tap a status to override</span>
                {aiManaged && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700">
                    <Sparkles className="w-2.5 h-2.5" /> AI active
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 min-w-[220px]">
              <div className="flex items-center justify-between px-1">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Override duration
                </p>
                <button onClick={() => setPendingPick(null)} className="text-[10px] text-muted-foreground hover:text-primary">
                  Back
                </button>
              </div>
              <div className="flex items-center gap-2 px-1">
                <span className={cn("grid place-items-center w-7 h-7 rounded-full text-white", META[pendingPick].ringBg)}>
                  {META[pendingPick].icon}
                </span>
                <span className="text-xs text-primary font-semibold">{META[pendingPick].label}</span>
              </div>
              <ul className="grid gap-0.5">
                {DURATIONS.map((d) => (
                  <li key={d.key}>
                    <button
                      onClick={() => confirmDuration(d)}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-[12px] text-primary hover:bg-surface-low transition"
                    >
                      {d.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
