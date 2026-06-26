import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck, Eye, EyeOff, Sparkles, Lock, Users, Clock, Plus, Trash2, ChevronDown,
  ArrowLeft, AlertTriangle, CheckCircle2, Building2, User, Cpu, ArrowRight,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  useDisclosureState, AUDIENCE_LABEL, DETECTED_LABEL, PUBLISHED_LABEL,
  computePrivacyScore, isMappingAllowed, durationDays,
  type Audience, type DetectedStatus, type PublishedStatus, type PrivacyPreset,
  type AccountType, type TrustMode, type TemporaryOverride,
} from "@/lib/disclosureStore";

const ALL_DETECTED: DetectedStatus[] = [
  "driving", "meeting", "lunch", "travelling", "airport",
  "gym", "sleeping", "walking", "focus_mode", "office_hours", "available",
];
const ALL_PUBLISHED: PublishedStatus[] = [
  "available", "busy", "focus", "away", "offline", "reachable", "unavailable", "available_later",
];
const ALL_AUDIENCES: Audience[] = ["vip_family", "friends", "clients", "colleagues", "public"];

const PRESETS: { id: PrivacyPreset; title: string; desc: string; icon: typeof Eye }[] = [
  { id: "general", title: "General", desc: "Recommended. Available · Busy · Focus · Away · Offline.", icon: ShieldCheck },
  { id: "private", title: "Private", desc: "Only Reachable / Unavailable. Maximum privacy.", icon: Lock },
  { id: "precise", title: "Precise", desc: "Show detected activities (Driving, Meeting, Gym…).", icon: Sparkles },
];

const ACCOUNT_TYPES: { id: AccountType; label: string; trust: TrustMode; desc: string; icon: typeof User }[] = [
  { id: "personal", label: "Personal", trust: "user", desc: "User Controlled · maximum flexibility", icon: User },
  { id: "professional", label: "Professional", trust: "ai", desc: "AI Assisted · supported by signals", icon: Cpu },
  { id: "enterprise", label: "Enterprise", trust: "org", desc: "Organization Policy · governance applied", icon: Building2 },
];

const OVERRIDE_TEMPLATES = ["Vacation", "Conference", "Travel", "Fundraising", "Medical Leave", "Holiday"];

const DisclosureCenter = () => {
  const {
    state, setAccountType, setPreset, setMapping, setAudienceMapping,
    toggleHidden, addOverride, removeOverride, reset,
  } = useDisclosureState();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCustomize, setShowCustomize] = useState(true);
  const [overrideOpen, setOverrideOpen] = useState(false);

  const score = useMemo(() => computePrivacyScore(state), [state]);

  const handleMapping = (d: DetectedStatus, p: PublishedStatus) => {
    const check = isMappingAllowed(state.trustMode, d, p);
    if (!check.allowed) {
      toast({
        title: "Mapping blocked",
        description: check.reason + (check.suggest ? ` Try: ${check.suggest.map(s => PUBLISHED_LABEL[s]).join(", ")}.` : ""),
        variant: "destructive",
      });
      return;
    }
    setMapping(d, p);
  };

  return (
    <AppShell subtitle="Settings · Privacy" title="Availability Disclosure">
      <div className="space-y-5 max-w-5xl">
        {/* Back */}
        <Link to="/app/settings" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Settings
        </Link>

        {/* Hero / Privacy Score */}
        <section className="rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="max-w-xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Privacy-first disclosure</p>
              <h2 className="mt-1 font-headline text-2xl font-bold text-primary">You control what others see.</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                AI detects reality. You decide disclosure. Sensible defaults are already on — customize only if you want to.
              </p>
            </div>
            <div className={cn("rounded-2xl border px-5 py-4 min-w-[200px]", score.tone)}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-80">Privacy Score</p>
              <p className="mt-1 text-3xl font-headline font-bold">{score.label}</p>
              <div className="mt-2 h-1.5 rounded-full bg-current/10 overflow-hidden">
                <div className="h-full bg-current/60" style={{ width: `${score.score}%` }} />
              </div>
              <p className="mt-1 text-[11px] opacity-80">{score.score}/100 protection</p>
            </div>
          </div>
        </section>

        {/* LEVEL 1 — Default summary */}
        <SectionCard
          eyebrow="Level 1 · Default"
          title="Working out of the box"
          subtitle="No setup required. These defaults protect you from day one."
        >
          <div className="grid sm:grid-cols-3 gap-3">
            <DefaultPill icon={ShieldCheck} title="General Privacy Mode" desc="Meeting → Busy · Driving → Focus · Sleeping → Offline" />
            <DefaultPill icon={Users} title="Audience Defaults" desc="VIP Family richer · Public minimal" />
            <DefaultPill icon={Cpu} title="Trust Model" desc={`${ACCOUNT_TYPES.find(a => a.id === state.accountType)?.label} · ${ACCOUNT_TYPES.find(a => a.id === state.accountType)?.trust === "user" ? "User Controlled" : state.trustMode === "ai" ? "AI Assisted" : "Org Policy"}`} />
          </div>
        </SectionCard>

        {/* LEVEL 2 — Customize */}
        <SectionCard
          eyebrow="Level 2 · Customize"
          title="Tune your disclosure"
          subtitle="Optional. Adjust how your status is published."
          collapsible
          open={showCustomize}
          onToggle={() => setShowCustomize(v => !v)}
        >
          {/* Privacy Mode presets */}
          <SubSection title="Privacy Mode" desc="Choose a preset. You can switch at any time.">
            <div className="grid sm:grid-cols-3 gap-3">
              {PRESETS.map(p => {
                const active = state.preset === p.id;
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPreset(p.id)}
                    className={cn(
                      "text-left rounded-2xl border p-4 transition",
                      active
                        ? "border-accent bg-accent/5 ring-2 ring-accent/30"
                        : "ghost-border bg-surface-low hover:bg-surface",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={cn("w-4 h-4", active ? "text-accent" : "text-muted-foreground")} />
                      <span className="font-headline font-bold text-primary text-sm">{p.title}</span>
                      {active && <CheckCircle2 className="w-3.5 h-3.5 text-accent ml-auto" />}
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">{p.desc}</p>
                  </button>
                );
              })}
            </div>
          </SubSection>

          {/* Status Mapping */}
          <SubSection title="Status Mapping" desc="Detected by AI → What others see. AI always keeps the real status internally.">
            <div className="rounded-2xl ghost-border overflow-hidden bg-surface-low">
              <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60">
                <span>Detected</span><span /><span>Published</span><span>Hide</span>
              </div>
              <div className="divide-y divide-border/40">
                {ALL_DETECTED.map(d => (
                  <div key={d} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2 px-4 py-2.5">
                    <span className="text-sm font-medium text-primary">{DETECTED_LABEL[d]}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                    <Select value={state.mapping[d]} onValueChange={(v) => handleMapping(d, v as PublishedStatus)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ALL_PUBLISHED.map(p => (
                          <SelectItem key={p} value={p}>{PUBLISHED_LABEL[p]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button
                      onClick={() => toggleHidden(d)}
                      className={cn(
                        "inline-flex items-center justify-center w-8 h-8 rounded-lg transition",
                        state.hidden.includes(d) ? "bg-rose-50 text-rose-600" : "bg-surface ghost-border text-muted-foreground hover:text-primary",
                      )}
                      title={state.hidden.includes(d) ? "Hidden from all" : "Click to hide entirely"}
                    >
                      {state.hidden.includes(d) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </SubSection>

          {/* Audience Disclosure */}
          <SubSection title="Audience Disclosure" desc="Different audiences can see different versions of the same status.">
            <div className="rounded-2xl ghost-border bg-surface-low overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="text-left px-3 py-2 font-bold">Detected</th>
                    {ALL_AUDIENCES.map(a => (
                      <th key={a} className="text-left px-3 py-2 font-bold">{AUDIENCE_LABEL[a]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {(["driving", "meeting", "airport", "gym", "sleeping"] as DetectedStatus[]).map(d => (
                    <tr key={d}>
                      <td className="px-3 py-2 font-medium text-primary whitespace-nowrap">{DETECTED_LABEL[d]}</td>
                      {ALL_AUDIENCES.map(a => {
                        const v = state.audienceMapping[a]?.[d] ?? state.mapping[d];
                        return (
                          <td key={a} className="px-2 py-1.5">
                            <Select value={v} onValueChange={(val) => setAudienceMapping(a, d, val as PublishedStatus)}>
                              <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {ALL_PUBLISHED.map(p => (
                                  <SelectItem key={p} value={p}>{PUBLISHED_LABEL[p]}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SubSection>

          {/* Temporary Overrides */}
          <SubSection
            title="Temporary Overrides"
            desc="Vacation, conference, travel. Auto-restores after expiry."
            action={
              <button
                onClick={() => setOverrideOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90"
              >
                <Plus className="w-3.5 h-3.5" /> New override
              </button>
            }
          >
            {state.overrides.length === 0 ? (
              <p className="text-xs text-muted-foreground italic px-1">No active overrides.</p>
            ) : (
              <ul className="space-y-2">
                {state.overrides.map(o => {
                  const remaining = Math.max(0, Math.ceil((new Date(o.expiresAt).getTime() - Date.now()) / 86400000));
                  return (
                    <li key={o.id} className="flex items-center justify-between gap-3 rounded-2xl ghost-border bg-surface-low p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-primary">{o.label}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {remaining} day{remaining === 1 ? "" : "s"} remaining · {Object.entries(o.audienceMap).map(([a, s]) => `${AUDIENCE_LABEL[a as Audience]}→${s === "normal" ? "Normal" : PUBLISHED_LABEL[s as PublishedStatus]}`).join(" · ")}
                        </p>
                      </div>
                      <button
                        onClick={() => removeOverride(o.id)}
                        className="grid place-items-center w-8 h-8 rounded-lg ghost-border hover:bg-destructive/5 hover:text-destructive transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </SubSection>
        </SectionCard>

        {/* LEVEL 3 — Advanced */}
        <SectionCard
          eyebrow="Level 3 · Advanced"
          title="Trust, verification & governance"
          subtitle="Power-user and enterprise controls. Most people will never need this."
          collapsible
          open={showAdvanced}
          onToggle={() => setShowAdvanced(v => !v)}
        >
          <SubSection title="Account & Trust Model" desc="Determines whether AI signals can constrain published status.">
            <div className="grid sm:grid-cols-3 gap-3">
              {ACCOUNT_TYPES.map(t => {
                const active = state.accountType === t.id;
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setAccountType(t.id)}
                    className={cn(
                      "text-left rounded-2xl border p-4 transition",
                      active ? "border-accent bg-accent/5 ring-2 ring-accent/30" : "ghost-border bg-surface-low hover:bg-surface",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={cn("w-4 h-4", active ? "text-accent" : "text-muted-foreground")} />
                      <span className="font-headline font-bold text-primary text-sm">{t.label}</span>
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">{t.desc}</p>
                  </button>
                );
              })}
            </div>
          </SubSection>

          <SubSection title="Platform Rule" desc="">
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900 flex gap-3">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">Users may reduce specificity. Users may not fabricate verified activities.</p>
                <p className="mt-1 opacity-90">
                  Privacy protects the user. Trust protects the platform. Both coexist — generalization is always allowed, but in Professional / Enterprise mode you cannot publish "Available" when AI has verified you're in a Meeting.
                </p>
              </div>
            </div>
          </SubSection>

          <SubSection title="Reset" desc="Restore all defaults.">
            <button
              onClick={() => { reset(); toast({ title: "Defaults restored" }); }}
              className="px-4 py-2 rounded-full ghost-border text-xs font-semibold text-primary hover:bg-surface"
            >
              Restore privacy defaults
            </button>
          </SubSection>
        </SectionCard>
      </div>

      <NewOverrideDialog
        open={overrideOpen}
        onOpenChange={setOverrideOpen}
        onSave={(o) => { addOverride(o); setOverrideOpen(false); toast({ title: "Override active", description: o.label }); }}
      />
    </AppShell>
  );
};

/* ---------- Helpers ---------- */

const SectionCard = ({
  eyebrow, title, subtitle, children, collapsible, open, onToggle,
}: {
  eyebrow: string; title: string; subtitle?: string; children: React.ReactNode;
  collapsible?: boolean; open?: boolean; onToggle?: () => void;
}) => (
  <section className="rounded-3xl bg-surface-lowest ghost-border p-5 shadow-ambient">
    <button
      type="button"
      onClick={onToggle}
      disabled={!collapsible}
      className={cn("w-full flex items-start justify-between gap-4 text-left", collapsible && "cursor-pointer")}
    >
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
        <h3 className="mt-0.5 font-headline text-base font-bold text-primary">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {collapsible && (
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground mt-1 transition-transform", open && "rotate-180")} />
      )}
    </button>
    {(!collapsible || open) && <div className="mt-4 space-y-5">{children}</div>}
  </section>
);

const SubSection = ({ title, desc, action, children }: { title: string; desc?: string; action?: React.ReactNode; children: React.ReactNode }) => (
  <div>
    <div className="flex items-end justify-between gap-3 mb-2">
      <div>
        <p className="text-sm font-headline font-bold text-primary">{title}</p>
        {desc && <p className="text-[11px] text-muted-foreground">{desc}</p>}
      </div>
      {action}
    </div>
    {children}
  </div>
);

const DefaultPill = ({ icon: Icon, title, desc }: { icon: typeof Eye; title: string; desc: string }) => (
  <div className="rounded-2xl ghost-border bg-surface-low p-3">
    <div className="flex items-center gap-2">
      <span className="grid place-items-center w-7 h-7 rounded-lg bg-accent/10 text-accent">
        <Icon className="w-3.5 h-3.5" />
      </span>
      <p className="text-xs font-bold text-primary">{title}</p>
    </div>
    <p className="mt-1.5 text-[11px] text-muted-foreground">{desc}</p>
  </div>
);

const NewOverrideDialog = ({
  open, onOpenChange, onSave,
}: {
  open: boolean; onOpenChange: (b: boolean) => void; onSave: (o: TemporaryOverride) => void;
}) => {
  const [label, setLabel] = useState("Vacation");
  const [days, setDays] = useState(14);
  const [clients, setClients] = useState<PublishedStatus>("busy");
  const [publicAud, setPublicAud] = useState<PublishedStatus>("offline");
  const [family, setFamily] = useState<PublishedStatus | "normal">("normal");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>New temporary override</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Reason</label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {OVERRIDE_TEMPLATES.map(t => (
                <button key={t} onClick={() => setLabel(t)}
                  className={cn("px-2.5 py-1 rounded-full text-[11px] border transition",
                    label === t ? "border-accent bg-accent/10 text-accent" : "ghost-border bg-surface-low text-muted-foreground hover:text-primary")}>
                  {t}
                </button>
              ))}
            </div>
            <Input className="mt-2 h-9 text-sm" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Duration (days)</label>
            <Input type="number" min={1} max={365} className="mt-1 h-9 text-sm" value={days} onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 1))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <AudienceField label="Clients" value={clients} onChange={setClients} />
            <AudienceField label="Public" value={publicAud} onChange={setPublicAud} />
            <AudienceField label="Family" value={family} onChange={setFamily} allowNormal />
          </div>
        </div>
        <DialogFooter>
          <button onClick={() => onOpenChange(false)} className="px-3 py-1.5 rounded-full ghost-border text-xs font-semibold">Cancel</button>
          <button
            onClick={() => onSave({
              id: crypto.randomUUID(),
              label,
              expiresAt: durationDays(days),
              audienceMap: { clients, public: publicAud, vip_family: family },
            })}
            className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold"
          >
            Activate override
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AudienceField = <T extends string>({ label, value, onChange, allowNormal }: { label: string; value: T; onChange: (v: T) => void; allowNormal?: boolean }) => (
  <div>
    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</label>
    <Select value={value} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
      <SelectContent>
        {allowNormal && <SelectItem value="normal">Normal</SelectItem>}
        {(["available", "busy", "focus", "away", "offline", "unavailable"] as PublishedStatus[]).map(p => (
          <SelectItem key={p} value={p}>{PUBLISHED_LABEL[p]}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export default DisclosureCenter;