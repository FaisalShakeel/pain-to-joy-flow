import { useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Calendar as CalIcon, Briefcase, Radio, Zap, Video, MapPin, Sparkles,
  Globe, Lock, Users as UsersIcon, Timer, ChevronLeft, ChevronRight, CalendarPlus,
  Eye, Shield,
} from "lucide-react";
import { generateSlotTimes, type SlotModule, type SlotFormat, type SlotAccessRule } from "@/lib/slotsStore";

export type DateMode = "single" | "multi" | "range";

export interface WizardOutput {
  dates: string[];                 // ISO yyyy-mm-dd
  windowStart: number;             // hour
  windowEnd: number;               // hour
  module: SlotModule;
  format: SlotFormat;              // online/onsite/hybrid (for meeting & webinar)
  venue?: string;
  qsCallMin: 3 | 5 | 8;            // for quick sync
  duration: number;                // minutes — derived for meeting/webinar
  seats: number;
  accessRule: SlotAccessRule;
  joinEarly: number;               // minutes
  providerDelay: number;           // minutes
  requireApproval: boolean;
}

const DEFAULTS: WizardOutput = {
  dates: [new Date().toISOString().slice(0, 10)],
  windowStart: 9,
  windowEnd: 18,
  module: "meeting",
  format: "online",
  venue: "",
  qsCallMin: 5,
  duration: 30,
  seats: 1,
  accessRule: "public",
  joinEarly: 5,
  providerDelay: 5,
  requireApproval: false,
};

const STEPS = [
  { id: "date",    label: "Date",    icon: CalIcon },
  { id: "window",  label: "Window",  icon: Timer },
  { id: "module",  label: "Module",  icon: Sparkles },
  { id: "rules",   label: "Rules",   icon: Shield },
  { id: "buffer",  label: "Buffer",  icon: Timer },
  { id: "preview", label: "Preview", icon: Eye },
] as const;

const moduleMeta: Record<SlotModule, { label: string; icon: any; hint: string }> = {
  meeting:   { label: "Meeting",   icon: Briefcase, hint: "1:1 or small team session" },
  webinar:   { label: "Webinar",   icon: Radio,     hint: "Group session with capacity" },
  quicksync: { label: "Quick Sync",icon: Zap,       hint: "3 / 5 / 8 minute calls" },
};

const accessMeta: Record<SlotAccessRule, { label: string; icon: any; cls: string }> = {
  public:  { label: "Public",      icon: Globe,    cls: "bg-emerald-500/15 text-emerald-700" },
  private: { label: "Private",     icon: Lock,     cls: "bg-slate-500/15 text-slate-700" },
  invite:  { label: "Invite Only", icon: UsersIcon,cls: "bg-indigo-500/15 text-indigo-700" },
};

const SEAT_PRESETS = [1, 5, 10];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (w: WizardOutput) => void;
}

const SlotWizardDialog = ({ open, onOpenChange, onSave }: Props) => {
  const [step, setStep] = useState(0);
  const [w, setW] = useState<WizardOutput>(DEFAULTS);
  const [dateMode, setDateMode] = useState<DateMode>("single");
  const [rangeStart, setRangeStart] = useState<Date | undefined>();
  const [rangeEnd, setRangeEnd] = useState<Date | undefined>();
  const [seatCustom, setSeatCustom] = useState<number | "">("");

  const set = <K extends keyof WizardOutput>(k: K, v: WizardOutput[K]) =>
    setW((s) => ({ ...s, [k]: v }));

  const duration = w.module === "quicksync" ? w.qsCallMin : w.duration;

  // Real scheduling: subtract providerDelay from each slot end so total fits window.
  const generated = useMemo(
    () => generateSlotTimes(w.windowStart, w.windowEnd, duration, w.providerDelay),
    [w.windowStart, w.windowEnd, duration, w.providerDelay],
  );

  const handleSave = () => {
    onSave({ ...w, duration });
    onOpenChange(false);
    setStep(0);
    setW(DEFAULTS);
    setDateMode("single");
    setRangeStart(undefined); setRangeEnd(undefined);
  };

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border/50">
          <DialogTitle className="text-base font-headline">Slot Builder</DialogTitle>
          <DialogDescription className="text-xs">
            {STEPS[step].label} · Step {step + 1} of {STEPS.length}
          </DialogDescription>
          <div className="mt-3 flex items-center gap-1.5">
            {STEPS.map((st, i) => {
              const active = i === step, done = i < step;
              const Ic = st.icon;
              return (
                <button key={st.id} type="button" onClick={() => setStep(i)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-bold transition",
                    active && "bg-primary text-primary-foreground",
                    done && !active && "bg-primary/15 text-primary",
                    !active && !done && "bg-surface-low text-muted-foreground hover:text-primary",
                  )}>
                  <Ic className="w-3 h-3" />
                  <span className="hidden sm:inline truncate">{st.label}</span>
                </button>
              );
            })}
          </div>
        </DialogHeader>

        <div className="max-h-[65vh] overflow-hidden">
          {/* LEFT: stepper body */}
          <div className="p-5 overflow-y-auto space-y-5">
            {step === 0 && (
              <>
                <Group title="Date selection mode">
                  <Tiles
                    options={[
                      { v: "single", label: "Single", icon: CalIcon },
                      { v: "multi",  label: "Multiple", icon: CalIcon },
                      { v: "range",  label: "Range", icon: CalIcon },
                    ]}
                    value={dateMode}
                    onChange={(v) => {
                      setDateMode(v as DateMode);
                      setW((s) => ({ ...s, dates: [] }));
                      setRangeStart(undefined); setRangeEnd(undefined);
                    }}
                  />
                </Group>
                <Group title="Pick date(s)">
                  <div className="rounded-xl ghost-border bg-surface-low p-2 inline-block">
                    {dateMode === "single" && (
                      <Calendar
                        mode="single"
                        selected={w.dates[0] ? new Date(w.dates[0]) : undefined}
                        onSelect={(d) => d && set("dates", [d.toISOString().slice(0, 10)])}
                        className={cn("p-0 pointer-events-auto")}
                      />
                    )}
                    {dateMode === "multi" && (
                      <Calendar
                        mode="multiple"
                        selected={w.dates.map((d) => new Date(d))}
                        onSelect={(arr) =>
                          set("dates", (arr ?? []).map((d) => d.toISOString().slice(0, 10)))
                        }
                        className={cn("p-0 pointer-events-auto")}
                      />
                    )}
                    {dateMode === "range" && (
                      <Calendar
                        mode="range"
                        selected={{ from: rangeStart, to: rangeEnd }}
                        onSelect={(r: any) => {
                          setRangeStart(r?.from);
                          setRangeEnd(r?.to);
                          if (r?.from && r?.to) {
                            const days: string[] = [];
                            const d = new Date(r.from);
                            while (d <= r.to) {
                              days.push(d.toISOString().slice(0, 10));
                              d.setDate(d.getDate() + 1);
                            }
                            set("dates", days);
                          } else if (r?.from) {
                            set("dates", [r.from.toISOString().slice(0, 10)]);
                          }
                        }}
                        className={cn("p-0 pointer-events-auto")}
                      />
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {w.dates.length} date{w.dates.length === 1 ? "" : "s"} selected
                  </p>
                </Group>
              </>
            )}

            {step === 1 && (
              <Group title="Working window">
                <div className="grid grid-cols-2 gap-2">
                  <HourPicker label="Start" value={w.windowStart} onChange={(v) => set("windowStart", v)} />
                  <HourPicker label="End"   value={w.windowEnd}   onChange={(v) => set("windowEnd", v)} min={w.windowStart + 1} />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Window: {String(w.windowStart).padStart(2,"0")}:00 → {String(w.windowEnd).padStart(2,"0")}:00 ·{" "}
                  {(w.windowEnd - w.windowStart)}h
                </p>
              </Group>
            )}

            {step === 2 && (
              <>
                <Group title="Module type">
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(moduleMeta) as SlotModule[]).map((k) => {
                      const M = moduleMeta[k]; const active = w.module === k;
                      return (
                        <button key={k} onClick={() => {
                          set("module", k);
                          if (k === "quicksync") set("format", "online");
                        }}
                          className={cn(
                            "p-3 rounded-xl text-left transition ghost-border",
                            active ? "bg-primary text-primary-foreground shadow-glass" : "bg-surface-low hover:bg-primary/5",
                          )}>
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

                {w.module === "quicksync" ? (
                  <Group title="Call length">
                    <Tiles
                      options={[
                        { v: "3", label: "3 min", icon: Zap },
                        { v: "5", label: "5 min", icon: Zap },
                        { v: "8", label: "8 min", icon: Zap },
                      ]}
                      value={String(w.qsCallMin)}
                      onChange={(v) => set("qsCallMin", Number(v) as 3 | 5 | 8)}
                    />
                  </Group>
                ) : (
                  <>
                    <Group title="Format">
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          ["online", "Online", Video],
                          ["onsite", "Onsite", MapPin],
                          ["hybrid", "Both", Sparkles],
                        ] as const).map(([k, l, Ic]) => {
                          const active = w.format === k;
                          return (
                            <button key={k} onClick={() => set("format", k)}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition justify-center",
                                active ? "bg-primary text-primary-foreground shadow-glass" : "bg-surface-low text-muted-foreground hover:text-primary",
                              )}>
                              <Ic className="w-3.5 h-3.5" /> {l}
                            </button>
                          );
                        })}
                      </div>
                    </Group>

                    {(w.format === "onsite" || w.format === "hybrid") && (
                      <Group title="Venue">
                        <input
                          value={w.venue ?? ""}
                          onChange={(e) => set("venue", e.target.value)}
                          placeholder="Studio · DIFC Lvl 12"
                          className="w-full px-3 py-2 rounded-lg bg-surface-low ghost-border text-sm outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </Group>
                    )}

                    <Group title={`${w.module === "webinar" ? "Webinar" : "Meeting"} duration`}>
                      <Tiles
                        options={[15, 30, 45, 60, 90].map((n) => ({ v: String(n), label: `${n}m`, icon: Timer }))}
                        value={String(w.duration)}
                        onChange={(v) => set("duration", Number(v))}
                      />
                    </Group>
                  </>
                )}
              </>
            )}

            {step === 3 && (
              <>
                {w.module === "webinar" && (
                <Group title="Seats / People limit">
                  <div className="flex flex-wrap gap-1.5">
                    {SEAT_PRESETS.map((n) => {
                      const active = w.seats === n && seatCustom === "";
                      return (
                        <button key={n} onClick={() => { set("seats", n); setSeatCustom(""); }}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-[11px] font-bold transition",
                            active ? "bg-primary text-primary-foreground shadow-glass" : "bg-surface-low text-muted-foreground hover:text-primary",
                          )}>
                          {n}
                        </button>
                      );
                    })}
                    <input
                      type="number" min={1} placeholder="Custom"
                      value={seatCustom}
                      onChange={(e) => {
                        const n = e.target.value === "" ? "" : Math.max(1, Number(e.target.value));
                        setSeatCustom(n);
                        if (n !== "") set("seats", n as number);
                      }}
                      className="w-24 px-3 py-1.5 rounded-full bg-surface-low ghost-border text-[11px] font-bold outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </Group>
                )}

                <Group title="Booking access">
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(accessMeta) as SlotAccessRule[]).map((a) => {
                      const M = accessMeta[a]; const active = w.accessRule === a;
                      return (
                        <button key={a} onClick={() => set("accessRule", a)}
                          className={cn(
                            "flex items-center gap-1.5 justify-center px-3 py-2 rounded-xl text-[11px] font-bold transition",
                            active ? "bg-primary text-primary-foreground" : `${M.cls} hover:opacity-90`,
                          )}>
                          <M.icon className="w-3.5 h-3.5" /> {M.label}
                        </button>
                      );
                    })}
                  </div>
                </Group>

                <Group title="Approval">
                  <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-low ghost-border cursor-pointer">
                    <input
                      type="checkbox"
                      checked={w.requireApproval}
                      onChange={(e) => set("requireApproval", e.target.checked)}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-xs font-bold text-primary">Approval required before booking</span>
                  </label>
                </Group>
              </>
            )}

            {step === 4 && (
              <>
                <Group title="Join early buffer">
                  <p className="text-[11px] text-muted-foreground mb-2">Client may join this many minutes before slot start.</p>
                  <Tiles
                    options={[0, 2, 5, 10].map((n) => ({ v: String(n), label: n === 0 ? "None" : `${n}m`, icon: Timer }))}
                    value={String(w.joinEarly)}
                    onChange={(v) => set("joinEarly", Number(v))}
                  />
                </Group>
                <Group title="Provider delay buffer">
                  <p className="text-[11px] text-muted-foreground mb-2">Provider grace window — also acts as gap between generated slots.</p>
                  <Tiles
                    options={[0, 5, 10, 15].map((n) => ({ v: String(n), label: n === 0 ? "None" : `${n}m`, icon: Timer }))}
                    value={String(w.providerDelay)}
                    onChange={(v) => set("providerDelay", Number(v))}
                  />
                </Group>
                <div className="rounded-xl bg-primary/5 ghost-border p-3 text-[11px] text-muted-foreground">
                  <p className="font-bold text-primary mb-1">Engine math</p>
                  Window {(w.windowEnd - w.windowStart)}h · slot {duration}m · gap {w.providerDelay}m →{" "}
                  <span className="font-bold text-primary">{generated.length} slots / day</span>
                </div>
              </>
            )}

            {step === 5 && (
              <PreviewPanel w={w} duration={duration} generated={generated} large />
            )}
          </div>
        </div>

        <DialogFooter className="px-5 py-3 border-t border-border/50 bg-surface-lowest">
          <button type="button" onClick={prev} disabled={step === 0}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full ghost-border bg-background text-xs font-bold text-primary disabled:opacity-40">
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={next}
              className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-elevated">
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button type="button" onClick={handleSave}
              disabled={w.dates.length === 0 || generated.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-primary text-primary-foreground text-xs font-bold shadow-elevated disabled:opacity-40">
              <CalendarPlus className="w-3.5 h-3.5" /> Save {w.dates.length * generated.length} slots
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
}: { options: { v: string; label: string; icon: any }[]; value: string; onChange: (v: string) => void }) => (
  <div className="flex flex-wrap gap-1.5">
    {options.map((o) => {
      const active = value === o.v; const Ic = o.icon;
      return (
        <button key={o.v} onClick={() => onChange(o.v)}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition",
            active ? "bg-primary text-primary-foreground shadow-glass" : "bg-surface-low text-muted-foreground hover:text-primary",
          )}>
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
    <select value={value} onChange={(e) => onChange(+e.target.value)}
      className="mt-1 w-full px-2 py-2 rounded-lg bg-surface-low ghost-border text-sm outline-none">
      {Array.from({ length: 24 }, (_, h) => h).filter((h) => h >= min).map((h) => (
        <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
      ))}
    </select>
  </label>
);

const PreviewPanel = ({
  w, duration, generated, large,
}: {
  w: WizardOutput; duration: number;
  generated: { start: string; end: string }[]; large?: boolean;
}) => {
  const M = moduleMeta[w.module];
  const A = accessMeta[w.accessRule];
  return (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Live preview</p>
        <p className="text-xs font-extrabold text-primary mt-0.5 flex items-center gap-1.5">
          <M.icon className="w-3.5 h-3.5" /> {M.label} · {duration}m
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {w.dates.length} day{w.dates.length === 1 ? "" : "s"} · {String(w.windowStart).padStart(2,"0")}:00–{String(w.windowEnd).padStart(2,"0")}:00
        </p>
        <div className="mt-1 flex items-center gap-1 flex-wrap">
          {w.module !== "quicksync" && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold">
              {w.format === "online" ? <Video className="w-2.5 h-2.5" /> :
               w.format === "onsite" ? <MapPin className="w-2.5 h-2.5" /> :
               <Sparkles className="w-2.5 h-2.5" />}
              {w.format === "hybrid" ? "Both" : w.format}
            </span>
          )}
          <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold", A.cls)}>
            <A.icon className="w-2.5 h-2.5" /> {A.label}
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-surface-low text-[10px] font-bold text-muted-foreground">
            {w.seats} seat{w.seats === 1 ? "" : "s"}
          </span>
        </div>
        {w.venue && (w.format === "onsite" || w.format === "hybrid") && w.module !== "quicksync" && (
          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5" /> {w.venue}
          </p>
        )}
        <p className="text-[10px] text-muted-foreground mt-1">
          Buffers: join early {w.joinEarly}m · provider delay {w.providerDelay}m
        </p>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
          {generated.length} slot{generated.length === 1 ? "" : "s"} per day · {generated.length * w.dates.length} total
        </p>
        {generated.length === 0 ? (
          <p className="text-[11px] text-muted-foreground italic">Window too short for this duration.</p>
        ) : (
          <div className={cn("grid gap-1.5", large ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-2")}>
            {generated.map((g) => (
              <div key={g.start}
                className="px-2 py-1.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold tabular-nums text-center ghost-border">
                {g.start}
                <span className="block text-[9px] text-muted-foreground font-semibold">→ {g.end}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {w.dates.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Days</p>
          <div className="flex flex-wrap gap-1">
            {w.dates.slice(0, 8).map((d) => (
              <span key={d} className="px-1.5 py-0.5 rounded bg-surface-low text-[10px] font-bold text-primary">
                {format(new Date(d), "MMM d")}
              </span>
            ))}
            {w.dates.length > 8 && (
              <span className="px-1.5 py-0.5 rounded bg-surface-low text-[10px] text-muted-foreground">
                +{w.dates.length - 8}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SlotWizardDialog;