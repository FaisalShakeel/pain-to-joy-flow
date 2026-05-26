import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Save, ShieldCheck, Eye, Users, EyeOff, Plus, Trash2, Globe, Lock, Camera, X, Pencil, Check,
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


const EditProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<OwnerProfile>(myOwnerProfile);
  const [twoFa, setTwoFa] = useState(true);
  const [discoverable, setDiscoverable] = useState(false);

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
                <li className="flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-rose-500" /> Private — only selected</li>
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
  value, onChange, compact, iconOnly,
}: { value: Visibility; onChange: (v: Visibility) => void; compact?: boolean; iconOnly?: boolean }) {
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
            aria-label={opt.label}
            className={`inline-flex items-center gap-1.5 ${iconOnly ? "p-1.5" : "px-2.5 py-1.5"} rounded-lg text-[11px] font-semibold transition ${
              active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-primary"
            }`}
          >
            <Icon className="w-3 h-3" />
            {!iconOnly && opt.label}
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
  const [editing, setEditing] = useState(!value);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-2 items-center p-2 rounded-xl bg-surface-low ghost-border">
      {editing ? (
        <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2 min-w-0">
          <input
            value={label}
            onChange={(e) => onLabel(e.target.value)}
            placeholder="Label"
            className="px-2.5 py-1.5 rounded-lg bg-surface ghost-border outline-none text-xs font-semibold focus:ring-2 focus:ring-primary/20 min-w-0"
          />
          <input
            value={value}
            onChange={(e) => onValue(e.target.value)}
            placeholder="Value"
            className="px-2.5 py-1.5 rounded-lg bg-surface ghost-border outline-none text-xs focus:ring-2 focus:ring-primary/20 min-w-0"
          />
        </div>
      ) : (
        <div className="min-w-0 px-1">
          <p className="text-xs font-semibold text-primary truncate">{label}</p>
          <p className="text-[11px] text-muted-foreground truncate">{value || <span className="italic">No value</span>}</p>
        </div>
      )}
      <VisibilityPicker value={visibility} onChange={onVisibility} compact iconOnly />
      <button
        type="button"
        onClick={() => setEditing((v) => !v)}
        className="grid place-items-center w-8 h-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition"
        aria-label={editing ? "Done editing" : "Edit channel"}
      >
        {editing ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
      </button>
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