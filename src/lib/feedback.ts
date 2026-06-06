/**
 * Availock Feedback Identity
 *
 * Layered confirmation for every meaningful action — sound + haptic.
 * Vocabulary: Signals → Protection → Permission → Availability.
 * Sounds are synthesized via WebAudio so we ship nothing extra and stay
 * perfectly on-brand (radar, pulse, shield, unlock, confirmation).
 */

import { useEffect, useState } from "react";

export type FeedbackEvent =
  | "status.available"
  | "status.busy"
  | "status.focus"
  | "status.offline"
  | "access.unlock"
  | "access.lock"
  | "request.sent"
  | "request.approved"
  | "request.denied"
  | "ping"
  | "callwatch.on"
  | "callwatch.off"
  | "booking.confirmed"
  | "toast.generic";

export const FEEDBACK_EVENTS: { id: FeedbackEvent; label: string; description: string }[] = [
  { id: "status.available", label: "Status: Available", description: "Soft radar ping" },
  { id: "status.focus", label: "Status: Focus", description: "Shield close" },
  { id: "status.busy", label: "Status: Busy", description: "Muted thud" },
  { id: "status.offline", label: "Status: Offline", description: "Low fade" },
  { id: "access.unlock", label: "Access unlocked", description: "Two-tone chime" },
  { id: "access.lock", label: "Access locked", description: "Shield close" },
  { id: "request.sent", label: "Request sent", description: "Outgoing sweep" },
  { id: "request.approved", label: "Request approved", description: "Confirmation tone" },
  { id: "request.denied", label: "Request denied", description: "Soft decline" },
  { id: "ping", label: "Ping", description: "Single radar blip" },
  { id: "callwatch.on", label: "Call Watch on", description: "Radar arm" },
  { id: "callwatch.off", label: "Call Watch off", description: "Radar disarm" },
  { id: "booking.confirmed", label: "Booking confirmed", description: "Confirmation chord" },
];

const PREFS_KEY = "availock.feedback.prefs";
const PREFS_EVT = "availock:feedback-prefs-changed";

export interface FeedbackPrefs {
  sfxEnabled: boolean;
  hapticsEnabled: boolean;
}

const defaultPrefs: FeedbackPrefs = { sfxEnabled: true, hapticsEnabled: true };

const readPrefs = (): FeedbackPrefs => {
  if (typeof window === "undefined") return defaultPrefs;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return defaultPrefs;
    return { ...defaultPrefs, ...(JSON.parse(raw) as Partial<FeedbackPrefs>) };
  } catch {
    return defaultPrefs;
  }
};

const writePrefs = (next: FeedbackPrefs) => {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  window.dispatchEvent(new Event(PREFS_EVT));
};

export const useFeedbackPrefs = () => {
  const [prefs, setPrefs] = useState<FeedbackPrefs>(readPrefs);
  useEffect(() => {
    const sync = () => setPrefs(readPrefs());
    window.addEventListener(PREFS_EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PREFS_EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const update = (patch: Partial<FeedbackPrefs>) => {
    const next = { ...readPrefs(), ...patch };
    writePrefs(next);
    setPrefs(next);
  };
  return { prefs, update };
};

/* ---------- WebAudio synth ---------- */

let ctx: AudioContext | null = null;
let unlocked = false;

const getCtx = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  try {
    const Ctor = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    return ctx;
  } catch { return null; }
};

/** Call on first user gesture to unlock audio on mobile/Safari. */
export const unlockAudio = () => {
  if (unlocked) return;
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume().catch(() => { /* ignore */ });
  unlocked = true;
};

type Tone = {
  freq: number;        // Hz
  type?: OscillatorType;
  duration: number;    // seconds
  delay?: number;      // seconds
  glide?: number;      // Hz, frequency target (linear ramp)
  gain?: number;       // 0-1
  filterFreq?: number; // optional lowpass
};

const playTone = (c: AudioContext, t: Tone, masterGain: number) => {
  const start = c.currentTime + (t.delay ?? 0);
  const osc = c.createOscillator();
  osc.type = t.type ?? "sine";
  osc.frequency.setValueAtTime(t.freq, start);
  if (t.glide) osc.frequency.linearRampToValueAtTime(t.glide, start + t.duration);

  const gain = c.createGain();
  const peak = (t.gain ?? 0.6) * masterGain;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + Math.min(0.02, t.duration / 3));
  gain.gain.exponentialRampToValueAtTime(0.0001, start + t.duration);

  let node: AudioNode = osc;
  if (t.filterFreq) {
    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = t.filterFreq;
    osc.connect(filter);
    node = filter;
  }
  node.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + t.duration + 0.05);
};

/**
 * Radar "sweep" — fast frequency glide. Used for ping / request.sent / callwatch.
 */
const radarSweep = (c: AudioContext, fromHz: number, toHz: number, dur: number, gain: number) =>
  playTone(c, { freq: fromHz, glide: toHz, duration: dur, type: "sine", gain, filterFreq: 2400 }, 1);

const MASTER = 0.32; // keep SFX under the UI

const SOUND_MAP: Record<FeedbackEvent, (c: AudioContext) => void> = {
  "status.available": (c) => {
    radarSweep(c, 520, 880, 0.18, 0.45);
    playTone(c, { freq: 1320, duration: 0.22, delay: 0.12, type: "sine", gain: 0.18, filterFreq: 3200 }, MASTER);
  },
  "status.busy":  (c) => playTone(c, { freq: 220, duration: 0.18, type: "triangle", gain: 0.32, filterFreq: 900 }, MASTER),
  "status.focus": (c) => playTone(c, { freq: 180, duration: 0.26, type: "sine",     gain: 0.32, filterFreq: 700 }, MASTER),
  "status.offline": (c) => playTone(c, { freq: 160, glide: 110, duration: 0.30, type: "sine", gain: 0.30, filterFreq: 600 }, MASTER),

  "access.unlock": (c) => {
    playTone(c, { freq: 660, duration: 0.10, type: "sine", gain: 0.40, filterFreq: 2400 }, MASTER);
    playTone(c, { freq: 990, duration: 0.18, delay: 0.07, type: "sine", gain: 0.45, filterFreq: 2800 }, MASTER);
  },
  "access.lock": (c) => {
    playTone(c, { freq: 330, duration: 0.10, type: "sine", gain: 0.35, filterFreq: 1200 }, MASTER);
    playTone(c, { freq: 220, duration: 0.18, delay: 0.07, type: "sine", gain: 0.40, filterFreq: 900 }, MASTER);
  },

  "request.sent":     (c) => radarSweep(c, 600, 1200, 0.20, 0.40),
  "request.approved": (c) => {
    playTone(c, { freq: 660, duration: 0.10, type: "sine", gain: 0.40, filterFreq: 2600 }, MASTER);
    playTone(c, { freq: 880, duration: 0.10, delay: 0.08, type: "sine", gain: 0.40, filterFreq: 2800 }, MASTER);
    playTone(c, { freq: 1320, duration: 0.18, delay: 0.16, type: "sine", gain: 0.45, filterFreq: 3200 }, MASTER);
  },
  "request.denied": (c) => {
    playTone(c, { freq: 280, duration: 0.10, type: "sine", gain: 0.35, filterFreq: 1000 }, MASTER);
    playTone(c, { freq: 200, duration: 0.16, delay: 0.08, type: "sine", gain: 0.35, filterFreq: 800 }, MASTER);
  },

  "ping": (c) => radarSweep(c, 1100, 1500, 0.12, 0.35),
  "callwatch.on":  (c) => radarSweep(c, 560, 980, 0.18, 0.40),
  "callwatch.off": (c) => radarSweep(c, 980, 540, 0.18, 0.32),

  "booking.confirmed": (c) => {
    playTone(c, { freq: 587, duration: 0.10, type: "sine", gain: 0.40, filterFreq: 2400 }, MASTER); // D5
    playTone(c, { freq: 880, duration: 0.10, delay: 0.08, type: "sine", gain: 0.40, filterFreq: 2800 }, MASTER); // A5
    playTone(c, { freq: 1175, duration: 0.22, delay: 0.16, type: "sine", gain: 0.45, filterFreq: 3200 }, MASTER); // D6
  },

  "toast.generic": (c) => playTone(c, { freq: 1500, duration: 0.06, type: "sine", gain: 0.18, filterFreq: 3200 }, MASTER),
};

const HAPTIC_MAP: Partial<Record<FeedbackEvent, number | number[]>> = {
  "status.available": 15,
  "access.unlock": [10, 30, 10],
  "access.lock": 20,
  "request.approved": [10, 40, 10],
  "ping": 8,
  "callwatch.on": 12,
  "callwatch.off": 8,
  "booking.confirmed": [10, 30, 10],
};

/**
 * Fire a feedback event. Reads user prefs each call so toggles take effect immediately.
 */
export const feedback = (event: FeedbackEvent) => {
  if (typeof window === "undefined") return;
  const prefs = readPrefs();
  if (prefs.sfxEnabled) {
    const c = getCtx();
    if (c) {
      if (c.state === "suspended") c.resume().catch(() => { /* ignore */ });
      try { SOUND_MAP[event]?.(c); } catch { /* ignore */ }
    }
  }
  if (prefs.hapticsEnabled) {
    const pattern = HAPTIC_MAP[event];
    if (pattern && typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate(pattern); } catch { /* ignore */ }
    }
  }
};