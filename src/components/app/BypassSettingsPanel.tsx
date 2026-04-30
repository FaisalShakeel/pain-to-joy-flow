import { Zap, ShieldCheck, Activity, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBypass, type BypassScope, type BypassWindow } from "./BypassContext";
import { contacts } from "@/lib/mockData";
import Avatar from "./Avatar";
import { Switch } from "@/components/ui/switch";

const scopeOptions: { id: BypassScope; label: string; desc: string }[] = [
  { id: "none", label: "No one", desc: "Bypass disabled for everyone" },
  { id: "selected", label: "Selected contacts", desc: "Only contacts you tag below" },
  { id: "priority-circle", label: "Priority Circle", desc: "Anyone marked Priority / VIP" },
  { id: "paid", label: "Paid users only", desc: "Requires a paid sender" },
];

const windowOptions: { id: BypassWindow; label: string }[] = [
  { id: "always", label: "Always allowed" },
  { id: "work-hours", label: "Work hours only" },
  { id: "respect-focus", label: "Respect Focus / Sleep / Driving" },
];

const BypassSettingsPanel = () => {
  const { settings, setSettings, toggleAllowed, usage } = useBypass();

  return (
    <div className="rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent inline-flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-gold" /> Priority Bypass
          </p>
          <h3 className="mt-1 font-headline font-bold text-primary">
            Granted privilege — not a default
          </h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-md">
            Allow trusted senders to skip protocol lanes and reach you instantly. Reach through when it truly matters.
          </p>
        </div>
        <span className="grid place-items-center w-9 h-9 rounded-xl bg-gold/15 text-gold shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </span>
      </div>

      {/* Scope */}
      <div className="mt-5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Who can use Priority Bypass
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {scopeOptions.map((o) => {
            const active = settings.scope === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => setSettings({ scope: o.id })}
                className={cn(
                  "p-3 rounded-2xl border text-left transition",
                  active
                    ? "border-gold bg-gold/10 text-primary"
                    : "border-border bg-surface-low text-muted-foreground hover:text-primary",
                )}
              >
                <p className="text-sm font-semibold">{o.label}</p>
                <p className="text-[10px] mt-0.5">{o.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Limits */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <LimitField
          label="Calls / contact / day"
          value={settings.callsPerContactPerDay}
          onChange={(v) => setSettings({ callsPerContactPerDay: v })}
        />
        <LimitField
          label="Messages / contact / day"
          value={settings.messagesPerContactPerDay}
          onChange={(v) => setSettings({ messagesPerContactPerDay: v })}
        />
      </div>

      {/* Time window */}
      <div className="mt-5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Time window
        </p>
        <div className="inline-flex flex-wrap gap-1.5">
          {windowOptions.map((w) => {
            const active = settings.window === w.id;
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => setSettings({ window: w.id })}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold border transition",
                  active
                    ? "border-gold bg-gold text-background"
                    : "border-border bg-surface-low text-muted-foreground hover:text-primary",
                )}
              >
                {w.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Allowed contacts (only when scope === selected) */}
      {settings.scope === "selected" && (
        <div className="mt-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Selected contacts ({settings.allowedContactIds.length})
          </p>
          <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {contacts.slice(0, 12).map((c) => {
              const on = settings.allowedContactIds.includes(c.id);
              return (
                <li key={c.id} className="flex items-center gap-3 p-2 rounded-xl bg-surface-low/60">
                  <Avatar initials={c.initials} accent={c.accent} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary truncate">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{c.relationship}</p>
                  </div>
                  <Switch checked={on} onCheckedChange={() => toggleAllowed(c.id)} />
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Activity tracking */}
      <div className="mt-5 p-4 rounded-2xl bg-surface-low/60 ghost-border">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <Activity className="w-3 h-3" /> Priority interruptions (today)
        </div>
        <p className="mt-1 font-headline font-extrabold text-primary text-2xl">
          {usage.length}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {settings.muted.length > 0 ? (
            <span className="inline-flex items-center gap-1">
              <BellOff className="w-3 h-3" /> {settings.muted.length} contact{settings.muted.length === 1 ? "" : "s"} muted
            </span>
          ) : "No one muted from bypass"}
        </p>
      </div>
    </div>
  );
};

function LimitField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="p-3 rounded-2xl ghost-border bg-surface-low/50">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-7 h-7 rounded-full bg-surface text-primary font-bold hover:bg-surface-container transition"
        >−</button>
        <span className="font-headline font-extrabold text-primary text-xl w-8 text-center">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(20, value + 1))}
          className="w-7 h-7 rounded-full bg-surface text-primary font-bold hover:bg-surface-container transition"
        >+</button>
      </div>
    </div>
  );
}

export default BypassSettingsPanel;