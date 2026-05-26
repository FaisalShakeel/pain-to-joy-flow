import { useState } from "react";
import {
  Radar, ChevronDown, ChevronUp, Clock, MessageCircle, Phone, Zap, UserPlus, Globe, Users, Lock,
} from "lucide-react";

/* ---------- Types ---------- */

type DiscoveryMode = "public" | "restricted" | "private";
type ScopeKey = "contacts" | "organization" | "groups" | "custom";
type SeeLevel = "status" | "limited" | "full";
type ActionKey = "request" | "message" | "call" | "bypass";

export interface DiscoverySettings {
  mode: DiscoveryMode;
  scope: Record<ScopeKey, boolean>;
  see: SeeLevel;
  actions: Record<ActionKey, boolean>;
  timeBased: boolean;
  publicFrom: string; // "HH:MM"
  publicTo: string;
}

/* ---------- Defaults & Meta ---------- */

export const DEFAULT_DISCOVERY: DiscoverySettings = {
  mode: "restricted",
  scope: { contacts: true, organization: false, groups: false, custom: false },
  see: "limited",
  actions: { request: true, message: false, call: false, bypass: false },
  timeBased: false,
  publicFrom: "09:00",
  publicTo: "20:00",
};

const MODE_META: Record<DiscoveryMode, { label: string; icon: typeof Globe; tag: string; tone: string }> = {
  public:     { label: "Public",     icon: Globe,  tag: "Anyone can find you",            tone: "text-emerald-600" },
  restricted: { label: "Restricted", icon: Users,  tag: "Only your circles can find you", tone: "text-amber-600" },
  private:    { label: "Private",    icon: Lock,   tag: "Visible to selected contacts only", tone: "text-rose-600" },
};

const SCOPE_REACH: Record<ScopeKey, number> = {
  contacts: 142,
  organization: 318,
  groups: 64,
  custom: 12,
};

function estimateReach(s: DiscoverySettings): number {
  if (s.mode === "private") return 0;
  if (s.mode === "public") return 9999;
  return (Object.keys(s.scope) as ScopeKey[])
    .filter((k) => s.scope[k])
    .reduce((sum, k) => sum + SCOPE_REACH[k], 0);
}

/* ---------- Panel ---------- */

export default function WhoCanFindMePanel() {
  const [settings, setSettings] = useState<DiscoverySettings>(DEFAULT_DISCOVERY);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const set = <K extends keyof DiscoverySettings>(k: K, v: DiscoverySettings[K]) =>
    setSettings((s) => ({ ...s, [k]: v }));

  const toggleScope = (k: ScopeKey) =>
    setSettings((s) => ({ ...s, scope: { ...s.scope, [k]: !s.scope[k] } }));

  const toggleAction = (k: ActionKey) =>
    setSettings((s) => ({ ...s, actions: { ...s.actions, [k]: !s.actions[k] } }));

  const reach = estimateReach(settings);
  const ModeIcon = MODE_META[settings.mode].icon;

  const previewLine =
    settings.mode === "private"
      ? "You are hidden — no one can find you"
      : settings.mode === "public"
        ? "You are visible to anyone on Availock"
        : reach === SCOPE_REACH.contacts && settings.scope.contacts &&
          !settings.scope.organization && !settings.scope.groups && !settings.scope.custom
          ? "Only your contacts can find you"
          : `You are visible to: ${reach.toLocaleString()} people`;

  return (
    <div className="rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent inline-flex items-center gap-1.5">
            <Radar className="w-3 h-3" /> Who can find me
          </p>
          <p className="font-headline font-bold text-primary mt-1">Be available on your terms</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Stay discoverable when it matters. Control access without awkward conversations.
          </p>
        </div>
      </div>

      {/* Mode selector */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {(Object.keys(MODE_META) as DiscoveryMode[]).map((m) => {
          const meta = MODE_META[m];
          const Icon = meta.icon;
          const active = settings.mode === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => set("mode", m)}
              className={`group rounded-2xl p-3 text-left transition border ${
                active
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-transparent bg-surface-low hover:bg-surface"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${active ? meta.tone : "text-muted-foreground"}`} />
                <span className={`text-sm font-semibold ${active ? "text-primary" : "text-foreground/80"}`}>{meta.label}</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground leading-snug">{meta.tag}</p>
            </button>
          );
        })}
      </div>

      {/* Live preview */}
      <div className="mt-4 flex items-center gap-3 p-3 rounded-2xl bg-surface-low ghost-border">
        <span className={`grid place-items-center w-9 h-9 rounded-xl bg-surface ${MODE_META[settings.mode].tone}`}>
          <ModeIcon className="w-4 h-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Live preview</p>
          <p className="text-sm font-semibold text-primary truncate">{previewLine}</p>
        </div>
      </div>

      {/* Advanced toggle */}
      <button
        type="button"
        onClick={() => setAdvancedOpen((o) => !o)}
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
      >
        {advancedOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        Advanced settings
      </button>

      {advancedOpen && (
        <div className="mt-4 space-y-5 pt-4 border-t border-surface-container">
          {/* Scope */}
          <SubBlock title="Visibility scope" hint="Who counts as “your circle”">
            <div className="grid grid-cols-2 gap-2">
              {([
                { k: "contacts",     label: "Contacts" },
                { k: "organization", label: "Organization" },
                { k: "groups",       label: "Groups" },
                { k: "custom",       label: "Custom" },
              ] as { k: ScopeKey; label: string }[]).map((opt) => (
                <PillCheck
                  key={opt.k}
                  label={opt.label}
                  checked={settings.scope[opt.k]}
                  onToggle={() => toggleScope(opt.k)}
                  disabled={settings.mode === "private"}
                />
              ))}
            </div>
          </SubBlock>

          {/* What they see */}
          <SubBlock title="What they see" hint="How much of your availability is exposed">
            <div className="inline-flex p-1 rounded-xl bg-surface-low ghost-border">
              {([
                { v: "status",  label: "Status only" },
                { v: "limited", label: "Limited" },
                { v: "full",    label: "Full" },
              ] as { v: SeeLevel; label: string }[]).map((opt) => {
                const active = settings.see === opt.v;
                return (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => set("see", opt.v)}
                    disabled={settings.mode === "private"}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 ${
                      active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-primary"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </SubBlock>

          {/* What they can do */}
          <SubBlock title="What they can do" hint="Permitted actions on your profile">
            <div className="grid grid-cols-2 gap-2">
              <PillCheck label="Request access"      icon={UserPlus}      checked={settings.actions.request} onToggle={() => toggleAction("request")} disabled={settings.mode === "private"} />
              <PillCheck label="Message"             icon={MessageCircle} checked={settings.actions.message} onToggle={() => toggleAction("message")} disabled={settings.mode === "private"} />
              <PillCheck label="Call"                icon={Phone}         checked={settings.actions.call}    onToggle={() => toggleAction("call")}    disabled={settings.mode === "private"} />
              <PillCheck label="Use Priority Bypass" icon={Zap}           checked={settings.actions.bypass}  onToggle={() => toggleAction("bypass")}  disabled={settings.mode === "private"} />
            </div>
          </SubBlock>

          {/* Time-based visibility */}
          <SubBlock title="Time-based visibility" hint="Public during work hours, private after">
            <label className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-surface-low ghost-border">
              <span className="inline-flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold text-primary">Schedule visibility</span>
              </span>
              <button
                type="button"
                onClick={() => set("timeBased", !settings.timeBased)}
                className={`w-10 h-6 rounded-full transition ${settings.timeBased ? "bg-primary" : "bg-surface-high"}`}
                aria-pressed={settings.timeBased}
              >
                <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${settings.timeBased ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </label>
            {settings.timeBased && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[11px] font-semibold text-muted-foreground">Public from</span>
                  <input
                    type="time"
                    value={settings.publicFrom}
                    onChange={(e) => set("publicFrom", e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-surface-low ghost-border outline-none text-sm focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold text-muted-foreground">Private after</span>
                  <input
                    type="time"
                    value={settings.publicTo}
                    onChange={(e) => set("publicTo", e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-surface-low ghost-border outline-none text-sm focus:ring-2 focus:ring-primary/20"
                  />
                </label>
              </div>
            )}
          </SubBlock>
        </div>
      )}
    </div>
  );
}

/* ---------- Subcomponents ---------- */

function SubBlock({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
      {hint && <p className="text-[11px] text-muted-foreground/80 mb-2">{hint}</p>}
      <div className={hint ? "" : "mt-2"}>{children}</div>
    </div>
  );
}

function PillCheck({
  label, checked, onToggle, icon: Icon, disabled,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`inline-flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition border disabled:opacity-50 ${
        checked
          ? "bg-primary/5 border-primary text-primary"
          : "bg-surface-low border-transparent text-foreground/70 hover:text-primary"
      }`}
    >
      <span className="inline-flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </span>
      <span className={`w-3.5 h-3.5 rounded-full border ${checked ? "bg-primary border-primary" : "border-muted-foreground/40"}`} />
    </button>
  );
}
