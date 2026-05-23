import { useSyncExternalStore } from "react";

export type AvailabilitySource = "focus" | "quicksync" | "event-access";
export type AvailabilityMode = "hybrid" | "online" | "onsite" | "quicksync";

export interface AvailabilityBlock {
  id: string;
  source: AvailabilitySource;
  /** ISO yyyy-mm-dd */
  date: string;
  startMin: number;
  endMin: number;
  bufferMin: number;
  mode: AvailabilityMode;
  typeLabel: string;
}

let state: AvailabilityBlock[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const availabilityStore = {
  get: () => state,
  /** Replace this source's blocks with the provided ones (used to sync builder local state). */
  syncSource: (source: AvailabilitySource, blocks: AvailabilityBlock[]) => {
    const others = state.filter((b) => b.source !== source);
    const next = [...others, ...blocks];
    // Avoid emitting if nothing changed (shallow id+window check).
    if (next.length === state.length) {
      const sig = (b: AvailabilityBlock) => `${b.id}|${b.date}|${b.startMin}|${b.endMin}|${b.bufferMin}|${b.mode}`;
      const prevSig = state.map(sig).sort().join(";");
      const nextSig = next.map(sig).sort().join(";");
      if (prevSig === nextSig) return;
    }
    state = next;
    emit();
  },
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => state;

export const useAvailability = () =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

const overlaps = (aS: number, aE: number, bS: number, bE: number) => aS < bE && bS < aE;

/** Find first conflicting block on the same date (buffer-aware). */
export const findConflict = (
  date: string,
  startMin: number,
  endMin: number,
  excludeId?: string,
): AvailabilityBlock | null => {
  for (const b of state) {
    if (b.id === excludeId) continue;
    if (b.date !== date) continue;
    const bs = b.startMin - b.bufferMin;
    const be = b.endMin + b.bufferMin;
    if (overlaps(startMin, endMin, bs, be)) return b;
  }
  return null;
};

/** Suggest up to 3 nearest open windows on the given date that fit `durationMin`. */
export const suggestOpenings = (
  date: string,
  durationMin: number,
  excludeId?: string,
): { startMin: number; endMin: number }[] => {
  const day = state
    .filter((b) => b.date === date && b.id !== excludeId)
    .map((b) => ({ s: b.startMin - b.bufferMin, e: b.endMin + b.bufferMin }))
    .sort((a, b) => a.s - b.s);

  const openings: { startMin: number; endMin: number }[] = [];
  let cursor = 8 * 60; // 08:00
  const dayEnd = 22 * 60; // 22:00

  for (const b of day) {
    if (b.s - cursor >= durationMin) {
      openings.push({ startMin: cursor, endMin: cursor + durationMin });
    }
    cursor = Math.max(cursor, b.e);
  }
  if (dayEnd - cursor >= durationMin) {
    openings.push({ startMin: cursor, endMin: cursor + durationMin });
  }
  return openings.slice(0, 3);
};

export const fmtTimeHM = (m: number) => {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const period = h >= 12 ? "PM" : "AM";
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${mm.toString().padStart(2, "0")} ${period}`;
};