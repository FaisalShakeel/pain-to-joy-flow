import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, addDays, addWeeks } from "date-fns";
import {
  ArrowLeft, Zap, Calendar as CalIcon, Clock, Timer, Repeat, Lock, Check,
  Globe, Users as UsersIcon, Crown, Sparkles, Plus, Pencil, Trash2, Copy,
  ChevronRight, X, CheckCircle2,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ---------- Types ----------
type CallMin = 3 | 5 | 8;
type BufferMin = 1 | 2 | 3;
type Repeats = "none" | "daily" | "weekly" | "monthly";
type Booking = "instant" | "approval";
type Access = "public" | "contacts" | "priority" | "paid";

interface QSSlot {
  id: string;
  date: string; // ISO yyyy-mm-dd
  startMin: number; // minutes from 00:00
  endMin: number;
  callMin: CallMin;
  bufferMin: BufferMin;
  repeats: Repeats;
  weekdays?: number[]; // 0..6 if weekly
  booking: Booking;
  access: Access;
  createdAt: number;
}

// ---------- Helpers ----------
const fmtTime = (m: number) => {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const period = h >= 12 ? "PM" : "AM";
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${mm.toString().padStart(2, "0")} ${period}`;
};

const buildTimeline = (s: { startMin: number; endMin: number; callMin: number; bufferMin: number }) => {
  const items: { kind: "call" | "buffer"; start: number; end: number }[] = [];
  let t = s.startMin;
  while (t + s.callMin <= s.endMin) {
    items.push({ kind: "call", start: t, end: t + s.callMin });
    t += s.callMin;
  }
  return items;
};

const slotCount = (s: { startMin: number; endMin: number; callMin: number; bufferMin: number }) =>
  buildTimeline(s).filter((i) => i.kind === "call").length;

const accessMeta: Record<Access, { label: string; icon: React.ComponentType<any>; cls: string }> = {
  public:   { label: "Public",            icon: Globe,    cls: "bg-emerald-500/15 text-emerald-700" },
  contacts: { label: "Contacts only",     icon: UsersIcon,cls: "bg-sky-500/15 text-sky-700" },
  priority: { label: "Priority contacts", icon: Crown,    cls: "bg-amber-500/20 text-amber-800" },
  paid:     { label: "Paid users",        icon: Sparkles, cls: "bg-violet-500/15 text-violet-700" },
};

const weekdayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ---------- Defaults ----------
const blank = (): Omit<QSSlot, "id" | "createdAt"> => ({
  date: new Date().toISOString().slice(0, 10),
  startMin: 10 * 60,
  endMin: 10 * 60 + 20,
  callMin: 3,
  bufferMin: 1,
  repeats: "none",
  weekdays: [],
  booking: "instant",
  access: "contacts",
});

const seed: QSSlot[] = [
  {
    id: "qs1",
    date: addDays(new Date(), 2).toISOString().slice(0, 10),
    startMin: 10 * 60, endMin: 10 * 60 + 20,
    callMin: 3, bufferMin: 1,
    repeats: "weekly", weekdays: [6],
    booking: "instant", access: "priority",
    createdAt: Date.now() - 100000,
  },
];

// ---------- Page ----------
const QuickSyncBuilder = () => {
  const navigate = useNavigate();
  const [slots, setSlots] = useState<QSSlot[]>(seed);
  const [draft, setDraft] = useState<Omit<QSSlot, "id" | "createdAt"> & { id?: string }>(blank());
  const [step, setStep] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const isEditing = !!draft.id;
  const set = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const totalMin = Math.max(0, draft.endMin - draft.startMin);
  const count = slotCount({ startMin: draft.startMin, endMin: draft.endMin, callMin: draft.callMin, bufferMin: draft.bufferMin });
  const timeline = useMemo(() => buildTimeline(draft), [draft]);

  const reset = () => { setDraft(blank()); setStep(1); };

  const save = () => {
    if (totalMin <= 0) {
      toast({ title: "Time window invalid", description: "End time must be after start time." });
      return;
    }
    if (count === 0) {
      toast({ title: "Window too short", description: "Increase window or reduce call/buffer length." });
      return;
    }
    if (isEditing) {
      setSlots((p) => p.map((s) => (s.id === draft.id ? { ...s, ...draft, id: draft.id! } : s)));
      toast({ title: "Quick Sync updated" });
    } else {
      const next: QSSlot = { ...(draft as Omit<QSSlot, "id" | "createdAt">), id: `qs${Date.now()}`, createdAt: Date.now() };
      setSlots((p) => [next, ...p]);
      toast({ title: "Quick Sync created", description: `${count} mini-slots generated.` });
    }
    reset();
  };

  const editSlot = (s: QSSlot) => {
    setDraft({ ...s });
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteSlot = (id: string) => {
    setSlots((p) => p.filter((s) => s.id !== id));
    setConfirmDelete(null);
    toast({ title: "Quick Sync deleted" });
  };

  const duplicate = (s: QSSlot, kind: "tomorrow" | "nextweek" | "custom", customDate?: string) => {
    const base = new Date(s.date);
    const nd =
      kind === "tomorrow" ? addDays(base, 1) :
      kind === "nextweek" ? addWeeks(base, 1) :
      customDate ? new Date(customDate) : base;
    setSlots((p) => [{ ...s, id: `qs${Date.now()}`, date: nd.toISOString().slice(0, 10), createdAt: Date.now() }, ...p]);
    toast({ title: "Schedule cloned successfully and extended.", description: format(nd, "EEE, MMM d") });
  };

  return (
    <AppShell
      subtitle="Quick Sync Builder"
      title="Create it. Manage it. Stay interruption-free."
      actions={
        <button
          onClick={() => navigate("/app/availability/builder")}
          className="inline-flex items-center gap-2 px-3 py-2.5 rounded-full ghost-border bg-surface-lowest text-xs font-semibold text-primary hover:bg-surface-low"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Slot Builder
        </button>
      }
    >
      {/* CREATION PANEL */}
      <section className="rounded-3xl bg-surface-lowest ghost-border p-4 md:p-6 shadow-ambient">
        <div className="flex items-center gap-2 mb-4">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-primary text-primary-foreground">
            <Zap className="w-4 h-4" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">{isEditing ? "Edit" : "New"} Quick Sync</p>
            <h2 className="font-headline font-extrabold text-primary text-base md:text-lg">Quick Sync Builder</h2>
          </div>
          {isEditing && (
            <button onClick={reset} className="ml-auto text-[11px] font-bold text-muted-foreground hover:text-primary inline-flex items-center gap-1">
              <X className="w-3 h-3" /> Discard edit
            </button>
          )}
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
          {[
            "Date", "Window", "Call", "Buffer", "Preview", "Repeat", "Booking", "Access",
          ].map((label, i) => {
            const n = i + 1;
            const active = step === n;
            const done = step > n;
            return (
              <button
                key={label}
                onClick={() => setStep(n)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition",
                  active && "bg-primary text-primary-foreground",
                  !active && done && "bg-emerald-500/15 text-emerald-700",
                  !active && !done && "bg-surface-low text-muted-foreground hover:text-primary",
                )}
              >
                <span className={cn("grid place-items-center w-4 h-4 rounded-full text-[9px]", active ? "bg-primary-foreground/20" : done ? "bg-emerald-500/20" : "bg-background/60")}>
                  {done ? <Check className="w-2.5 h-2.5" /> : n}
                </span>
                {label}
              </button>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-5">
          {/* Step content */}
          <div className="space-y-4">
            {step === 1 && (
              <Section title="Step 1 — Select Date" icon={CalIcon} hint="Pick the day this Quick Sync block runs">
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-full md:w-auto inline-flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-surface-low ghost-border text-sm font-bold text-primary hover:bg-surface-low/80"
                    >
                      <CalIcon className="w-4 h-4 text-muted-foreground" />
                      <span>{format(new Date(draft.date), "EEEE, MMMM d, yyyy")}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[60]" align="start">
                    <Calendar
                      mode="single"
                      selected={new Date(draft.date)}
                      onSelect={(d) => d && set("date", d.toISOString().slice(0, 10))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </Section>
            )}

            {step === 2 && (
              <Section title="Step 2 — Time Window" icon={Clock} hint="The full block during which mini-calls run">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Start Time">
                    <TimeInput value={draft.startMin} onChange={(v) => set("startMin", v)} />
                  </Field>
                  <Field label="End Time">
                    <TimeInput value={draft.endMin} onChange={(v) => set("endMin", v)} />
                  </Field>
                </div>
                <p className="text-[11px] text-muted-foreground">Total window: <strong className="text-primary">{totalMin} min</strong></p>
              </Section>
            )}

            {step === 3 && (
              <Section title="Step 3 — Call Duration" icon={Timer} hint="How long is each mini-call?">
                <div className="flex flex-wrap gap-2">
                  {([3, 5, 8] as CallMin[]).map((d) => (
                    <Pill key={d} active={draft.callMin === d} onClick={() => set("callMin", d)}>{d} minutes</Pill>
                  ))}
                </div>
              </Section>
            )}

            {step === 4 && (
              <Section title="Step 4 — Buffer Time" icon={Timer} hint="Cooldown between each call">
                <div className="flex flex-wrap gap-2">
                  {([1, 2, 3] as BufferMin[]).map((b) => (
                    <Pill key={b} active={draft.bufferMin === b} onClick={() => set("bufferMin", b)}>{b} minute{b > 1 ? "s" : ""}</Pill>
                  ))}
                </div>
              </Section>
            )}

            {step === 5 && (
              <Section title="Step 5 — Auto Slot Generation" icon={Sparkles} hint="System calculates structured mini-slots">
                <div className="rounded-2xl bg-gradient-to-r from-fuchsia-500/15 to-pink-500/15 p-4">
                  <p className="text-[11px] uppercase tracking-wider text-fuchsia-900/70 font-bold">Total slots</p>
                  <p className="font-headline font-extrabold text-fuchsia-900 text-3xl">{count}</p>
                  <p className="text-[11px] text-fuchsia-900/70 mt-0.5">{draft.callMin}-min calls · {draft.bufferMin}-min buffer · {totalMin} min window</p>
                </div>
                <TimelineView items={timeline} />
              </Section>
            )}

            {step === 6 && (
              <Section title="Step 6 — Repeat" icon={Repeat} hint="Set up recurrence">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {([
                    ["none", "Do not repeat"],
                    ["daily", "Daily (D)"],
                    ["weekly", "Weekly (W)"],
                    ["monthly", "Monthly (M)"],
                  ] as const).map(([k, l]) => (
                    <button
                      key={k}
                      onClick={() => set("repeats", k)}
                      className={cn(
                        "p-3 rounded-xl text-xs font-bold transition text-left",
                        draft.repeats === k ? "bg-primary text-primary-foreground shadow-glass" : "bg-surface-low text-muted-foreground hover:text-primary",
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                {draft.repeats === "weekly" && (
                  <Field label="Weekdays">
                    <div className="flex flex-wrap gap-1.5">
                      {weekdayShort.map((d, i) => {
                        const on = draft.weekdays?.includes(i);
                        return (
                          <button
                            key={d}
                            onClick={() => {
                              const cur = new Set(draft.weekdays ?? []);
                              on ? cur.delete(i) : cur.add(i);
                              set("weekdays", Array.from(cur).sort());
                            }}
                            className={cn(
                              "w-10 h-10 rounded-full text-[11px] font-bold transition",
                              on ? "bg-primary text-primary-foreground" : "bg-surface-low text-muted-foreground hover:text-primary",
                            )}
                          >{d}</button>
                        );
                      })}
                    </div>
                  </Field>
                )}
              </Section>
            )}

            {step === 7 && (
              <Section title="Step 7 — Booking Mode" icon={Lock}>
                <div className="grid grid-cols-2 gap-2">
                  {(["instant", "approval"] as const).map((b) => (
                    <button
                      key={b}
                      onClick={() => set("booking", b)}
                      className={cn(
                        "p-3 rounded-xl text-left transition",
                        draft.booking === b ? "bg-primary text-primary-foreground shadow-glass" : "bg-surface-low text-muted-foreground hover:text-primary",
                      )}
                    >
                      <p className="text-xs font-bold flex items-center gap-1.5">
                        {b === "instant" ? <Check className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        {b === "instant" ? "Instant Booking" : "Approval Required"}
                      </p>
                      <p className="text-[10px] mt-1 opacity-80 leading-snug">
                        {b === "instant" ? "Auto-reserved on selection" : "Manual approval before booking"}
                      </p>
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {step === 8 && (
              <Section title="Step 8 — Access Control" icon={UsersIcon} hint="Choose who can book">
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(accessMeta) as Access[]).map((a) => {
                    const M = accessMeta[a];
                    return (
                      <button
                        key={a}
                        onClick={() => set("access", a)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition",
                          draft.access === a ? "bg-primary text-primary-foreground" : `${M.cls} hover:opacity-90`,
                        )}
                      >
                        <M.icon className="w-3.5 h-3.5" /> {M.label}
                      </button>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* Step nav */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className="px-4 py-2 rounded-full ghost-border text-xs font-bold text-muted-foreground hover:text-primary disabled:opacity-40"
              >
                Back
              </button>
              {step < 8 ? (
                <button
                  onClick={() => setStep((s) => Math.min(8, s + 1))}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-primary text-primary-foreground text-xs font-bold shadow-elevated"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={save}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-primary text-primary-foreground text-xs font-bold shadow-elevated"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> {isEditing ? "Update Quick Sync" : "Create Quick Sync"}
                </button>
              )}
            </div>
          </div>

          {/* Live preview card */}
          <aside className="rounded-2xl bg-gradient-vault text-primary-foreground p-4 shadow-elevated h-fit">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold">Live preview</p>
            <h4 className="font-headline font-extrabold text-base mt-1">{format(new Date(draft.date), "EEEE, MMM d")}</h4>
            <p className="text-[12px] text-primary-foreground/80 mt-0.5">
              {fmtTime(draft.startMin)} – {fmtTime(draft.endMin)}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
              <Stat label="Call" value={`${draft.callMin}m`} />
              <Stat label="Buffer" value={`${draft.bufferMin}m`} />
              <Stat label="Slots" value={`${count}`} />
              <Stat label="Repeat" value={draft.repeats === "none" ? "—" : draft.repeats[0].toUpperCase()} />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-primary-foreground/15 text-[10px] font-bold">
                {draft.booking === "instant" ? "Instant" : "Approval"}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-primary-foreground/15 text-[10px] font-bold">
                {accessMeta[draft.access].label}
              </span>
            </div>
          </aside>
        </div>
      </section>

      {/* ACTIVE SLOTS */}
      <section className="mt-6 rounded-3xl bg-surface-lowest ghost-border p-4 md:p-6 shadow-ambient">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">Manage</p>
            <h3 className="font-headline font-extrabold text-primary text-base md:text-lg">Active Quick Sync Slots</h3>
          </div>
          <span className="text-[11px] text-muted-foreground">{slots.length} active</span>
        </div>

        {slots.length === 0 ? (
          <p className="text-xs text-muted-foreground py-10 text-center">No Quick Sync blocks yet — create one above.</p>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {slots.map((s) => (
              <QuickSyncCard
                key={s.id}
                slot={s}
                onEdit={() => editSlot(s)}
                onDelete={() => setConfirmDelete(s.id)}
                onDuplicate={(k, d) => duplicate(s, k, d)}
              />
            ))}
          </div>
        )}
      </section>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this Quick Sync schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              The full Quick Sync block and all generated mini-slots will be removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && deleteSlot(confirmDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
};

// ---------- QuickSync Card ----------
const QuickSyncCard = ({
  slot, onEdit, onDelete, onDuplicate,
}: {
  slot: QSSlot;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: (kind: "tomorrow" | "nextweek" | "custom", customDate?: string) => void;
}) => {
  const [dupOpen, setDupOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const count = slotCount(slot);
  const allSlots = useMemo(
    () => buildTimeline(slot).filter((i) => i.kind === "call"),
    [slot],
  );
  const visibleSlots = expanded ? allSlots : allSlots.slice(0, 3);
  const A = accessMeta[slot.access];
  const date = new Date(slot.date);
  const isPast = date < new Date(new Date().toDateString());
  const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
  const status = isPast ? "expired" : isToday ? "active" : "upcoming";

  return (
    <article
      className={cn(
        "relative rounded-2xl ghost-border p-4 transition group",
        status === "active" && "bg-gradient-to-br from-primary/10 to-accent/10 ring-1 ring-primary/30 shadow-elevated",
        status === "upcoming" && "bg-surface-low hover:shadow-ambient",
        status === "expired" && "bg-surface-low/50 opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Zap className={cn("w-3.5 h-3.5", status === "active" ? "text-primary" : "text-muted-foreground")} />
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-wider",
              status === "active" ? "text-primary" : status === "expired" ? "text-muted-foreground" : "text-accent",
            )}>{status}</span>
          </div>
          <p className="font-headline font-extrabold text-primary text-sm mt-1 truncate">
            {format(date, "EEEE, MMM d")}
          </p>
          <p className="text-[12px] text-muted-foreground">
            {fmtTime(slot.startMin)} – {fmtTime(slot.endMin)}
          </p>
        </div>
        <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold shrink-0", A.cls)}>
          <A.icon className="w-3 h-3" /> {A.label}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px]">
        <Chip>{slot.callMin}-min calls</Chip>
        <Chip title="Participants may join early or extend slightly. Does not affect slot count.">
          {slot.bufferMin}-min flexible buffer
        </Chip>
        <Chip>{count} slots total</Chip>
        <Chip>
          <Repeat className="w-3 h-3" /> {slot.repeats === "none" ? "Once" : slot.repeats}
        </Chip>
      </div>

      {/* Individual slots list */}
      {allSlots.length > 0 && (
        <div className="mt-3 rounded-xl bg-surface-lowest ghost-border p-2">
          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 px-1">
            Slots
          </p>
          <ul className="space-y-0.5 text-[11px] font-mono">
            {visibleSlots.map((it, i) => (
              <li key={i} className="flex items-center justify-between px-1.5 py-1 rounded hover:bg-surface-low">
                <span className="text-primary font-bold">
                  {fmtTime(it.start)} – {fmtTime(it.end)}
                </span>
                <span className="text-[9px] text-muted-foreground font-sans">#{i + 1}</span>
              </li>
            ))}
          </ul>
          {allSlots.length > 3 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 w-full text-[10px] font-bold text-accent hover:text-primary py-1"
            >
              {expanded ? "Show less" : `View All Slots (${allSlots.length})`}
            </button>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className={cn(
          "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold",
          slot.booking === "instant" ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-800",
        )}>
          {slot.booking === "instant" ? <Check className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
          {slot.booking === "instant" ? "Instant" : "Approval"}
        </span>

        <div className="flex items-center gap-1">
          <Popover open={dupOpen} onOpenChange={setDupOpen}>
            <PopoverTrigger asChild>
              <button className="inline-flex items-center gap-1 px-2 h-8 rounded-lg ghost-border bg-surface-lowest hover:bg-primary/10 text-primary text-[10px] font-bold" aria-label="Clone schedule" title="Clone schedule — extend forward">
                <Copy className="w-3 h-3" /> Clone
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-44 p-1 z-[60]" align="end">
              <p className="px-2 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Clone schedule</p>
              <button onClick={() => { onDuplicate("nextweek"); setDupOpen(false); }} className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-surface-low">Next cycle (recommended)</button>
              <button onClick={() => { onDuplicate("tomorrow"); setDupOpen(false); }} className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-surface-low">Tomorrow</button>
              <button onClick={() => { setDupOpen(false); setCustomOpen(true); }} className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-surface-low">Pick end date…</button>
            </PopoverContent>
          </Popover>

          <Popover open={customOpen} onOpenChange={setCustomOpen}>
            <PopoverTrigger asChild><span /></PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[60]" align="end">
              <Calendar
                mode="single"
                onSelect={(d) => { if (d) { onDuplicate("custom", d.toISOString().slice(0, 10)); setCustomOpen(false); } }}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          <button onClick={onEdit} className="grid place-items-center w-8 h-8 rounded-lg ghost-border bg-surface-lowest hover:bg-primary/10 text-primary" aria-label="Edit">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="grid place-items-center w-8 h-8 rounded-lg ghost-border bg-surface-lowest hover:bg-destructive/10 text-destructive" aria-label="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
};

// ---------- Small UI ----------
const Section = ({ title, icon: Ic, hint, children }: { title: string; icon: React.ComponentType<any>; hint?: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <div>
      <h3 className="font-headline font-bold text-primary text-sm flex items-center gap-2">
        <Ic className="w-4 h-4" /> {title}
      </h3>
      {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
    </div>
    <div className="space-y-3">{children}</div>
  </section>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
    <div className="mt-1">{children}</div>
  </label>
);

const Pill = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-4 py-2.5 rounded-full text-xs font-bold transition",
      active ? "bg-primary text-primary-foreground shadow-glass" : "bg-surface-low text-muted-foreground hover:text-primary",
    )}
  >{children}</button>
);

const Chip = ({ children, title }: { children: React.ReactNode; title?: string }) => (
  <span
    title={title}
    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-lowest ghost-border text-[10px] font-bold text-primary"
  >
    {children}
  </span>
);

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-primary-foreground/10 p-2">
    <p className="text-[9px] uppercase tracking-wider text-primary-foreground/60 font-bold">{label}</p>
    <p className="font-headline font-extrabold text-sm mt-0.5">{value}</p>
  </div>
);

const TimeInput = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  const h = Math.floor(value / 60);
  const m = value % 60;
  const hh = h.toString().padStart(2, "0");
  const mm = m.toString().padStart(2, "0");
  return (
    <input
      type="time"
      value={`${hh}:${mm}`}
      onChange={(e) => {
        const [hs, ms] = e.target.value.split(":");
        onChange(parseInt(hs, 10) * 60 + parseInt(ms, 10));
      }}
      className="w-full px-3 py-2.5 rounded-xl bg-surface-low ghost-border text-sm font-bold text-primary outline-none focus:ring-2 focus:ring-primary/30"
    />
  );
};

const TimelineView = ({ items }: { items: { kind: "call" | "buffer"; start: number; end: number }[] }) => {
  if (items.length === 0) {
    return <p className="text-[11px] text-muted-foreground">Window too short — adjust duration or buffer.</p>;
  }
  const first = items[0].start;
  const last = items[items.length - 1].end;
  const total = Math.max(1, last - first);
  return (
    <div className="space-y-3">
      <div className="h-3 w-full rounded-full bg-surface-low overflow-hidden flex">
        {items.map((it, i) => (
          <div
            key={i}
            className={cn(it.kind === "call" ? "bg-gradient-primary" : "bg-muted-foreground/30")}
            style={{ width: `${((it.end - it.start) / total) * 100}%` }}
            title={`${it.kind} ${fmtTime(it.start)}–${fmtTime(it.end)}`}
          />
        ))}
      </div>
      <ul className="max-h-44 overflow-y-auto rounded-xl bg-surface-low p-2 text-[11px] font-mono divide-y divide-border/40">
        {items.map((it, i) => (
          <li key={i} className="flex items-center justify-between py-1 px-1">
            <span className="text-muted-foreground">{fmtTime(it.start)}</span>
            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", it.kind === "call" ? "bg-primary/15 text-primary" : "bg-muted-foreground/15 text-muted-foreground")}>
              {it.kind === "call" ? "Call" : "Buffer"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default QuickSyncBuilder;