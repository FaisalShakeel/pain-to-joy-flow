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
  /** Length of each generated sub-slot, in minutes. */
  callMin?: number;
  /** Sub-slot start-minutes that are currently booked. */
  bookedSubSlots?: number[];
  /** Sub-slot start-minutes that the owner has deleted/disabled. */
  disabledSubSlots?: number[];
  /** Per-sub-slot custom overrides keyed by original start-min. */
  editedSubSlots?: Record<number, { start: number; end: number }>;
}

let state: AvailabilityBlock[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

// --- Conflict highlight (shake/flash on the offending block) ---
let highlightId: string | null = null;
const highlightListeners = new Set<() => void>();
const emitHighlight = () => highlightListeners.forEach((l) => l());
let highlightTimer: ReturnType<typeof setTimeout> | null = null;

export const flashConflict = (id: string, ms = 2400) => {
  highlightId = id;
  emitHighlight();
  if (highlightTimer) clearTimeout(highlightTimer);
  highlightTimer = setTimeout(() => {
    highlightId = null;
    emitHighlight();
  }, ms);
};

export const useConflictHighlight = () =>
  useSyncExternalStore(
    (l) => { highlightListeners.add(l); return () => highlightListeners.delete(l); },
    () => highlightId,
    () => highlightId,
  );

export const availabilityStore = {
  get: () => state,
  /** Replace this source's blocks with the provided ones (used to sync builder local state). */
  syncSource: (source: AvailabilitySource, blocks: AvailabilityBlock[]) => {
    const others = state.filter((b) => b.source !== source);
    // Preserve previously-tracked sub-slot booking state across syncs.
    const prevById = new Map(state.map((b) => [b.id, b] as const));
    const merged = blocks.map((b) => {
      const prev = prevById.get(b.id);
      if (!prev) return b;
      return {
        ...b,
        bookedSubSlots: b.bookedSubSlots ?? prev.bookedSubSlots,
        disabledSubSlots: b.disabledSubSlots ?? prev.disabledSubSlots,
        editedSubSlots: b.editedSubSlots ?? prev.editedSubSlots,
      };
    });
    const next = [...others, ...merged];
    // Avoid emitting if nothing changed (shallow id+window check).
    if (next.length === state.length) {
      const sig = (b: AvailabilityBlock) =>
        `${b.id}|${b.date}|${b.startMin}|${b.endMin}|${b.bufferMin}|${b.mode}|${b.callMin ?? ""}|${(b.bookedSubSlots ?? []).join(",")}`;
      const prevSig = state.map(sig).sort().join(";");
      const nextSig = next.map(sig).sort().join(";");
      if (prevSig === nextSig) return;
    }
    state = next;
    emit();
  },
  /** Toggle booked state for a single sub-slot (identified by start-minute). */
  toggleSubSlot: (blockId: string, startMin: number) => {
    state = state.map((b) => {
      if (b.id !== blockId) return b;
      const cur = new Set(b.bookedSubSlots ?? []);
      cur.has(startMin) ? cur.delete(startMin) : cur.add(startMin);
      return { ...b, bookedSubSlots: Array.from(cur).sort((a, z) => a - z) };
    });
    emit();
  },
  /** Owner-side: remove a generated sub-slot from availability. */
  disableSubSlot: (blockId: string, startMin: number) => {
    state = state.map((b) => {
      if (b.id !== blockId) return b;
      const cur = new Set(b.disabledSubSlots ?? []);
      cur.add(startMin);
      return { ...b, disabledSubSlots: Array.from(cur).sort((a, z) => a - z) };
    });
    emit();
  },
  /** Owner-side: shift one sub-slot's start/end (deltaMin can be ±). */
  editSubSlot: (blockId: string, originalStart: number, deltaMin: number) => {
    state = state.map((b) => {
      if (b.id !== blockId) return b;
      const callMin = b.callMin ?? 0;
      if (!callMin) return b;
      const newStart = originalStart + deltaMin;
      if (newStart < b.startMin || newStart + callMin > b.endMin) return b;
      const edits = { ...(b.editedSubSlots ?? {}) };
      edits[originalStart] = { start: newStart, end: newStart + callMin };
      return { ...b, editedSubSlots: edits };
    });
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