import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Save, ShieldCheck, Eye, Users, EyeOff, Plus, Trash2, Globe, Lock,
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

      <form onSubmit={save} className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Avatar */}
          <Section title="Avatar">
            <div className="flex items-center gap-4">
              <Avatar initials={profile.initials} size="xl" />
              <input type="file" accept="image/*" className="text-sm text-muted-foreground" />
            </div>
          </Section>

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
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-gradient-primary text-primary-foreground font-semibold shadow-elevated hover:opacity-95 transition"
          >
            <Save className="w-4 h-4" /> Save changes
          </button>

          <p className="text-[11px] text-muted-foreground text-center">
            Signed in as <span className="font-semibold text-primary">{me.email}</span>
          </p>
        </aside>
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