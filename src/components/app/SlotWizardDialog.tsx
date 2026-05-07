import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Calendar as CalIcon, Repeat, Timer, Phone, Zap, Video, MapPin,
  Sparkles, Shield, Globe, Users as UsersIcon, Crown, Lock, Check,
  ChevronLeft, ChevronRight, CalendarPlus, Eye,
} from "lucide-react";

export type WizardCategory = "call" | "sync" | "meeting" | "venue";
export type WizardAccess = "public" | "contacts" | "approved" | "priority";
export type WizardBooking = "instant" | "approval";

export interface WizardSlot {
  date?: string;        // ISO yyyy-mm-dd
  repeat: "none" | "daily" | "weekdays" | "weekly";
  windowStart: number;  // hour
  windowEnd: number;    // hour
  bufferMin: 0 | 5 | 10 | 15;
  category: WizardCategory;
  duration: 5 | 10 | 15 | 30 | 60;
  access: WizardAccess;
  booking: WizardBooking;
  maxBookings: number;
}

const DEFAULTS: WizardSlot = {
  date: new Date().toISOString().slice(0, 10),
  repeat: "none",
  windowStart: 10,
  windowEnd: 12,
  bufferMin: 5,
  category: "call",
  duration: 15,
  access: "contacts",
  booking: "instant",
  maxBookings: 8,
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (slot: WizardSlot) => void;
}

const STEPS = [
  { id: "schedule", label: "Schedule", icon: CalIcon },
  { id: "window",   label: "Window",   icon: Timer },
  { id: "type",     label: "Type",     icon: Sparkles },
  { id: "rules",    label: "Rules",    icon: Shield },
  { id: "preview",  label: "Preview",  icon: Eye },
] as const;

const categoryMeta: Record<WizardCategory, { label: string; icon: any; hint: string; durations: WizardSlot["duration"][] }> = {
  call:    { label: "Call",    icon: Phone,    hint: "1:1 voice / video",        durations: [10, 15, 30] },
  sync:    { label: "Quick Sync", icon: Zap,   hint: "Rapid 3–10 min calls",     durations: [5, 10, 15] },
  meeting: { label: "Meeting", icon: Video,    hint: "Focused work session",     durations: [15, 30, 60] },
  venue:   { label: "Venue",   icon: MapPin,   hint: "On-site / in-person",      durations: [30, 60] },
};

const accessMeta: Record<WizardAccess, { label: string; icon: any; cls: string }> = {
  public:   { label: "Public",       icon: Globe,    cls: "bg-emerald-500/15 text-emerald-700" },
  contacts: { label: "Contacts",     icon: UsersIcon,cls: "bg-sky-500/15 text-sky-700" },
  approved: { label: "Link / Approved", icon: Check, cls: "bg-indigo-500/15 text-indigo-700" },
  priority: { label: "Priority",     icon: Crown,    cls: "bg-amber-500/20 text-amber-800" },
};

const toHHMM = (mins: number) =>
  `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

function generateSlots(s: WizardSlot): { time: string; end: string }[] {
  const start = s.windowStart * 60;
  const end = s.windowEnd * 60;
  const step = s.duration + s.bufferMin;
  const out: { time: string; end: string }[] = [];
  for (let t = start; t + s.duration <= end && out.length < s.maxBookings; t += step) {
    out.push({ time: toHHMM(t), end: toHHMM(t + s.duration) });
  }
  return out;
}

const SlotWizardDialog = ({ open, onOpenChange, onSave }: Props) => {
  const [step, setStep] = useState(0);
  const [slot, setSlot] = useState<WizardSlot>(DEFAULTS);
  const set = <K extends keyof WizardSlot>(k: K, v: WizardSlot[K]) =>
    setSlot((s) => ({ ...s, [k]: v }));

  const generated = useMemo(() => generateSlots(slot), [slot]);
  const Cat = categoryMeta[slot.category];

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const handleSave = () => {
    onSave(slot);
    onOpenChange(false);
    setStep(0);
    setSlot(DEFAULTS);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border/50">
          <DialogTitle className="text-base font-headline">Slot Builder</DialogTitle>
          <DialogDescription className="text-xs">
            Guided setup · {STEPS[step].label} ({step + 1}/{STEPS.length})
          </DialogDescription>

          {/* Stepper */}
          <div className="mt-3 flex items-center gap-1.5">
            {STEPS.map((st, i) => {
              const active = i === step;
              const done = i < step;
              const Ic = st.icon;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStep(i)}
                  className={cn(
                    "flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-bold transition",
                    active && "bg-primary text-primary-foreground",
                    done && !active && "bg-primary/15 text-primary",
                    !active && !done && "bg-surface-low text-muted-foreground hover:text-primary",
                  )}
                >
                  <Ic className="w-3 h-3" />
                  <span className="truncate hidden sm:inline">{st.label}</span>
                </button>
              );
            })}
          </div>
        </DialogHeader>

        <div className="grid md:grid-cols-[1fr_260px] gap-0 max-h-[60vh] overflow-hidden">
          {/* Step body */}
          <div className="p-5 overflow-y-auto space-y-5">
            {step === 0 && (
              <>
                <Group title="Date">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="w-full inline-flex items-center justify-between px-3 py-2 rounded-lg bg-surface-low ghost-border text-sm hover:bg-surface-low/80"
                      >
                        <span className={cn(!slot.date && "text-muted-foreground")}>
                          {slot.date ? format(new Date(slot.date), "PPP") : "Pick a date"}
                        </span>
                        <CalIcon className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[60]" align="start">
                      <Calendar
                        mode="single"
                        selected={slot.date ? new Date(slot.date) : undefined}
                        onSelect={(d) => d && set("date", d.toISOString().slice(0, 10))}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </Group>
                <Group title="Repeat">
                  <Tiles
                    options={[
                      { v: "none", label: "Once", icon: CalIcon },
                      { v: "weekdays", label: "Weekdays", icon: Repeat },
                      { v: "weekly", label: "Weekly", icon: Repeat },
                    ]}
                    value={slot.repeat}
                    onChange={(v) => set("repeat", v as WizardSlot["repeat"])}
                  />
                </Group>
              </>
            )}

            {step === 1 && (
              <>
                <Group title="Working window">
                  <div className="grid grid-cols-2 gap-2">
                    <HourPicker label="Start" value={slot.windowStart} onChange={(v) => set("windowStart", v)} />
                    <HourPicker label="End" value={slot.windowEnd} onChange={(v) => set("windowEnd", v)} min={slot.windowStart + 1} />
                  </div>
                </Group>
                <Group title="Buffer between bookings">
                  <Tiles
                    options={[0, 5, 10, 15].map((n) => ({ v: String(n), label: n === 0 ? "None" : `${n}m`, icon: Timer }))}
                    value={String(slot.bufferMin)}
                    onChange={(v) => set("bufferMin", Number(v) as WizardSlot["bufferMin"])}
                  />
                </Group>
              </>
            )}

            {step === 2 && (
              <>
                <Group title="Connection type">
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(categoryMeta) as WizardCategory[]).map((k) => {
                      const M = categoryMeta[k];
                      const active = slot.category === k;
                      return (
                        <button
                          key={k}
                          onClick={() => {
                            set("category", k);
                            if (!M.durations.includes(slot.duration)) set("duration", M.durations[0]);
                          }}
                          className={cn(
                            "p-3 rounded-xl text-left transition ghost-border",
                            active ? "bg-primary text-primary-foreground shadow-glass" : "bg-surface-low hover:bg-primary/5",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <M.icon className="w-4 h-4" />
                            <span className="text-xs font-extrabold">{M.label}</span>
                          </div>
                          <p className={cn("text-[10px] mt-1", active ? "opacity-80" : "text-muted-foreground")}>{M.hint}</p>
                        </button>
                      );
                    })}
                  </div>
                </Group>
                <Group title={`${Cat.label} duration`}>
                  <Tiles
                    options={Cat.durations.map((d) => ({ v: String(d), label: `${d}m`, icon: Timer }))}
                    value={String(slot.duration)}
                    onChange={(v) => set("duration", Number(v) as WizardSlot["duration"])}
                  />
                </Group>
              </>
            )}

            {step === 3 && (
              <>
                <Group title="Access">
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(accessMeta) as WizardAccess[]).map((a) => {
                      const M = accessMeta[a];
                      const active = slot.access === a;
                      return (
                        <button
                          key={a}
                          onClick={() => set("access", a)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold transition",
                            active ? "bg-primary text-primary-foreground" : `${M.cls} hover:opacity-90`,
                          )}
                        >
                          <M.icon className="w-3.5 h-3.5" /> {M.label}
                        </button>
                      );
                    })}
                  </div>
                </Group>
                <Group title="Booking">
                  <Tiles
                    options={[
                      { v: "instant", label: "Instant", icon: Check },
                      { v: "approval", label: "Approval", icon: Lock },
                    ]}
                    value={slot.booking}
                    onChange={(v) => set("booking", v as WizardBooking)}
                  />
                </Group>
                <Group title="Max bookings">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={slot.maxBookings}
                    onChange={(e) => set("maxBookings", Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-3 py-2 rounded-lg bg-surface-low ghost-border text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </Group>
              </>
            )}

            {step === 4 && (
              <PreviewPanel slot={slot} generated={generated} large />
            )}
          </div>

          {/* Live preview side panel */}
          <aside className="hidden md:block border-l border-border/50 bg-surface-lowest p-4 overflow-y-auto">
            <PreviewPanel slot={slot} generated={generated} />
          </aside>
        </div>

        <DialogFooter className="px-5 py-3 border-t border-border/50 bg-surface-lowest">
          <button
            type="button"
            onClick={prev}
            disabled={step === 0}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full ghost-border bg-background text-xs font-bold text-primary disabled:opacity-40"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-elevated"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-primary text-primary-foreground text-xs font-bold shadow-elevated"
            >
              <CalendarPlus className="w-3.5 h-3.5" /> Save slot
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-2">{title}</h4>
    {children}
  </div>
);

const Tiles = ({
  options, value, onChange,
}: {
  options: { v: string; label: string; icon: any }[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="flex flex-wrap gap-1.5">
    {options.map((o) => {
      const active = value === o.v;
      const Ic = o.icon;
      return (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition",
            active ? "bg-primary text-primary-foreground shadow-glass" : "bg-surface-low text-muted-foreground hover:text-primary",
          )}
        >
          <Ic className="w-3 h-3" /> {o.label}
        </button>
      );
    })}
  </div>
);

const HourPicker = ({
  label, value, onChange, min = 0,
}: { label: string; value: number; onChange: (v: number) => void; min?: number }) => (
  <label className="block">
    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(+e.target.value)}
      className="mt-1 w-full px-2 py-2 rounded-lg bg-surface-low ghost-border text-sm outline-none"
    >
      {Array.from({ length: 24 }, (_, h) => h).filter((h) => h >= min).map((h) => (
        <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
      ))}
    </select>
  </label>
);

const PreviewPanel = ({
  slot, generated, large,
}: { slot: WizardSlot; generated: { time: string; end: string }[]; large?: boolean }) => {
  const Cat = categoryMeta[slot.category];
  const A = accessMeta[slot.access];
  return (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Live preview</p>
        <p className="text-xs font-extrabold text-primary mt-0.5 flex items-center gap-1.5">
          <Cat.icon className="w-3.5 h-3.5" /> {Cat.label} · {slot.duration}m
          <span className="text-muted-foreground font-semibold">+{slot.bufferMin}m buffer</span>
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {slot.date ? format(new Date(slot.date), "EEE, MMM d") : "—"} ·{" "}
          {String(slot.windowStart).padStart(2, "0")}:00–{String(slot.windowEnd).padStart(2, "0")}:00
        </p>
        <span className={cn("inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold", A.cls)}>
          <A.icon className="w-2.5 h-2.5" /> {A.label}
        </span>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
          {generated.length} {Cat.label.toLowerCase()} slot{generated.length === 1 ? "" : "s"}
        </p>
        {generated.length === 0 ? (
          <p className="text-[11px] text-muted-foreground italic">Window too short for this duration.</p>
        ) : (
          <div className={cn("grid gap-1.5", large ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-2")}>
            {generated.map((g) => (
              <div
                key={g.time}
                className="px-2 py-1.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold tabular-nums text-center ghost-border"
              >
                {g.time}
                <span className="block text-[9px] text-muted-foreground font-semibold">→ {g.end}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SlotWizardDialog;