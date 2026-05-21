import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, ShieldCheck, Briefcase, Car, Brain, MoonStar, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Avatar from "@/components/app/Avatar";

export type OrbStatus = "available" | "busy" | "focus" | "driving" | "offline";

type Meta = {
  label: string;
  ring: string;        // ring color class for avatar outline
  glow: string;        // soft glow color (rgba via tailwind arbitrary)
  chipBg: string;
  chipText: string;
  dot: string;
  icon: React.ReactNode;
};

const META: Record<OrbStatus, Meta> = {
  available: { label: "Available", ring: "ring-emerald-400/80", glow: "shadow-[0_0_28px_-4px_hsl(152_72%_45%/0.55)]", chipBg: "bg-emerald-500/15", chipText: "text-emerald-200", dot: "bg-emerald-400", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  busy:      { label: "Busy",      ring: "ring-amber-400/80",   glow: "shadow-[0_0_28px_-4px_hsl(38_92%_55%/0.55)]",  chipBg: "bg-amber-500/15",   chipText: "text-amber-200",   dot: "bg-amber-400",   icon: <Briefcase className="w-3.5 h-3.5" /> },
  driving:   { label: "Driving",   ring: "ring-violet-400/80",  glow: "shadow-[0_0_28px_-4px_hsl(265_85%_65%/0.55)]", chipBg: "bg-violet-500/15",  chipText: "text-violet-200",  dot: "bg-violet-400",  icon: <Car className="w-3.5 h-3.5" /> },
  focus:     { label: "Focus",     ring: "ring-sky-400/80",     glow: "shadow-[0_0_28px_-4px_hsl(205_92%_55%/0.55)]", chipBg: "bg-sky-500/15",     chipText: "text-sky-200",     dot: "bg-sky-400",     icon: <Brain className="w-3.5 h-3.5" /> },
  offline:   { label: "Offline",   ring: "ring-slate-400/60",   glow: "shadow-[0_0_22px_-6px_hsl(215_15%_55%/0.45)]", chipBg: "bg-slate-500/15",   chipText: "text-slate-200",   dot: "bg-slate-400",   icon: <MoonStar className="w-3.5 h-3.5" /> },
};

// Radial positions (degrees from 12 o'clock, clockwise).
const RADIAL: { key: OrbStatus; angle: number }[] = [
  { key: "available", angle: 0 },
  { key: "busy",      angle: 45 },
  { key: "driving",   angle: 90 },
  { key: "focus",     angle: 135 },
  { key: "offline",   angle: 180 },
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

  // Tick clock for countdown
  useEffect(() => {
    if (!override) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [override]);

  // Auto-revert when override expires
  useEffect(() => {
    if (override?.until && now >= override.until) {
      setOverride(null);
      setAiManaged(true);
      onChange("available");
    }
  }, [now, override, onChange]);

  // Close radial on outside click / escape
  useEffect(() => {
    if (!open && !pendingPick) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setPendingPick(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); setPendingPick(null); }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, pendingPick]);

  const pickStatus = (s: OrbStatus) => {
    setPendingPick(s);
  };

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

  // radius in px for radial menu items
  const R = 92;

  return (
    <div ref={rootRef} className="relative inline-flex flex-col items-center select-none">
      {/* Backdrop blur when expanded */}
      {open && (
        <button
          aria-hidden
          tabIndex={-1}
          onClick={() => { setOpen(false); setPendingPick(null); }}
          className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-[2px] animate-fade-in cursor-default"
        />
      )}

      {/* Orb stack */}
      <div className="relative z-40">
        {/* Animated outer pulse ring */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 m-auto rounded-full",
            "w-16 h-16 ring-2 ring-offset-2 ring-offset-transparent",
            meta.ring,
            "animate-[ping_2.4s_cubic-bezier(0,0,0.2,1)_infinite] opacity-40",
          )}
        />
        {/* Static refined ring + glow */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 m-auto rounded-full w-16 h-16 ring-2",
            meta.ring, meta.glow, "transition-all duration-500",
          )}
        />

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Adaptive access controls"
          aria-expanded={open}
          className={cn(
            "relative grid place-items-center w-16 h-16 rounded-full",
            "transition-transform duration-300 ease-out hover:scale-[1.06] active:scale-95",
          )}
        >
          <Avatar initials={initials} accent={accent} size="lg" hideDot />
          {/* live status dot */}
          <span className={cn(
            "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ring-2 ring-background",
            meta.dot,
            "after:absolute after:inset-0 after:rounded-full after:animate-ping after:opacity-60",
            meta.dot.replace("bg-", "after:bg-"),
          )} />
        </button>

        {/* Radial menu — chips */}
        {RADIAL.map(({ key, angle }, i) => {
          const rad = (angle - 90) * (Math.PI / 180); // 0deg = top
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
                transitionDelay: `${open ? i * 35 : (RADIAL.length - i) * 20}ms`,
              }}
              className={cn(
                "absolute top-1/2 left-1/2 -mt-5 -ml-5 z-40",
                "grid place-items-center w-10 h-10 rounded-full",
                "backdrop-blur-xl bg-slate-900/60 ring-1 ring-white/15 text-white",
                "shadow-[0_8px_30px_-6px_rgba(0,0,0,0.45)]",
                "transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
                isActive && cn("ring-2", m.ring, m.glow),
                "hover:scale-110",
              )}
              title={m.label}
            >
              <span className={cn("absolute inset-0 rounded-full opacity-40", m.chipBg)} aria-hidden />
              <span className="relative">{m.icon}</span>
              {pendingPick === key && (
                <span className={cn("absolute -inset-1 rounded-full ring-2 animate-pulse", m.ring)} aria-hidden />
              )}
            </button>
          );
        })}

        {/* Duration picker (after a status is tapped) */}
        {pendingPick && (
          <div
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "absolute z-50 top-full mt-4 left-1/2 -translate-x-1/2",
              "w-[260px] rounded-2xl p-3",
              "bg-slate-950/85 backdrop-blur-xl ring-1 ring-white/10 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.6)]",
              "animate-in fade-in-0 zoom-in-95 duration-200",
            )}
          >
            <div className="flex items-center justify-between px-1 pb-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300/80">
                Override duration
              </p>
              <button onClick={() => setPendingPick(null)} className="text-slate-400 hover:text-white" aria-label="Cancel">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1.5 px-1 pb-2">
              <span className={cn("w-1.5 h-1.5 rounded-full", META[pendingPick].dot)} />
              <span className="text-xs text-white font-semibold">{META[pendingPick].label}</span>
            </div>
            <ul className="grid gap-1">
              {DURATIONS.map((d) => (
                <li key={d.key}>
                  <button
                    onClick={() => confirmDuration(d)}
                    className="w-full text-left px-3 py-2 rounded-lg text-[12.5px] text-slate-100 hover:bg-white/10 transition"
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
      <div className="relative z-40 mt-2 flex items-center gap-1.5">
        {aiManaged ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/15 ring-1 ring-indigo-400/30 text-[10px] font-semibold tracking-wide text-indigo-200">
            <Sparkles className="w-3 h-3" />
            AI Managing Availability
          </span>
        ) : (
          <button
            onClick={revertToAI}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide ring-1",
              meta.chipBg, meta.chipText, "ring-white/15 hover:ring-white/30 transition",
            )}
            title="Tap to return to AI-managed"
          >
            <span className={cn("w-1.5 h-1.5 rounded-full", meta.dot)} />
            Manual Override
            {remaining && <span className="opacity-80 tabular-nums">· {remaining}</span>}
          </button>
        )}
      </div>
    </div>
  );
}
