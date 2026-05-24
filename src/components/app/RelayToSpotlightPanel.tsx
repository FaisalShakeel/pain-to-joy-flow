import { Radio, Globe, Users, Briefcase, Heart, Home, UserCheck, Lock, Zap, AlertTriangle, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_RELAY, type RelayConfig, type RelayAudience, type RelayPermissions } from "./SpotlightContext";

const audienceOpts: { id: RelayAudience; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "public", label: "Public", icon: Globe },
  { id: "team", label: "Team", icon: Users },
  { id: "office", label: "Office", icon: Briefcase },
  { id: "friends", label: "Friends", icon: Heart },
  { id: "family", label: "Family", icon: Home },
  { id: "selected", label: "Selected", icon: UserCheck },
  { id: "private", label: "Private", icon: Lock },
];

const expiryOpts = ["1h", "3h", "today", "until slot ends", "tomorrow"];

const permissionOpts: { key: keyof RelayPermissions; label: string }[] = [
  { key: "booking", label: "Booking" },
  { key: "questions", label: "Questions" },
  { key: "rsvp", label: "RSVP" },
  { key: "quickJoin", label: "Quick join" },
  { key: "share", label: "Share" },
  { key: "reactions", label: "Reactions" },
  { key: "waitlist", label: "Waitlist" },
];

export { DEFAULT_RELAY };
export type { RelayConfig };

interface Props {
  value: RelayConfig;
  onChange: (next: RelayConfig) => void;
  onSuggest?: () => void;
  className?: string;
}

const RelayToSpotlightPanel = ({ value, onChange, onSuggest, className }: Props) => {
  const set = <K extends keyof RelayConfig>(k: K, v: RelayConfig[K]) => onChange({ ...value, [k]: v });
  const togglePerm = (k: keyof RelayPermissions) =>
    onChange({ ...value, permissions: { ...value.permissions, [k]: !value.permissions[k] } });
  const toggleInd = (k: keyof RelayConfig["indicators"]) =>
    onChange({ ...value, indicators: { ...value.indicators, [k]: !value.indicators[k] } });

  return (
    <section className={cn("rounded-2xl bg-surface-lowest ghost-border p-3 md:p-4", className)}>
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid place-items-center w-8 h-8 rounded-xl bg-gold/15 text-gold">
            <Radio className="w-3.5 h-3.5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">Operational relay</p>
            <h4 className="font-headline font-extrabold text-primary text-sm">Relay to Spotlight</h4>
          </div>
        </div>
        <Switch checked={value.enabled} onCheckedChange={(v) => set("enabled", v)} />
      </header>

      {value.enabled && (
        <div className="mt-4 space-y-4">
          {/* Audience */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Audience</p>
            <div className="flex flex-wrap gap-1.5">
              {audienceOpts.map(({ id, label, icon: Icon }) => {
                const on = value.audience === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => set("audience", id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold transition",
                      on ? "bg-primary text-primary-foreground" : "bg-surface-low text-muted-foreground hover:text-primary",
                    )}
                  >
                    <Icon className="w-3 h-3" /> {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Expiry */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Expires</p>
            <div className="flex flex-wrap gap-1.5">
              {expiryOpts.map((e) => {
                const on = value.expiry === e;
                return (
                  <button
                    key={e}
                    type="button"
                    onClick={() => set("expiry", e)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[11px] font-bold transition",
                      on ? "bg-primary text-primary-foreground" : "bg-surface-low text-muted-foreground hover:text-primary",
                    )}
                  >
                    {e}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Permissions */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Allow</p>
            <div className="flex flex-wrap gap-1.5">
              {permissionOpts.map(({ key, label }) => {
                const on = value.permissions[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => togglePerm(key)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[11px] font-bold transition ghost-border",
                      on ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" : "bg-surface-low text-muted-foreground hover:text-primary",
                    )}
                  >
                    {on ? "✓ " : ""}{label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Indicators */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Indicators</p>
            <div className="flex flex-wrap gap-1.5">
              {([
                ["live", "Live now", Zap],
                ["urgent", "Urgent", AlertTriangle],
                ["limited", "Limited access", Crown],
              ] as const).map(([k, label, Icon]) => {
                const on = value.indicators[k];
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => toggleInd(k)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition",
                      on ? "bg-amber-500/15 text-amber-800" : "bg-surface-low text-muted-foreground hover:text-primary",
                    )}
                  >
                    <Icon className="w-3 h-3" /> {label}
                  </button>
                );
              })}
            </div>
          </div>

          {onSuggest && (
            <button
              type="button"
              onClick={onSuggest}
              className="text-[11px] font-bold text-primary hover:text-accent inline-flex items-center gap-1"
            >
              ✨ Suggest relay copy
            </button>
          )}
        </div>
      )}
    </section>
  );
};

export default RelayToSpotlightPanel;