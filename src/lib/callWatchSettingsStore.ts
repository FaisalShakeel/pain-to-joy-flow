import { useEffect, useState } from "react";

export type CallWatchScope = "everyone" | "contacts" | "priority" | "nobody";

export interface CallWatchSettings {
  enabled: boolean;
  scope: CallWatchScope;
}

const KEY = "availock.callWatchSettings";
const EVT = "availock:callwatch-settings-changed";

export const DEFAULT_CALL_WATCH_SETTINGS: CallWatchSettings = {
  enabled: true,
  scope: "contacts",
};

const read = (): CallWatchSettings => {
  if (typeof window === "undefined") return DEFAULT_CALL_WATCH_SETTINGS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_CALL_WATCH_SETTINGS;
    return { ...DEFAULT_CALL_WATCH_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CALL_WATCH_SETTINGS;
  }
};

export const useCallWatchSettings = () => {
  const [settings, setState] = useState<CallWatchSettings>(read);

  useEffect(() => {
    const sync = () => setState(read());
    window.addEventListener("storage", sync);
    window.addEventListener(EVT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EVT, sync);
    };
  }, []);

  const setSettings = (patch: Partial<CallWatchSettings>) => {
    const next = { ...read(), ...patch };
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setState(next);
    window.dispatchEvent(new Event(EVT));
  };

  return { settings, setSettings };
};