import { useState } from "react";
import { Phone, Radar, Users, Star, Globe, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useCallWatchSettings, type CallWatchScope } from "@/lib/callWatchSettingsStore";
import { feedback } from "@/lib/feedback";

const scopeOptions: { id: CallWatchScope; label: string; desc: string; icon: typeof Globe }[] = [
  { id: "everyone", label: "Everyone", desc: "Anyone on Availock can add you to Call Watch", icon: Globe },
  { id: "contacts", label: "Contacts only", desc: "Only your saved contacts can watch you", icon: Users },
  { id: "priority", label: "Priority Circle", desc: "Only VIP / priority contacts can watch you", icon: Star },
  { id: "nobody",   label: "No one", desc: "Hide the Call Watch action from your profile", icon: EyeOff },
];

const CallWatchSettingsPanel = () => {
  const { settings, setSettings } = useCallWatchSettings();
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent inline-flex items-center gap-1.5">
            <Radar className="w-3 h-3 text-emerald-600" /> Call Watch
          </p>
          <h3 className="mt-1 font-headline font-bold text-primary">
            Let people know when you're free
          </h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-md">
            When on, others can tap the Call Watch icon on your contact tile and get notified the moment you're available. Turn it off to hide the option entirely.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn(
            "grid place-items-center w-9 h-9 rounded-xl",
            settings.enabled ? "bg-emerald-500/15 text-emerald-600" : "bg-surface-low text-muted-foreground",
          )}>
            <Phone className="w-4 h-4" />
          </span>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="grid place-items-center w-8 h-8 rounded-full bg-surface-low hover:bg-surface text-primary transition"
          >
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {open && (<>
      {/* On/Off */}
      <label className="mt-5 flex items-center justify-between gap-3 p-4 rounded-2xl bg-surface-low ghost-border">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary">Call Watch availability</p>
          <p className="text-[11px] text-muted-foreground">
            {settings.enabled
              ? "On — the Call Watch icon shows on your Explore tile."
              : "Off — the Call Watch icon is hidden from your Explore tile."}
          </p>
        </div>
        <Switch
          checked={settings.enabled}
          onCheckedChange={(v) => { setSettings({ enabled: v }); feedback(v ? "callwatch.on" : "callwatch.off"); }}
        />
      </label>

      {/* Visibility scope */}
      <div className={cn("mt-5 transition", !settings.enabled && "opacity-50 pointer-events-none")}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Who can use Call Watch on you
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {scopeOptions.map((o) => {
            const active = settings.scope === o.id;
            const Icon = o.icon;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => setSettings({ scope: o.id })}
                className={cn(
                  "p-3 rounded-2xl border text-left transition",
                  active
                    ? "border-emerald-500 bg-emerald-500/10 text-primary"
                    : "border-border bg-surface-low text-muted-foreground hover:text-primary",
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className={cn("w-3.5 h-3.5", active ? "text-emerald-600" : "text-muted-foreground")} />
                  <p className="text-sm font-semibold">{o.label}</p>
                </div>
                <p className="text-[10px] mt-0.5">{o.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
      </>)}
    </div>
  );
};

export default CallWatchSettingsPanel;