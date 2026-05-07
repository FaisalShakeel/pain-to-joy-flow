import { useSyncExternalStore } from "react";
import type { Pricing } from "@/components/app/PricingField";
import { defaultPricing } from "@/components/app/PricingField";

export type SlotMode = "online" | "onsite" | "hybrid" | "quicksync" | "webinar";
export type SlotChannel = "voice" | "video" | "message" | "inperson" | "appcall" | "link";
export type SlotAccess = "public" | "contacts" | "approved" | "priority" | "paid" | "hidden";
export type SlotBooking = "instant" | "approval";
export type SlotBuffer = 0 | 5 | 10 | 15;
export type SlotDuration = 5 | 10 | 15 | 30 | 60;

export type SlotModule = "meeting" | "webinar" | "quicksync";
export type SlotFormat = "online" | "onsite" | "hybrid";
export type SlotAccessRule = "public" | "private" | "invite";

export interface StoredSlot {
  id: string;
  title: string;
  day: string;
  date?: string;
  start: number;
  end: number;
  mode: SlotMode;
  duration: SlotDuration;
  buffer: SlotBuffer;
  bookingMode: SlotBooking;
  access: SlotAccess;
  recurring: boolean;
  priority?: boolean;
  online?: { channel: SlotChannel; capacity: number; booking: SlotBooking; link?: string };
  onsite?: { location: string; capacity: number; booking: SlotBooking; queue?: boolean };
  quickSync?: { callMin: 3 | 5 | 8 | 10; bufferMin: 1 | 2 | 5 };
  webinar?: { format: "online" | "onsite" | "both"; venue?: string; capacity: number };
  autoCloseAlternate?: boolean;
  pricing?: Pricing;
  // New scheduling-engine fields
  module?: SlotModule;
  format?: SlotFormat;
  venue?: string;
  seats?: number;
  joinEarly?: number;       // minutes client can join early
  providerDelay?: number;   // minutes provider grace
  accessRule?: SlotAccessRule;
  qsCallMin?: 3 | 5 | 8;
}

const seed: StoredSlot[] = [
  {
    id: "s1", title: "Hybrid Consult", day: "Mon", start: 15, end: 16,
    mode: "hybrid", duration: 30, buffer: 5, bookingMode: "approval", access: "contacts",
    recurring: true, autoCloseAlternate: true, pricing: defaultPricing,
    online: { channel: "video", capacity: 1, booking: "approval", link: "meet/availock/jv" },
    onsite: { location: "Studio · DIFC Lvl 12", capacity: 1, booking: "approval", queue: false },
  },
  {
    id: "s2", title: "Quick Sync Hour", day: "Tue", start: 10, end: 11,
    mode: "quicksync", duration: 5, buffer: 5, bookingMode: "instant", access: "public",
    recurring: true, quickSync: { callMin: 5, bufferMin: 2 }, pricing: defaultPricing,
  },
  {
    id: "s3", title: "VIP Fast Lane", day: "Wed", start: 14, end: 15,
    mode: "online", duration: 15, buffer: 10, bookingMode: "approval", access: "priority",
    recurring: false, priority: true, pricing: defaultPricing,
    online: { channel: "voice", capacity: 1, booking: "approval" },
  },
  {
    id: "s4", title: "Office Hours", day: "Thu", start: 11, end: 12,
    mode: "onsite", duration: 30, buffer: 5, bookingMode: "instant", access: "approved",
    recurring: true, pricing: defaultPricing,
    onsite: { location: "Atlas HQ Reception", capacity: 4, booking: "instant", queue: true },
  },
];

let state: StoredSlot[] = [...seed];
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => state;

export const slotsStore = {
  get: () => state,
  set: (next: StoredSlot[] | ((p: StoredSlot[]) => StoredSlot[])) => {
    state = typeof next === "function" ? (next as any)(state) : next;
    emit();
  },
};

export const useSlots = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

// Helpers
export const slotModule = (s: StoredSlot): SlotModule =>
  s.module ?? (s.mode === "quicksync" ? "quicksync" : s.mode === "webinar" ? "webinar" : "meeting");

export const slotFormat = (s: StoredSlot): SlotFormat | null => {
  if (s.format) return s.format;
  if (s.mode === "online") return "online";
  if (s.mode === "onsite") return "onsite";
  if (s.mode === "hybrid") return "hybrid";
  if (s.mode === "webinar" && s.webinar) {
    return s.webinar.format === "both" ? "hybrid" : s.webinar.format;
  }
  return null;
};

export const slotVenue = (s: StoredSlot): string | undefined =>
  s.venue ?? s.onsite?.location ?? s.webinar?.venue;

export const slotSeats = (s: StoredSlot): number =>
  s.seats ?? s.webinar?.capacity ?? s.onsite?.capacity ?? s.online?.capacity ?? 1;

/** Real scheduling generator. Returns generated time slots inside window. */
export const generateSlotTimes = (
  startHour: number, endHour: number, duration: number, buffer: number,
): { start: string; end: string }[] => {
  const winStart = startHour * 60;
  const winEnd = endHour * 60;
  const step = Math.max(1, duration + buffer);
  const out: { start: string; end: string }[] = [];
  // Intelligent fit: ((window + buffer) / step) — last slot needs no trailing buffer.
  for (let t = winStart; t + duration <= winEnd; t += step) {
    const h = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
    out.push({ start: h(t), end: h(t + duration) });
  }
  return out;
};

export const slotCapacity = (s: StoredSlot): number => {
  const totalMin = (s.end - s.start) * 60;
  if (s.mode === "quicksync" && s.quickSync) {
    return Math.max(0, Math.floor(totalMin / Math.max(1, s.quickSync.callMin)));
  }
  return Math.max(1, Math.floor(totalMin / (s.duration + (s.buffer || 0))));
};