import { useState } from "react";
import {
  CheckCircle2, Plus, Trash2, Power, PowerOff, Radio,
  Coffee, Brain, BriefcaseBusiness, Car, Moon, MapPin, CalendarClock, Sparkles,
  Home, Heart, Briefcase, Gem, Star, Users as UsersIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type StatusKey =
  | "available" | "focus" | "busy" | "driving" | "sleeping" | "away" | "meeting" | "custom";
type AudienceKey =
  | "family" | "friends" | "office" | "clients" | "vip" | "custom";
type DurationKey =
  | "always" | "today" | "week" | "custom" | "until_disabled";

const STATUSES: { id: StatusKey; label: string; icon: typeof Coffee }[] = [
  { id: "available", label: "Available", icon: CheckCircle2 },
  { id: "focus",     label: "Focus Mode", icon: Brain },
  { id: "busy",      label: "Busy", icon: BriefcaseBusiness },
  { id: "driving",   label: "Driving", icon: Car },
  { id: "sleeping",  label: "Sleeping", icon: Moon },
  { id: "away",      label: "Away", icon: MapPin },
  { id: "meeting",   label: "Meeting", icon: CalendarClock },
  { id: "custom",    label: "Custom", icon: Sparkles },
];

const AUDIENCES: { id: AudienceKey; label: string; icon: typeof Home }[] = [
  { id: "family",  label: "Family",  icon: Home },
  { id: "friends", label: "Friends", icon: Heart },
  { id: "office",  label: "Office",  icon: Briefcase },
  { id: "clients", label: "Clients", icon: Gem },
  { id: "vip",     label: "VIP",     icon: Star },
  { id: "custom",  label: "Custom Group", icon: UsersIcon },
];

const DURATIONS: { id: DurationKey; label: string }[] = [
  { id: "always",   label: "Always Active" },
  { id: "today",    label: "Today Only" },
  { id: "week",     label: "This Week" },
  { id: "custom",   label: "Custom Schedule" },
  { id: "until_disabled", label: "Until Disabled" },
];

interface Rule {
  id: string;
  statuses: StatusKey[];
  audiences: AudienceKey[];
  duration: DurationKey;
  active: boolean;
}

const seedRules: Rule[] = [
  { id: "r1", statuses: ["available", "focus"], audiences: ["office", "clients"], duration: "always", active: true },
  { id: "r2", statuses: ["away", "sleeping"], audiences: ["family"], duration: "until_disabled", active: true },
];

const AwarenessRules = () => {
  const [rules, setRules] = useState<Rule[]>(seedRules);
  const [open, setOpen] = useState(false);
  const [statuses, setStatuses] = useState<StatusKey[]>([]);
  const [audiences, setAudiences] = useState<AudienceKey[]>([]);
  const [duration, setDuration] = useState<DurationKey>("always");

  const toggle = <T,>(arr: T[], v: T) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const reset = () => { setStatuses([]); setAudiences([]); setDuration("always"); };

  const activate = () => {
    if (!statuses.length || !audiences.length) {
      toast.error("Pick at least one status and audience");
      return;
    }
    setRules((r) => [
      { id: `r${Date.now()}`, statuses, audiences, duration, active: true },
      ...r,
    ]);
    toast.success("Awareness rule activated");
    reset(); setOpen(false);
  };

  return (
    <section className="rounded-2xl ghost-border bg-surface-lowest p-3 shadow-soft">
      <header className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="grid place-items-center w-6 h-6 rounded-lg bg-primary/10 text-primary">
            <Radio className="w-3.5 h-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground leading-none">
              Automated
            </p>
            <h4 className="text-sm font-bold text-primary leading-tight">Awareness Rules</h4>
          </div>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider hover:opacity-95 transition"
        >
          <Plus className={cn("w-3 h-3 transition", open && "rotate-45")} />
          {open ? "Close" : "New Rule"}
        </button>
      </header>

      {open && (
        <div className="rounded-xl bg-surface-low/60 p-2.5 space-y-3 mb-3">
          <Step n={1} label="Choose statuses to share">
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map((s) => {
                const I = s.icon; const on = statuses.includes(s.id);
                return (
                  <button key={s.id} onClick={() => setStatuses((a) => toggle(a, s.id))}
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold border transition",
                      on ? "bg-primary text-primary-foreground border-primary"
                         : "bg-surface-lowest text-primary border-border hover:bg-surface-low",
                    )}>
                    <I className="w-3 h-3" /> {s.label}
                  </button>
                );
              })}
            </div>
          </Step>
          <Step n={2} label="Choose audience">
            <div className="flex flex-wrap gap-1.5">
              {AUDIENCES.map((a) => {
                const I = a.icon; const on = audiences.includes(a.id);
                return (
                  <button key={a.id} onClick={() => setAudiences((x) => toggle(x, a.id))}
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold border transition",
                      on ? "bg-primary text-primary-foreground border-primary"
                         : "bg-surface-lowest text-primary border-border hover:bg-surface-low",
                    )}>
                    <I className="w-3 h-3" /> {a.label}
                  </button>
                );
              })}
            </div>
          </Step>
          <Step n={3} label="Choose duration">
            <div className="flex flex-wrap gap-1.5">
              {DURATIONS.map((d) => {
                const on = duration === d.id;
                return (
                  <button key={d.id} onClick={() => setDuration(d.id)}
                    className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-semibold border transition",
                      on ? "bg-primary text-primary-foreground border-primary"
                         : "bg-surface-lowest text-primary border-border hover:bg-surface-low",
                    )}>
                    {d.label}
                  </button>
                );
              })}
            </div>
          </Step>
          <div className="flex items-center justify-between pt-1">
            <p className="text-[10px] text-muted-foreground">
              Availock will auto-broadcast — no manual posts required.
            </p>
            <button onClick={activate}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-wider hover:opacity-95 transition">
              <Power className="w-3 h-3" /> Activate Rule
            </button>
          </div>
        </div>
      )}

      {rules.length === 0 ? (
        <p className="text-[11px] text-muted-foreground italic px-1 py-2">
          No rules yet — create one so people know when you're reachable, automatically.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {rules.map((r) => (
            <li key={r.id} className="flex items-start gap-2 rounded-xl bg-surface-low/40 p-2">
              <button
                onClick={() => setRules((rs) => rs.map((x) => x.id === r.id ? { ...x, active: !x.active } : x))}
                className={cn(
                  "shrink-0 grid place-items-center w-6 h-6 rounded-full transition",
                  r.active ? "bg-emerald-500/15 text-emerald-600" : "bg-surface-lowest text-muted-foreground",
                )}
                aria-label={r.active ? "Disable rule" : "Enable rule"}
              >
                {r.active ? <Power className="w-3 h-3" /> : <PowerOff className="w-3 h-3" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">When</span>
                  {r.statuses.map((s) => (
                    <span key={s} className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                      {STATUSES.find((x) => x.id === s)?.label}
                    </span>
                  ))}
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">tell</span>
                  {r.audiences.map((a) => (
                    <span key={a} className="px-1.5 py-0.5 rounded-full bg-gold/10 text-gold text-[10px] font-semibold">
                      {AUDIENCES.find((x) => x.id === a)?.label}
                    </span>
                  ))}
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {DURATIONS.find((d) => d.id === r.duration)?.label} · {r.active ? "Broadcasting" : "Paused"}
                </p>
              </div>
              <button
                onClick={() => setRules((rs) => rs.filter((x) => x.id !== r.id))}
                className="shrink-0 p-1 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                aria-label="Delete rule"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

const Step = ({ n, label, children }: { n: number; label: string; children: React.ReactNode }) => (
  <div>
    <div className="flex items-center gap-1.5 mb-1.5">
      <span className="grid place-items-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold">{n}</span>
      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{label}</span>
    </div>
    {children}
  </div>
);

export default AwarenessRules;