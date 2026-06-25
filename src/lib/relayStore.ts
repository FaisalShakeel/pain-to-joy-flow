import { useEffect, useState } from "react";

export type Audience = "colleague" | "client" | "friend" | "vip_family";
export type RuleMode = "always" | "hidden" | "office" | "custom";

export interface TimeWindow {
  from: string; // "HH:MM" 24h
  to: string;
}

export interface AudienceRule {
  mode: RuleMode;
  window?: TimeWindow;
}

export interface ContactOverride {
  contactId: string;
  mode: RuleMode | "default";
  window?: TimeWindow;
  expiresAt?: string; // ISO date; undefined = permanent
}

export interface RelayState {
  audienceDefaults: Record<Audience, AudienceRule>;
  contactAudience: Record<string, Audience>;
  overrides: Record<string, ContactOverride>;
}

export const AUDIENCE_LABEL: Record<Audience, string> = {
  colleague: "Colleague",
  client: "Client",
  friend: "Friend",
  vip_family: "VIP Family",
};

export const OFFICE_WINDOW: TimeWindow = { from: "09:00", to: "18:00" };

const DEFAULT_STATE: RelayState = {
  audienceDefaults: {
    colleague: { mode: "office" },
    client: { mode: "office" },
    friend: { mode: "custom", window: { from: "09:00", to: "22:00" } },
    vip_family: { mode: "always" },
  },
  contactAudience: {},
  overrides: {},
};

const KEY = "availock.relayState.v1";
const EVT = "availock:relay-changed";

const read = (): RelayState => {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as RelayState;
    return {
      audienceDefaults: { ...DEFAULT_STATE.audienceDefaults, ...(parsed.audienceDefaults ?? {}) },
      contactAudience: parsed.contactAudience ?? {},
      overrides: parsed.overrides ?? {},
    };
  } catch {
    return DEFAULT_STATE;
  }
};

const purgeExpired = (s: RelayState): RelayState => {
  const now = Date.now();
  const next: Record<string, ContactOverride> = {};
  let changed = false;
  for (const [k, ov] of Object.entries(s.overrides)) {
    if (ov.expiresAt && new Date(ov.expiresAt).getTime() <= now) {
      changed = true;
      continue;
    }
    next[k] = ov;
  }
  return changed ? { ...s, overrides: next } : s;
};

const write = (s: RelayState) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(EVT));
};

export const useRelayState = () => {
  const [state, setState] = useState<RelayState>(() => purgeExpired(read()));

  useEffect(() => {
    const sync = () => setState(purgeExpired(read()));
    window.addEventListener("storage", sync);
    window.addEventListener(EVT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EVT, sync);
    };
  }, []);

  const persist = (updater: (s: RelayState) => RelayState) => {
    setState((prev) => {
      const next = purgeExpired(updater(prev));
      write(next);
      return next;
    });
  };

  const setAudienceDefault = (a: Audience, rule: AudienceRule) =>
    persist((s) => ({ ...s, audienceDefaults: { ...s.audienceDefaults, [a]: rule } }));

  const assignAudience = (contactId: string, audience: Audience) =>
    persist((s) => ({ ...s, contactAudience: { ...s.contactAudience, [contactId]: audience } }));

  const setOverride = (contactId: string, ov: Omit<ContactOverride, "contactId"> | null) =>
    persist((s) => {
      const next = { ...s.overrides };
      if (!ov || ov.mode === "default") delete next[contactId];
      else next[contactId] = { contactId, ...ov };
      return { ...s, overrides: next };
    });

  const resolveRule = (contactId: string): { rule: AudienceRule; source: "override" | "audience" | "global"; audience: Audience; override?: ContactOverride } => {
    const audience: Audience = state.contactAudience[contactId] ?? "colleague";
    const ov = state.overrides[contactId];
    if (ov && ov.mode !== "default") {
      const rule: AudienceRule = ov.mode === "custom"
        ? { mode: "custom", window: ov.window ?? OFFICE_WINDOW }
        : { mode: ov.mode };
      return { rule, source: "override", audience, override: ov };
    }
    return { rule: state.audienceDefaults[audience], source: "audience", audience };
  };

  return { state, setAudienceDefault, assignAudience, setOverride, resolveRule };
};

export const formatRule = (rule: AudienceRule): string => {
  if (rule.mode === "always") return "Always Visible";
  if (rule.mode === "hidden") return "Hidden";
  if (rule.mode === "office") return `Office Hours (${fmt12(OFFICE_WINDOW.from)}–${fmt12(OFFICE_WINDOW.to)})`;
  return `Custom ${fmt12(rule.window?.from)}–${fmt12(rule.window?.to)}`;
};

export const fmt12 = (hhmm?: string) => {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  const hh = ((h + 11) % 12) + 1;
  return m ? `${hh}:${String(m).padStart(2, "0")} ${ap}` : `${hh} ${ap}`;
};

export const formatExpiry = (iso?: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export const formatStatus = (
  override: ContactOverride | undefined,
): string => {
  if (!override || override.mode === "default") return "Default";
  const until = override.expiresAt ? ` Until ${formatExpiry(override.expiresAt)}` : "";
  if (override.mode === "always") return `Always Visible${until}`;
  if (override.mode === "hidden") return `Hidden${until}`;
  if (override.mode === "office") return `Office Hours${until}`;
  return `Custom ${fmt12(override.window?.from)}–${fmt12(override.window?.to)}${until}`;
};

export const durationToDate = (duration: "today" | "3d" | "1w" | "2w" | "1mo"): string => {
  const d = new Date();
  switch (duration) {
    case "today": d.setHours(23, 59, 59, 999); break;
    case "3d": d.setDate(d.getDate() + 3); break;
    case "1w": d.setDate(d.getDate() + 7); break;
    case "2w": d.setDate(d.getDate() + 14); break;
    case "1mo": d.setMonth(d.getMonth() + 1); break;
  }
  return d.toISOString();
};