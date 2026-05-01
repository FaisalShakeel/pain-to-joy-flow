import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Save, ShieldCheck, Eye, Users, EyeOff, Plus, Trash2, Globe, Lock, Camera, X,
  Radar, ChevronDown, ChevronUp, Clock, MessageCircle, Phone, Zap, UserPlus,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import Avatar from "@/components/app/Avatar";
import {
  myOwnerProfile, me,
  type OwnerProfile, type Visibility, type CommsChannel, type SocialHandle,
} from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";

const visibilityOptions: { value: Visibility; label: string; icon: typeof Eye; hint: string }[] = [
  { value: "public",   label: "Public",   icon: Globe,  hint: "Anyone viewing your profile" },
  { value: "approved", label: "Approved", icon: Users,  hint: "Only synced contacts" },
  { value: "hidden",   label: "Hidden",   icon: EyeOff, hint: "Only you" },
];

/* ---------- Who Can Find Me — types & defaults ---------- */

type DiscoveryMode = "public" | "restricted" | "private";
type ScopeKey = "contacts" | "organization" | "groups" | "custom";
type SeeLevel = "status" | "limited" | "full";
type ActionKey = "request" | "message" | "call" | "bypass";

interface DiscoverySettings {
  mode: DiscoveryMode;
  scope: Record<ScopeKey, boolean>;
  see: SeeLevel;
  actions: Record<ActionKey, boolean>;
  timeBased: boolean;
  publicFrom: string; // "HH:MM"
  publicTo: string;
}

const DEFAULT_DISCOVERY: DiscoverySettings = {
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
  private:    { label: "Private",    icon: Lock,   tag: "Hidden from search",             tone: "text-rose-600" },
};

// Demo math for the "live preview" reach number.
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

const EditProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<OwnerProfile>(myOwnerProfile);
  const [twoFa, setTwoFa] = useState(true);
  const [discoverable, setDiscoverable] = useState(false);
  const [discovery, setDiscovery] = useState<DiscoverySettings>(DEFAULT_DISCOVERY);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const update = <K extends keyof OwnerProfile>(k: K, v: OwnerProfile[K]) =>
    setProfile((p) => ({ ...p, [k]: v }));

  const setFieldVisibility = (key: keyof OwnerProfile["visibility"], v: Visibility) =>
    setProfile((p) => ({ ...p, visibility: { ...p.visibility, [key]: v } }));

  const updateComms = (id: string, patch: Partial<CommsChannel>) =>
    setProfile((p) => ({
      ...p,
      primaryComms: p.primaryComms.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));

  const removeComms = (id: string) =>
    setProfile((p) => ({ ...p, primaryComms: p.primaryComms.filter((c) => c.id !== id) }));

  const addComms = () =>
    setProfile((p) => ({
      ...p,
      primaryComms: [
        ...p.primaryComms,
        { id: `c-${Date.now()}`, kind: "phone", label: "New channel", value: "", visibility: "approved" },
      ],
    }));

  const updateSocial = (id: string, patch: Partial<SocialHandle>) =>
    setProfile((p) => ({
      ...p,
      socialHandles: p.socialHandles.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));

  const removeSocial = (id: string) =>
    setProfile((p) => ({ ...p, socialHandles: p.socialHandles.filter((s) => s.id !== id) }));

  const addSocial = () =>
    setProfile((p) => ({
      ...p,
      socialHandles: [
        ...p.socialHandles,
        { id: `s-${Date.now()}`, kind: "other", label: "New handle", value: "", href: "#", visibility: "public" },
      ],
    }));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock save — in a real backend this would persist `profile`
    Object.assign(myOwnerProfile, profile);
    toast({ title: "Profile saved", description: "Visibility rules applied to your contact card." });
    navigate("/app/settings");
  };

  return (
    <AppShell subtitle="Account" title="Edit profile">
      <Link to="/app/settings" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to settings
      </Link>

      <form onSubmit={save} className="grid lg:grid-cols-3 gap-5 pb-28">
        <div className="lg:col-span-2 space-y-5">
          {/* Profile header */}
          <div className="rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="relative shrink-0">
                <Avatar initials={profile.initials} size="xl" />
                <label className="absolute -bottom-1 -right-1 grid place-items-center w-8 h-8 rounded-full bg-primary text-primary-foreground shadow-sm cursor-pointer hover:opacity-90 transition" title="Change photo">
                  <Camera className="w-3.5 h-3.5" />
                  <input type="file" accept="image/*" className="sr-only" />
                </label>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Profile</p>
                <p className="font-headline font-extrabold text-primary text-xl truncate mt-0.5">{profile.name || "Unnamed"}</p>
                <p className="text-sm text-muted-foreground truncate">{profile.title}{profile.org ? ` · ${profile.org}` : ""}</p>
                <p className="text-xs text-muted-foreground mt-1">{me.email}</p>
              </div>
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full ghost-border bg-surface-low text-xs font-semibold text-primary hover:bg-surface transition cursor-pointer shrink-0">
                <Camera className="w-3.5 h-3.5" /> Edit photo
                <input type="file" accept="image/*" className="sr-only" />
              </label>
            </div>
          </div>

          {/* Who Can Find Me */}
          <WhoCanFindMe
            settings={discovery}
            onChange={setDiscovery}
            advancedOpen={advancedOpen}
            onToggleAdvanced={() => setAdvancedOpen((o) => !o)}
          />

          {/* Identity (always public) */}
          <Section title="Identity" hint="Always public — this is how people find you">
            <Field label="Full name" value={profile.name} onChange={(v) => update("name", v)} />
            <FieldRow>
              <Field label="Title" value={profile.title} onChange={(v) => update("title", v)} />
              <VisibilityPicker value={profile.visibility.title} onChange={(v) => setFieldVisibility("title", v)} />
            </FieldRow>
            <FieldRow>
              <Field label="Organization" value={profile.org} onChange={(v) => update("org", v)} />
              <VisibilityPicker value={profile.visibility.org} onChange={(v) => setFieldVisibility("org", v)} />
            </FieldRow>
          </Section>

          {/* Narrative */}
          <Section title="Narrative">
            <FieldRow>
              <TextareaField
                label="Bio / Spotlight"
                value={profile.bio}
                onChange={(v) => update("bio", v)}
              />
              <VisibilityPicker value={profile.visibility.bio} onChange={(v) => setFieldVisibility("bio", v)} />
            </FieldRow>
            <FieldRow>
              <Field
                label="Tags (comma-separated)"
                value={profile.tags.join(", ")}
                onChange={(v) => update("tags", v.split(",").map((t) => t.trim()).filter(Boolean))}
              />
              <VisibilityPicker value={profile.visibility.tags} onChange={(v) => setFieldVisibility("tags", v)} />
            </FieldRow>
            <FieldRow>
              <div className="block">
                <span className="text-xs font-semibold text-muted-foreground">Availability context</span>
                <div className="mt-1 px-4 py-2.5 rounded-xl bg-surface-low ghost-border text-sm text-muted-foreground">
                  {profile.availabilityContext || <span className="italic">No status set</span>}
                  <span className="ml-2 text-[10px]">· Set this from your profile page.</span>
                </div>
              </div>
              <VisibilityPicker
                value={profile.visibility.availabilityContext}
                onChange={(v) => setFieldVisibility("availabilityContext", v)}
              />
            </FieldRow>
            <Field label="Typical response time" value={profile.responseTime} onChange={(v) => update("responseTime", v)} />
          </Section>

          {/* Operations Center */}
          <Section title="Operations Center">
            <FieldRow>
              <Field label="Operation days" value={profile.operationDays} onChange={(v) => update("operationDays", v)} />
              <VisibilityPicker value={profile.visibility.operationDays} onChange={(v) => setFieldVisibility("operationDays", v)} />
            </FieldRow>
            <FieldRow>
              <Field label="Operation hours" value={profile.operationHours} onChange={(v) => update("operationHours", v)} />
              <VisibilityPicker value={profile.visibility.operationHours} onChange={(v) => setFieldVisibility("operationHours", v)} />
            </FieldRow>
            <FieldRow>
              <Field label="Time zone" value={profile.timeZone} onChange={(v) => update("timeZone", v)} />
              <VisibilityPicker value={profile.visibility.timeZone} onChange={(v) => setFieldVisibility("timeZone", v)} />
            </FieldRow>
            <FieldRow>
              <Field label="Location" value={profile.location} onChange={(v) => update("location", v)} />
              <VisibilityPicker value={profile.visibility.location} onChange={(v) => setFieldVisibility("location", v)} />
            </FieldRow>
            <FieldRow>
              <Field label="Headquarters" value={profile.headquarters} onChange={(v) => update("headquarters", v)} />
              <VisibilityPicker value={profile.visibility.headquarters} onChange={(v) => setFieldVisibility("headquarters", v)} />
            </FieldRow>
          </Section>

          {/* Primary Comms */}
          <Section
            title="Primary Comms"
            hint="Each channel has its own visibility. Hidden channels never reach the viewer."
            sectionVisibility={profile.visibility.primaryCommsSection}
            onSectionVisibilityChange={(v) => setFieldVisibility("primaryCommsSection", v)}
          >
            <div className="space-y-2">
              {profile.primaryComms.map((c) => (
                <ChannelRow
                  key={c.id}
                  label={c.label}
                  value={c.value}
                  visibility={c.visibility}
                  onLabel={(v) => updateComms(c.id, { label: v })}
                  onValue={(v) => updateComms(c.id, { value: v })}
                  onVisibility={(v) => updateComms(c.id, { visibility: v })}
                  onRemove={() => removeComms(c.id)}
                />
              ))}
              <button type="button" onClick={addComms} className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                <Plus className="w-3.5 h-3.5" /> Add channel
              </button>
            </div>
          </Section>

          {/* Social Handles */}
          <Section
            title="Social Handles"
            hint="Per-handle visibility. Toggle the whole section off to hide everything at once."
            sectionVisibility={profile.visibility.socialHandlesSection}
            onSectionVisibilityChange={(v) => setFieldVisibility("socialHandlesSection", v)}
          >
            <div className="space-y-2">
              {profile.socialHandles.map((s) => (
                <ChannelRow
                  key={s.id}
                  label={s.label}
                  value={s.value}
                  visibility={s.visibility}
                  onLabel={(v) => updateSocial(s.id, { label: v })}
                  onValue={(v) => updateSocial(s.id, { value: v, href: v.startsWith("http") ? v : s.href })}
                  onVisibility={(v) => updateSocial(s.id, { visibility: v })}
                  onRemove={() => removeSocial(s.id)}
                />
              ))}
              <button type="button" onClick={addSocial} className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                <Plus className="w-3.5 h-3.5" /> Add handle
              </button>
            </div>
          </Section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient sticky top-4">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <p className="mt-2 font-headline font-bold text-primary">Security access</p>
            <Toggle on={twoFa} onChange={setTwoFa} label="Two-factor authentication" />
            <Toggle on={discoverable} onChange={setDiscoverable} label="Discoverable in search" />

            <div className="mt-5 pt-5 border-t border-surface-container">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-2">Visibility legend</p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-emerald-500" /> Public — anyone</li>
                <li className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-amber-500" /> Approved — synced contacts</li>
                <li className="flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-rose-500" /> Hidden — only you</li>
              </ul>
            </div>

            <p className="mt-5 text-[11px] text-muted-foreground text-center">
              Signed in as <span className="font-semibold text-primary">{me.email}</span>
            </p>
          </div>
        </aside>

        {/* Sticky action bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-outline-variant/30 bg-surface-lowest/95 backdrop-blur supports-[backdrop-filter]:bg-surface-lowest/80">
          <div className="mx-auto max-w-7xl px-4 md:px-6 py-3 flex items-center justify-between gap-3">
            <p className="hidden sm:block text-xs text-muted-foreground">
              Changes apply to your contact card immediately after save.
            </p>
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => navigate("/app/settings")}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full ghost-border bg-surface-low text-sm font-semibold text-primary hover:bg-surface transition"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-elevated hover:opacity-95 transition"
              >
                <Save className="w-4 h-4" /> Save changes
              </button>
            </div>
          </div>
        </div>
      </form>
    </AppShell>
  );
};

/* ---------- Subcomponents ---------- */

function Section({
  title, hint, children, sectionVisibility, onSectionVisibilityChange,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  sectionVisibility?: Visibility;
  onSectionVisibilityChange?: (v: Visibility) => void;
}) {
  return (
    <div className="rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">{title}</p>
          {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
        </div>
        {sectionVisibility && onSectionVisibilityChange && (
          <VisibilityPicker value={sectionVisibility} onChange={onSectionVisibilityChange} compact />
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">{children}</div>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-4 py-2.5 rounded-xl bg-surface-low ghost-border outline-none text-sm focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function TextareaField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="mt-1 w-full px-4 py-2.5 rounded-xl bg-surface-low ghost-border outline-none text-sm focus:ring-2 focus:ring-primary/20 resize-none"
      />
    </label>
  );
}

function VisibilityPicker({
  value, onChange, compact,
}: { value: Visibility; onChange: (v: Visibility) => void; compact?: boolean }) {
  return (
    <div className={`inline-flex rounded-xl bg-surface-low ghost-border p-1 ${compact ? "" : "self-end"}`}>
      {visibilityOptions.map((opt) => {
        const active = value === opt.value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            title={opt.hint}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition ${
              active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-primary"
            }`}
          >
            <Icon className="w-3 h-3" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ChannelRow({
  label, value, visibility, onLabel, onValue, onVisibility, onRemove,
}: {
  label: string;
  value: string;
  visibility: Visibility;
  onLabel: (v: string) => void;
  onValue: (v: string) => void;
  onVisibility: (v: Visibility) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[140px_1fr_auto_auto] gap-2 items-center p-2 rounded-xl bg-surface-low ghost-border">
      <input
        value={label}
        onChange={(e) => onLabel(e.target.value)}
        placeholder="Label"
        className="px-3 py-2 rounded-lg bg-surface ghost-border outline-none text-xs font-semibold focus:ring-2 focus:ring-primary/20"
      />
      <input
        value={value}
        onChange={(e) => onValue(e.target.value)}
        placeholder="Value"
        className="px-3 py-2 rounded-lg bg-surface ghost-border outline-none text-xs focus:ring-2 focus:ring-primary/20"
      />
      <VisibilityPicker value={visibility} onChange={onVisibility} compact />
      <button
        type="button"
        onClick={onRemove}
        className="grid place-items-center w-8 h-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
        aria-label="Remove channel"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="mt-3 flex items-center justify-between gap-3">
      <span className="text-sm text-foreground/80">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!on)}
        className={`w-10 h-6 rounded-full transition ${on ? "bg-primary" : "bg-surface-high"}`}
        aria-pressed={on}
      >
        <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}

export default EditProfile;

/* ---------- Who Can Find Me ---------- */

function WhoCanFindMe({
  settings, onChange, advancedOpen, onToggleAdvanced,
}: {
  settings: DiscoverySettings;
  onChange: (s: DiscoverySettings) => void;
  advancedOpen: boolean;
  onToggleAdvanced: () => void;
}) {
  const set = <K extends keyof DiscoverySettings>(k: K, v: DiscoverySettings[K]) =>
    onChange({ ...settings, [k]: v });

  const toggleScope = (k: ScopeKey) =>
    onChange({ ...settings, scope: { ...settings.scope, [k]: !settings.scope[k] } });

  const toggleAction = (k: ActionKey) =>
    onChange({ ...settings, actions: { ...settings.actions, [k]: !settings.actions[k] } });

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

      {/* Mode selector — the only thing most users need */}
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
        onClick={onToggleAdvanced}
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