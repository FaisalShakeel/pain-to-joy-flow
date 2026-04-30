import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

/**
 * Priority Bypass — controlled privilege, NOT a default.
 * Lets selected contacts skip protocol lanes and reach the user
 * instantly via a "Priority Call" or "Priority Message".
 */

export type BypassScope = "none" | "selected" | "priority-circle" | "paid";
export type BypassWindow = "always" | "work-hours" | "respect-focus";

export interface BypassSettings {
  scope: BypassScope;
  window: BypassWindow;
  callsPerContactPerDay: number;
  messagesPerContactPerDay: number;
  // contact ids explicitly allowed when scope === "selected"
  allowedContactIds: string[];
  muted: string[]; // contact ids the user has muted from bypass
}

export interface BypassUsageEntry {
  id: string;
  contactId: string;
  kind: "call" | "message";
  at: number;
}

interface BypassCtx {
  settings: BypassSettings;
  setSettings: (patch: Partial<BypassSettings>) => void;
  toggleAllowed: (contactId: string) => void;
  toggleMuted: (contactId: string) => void;
  // can the *outgoing* user fire bypass at this contact?
  canBypass: (contactId: string, kind: "call" | "message") => { ok: boolean; reason?: string };
  // record usage (for cooldown + analytics)
  recordUsage: (contactId: string, kind: "call" | "message") => void;
  usage: BypassUsageEntry[];
  usedTodayBy: (contactId: string, kind: "call" | "message") => number;
}

const Ctx = createContext<BypassCtx | null>(null);

const DEFAULT_SETTINGS: BypassSettings = {
  scope: "selected",
  window: "respect-focus",
  callsPerContactPerDay: 1,
  messagesPerContactPerDay: 3,
  // a couple of seeds so the UI is demoable
  allowedContactIds: ["sarah-jenkins", "leo-fontaine", "rashid-al-amir"],
  muted: [],
};

const startOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export function BypassProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsRaw] = useState<BypassSettings>(DEFAULT_SETTINGS);
  const [usage, setUsage] = useState<BypassUsageEntry[]>([]);

  const setSettings = useCallback((patch: Partial<BypassSettings>) => {
    setSettingsRaw((s) => ({ ...s, ...patch }));
  }, []);

  const toggleAllowed = useCallback((contactId: string) => {
    setSettingsRaw((s) => {
      const has = s.allowedContactIds.includes(contactId);
      return {
        ...s,
        allowedContactIds: has
          ? s.allowedContactIds.filter((c) => c !== contactId)
          : [...s.allowedContactIds, contactId],
      };
    });
  }, []);

  const toggleMuted = useCallback((contactId: string) => {
    setSettingsRaw((s) => {
      const has = s.muted.includes(contactId);
      return {
        ...s,
        muted: has ? s.muted.filter((c) => c !== contactId) : [...s.muted, contactId],
      };
    });
  }, []);

  const usedTodayBy = useCallback(
    (contactId: string, kind: "call" | "message") => {
      const today = startOfDay(Date.now());
      return usage.filter(
        (u) => u.contactId === contactId && u.kind === kind && u.at >= today,
      ).length;
    },
    [usage],
  );

  const canBypass = useCallback(
    (contactId: string, kind: "call" | "message") => {
      if (settings.scope === "none") return { ok: false, reason: "Priority access not granted" };
      if (settings.muted.includes(contactId)) return { ok: false, reason: "You muted bypass for this contact" };
      // Outgoing flow: we treat the *current user* as the seeker.
      // For demo: scope "selected" requires contact in allowedContactIds.
      if (settings.scope === "selected" && !settings.allowedContactIds.includes(contactId)) {
        return { ok: false, reason: "Priority access not granted" };
      }
      const limit = kind === "call" ? settings.callsPerContactPerDay : settings.messagesPerContactPerDay;
      const used = usedTodayBy(contactId, kind);
      if (used >= limit) {
        return { ok: false, reason: `Daily ${kind} bypass limit reached (${limit})` };
      }
      return { ok: true };
    },
    [settings, usedTodayBy],
  );

  const recordUsage = useCallback((contactId: string, kind: "call" | "message") => {
    setUsage((u) => [
      ...u,
      { id: `b${Date.now()}`, contactId, kind, at: Date.now() },
    ]);
  }, []);

  const value = useMemo<BypassCtx>(
    () => ({ settings, setSettings, toggleAllowed, toggleMuted, canBypass, recordUsage, usage, usedTodayBy }),
    [settings, setSettings, toggleAllowed, toggleMuted, canBypass, recordUsage, usage, usedTodayBy],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBypass() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBypass must be used within BypassProvider");
  return ctx;
}