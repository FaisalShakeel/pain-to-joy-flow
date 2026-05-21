import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Sparkles, ShieldCheck, Briefcase, Car, Brain, MoonStar, ChevronDown, Wand2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type OrbStatus = "available" | "busy" | "focus" | "driving" | "offline";

type Meta = {
  label: string;
  signal: string;
  dot: string;
  chipBg: string;
  chipText: string;
  icon: React.ReactNode;
};

const META: Record<OrbStatus, Meta> = {
  available: { label: "Available", signal: "152 72% 45%", dot: "bg-emerald-500", chipBg: "bg-emerald-500/15", chipText: "text-emerald-700", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  busy:      { label: "Busy",      signal: "38 92% 55%",  dot: "bg-amber-500",   chipBg: "bg-amber-500/15",   chipText: "text-amber-700",   icon: <Briefcase className="w-3.5 h-3.5" /> },
  focus:     { label: "Focus",     signal: "205 92% 55%", dot: "bg-sky-500",     chipBg: "bg-sky-500/15",     chipText: "text-sky-700",     icon: <Brain className="w-3.5 h-3.5" /> },
  driving:   { label: "Driving",   signal: "265 85% 65%", dot: "bg-violet-500",  chipBg: "bg-violet-500/15",  chipText: "text-violet-700",  icon: <Car className="w-3.5 h-3.5" /> },
  offline:   { label: "Offline",   signal: "215 15% 55%", dot: "bg-slate-400",   chipBg: "bg-slate-500/15",   chipText: "text-slate-600",   icon: <MoonStar className="w-3.5 h-3.5" /> },
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
  const rootRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) { setOpen(false); setPendingPick(null); }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); setPendingPick(null); } };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

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
    <div ref={rootRef} className="relative inline-flex" style={signalStyle}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
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

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "absolute z-50 top-1/2 -translate-y-1/2 right-full mr-2",
            "w-[260px] rounded-xl p-2",
            "bg-surface-lowest/95 backdrop-blur-xl ring-1 ring-border shadow-elevated",
            "animate-in fade-in-0 zoom-in-95 duration-150",
          )}
        >
          {!pendingPick ? (
            <>
              <div className="px-2 pt-1 pb-1.5 flex items-center justify-between">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Manual override
                </p>
                {!aiManaged && (
                  <button onClick={revertToAI} className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 hover:underline">
                    <Wand2 className="w-3 h-3" /> Resume AI
                  </button>
                )}
              </div>
              <ul className="grid gap-0.5">
                {ORDER.map((k) => {
                  const m = META[k];
                  const active = !aiManaged && k === status;
                  return (
                    <li key={k}>
                      <button
                        onClick={() => setPendingPick(k)}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px] text-primary hover:bg-surface-low transition",
                          active && "bg-surface-low",
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", m.dot)} />
                        <span className="flex-1 text-left">{m.label}</span>
                        {active && <Check className="w-3 h-3 text-muted-foreground" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between px-2 pt-1 pb-1.5">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Override duration
                </p>
                <button onClick={() => setPendingPick(null)} className="text-[10px] text-muted-foreground hover:text-primary">
                  Back
                </button>
              </div>
              <div className="flex items-center gap-1.5 px-2 pb-1.5">
                <span className={cn("w-1.5 h-1.5 rounded-full", META[pendingPick].dot)} />
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
