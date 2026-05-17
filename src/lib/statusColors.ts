// Single source of truth for AVAILOCK availability status colors.
// Applied consistently across: profile pages, dashboard, pinned contacts,
// vault directory, search results, mini cards, contact previews, notifications.
//
// Design rule: thin refined outlines + tiny dot. No neon, no glow, no gaming aesthetic.

export type StatusKey =
  | "available"
  | "busy"
  | "focus"
  | "unavailable"
  | "offline"
  | "driving";

export interface StatusTokens {
  label: string;
  /** thin outline ring color class (use with `ring-1` / `ring-2`) */
  ring: string;
  /** offset color so the ring reads cleanly on surface */
  ringOffset: string;
  /** solid dot fill */
  dot: string;
  /** soft tint background for chips */
  chipBg: string;
  /** chip text color */
  chipText: string;
  /** chip border */
  chipBorder: string;
}

export const statusTokens: Record<StatusKey, StatusTokens> = {
  available: {
    label: "Available",
    ring: "ring-emerald-500/70",
    ringOffset: "ring-offset-background",
    dot: "bg-emerald-500",
    chipBg: "bg-emerald-500/10",
    chipText: "text-emerald-700",
    chipBorder: "border-emerald-500/30",
  },
  busy: {
    label: "Busy",
    ring: "ring-amber-500/70",
    ringOffset: "ring-offset-background",
    dot: "bg-amber-500",
    chipBg: "bg-amber-500/10",
    chipText: "text-amber-700",
    chipBorder: "border-amber-500/30",
  },
  focus: {
    label: "In Focus",
    ring: "ring-sky-500/70",
    ringOffset: "ring-offset-background",
    dot: "bg-sky-500",
    chipBg: "bg-sky-500/10",
    chipText: "text-sky-700",
    chipBorder: "border-sky-500/30",
  },
  unavailable: {
    label: "Unavailable",
    ring: "ring-rose-500/70",
    ringOffset: "ring-offset-background",
    dot: "bg-rose-500",
    chipBg: "bg-rose-500/10",
    chipText: "text-rose-700",
    chipBorder: "border-rose-500/30",
  },
  offline: {
    label: "Offline",
    ring: "ring-slate-400/60",
    ringOffset: "ring-offset-background",
    dot: "bg-slate-400",
    chipBg: "bg-slate-500/10",
    chipText: "text-slate-600",
    chipBorder: "border-slate-400/30",
  },
  driving: {
    label: "Driving",
    ring: "ring-violet-500/70",
    ringOffset: "ring-offset-background",
    dot: "bg-violet-500",
    chipBg: "bg-violet-500/10",
    chipText: "text-violet-700",
    chipBorder: "border-violet-500/30",
  },
};

/** Normalize legacy / mock status values to the canonical color system. */
export const normalizeStatus = (s: string | undefined): StatusKey => {
  switch (s) {
    case "available":
    case "busy":
    case "focus":
    case "offline":
    case "driving":
    case "unavailable":
      return s;
    default:
      return "offline";
  }
};

export const statusFor = (s: string | undefined) => statusTokens[normalizeStatus(s)];