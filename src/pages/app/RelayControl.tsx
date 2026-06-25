import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Search, ArrowLeft, Radio } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { contacts } from "@/lib/mockData";
import {
  useRelayState, AUDIENCE_LABEL, formatRule, formatStatus, fmt12,
  durationToDate, type Audience, type RuleMode, type AudienceRule, type ContactOverride,
} from "@/lib/relayStore";

type FilterId = "all" | "active" | "expiring" | "always" | "hidden" | "custom";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All Contacts" },
  { id: "active", label: "Active Overrides" },
  { id: "expiring", label: "Expiring Soon" },
  { id: "always", label: "Always Visible" },
  { id: "hidden", label: "Hidden" },
  { id: "custom", label: "Custom Schedule" },
];

const AUDIENCES: Audience[] = ["colleague", "client", "friend", "vip_family"];
const MODES: { id: RuleMode; label: string }[] = [
  { id: "always", label: "Always Visible" },
  { id: "hidden", label: "Hidden" },
  { id: "office", label: "Office Hours" },
  { id: "custom", label: "Custom Window" },
];
const DURATIONS: { id: "today" | "3d" | "1w" | "2w" | "1mo" | "custom" | "permanent"; label: string }[] = [
  { id: "permanent", label: "Permanent" },
  { id: "today", label: "Today" },
  { id: "3d", label: "3 Days" },
  { id: "1w", label: "1 Week" },
  { id: "2w", label: "2 Weeks" },
  { id: "1mo", label: "1 Month" },
  { id: "custom", label: "Custom Date" },
];

const RelayControl = () => {
  const { state, setAudienceDefault, assignAudience, setOverride, resolveRule } = useRelayState();
  const [filter, setFilter] = useState<FilterId>("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = Date.now();
    return contacts.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q)) return false;
      const ov = state.overrides[c.id];
      switch (filter) {
        case "active": return !!ov;
        case "expiring": return !!ov?.expiresAt && new Date(ov.expiresAt).getTime() - now < 7 * 86400000;
        case "always": return ov?.mode === "always";
        case "hidden": return ov?.mode === "hidden";
        case "custom": return ov?.mode === "custom";
        default: return true;
      }
    });
  }, [filter, search, state.overrides]);

  return (
    <AppShell subtitle="Settings" title="Relay Control">
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-xs">
          <Link to="/app/settings" className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Settings
          </Link>
        </div>

        <div className="rounded-3xl bg-surface-lowest ghost-border p-5 shadow-ambient">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-accent" />
            <h2 className="font-headline font-bold text-primary">Audience Defaults</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Set the baseline visibility for each audience. Changes apply to every contact using the default.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            {AUDIENCES.map((a) => (
              <AudienceCard
                key={a}
                audience={a}
                rule={state.audienceDefaults[a]}
                onChange={(r) => setAudienceDefault(a, r)}
              />
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-surface-lowest ghost-border p-5 shadow-ambient">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-headline font-bold text-primary">Contact Relay Overrides</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Per-contact exceptions override the audience default. Time-bound overrides revert automatically.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search contacts…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-8 text-sm"
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "px-2.5 h-7 rounded-full text-[11px] font-semibold border transition",
                  filter === f.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-surface-low text-primary border-border hover:bg-surface",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <ul className="mt-4 divide-y divide-border/60 rounded-2xl overflow-hidden border border-border/60">
            {filtered.map((c) => {
              const ov = state.overrides[c.id];
              const { rule, audience } = resolveRule(c.id);
              return (
                <li key={c.id} className="grid grid-cols-12 items-center gap-2 px-3 py-2.5 bg-surface-lowest">
                  <div className="col-span-12 sm:col-span-3 min-w-0">
                    <p className="text-sm font-semibold text-primary truncate">{c.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{c.title}</p>
                  </div>
                  <div className="col-span-6 sm:col-span-2">
                    <AudienceSelect
                      value={audience}
                      onChange={(v) => assignAudience(c.id, v)}
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-3 text-[11px] text-muted-foreground truncate">
                    {formatRule(rule)}
                  </div>
                  <div className="col-span-9 sm:col-span-3">
                    <span className={cn(
                      "inline-flex items-center px-2 h-6 rounded-full text-[10px] font-semibold",
                      ov ? "bg-amber-500/15 text-amber-700" : "bg-emerald-500/10 text-emerald-700",
                    )}>
                      {formatStatus(ov)}
                    </span>
                  </div>
                  <div className="col-span-3 sm:col-span-1 flex justify-end">
                    <button
                      onClick={() => setEditing(c.id)}
                      className="grid place-items-center w-8 h-8 rounded-full hover:bg-surface-low text-primary"
                      title="Edit relay visibility"
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-xs text-muted-foreground">
                No contacts match this filter.
              </li>
            )}
          </ul>
        </div>
      </div>

      {editing && (
        <OverrideDialog
          contactId={editing}
          contactName={contacts.find((c) => c.id === editing)?.name ?? ""}
          current={state.overrides[editing]}
          inheritedRule={resolveRule(editing).rule}
          onClose={() => setEditing(null)}
          onSave={(ov) => { setOverride(editing, ov); setEditing(null); }}
        />
      )}
    </AppShell>
  );
};

const AudienceCard = ({
  audience, rule, onChange,
}: { audience: Audience; rule: AudienceRule; onChange: (r: AudienceRule) => void }) => (
  <div className="rounded-2xl border border-border/70 bg-surface-low p-3">
    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
      {AUDIENCE_LABEL[audience]}
    </p>
    <div className="mt-2 grid grid-cols-2 gap-1.5">
      {MODES.map((m) => {
        const on = rule.mode === m.id;
        return (
          <button
            key={m.id}
            onClick={() => onChange(
              m.id === "custom"
                ? { mode: "custom", window: rule.window ?? { from: "09:00", to: "18:00" } }
                : { mode: m.id },
            )}
            className={cn(
              "px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition text-left",
              on ? "border-accent bg-accent/10 text-primary"
                 : "border-border bg-surface-lowest text-muted-foreground hover:bg-surface",
            )}
          >
            {m.label}
          </button>
        );
      })}
    </div>
    {rule.mode === "custom" && (
      <div className="mt-2 flex items-center gap-2 text-[11px]">
        <label className="font-semibold text-muted-foreground">From</label>
        <input
          type="time"
          value={rule.window?.from ?? "09:00"}
          onChange={(e) => onChange({ mode: "custom", window: { from: e.target.value, to: rule.window?.to ?? "18:00" } })}
          className="h-7 px-2 rounded-md border border-border bg-surface-lowest"
        />
        <label className="font-semibold text-muted-foreground">To</label>
        <input
          type="time"
          value={rule.window?.to ?? "18:00"}
          onChange={(e) => onChange({ mode: "custom", window: { from: rule.window?.from ?? "09:00", to: e.target.value } })}
          className="h-7 px-2 rounded-md border border-border bg-surface-lowest"
        />
      </div>
    )}
    <p className="mt-2 text-[10px] text-muted-foreground">
      Current: <span className="font-semibold text-primary">{formatRule(rule)}</span>
    </p>
  </div>
);

const AudienceSelect = ({ value, onChange }: { value: Audience; onChange: (v: Audience) => void }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button className="inline-flex items-center gap-1 px-2 h-7 rounded-md border border-border bg-surface-lowest text-[11px] font-semibold text-primary hover:bg-surface">
        {AUDIENCE_LABEL[value]} <span className="text-muted-foreground">▾</span>
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start">
      {AUDIENCES.map((a) => (
        <DropdownMenuItem key={a} onClick={() => onChange(a)}>{AUDIENCE_LABEL[a]}</DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

const OverrideDialog = ({
  contactId, contactName, current, inheritedRule, onClose, onSave,
}: {
  contactId: string;
  contactName: string;
  current?: ContactOverride;
  inheritedRule: AudienceRule;
  onClose: () => void;
  onSave: (ov: Omit<ContactOverride, "contactId"> | null) => void;
}) => {
  const [mode, setMode] = useState<RuleMode | "default">(current?.mode ?? "default");
  const [from, setFrom] = useState(current?.window?.from ?? "08:00");
  const [to, setTo] = useState(current?.window?.to ?? "23:00");
  const [duration, setDuration] = useState<typeof DURATIONS[number]["id"]>(
    current?.expiresAt ? "custom" : "permanent",
  );
  const [customDate, setCustomDate] = useState<string>(
    current?.expiresAt ? current.expiresAt.slice(0, 10) : new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  );

  const save = () => {
    if (mode === "default") return onSave(null);
    const expiresAt = duration === "permanent" ? undefined
      : duration === "custom" ? new Date(customDate + "T23:59:59").toISOString()
      : durationToDate(duration);
    onSave({
      mode,
      window: mode === "custom" ? { from, to } : undefined,
      expiresAt,
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Relay Visibility · {contactName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Inherits from audience: <span className="font-semibold text-primary">{formatRule(inheritedRule)}</span>
          </p>

          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-muted-foreground mb-1.5">Visibility</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[{ id: "default" as const, label: "Use Audience Default" }, ...MODES].map((m) => {
                const on = mode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={cn(
                      "px-2.5 py-2 rounded-lg text-xs font-semibold border text-left transition",
                      on ? "border-accent bg-accent/10 text-primary"
                         : "border-border bg-surface-lowest text-muted-foreground hover:bg-surface",
                    )}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {mode === "custom" && (
            <div className="flex items-center gap-2 text-xs">
              <label className="font-semibold text-muted-foreground">From</label>
              <input type="time" value={from} onChange={(e) => setFrom(e.target.value)} className="h-8 px-2 rounded-md border border-border bg-surface-lowest" />
              <label className="font-semibold text-muted-foreground">To</label>
              <input type="time" value={to} onChange={(e) => setTo(e.target.value)} className="h-8 px-2 rounded-md border border-border bg-surface-lowest" />
              <span className="text-muted-foreground">({fmt12(from)}–{fmt12(to)})</span>
            </div>
          )}

          {mode !== "default" && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-muted-foreground mb-1.5">Duration</p>
              <div className="grid grid-cols-3 gap-1.5">
                {DURATIONS.map((d) => {
                  const on = duration === d.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setDuration(d.id)}
                      className={cn(
                        "px-2 py-1.5 rounded-md text-[11px] font-semibold border",
                        on ? "border-accent bg-accent/10 text-primary"
                           : "border-border bg-surface-lowest text-muted-foreground hover:bg-surface",
                      )}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
              {duration === "custom" && (
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <label className="font-semibold text-muted-foreground">Expiry</label>
                  <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} className="h-8 px-2 rounded-md border border-border bg-surface-lowest" />
                </div>
              )}
              <p className="mt-2 text-[10px] text-muted-foreground">
                When the expiry is reached, this contact reverts to the audience default automatically.
              </p>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          {current && (
            <button
              onClick={() => onSave(null)}
              className="px-3 h-9 rounded-md border border-border bg-surface-lowest text-xs font-semibold text-rose-600 hover:bg-rose-500/5"
            >
              Clear override
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 h-9 rounded-md border border-border bg-surface-lowest text-xs font-semibold text-primary hover:bg-surface"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="px-4 h-9 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90"
          >
            Save
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RelayControl;