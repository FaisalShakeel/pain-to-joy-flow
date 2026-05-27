import { useEffect, useState } from "react";

export const WATCH_KEY = "availock.callWatchList";
const EVT = "availock:callwatch-changed";

export type WatchedContact = {
  id: string;
  name: string;
  initials: string;
  accent?: string;
  title?: string;
  company?: string;
  status?: string;
  addedAt: number;
};

const read = (): WatchedContact[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WATCH_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Back-compat: previously stored as string[]
    if (Array.isArray(parsed) && parsed.length && typeof parsed[0] === "string") {
      return (parsed as string[]).map((id) => ({
        id,
        name: id,
        initials: id.slice(0, 2).toUpperCase(),
        addedAt: Date.now(),
      }));
    }
    return parsed as WatchedContact[];
  } catch {
    return [];
  }
};

export const useCallWatch = () => {
  const [items, setItems] = useState<WatchedContact[]>(read);

  useEffect(() => {
    const sync = () => setItems(read());
    window.addEventListener("storage", sync);
    window.addEventListener(EVT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EVT, sync);
    };
  }, []);

  const persist = (next: WatchedContact[]) => {
    try {
      localStorage.setItem(WATCH_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setItems(next);
    window.dispatchEvent(new Event(EVT));
  };

  const ids = items.map((i) => i.id);
  const isWatching = (id: string) => ids.includes(id);

  const toggleWatch = (
    contact: string | Omit<WatchedContact, "addedAt">,
  ): "added" | "removed" => {
    const id = typeof contact === "string" ? contact : contact.id;
    if (ids.includes(id)) {
      persist(items.filter((x) => x.id !== id));
      return "removed";
    }
    const record: WatchedContact =
      typeof contact === "string"
        ? { id, name: id, initials: id.slice(0, 2).toUpperCase(), addedAt: Date.now() }
        : { ...contact, addedAt: Date.now() };
    persist([record, ...items]);
    return "added";
  };

  const disableWatch = (id: string) => {
    if (ids.includes(id)) persist(items.filter((x) => x.id !== id));
  };

  return { items, ids, isWatching, toggleWatch, disableWatch };
};