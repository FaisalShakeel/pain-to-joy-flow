import { useEffect, useState } from "react";

export const PINNED_KEY = "availock.pinnedContacts";
export const MAX_PINS = 6;

const read = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PINNED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};

const EVT = "availock:pins-changed";

export const usePins = () => {
  const [pins, setPins] = useState<string[]>(read);

  useEffect(() => {
    const sync = () => setPins(read());
    window.addEventListener("storage", sync);
    window.addEventListener(EVT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EVT, sync);
    };
  }, []);

  const persist = (next: string[]) => {
    try {
      localStorage.setItem(PINNED_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setPins(next);
    window.dispatchEvent(new Event(EVT));
  };

  const isPinned = (id: string) => pins.includes(id);
  const canPin = pins.length < MAX_PINS;

  const togglePin = (id: string): "pinned" | "unpinned" | "limit" => {
    if (pins.includes(id)) {
      persist(pins.filter((x) => x !== id));
      return "unpinned";
    }
    if (pins.length >= MAX_PINS) return "limit";
    persist([id, ...pins].slice(0, MAX_PINS));
    return "pinned";
  };

  return { pins, isPinned, canPin, togglePin, max: MAX_PINS };
};