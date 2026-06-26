import { useEffect, useState } from "react";

export type AccountType = "personal" | "professional" | "enterprise";
export type TrustMode = "user" | "ai" | "org";
export type PrivacyPreset = "general" | "private" | "precise";
export type Audience = "vip_family" | "friends" | "clients" | "colleagues" | "public";

// Internal detected activities (what AI sees)
export type DetectedStatus =
  | "driving" | "meeting" | "lunch" | "travelling" | "airport"
  | "gym" | "sleeping" | "walking" | "focus_mode" | "office_hours" | "available";

// Published / generalized statuses
export type PublishedStatus =
  | "available" | "busy" | "focus" | "away" | "offline" | "reachable" | "unavailable" | "available_later";

export interface TemporaryOverride {
  id: string;
  label: string;            // Vacation, Conference...
  expiresAt: string;        // ISO
  audienceMap: Partial<Record<Audience, PublishedStatus | "normal">>;
}

export interface DisclosureState {
  accountType: AccountType;
  trustMode: TrustMode;
  preset: PrivacyPreset;
  // detected -> published, user editable
  mapping: Record<DetectedStatus, PublishedStatus>;
  // per-audience per-detected override (audience-specific disclosure)
  audienceMapping: Record<Audience, Partial<Record<DetectedStatus, PublishedStatus>>>;
  // hide list — these detected activities should never reveal raw context
  hidden: DetectedStatus[];
  // temporary overrides
  overrides: TemporaryOverride[];
}

export const AUDIENCE_LABEL: Record<Audience, string> = {
  vip_family: "VIP Family",
  friends: "Friends",
  clients: "Clients",
  colleagues: "Colleagues",
  public: "Public",
};

export const DETECTED_LABEL: Record<DetectedStatus, string> = {
  driving: "Driving",
  meeting: "Meeting",
  lunch: "Lunch Break",
  travelling: "Travelling",
  airport: "Airport",
  gym: "Gym",
  sleeping: "Sleeping",
  walking: "Walking",
  focus_mode: "Focus Mode",
  office_hours: "Office Hours",
  available: "Available",
};

export const PUBLISHED_LABEL: Record<PublishedStatus, string> = {
  available: "Available",
  busy: "Busy",
  focus: "Focus",
  away: "Away",
  offline: "Offline",
  reachable: "Reachable",
  unavailable: "Unavailable",
  available_later: "Available Later",
};

const DEFAULT_MAPPING: Record<DetectedStatus, PublishedStatus> = {
  driving: "focus",
  meeting: "busy",
  lunch: "busy",
  travelling: "away",
  airport: "away",
  gym: "focus",
  sleeping: "offline",
  walking: "available",
  focus_mode: "focus",
  office_hours: "available",
  available: "available",
};

const DEFAULT_AUDIENCE_MAPPING: Record<Audience, Partial<Record<DetectedStatus, PublishedStatus>>> = {
  vip_family: { driving: "focus", meeting: "busy" }, // richer — falls back to detected label in UI
  friends: {},
  clients: {},
  colleagues: {},
  public: { meeting: "unavailable", driving: "unavailable", airport: "unavailable" },
};

const DEFAULT_HIDDEN: DetectedStatus[] = ["airport", "gym", "sleeping", "walking"];

export const DEFAULT_STATE: DisclosureState = {
  accountType: "professional",
  trustMode: "ai",
  preset: "general",
  mapping: DEFAULT_MAPPING,
  audienceMapping: DEFAULT_AUDIENCE_MAPPING,
  hidden: DEFAULT_HIDDEN,
  overrides: [],
};

const KEY = "availock.disclosure.v1";
const EVT = "availock:disclosure-changed";

const read = (): DisclosureState => {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<DisclosureState>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      mapping: { ...DEFAULT_MAPPING, ...(parsed.mapping ?? {}) },
      audienceMapping: { ...DEFAULT_AUDIENCE_MAPPING, ...(parsed.audienceMapping ?? {}) },
      hidden: parsed.hidden ?? DEFAULT_HIDDEN,
      overrides: (parsed.overrides ?? []).filter(o => new Date(o.expiresAt).getTime() > Date.now()),
    };
  } catch {
    return DEFAULT_STATE;
  }
};

const write = (s: DisclosureState) => {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
  window.dispatchEvent(new Event(EVT));
};

export const useDisclosureState = () => {
  const [state, setState] = useState<DisclosureState>(() => read());
  useEffect(() => {
    const sync = () => setState(read());
    window.addEventListener("storage", sync);
    window.addEventListener(EVT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EVT, sync);
    };
  }, []);

  const persist = (u: (s: DisclosureState) => DisclosureState) =>
    setState(p => { const n = u(p); write(n); return n; });

  return {
    state,
    setAccountType: (a: AccountType) => persist(s => ({ ...s, accountType: a, trustMode: a === "personal" ? "user" : a === "enterprise" ? "org" : "ai" })),
    setTrustMode: (t: TrustMode) => persist(s => ({ ...s, trustMode: t })),
    setPreset: (p: PrivacyPreset) => persist(s => ({ ...s, preset: p })),
    setMapping: (d: DetectedStatus, p: PublishedStatus) =>
      persist(s => ({ ...s, mapping: { ...s.mapping, [d]: p } })),
    setAudienceMapping: (a: Audience, d: DetectedStatus, p: PublishedStatus) =>
      persist(s => ({ ...s, audienceMapping: { ...s.audienceMapping, [a]: { ...s.audienceMapping[a], [d]: p } } })),
    toggleHidden: (d: DetectedStatus) =>
      persist(s => ({ ...s, hidden: s.hidden.includes(d) ? s.hidden.filter(x => x !== d) : [...s.hidden, d] })),
    addOverride: (o: TemporaryOverride) =>
      persist(s => ({ ...s, overrides: [...s.overrides, o] })),
    removeOverride: (id: string) =>
      persist(s => ({ ...s, overrides: s.overrides.filter(o => o.id !== id) })),
    reset: () => persist(() => DEFAULT_STATE),
  };
};

// Verified activities that need AI signal — can only generalize, not fabricate
export const VERIFIED_ACTIVITIES: DetectedStatus[] = ["meeting", "driving", "office_hours", "focus_mode", "airport"];

// In "ai"/"org" trust modes, publishing some statuses for verified activities is not allowed.
export const isMappingAllowed = (
  trust: TrustMode,
  detected: DetectedStatus,
  published: PublishedStatus
): { allowed: boolean; reason?: string; suggest?: PublishedStatus[] } => {
  if (trust === "user") return { allowed: true };
  const isVerified = VERIFIED_ACTIVITIES.includes(detected);
  if (!isVerified) return { allowed: true };
  // Generalization always allowed
  const generalizations: PublishedStatus[] = ["busy", "focus", "away", "offline", "unavailable", "available_later"];
  if (generalizations.includes(published)) return { allowed: true };
  // Cannot publish "available" or "reachable" while a verified busy-state is detected
  if (detected !== "available" && (published === "available" || published === "reachable")) {
    return {
      allowed: false,
      reason: `Cannot publish "${PUBLISHED_LABEL[published]}" while ${DETECTED_LABEL[detected]} is verified by AI.`,
      suggest: ["busy", "focus", "away"],
    };
  }
  return { allowed: true };
};

// Privacy score
export const computePrivacyScore = (s: DisclosureState): { score: number; label: "Strong" | "Moderate" | "Open"; tone: string } => {
  let score = 0;
  // Preset weight
  if (s.preset === "private") score += 45;
  else if (s.preset === "general") score += 30;
  else score += 10;
  // Hidden coverage
  score += Math.min(25, s.hidden.length * 4);
  // Audience public restriction
  if ((s.audienceMapping.public && Object.keys(s.audienceMapping.public).length > 0)) score += 10;
  // Generalization vs precise mapping
  const generalized = Object.entries(s.mapping).filter(([d, p]) => d !== p && p !== "available").length;
  score += Math.min(20, generalized * 2);
  score = Math.min(100, score);
  if (score >= 70) return { score, label: "Strong", tone: "text-emerald-600 bg-emerald-50 border-emerald-200" };
  if (score >= 40) return { score, label: "Moderate", tone: "text-amber-700 bg-amber-50 border-amber-200" };
  return { score, label: "Open", tone: "text-rose-700 bg-rose-50 border-rose-200" };
};

export const durationDays = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};