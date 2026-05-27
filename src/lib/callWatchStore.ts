import { useEffect, useState } from "react";

export const WATCH_KEY = "availock.callWatchList";
const EVT = "availock:callwatch-changed";

const read = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WATCH_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};

export const useCallWatch = () => {
  const [ids, setIds] = useState<string[]>(read);

  useEffect(() => {
    const sync = () => setIds(read());
    window.addEventListener("storage", sync);
    window.addEventListener(EVT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EVT, sync);
    };
  }, []);

  const persist = (next: string[]) => {
    try {
      localStorage.setItem(WATCH_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setIds(next);
    window.dispatchEvent(new Event(EVT));
  };

  const isWatching = (id: string) => ids.includes(id);

  const toggleWatch = (id: string): "added" | "removed" => {
    if (ids.includes(id)) {
      persist(ids.filter((x) => x !== id));
      return "removed";
    }
    persist([id, ...ids]);
    return "added";
  };

  // Called when an alert fires — auto-disable the watch.
  const disableWatch = (id: string) => {
    if (ids.includes(id)) persist(ids.filter((x) => x !== id));
  };

  return { ids, isWatching, toggleWatch, disableWatch };
};