import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Sparkles, ShieldCheck, Briefcase, Car, Brain, MoonStar, X, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Avatar from "@/components/app/Avatar";

export type OrbStatus = "available" | "busy" | "focus" | "driving" | "offline";

type Meta = {
  label: string;
  signal: string; // HSL channels
  dot: string;
  chipBg: string;
  chipText: string;
  icon: React.ReactNode;
};

const META: Record<OrbStatus, Meta> = {
  available: { label: "Available", signal: "152 72% 45%", dot: "bg-emerald-500", chipBg: "bg-emerald-500/15", chipText: "text-emerald-700", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  busy:      { label: "Busy",      signal: "38 92% 55%",  dot: "bg-amber-500",   chipBg: "bg-amber-500/15",   chipText: "text-amber-700",   icon: <Briefcase className="w-3.5 h-3.5" /> },
  driving:   { label: "Driving",   signal: "265 85% 65%", dot: "bg-violet-500",  chipBg: "bg-violet-500/15",  chipText: "text-violet-700",  icon: <Car className="w-3.5 h-3.5" /> },
  focus:     { label: "Focus",     signal: "205 92% 55%", dot: "bg-sky-500",     chipBg: "bg-sky-500/15",     chipText: "text-sky-700",     icon: <Brain className="w-3.5 h-3.5" /> },
  offline:   { label: "Offline",   signal: "215 15% 55%", dot: "bg-slate-400",   chipBg: "bg-slate-500/15",   chipText: "text-slate-600",   icon: <MoonStar className="w-3.5 h-3.5" /> },
};

const RADIAL: { key: OrbStatus; angle: number }[] = [
  { key: "available", angle: -60 },
  { key: "busy",      angle: -30 },
  { key: "focus",     angle: 0 },
  { key: "driving",   angle: 30 },
  { key: "offline",   angle: 60 },
];

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
  initials: string;
  accent?: string;
}

export default function AdaptiveAccessOrb({ status, onChange, initials, accent }: Props) {
  const [open, setOpen] = useState(false);
  const [aiManaged, setAiManaged] = useState(true);
  const [pendingPick, setPendingPick] = useState<OrbStatus | null>(null);
  const [override, setOverride] = useState<{ status: OrbStatus; until: number | null } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const rootRef = useRef<HTMLDivElement>(null);

  const meta = META[status];
  const signalStyle = useMemo(() => ({ "--orb-signal": meta.signal }) as CSSProperties, [meta.signal]);

  // Pulse is active ONLY when a manual override is in effect.
  const pulseActive = !aiManaged && override !== null;

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
    if (!open && !pendingPick) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) { setOpen(false); setPendingPick(null); }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); setPendingPick(null); } };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open, pendingPick]);

  const pickStatus = (s: OrbStatus) => setPendingPick(s);

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
    const s = Math.floor((ms % 60000) / 1000);
    if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
    return `${m}m ${s.toString().padStart(2, "0")}s`;
  }, [override, now]);

  const R = 72;

  return (
    <div ref={rootRef} className="relative inline-flex flex-col items-center select-none" style={signalStyle}>
      {open && (
        <button
          aria-hidden tabIndex={-1}
          onClick={() => { setOpen(false); setPendingPick(null); }}
          className="fixed inset-0 z-30 bg-foreground/10 backdrop-blur-[1px] animate-fade-in cursor-default"
        />
      )}

      <div className="relative z-40 grid h-12 w-12 place-items-center">
        {/* Pulse rings — ONLY when manual override is active */}
        {pulseActive && (
          <>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 z-10 rounded-full border opacity-70 animate-[ping_2.4s_cubic-bezier(0,0,0.2,1)_infinite]"
              style={{ borderColor: `hsl(${meta.signal} / 0.7)` }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 z-10 rounded-full border opacity-50 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"
              style={{ borderColor: `hsl(${meta.signal} / 0.55)`, animationDelay: "0.9s" }}
            />
          </>
        )}

        {/* Static subtle ring — always visible, calm */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 rounded-full ring-1 transition-colors duration-500"
          style={{
            boxShadow: `inset 0 0 0 1.5px hsl(${meta.signal} / ${aiManaged ? 0.35 : 0.7})`,
          }}
        />

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Availability controls"
          aria-expanded={open}
          className={cn(
            "relative z-50 grid place-items-center w-10 h-10 rounded-full",
            "transition-transform duration-300 ease-out hover:scale-105 active:scale-95",
          )}
        >
          <Avatar initials={initials} accent={accent} size="md" hideDot />
          <span
            className={cn("absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-background", meta.dot)}
          />
        </button>

        {/* Radial menu — chips arc above the avatar */}
        {RADIAL.map(({ key, angle }, i) => {
          const rad = (angle - 90) * (Math.PI / 180);
          const x = Math.cos(rad) * R;
          const y = Math.sin(rad) * R;
          const m = META[key];
          const isActive = key === status && !aiManaged;
          return (
            <button
              key={key}
              type="button"
              onClick={(e) => { e.stopPropagation(); pickStatus(key); }}
              aria-label={m.label}
              style={{
                transform: open
                  ? `translate(${x}px, ${y}px) scale(1)`
                  : `translate(0px, 0px) scale(0.4)`,
                transitionDelay: `${open ? i * 30 : (RADIAL.length - i) * 18}ms`,
              }}
              className={cn(
                "absolute top-1/2 left-1/2 -mt-4 -ml-4 z-40",
                "grid place-items-center w-8 h-8 rounded-full",
                "backdrop-blur-xl bg-surface-lowest/95 ring-1 ring-border text-primary",
                "shadow-soft",
                "transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
                isActive && "ring-2",
                "hover:scale-110",
              )}
              title={m.label}
              data-active={isActive || undefined}
            >
              <span className={cn("absolute inset-0 rounded-full opacity-40", m.chipBg)} aria-hidden />
              <span className="relative">{m.icon}</span>
              {pendingPick === key && (
                <span
                  className="absolute -inset-1 rounded-full ring-2 animate-pulse"
                  style={{ boxShadow: `0 0 0 2px hsl(${m.signal} / 0.7)` }}
                  aria-hidden
                />
              )}
            </button>
          );
        })}

        {/* Return to Auto — appears in radial when manual override is active */}
        {open && !aiManaged && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); revertToAI(); }}
            aria-label="Resume Adaptive AI"
            style={{
              transform: `translate(0px, ${R + 4}px) scale(1)`,
              transitionDelay: "120ms",
            }}
            className={cn(
              "absolute top-1/2 left-1/2 -mt-3.5 -ml-12 z-40",
              "inline-flex items-center gap-1 h-7 px-2.5 rounded-full",
              "bg-indigo-500/15 ring-1 ring-indigo-400/30 text-indigo-700 text-[10px] font-semibold",
              "transition-all duration-400 hover:bg-indigo-500/25 backdrop-blur-xl",
            )}
          >
            <Wand2 className="w-3 h-3" /> Resume AI
          </button>
        )}

        {/* Duration picker (after a status is tapped) */}
        {pendingPick && (
          <div
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "absolute z-50 top-full mt-3 left-1/2 -translate-x-1/2",
              "w-[240px] rounded-2xl p-2.5",
              "bg-surface-lowest/95 backdrop-blur-xl ring-1 ring-border shadow-elevated",
              "animate-in fade-in-0 zoom-in-95 duration-200",
            )}
          >
            <div className="flex items-center justify-between px-1 pb-1.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Override duration
              </p>
              <button onClick={() => setPendingPick(null)} className="text-muted-foreground hover:text-primary" aria-label="Cancel">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1.5 px-1 pb-1.5">
              <span className={cn("w-1.5 h-1.5 rounded-full", META[pendingPick].dot)} />
              <span className="text-xs text-primary font-semibold">{META[pendingPick].label}</span>
            </div>
            <ul className="grid gap-0.5">
              {DURATIONS.map((d) => (
                <li key={d.key}>
                  <button
                    onClick={() => confirmDuration(d)}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-[12px] text-primary hover:bg-surface-low transition"
                  >
                    {d.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Caption under avatar */}
      <div className="relative z-40 mt-1.5 flex items-center gap-1.5">
        {aiManaged ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 ring-1 ring-indigo-400/25 text-[9.5px] font-semibold tracking-wide text-indigo-700">
            <Sparkles className="w-2.5 h-2.5" />
            AI Managing
          </span>
        ) : (
          <button
            onClick={revertToAI}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-semibold tracking-wide ring-1 ring-border",
              meta.chipBg, meta.chipText, "hover:ring-foreground/30 transition",
            )}
            title="Tap to resume Adaptive AI"
          >
            <span className={cn("w-1.5 h-1.5 rounded-full", meta.dot)} />
            Manual
            {remaining && <span className="opacity-80 tabular-nums">· {remaining}</span>}
          </button>
        )}
      </div>
    </div>
  );
}
