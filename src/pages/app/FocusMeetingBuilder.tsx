import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, addDays, addWeeks } from "date-fns";
import {
  ArrowLeft, Briefcase, Calendar as CalIcon, Clock, Timer, Repeat, Lock, Check,
  Globe, Users as UsersIcon, Crown, Sparkles, Plus, Pencil, Trash2, Copy,
  ChevronRight, X, CheckCircle2, CalendarPlus, Video, MapPin,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import DateRangePopover, { toISO } from "@/components/app/DateRangePopover";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { toast as sonner } from "sonner";
import { cn } from "@/lib/utils";
import PricingField, { Pricing, PriceTag, defaultPricing } from "@/components/app/PricingField";
import RelayToSpotlightPanel, { DEFAULT_RELAY, type RelayConfig } from "@/components/app/RelayToSpotlightPanel";
import { useSpotlight } from "@/components/app/SpotlightContext";
import ActiveSlotsPanel, { DailyOccupancy, type ActiveSlotItem } from "@/components/app/ActiveSlotsPanel";
import { availabilityStore, findConflict, flashConflict, markCreated, suggestOpenings, fmtTimeHM } from "@/lib/availabilityStore";

// ---------- Types ----------
type CallMin = 15 | 20 | 25 | 30 | 35;
type BufferMin = 5 | 10;
type Repeats = "none" | "daily" | "weekly" | "monthly";
type Booking = "instant" | "approval";
type Access = "public" | "contacts" | "priority" | "paid";

interface MTSlot {
  id: string;
  date: string; // ISO yyyy-mm-dd
  dateTo?: string; // optional end of range (inclusive)
  startMin: number; // minutes from 00:00
  endMin: number;
  callMin: CallMin;
  bufferMin: BufferMin;
  repeats: Repeats;
  weekdays?: number[]; // 0..6 if weekly
  booking: Booking;
  access: Access;
  pricing: Pricing;
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
const blank = (): Omit<MTSlot, "id" | "createdAt"> => ({
  date: toISO(new Date()),
  dateTo: undefined,
  startMin: 10 * 60,
  endMin: 12 * 60,
  callMin: 30,
  bufferMin: 5,
  repeats: "none",
  weekdays: [],
  booking: "approval",
  access: "contacts",
  pricing: defaultPricing,
});

const seed: MTSlot[] = [
  {
    id: "mt1",
    date: toISO(addDays(new Date(), 3)),
    startMin: 10 * 60, endMin: 12 * 60,
    callMin: 30, bufferMin: 5,
    repeats: "weekly", weekdays: [2],
    booking: "approval", access: "contacts",
    pricing: { mode: "free" },
    createdAt: Date.now() - 100000,
  },
];

// ---------- Page ----------
const FocusMeetingBuilder = () => {
  const navigate = useNavigate();
  const [slots, setSlots] = useState<MTSlot[]>(seed);
  const [draft, setDraft] = useState<Omit<MTSlot, "id" | "createdAt"> & { id?: string }>(blank());
  const [step, setStep] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [channel, setChannel] = useState<"hybrid" | "online" | "onsite">("hybrid");
  const [relay, setRelay] = useState<RelayConfig>({ ...DEFAULT_RELAY, tone: "info" });
  const { createRelay } = useSpotlight();

  const isEditing = !!draft.id;
  const set = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const totalMin = Math.max(0, draft.endMin - draft.startMin);
  const count = slotCount({ startMin: draft.startMin, endMin: draft.endMin, callMin: draft.callMin, bufferMin: draft.bufferMin });
  const timeline = useMemo(() => buildTimeline(draft), [draft]);

  const reset = () => { setDraft(blank()); setStep(1); };

  const conflictToast = (date: string, startMin: number, endMin: number, excludeId?: string) => {
    const c = findConflict(date, startMin, endMin, excludeId);
    if (!c) return false;
    const sugg = suggestOpenings(date, endMin - startMin, excludeId)
      .map((s) => `${fmtTimeHM(s.startMin)}–${fmtTimeHM(s.endMin)}`)
      .join(" · ");
    flashConflict(c.id);
    sonner.error("Time conflict", {
      description:
        `This time range is already occupied by ${c.typeLabel} (${fmtTimeHM(c.startMin)}–${fmtTimeHM(c.endMin)}).` +
        (sugg ? ` Nearest openings: ${sugg}.` : ""),
      duration: 10000,
      closeButton: true,
    });
    return true;
  };

  const save = () => {
    if (totalMin <= 0) {
      toast({ title: "Time window invalid", description: "End time must be after start time." });
      return;
    }
    if (count === 0) {
      toast({ title: "Window too short", description: "Increase window or reduce call/buffer length." });
      return;
    }
    if (draft.pricing?.mode === "paid" && (!draft.pricing.amount || draft.pricing.amount <= 0)) {
      toast({ title: "Set a price", description: "Paid meetings must have a price greater than zero." });
      return;
    }
    // Build the list of dates this save will create (range support).
    const dates: string[] = [];
    const startD = new Date(draft.date);
    const endD = draft.dateTo ? new Date(draft.dateTo) : startD;
    for (let d = new Date(startD); d <= endD; d = addDays(d, 1)) dates.push(toISO(d));
    for (const dt of dates) {
      if (conflictToast(dt, draft.startMin, draft.endMin, draft.id)) return;
    }
    if (isEditing) {
      setSlots((p) => p.map((s) => (s.id === draft.id ? { ...s, ...draft, id: draft.id! } : s)));
      toast({ title: "Meeting updated" });
    } else {
      const created: MTSlot[] = dates.map((dt, i) => ({
        ...(draft as Omit<MTSlot, "id" | "createdAt">),
        date: dt,
        dateTo: undefined,
        id: `mt${Date.now()}_${i}`,
        createdAt: Date.now() + i,
      }));
      setSlots((p) => [...created, ...p]);
      const totalSubSlots = count * dates.length;
      toast({
        title: dates.length > 1 ? `Meeting blocks created · ${dates.length} days` : "Meeting block created",
        description: `${totalSubSlots} meeting slot${totalSubSlots === 1 ? "" : "s"} generated.`,
      });
      const next = created[0];
      if (next) setTimeout(() => markCreated(next.id), 250);
      if (relay.enabled) {
        createRelay({
          title: `OPEN MEETING BLOCK · ${fmtTime(next.startMin)}–${fmtTime(next.endMin)}`,
          body: `${count} ${next.callMin}-min meeting slots on ${format(new Date(next.date), "EEE, MMM d")}${dates.length > 1 ? ` (+${dates.length - 1} more day${dates.length - 1 === 1 ? "" : "s"})` : ""} · ${channel}.`,
          tone: relay.tone,
          expiresIn: `expires ${relay.expiry}`,
          relay: {
            source: "hybrid",
            sourceId: next.id,
            totalSlots: count,
            remainingSlots: count,
            permissions: relay.permissions,
            indicators: relay.indicators,
            audience: relay.audience,
            viewHref: "/app/availability/focus-meetings",
          },
        });
        toast({ title: "Relayed to Spotlight" });
      }
    }
    reset();
  };

  const editSlot = (s: MTSlot) => {
    setDraft({ ...s });
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteSlot = (id: string) => {
    setSlots((p) => p.filter((s) => s.id !== id));
    setConfirmDelete(null);
    toast({ title: "Meeting block deleted" });
  };

  const duplicate = (s: MTSlot, kind: "tomorrow" | "nextweek" | "custom", customDate?: string) => {
    const base = new Date(s.date);
    const nd =
      kind === "tomorrow" ? addDays(base, 1) :
      kind === "nextweek" ? addWeeks(base, 1) :
      customDate ? new Date(customDate) : base;
    const newDate = toISO(nd);
    if (conflictToast(newDate, s.startMin, s.endMin)) return;
    setSlots((p) => [{ ...s, id: `mt${Date.now()}`, date: newDate, createdAt: Date.now() }, ...p]);
    toast({ title: "Schedule cloned successfully and extended.", description: format(nd, "EEE, MMM d") });
  };

  // Sync to unified availability store
  useEffect(() => {
    availabilityStore.syncSource(
      "focus",
      slots.map((s) => ({
        id: s.id,
        source: "focus" as const,
        date: s.date,
        startMin: s.startMin,
        endMin: s.endMin,
        bufferMin: s.bufferMin,
        mode: channel,
        typeLabel: "Focus Sync",
        callMin: s.callMin,
      })),
    );
  }, [slots, channel]);

  return (
    <AppShell
      subtitle="One slot — double the exposure"
      title="Hybrid Slot Scheduling"
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
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-primary text-primary-foreground shrink-0">
            <Briefcase className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">{isEditing ? "Edit" : "Dedicated availability for meaningful conversations"}</p>
            <h2 className="font-headline font-extrabold text-primary text-base md:text-lg">Focus Sync Builder</h2>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="rounded-xl ghost-border bg-surface-low p-1 flex items-center gap-1">
              {([
                ["hybrid", "Hybrid", Sparkles],
                ["online", "Online", Video],
                ["onsite", "Onsite", MapPin],
              ] as const).map(([k, l, Ic]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setChannel(k)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition",
                    channel === k
                      ? "bg-primary text-primary-foreground shadow-glass"
                      : "text-muted-foreground hover:text-primary",
                  )}
                  aria-pressed={channel === k}
                >
                  <Ic className="w-3.5 h-3.5" /> {l}
                </button>
              ))}
            </div>
            {isEditing && (
              <button onClick={reset} className="text-[11px] font-bold text-muted-foreground hover:text-primary inline-flex items-center gap-1">
                <X className="w-3 h-3" /> Discard edit
              </button>
            )}
          </div>
        </div>

        {/* DAILY OCCUPANCY (today) */}
        <div className="mb-5">
          <DailyOccupancy date={draft.date} />
        </div>

        {/* Stepper with fixed Back/Next anchors */}
        <div className="flex items-center gap-2 mb-5">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="shrink-0 px-3 py-1.5 rounded-full ghost-border text-[10px] font-bold text-muted-foreground hover:text-primary disabled:opacity-40"
          >
            Back
          </button>
          <div className="flex items-center gap-1 overflow-x-auto pb-1 flex-1">
            {[
              "Date", "Window", "Call", "Buffer", "Repeat", "Booking", "Access", "Pricing",
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
          {step < 8 ? (
            <button
              onClick={() => setStep((s) => Math.min(8, s + 1))}
              className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-primary text-primary-foreground text-[10px] font-bold shadow-elevated"
            >
              Next <ChevronRight className="w-3 h-3" />
            </button>
          ) : (
            <button
              onClick={save}
              className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-primary text-primary-foreground text-[10px] font-bold shadow-elevated"
            >
              <CheckCircle2 className="w-3 h-3" /> {isEditing ? "Update" : "Create"}
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* Step content */}
          <div className="space-y-4">
            {step === 1 && (
              <Section title="Step 1 — Select Date" icon={CalIcon} hint="Pick the day this Quick Sync block runs">
                <DateRangePopover
                  from={draft.date}
                  to={draft.dateTo}
                  onChange={(f, t) => setDraft((d) => ({ ...d, date: f, dateTo: t && t !== f ? t : undefined }))}
                />
                {draft.dateTo && draft.dateTo !== draft.date && (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Creates one block per day across the selected range.
                  </p>
                )}
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
              <Section title="Step 3 — Meeting Duration" icon={Timer} hint="How long is each meeting?">
                <div className="flex flex-wrap gap-2">
                  {([15, 20, 25, 30, 35] as CallMin[]).map((d) => (
                    <Pill key={d} active={draft.callMin === d} onClick={() => set("callMin", d)}>{d} minutes</Pill>
                  ))}
                </div>
              </Section>
            )}

            {step === 4 && (
              <Section title="Step 4 — Flexible Buffer" icon={Timer} hint="Allows early-join and soft extension. Does NOT add gaps between slots.">
                <div className="flex flex-wrap gap-2">
                  {([5, 10] as BufferMin[]).map((b) => (
                    <Pill key={b} active={draft.bufferMin === b} onClick={() => set("bufferMin", b)}>{b} minute{b > 1 ? "s" : ""}</Pill>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Participants may join during the buffer window before the scheduled start time, and the conductor may extend the sync duration beyond the originally scheduled time.
                </p>
              </Section>
            )}

            {step === 5 && (
              <Section title="Step 5 — Repeat" icon={Repeat} hint="Set up recurrence">
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

            {step === 6 && (
              <Section title="Step 6 — Booking Mode" icon={Lock}>
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

            {step === 7 && (
              <Section title="Step 7 — Access Control" icon={UsersIcon} hint="Choose who can book">
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

            {step === 8 && (
              <Section title="Step 8 — Pricing" icon={Sparkles} hint="Free by default. Switch to Paid to charge per booking.">
                <PricingField value={draft.pricing} onChange={(p) => set("pricing", p)} />
              </Section>
            )}

          </div>

          {/* Live preview — horizontal */}
          <aside className="rounded-2xl bg-gradient-vault text-primary-foreground p-4 shadow-elevated">
            <div className="flex items-center gap-2 mb-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold">Live preview</p>
              <span className="text-[10px] text-primary-foreground/50">·</span>
              <h4 className="font-headline font-extrabold text-sm capitalize">Focus Sync · {channel}</h4>
            </div>
            <div className="flex flex-wrap items-stretch gap-3 text-[10px]">
              <div className="flex-1 min-w-[140px]">
                <p className="text-[9px] font-bold uppercase tracking-wider text-primary-foreground/60">When</p>
                <p className="text-[11px] text-primary-foreground/90 mt-0.5">{format(new Date(draft.date), "EEE, MMM d")}</p>
                <p className="text-[11px] text-primary-foreground/90">{fmtTime(draft.startMin)} – {fmtTime(draft.endMin)}</p>
              </div>
              <Stat label="Duration" value={`${draft.callMin}m`} />
              <Stat label="Buffer" value={`${draft.bufferMin}m`} />
              <Stat label="Sub-slots" value={`${count}`} />
              <Stat label="Repeat" value={draft.repeats === "none" ? "—" : draft.repeats[0].toUpperCase()} />
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-primary-foreground/15 text-[10px] font-bold">
                  {draft.booking === "instant" ? "Instant" : "Approval"}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-primary-foreground/15 text-[10px] font-bold">
                  {accessMeta[draft.access].label}
                </span>
                <PriceTag pricing={draft.pricing} />
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold",
                  relay.enabled ? "bg-emerald-400/25 text-emerald-100" : "bg-primary-foreground/10 text-primary-foreground/70",
                )}>
                  Relay {relay.enabled ? "ON" : "OFF"}
                </span>
              </div>
            </div>
            {timeline.length > 0 && (
              <div className="mt-3 rounded-lg bg-primary-foreground/10 p-2">
                <p className="text-[9px] font-bold uppercase tracking-wider text-primary-foreground/60 mb-1">
                  Generated sub-slots
                </p>
                <ul className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] font-mono">
                  {timeline.slice(0, 8).map((it, i) => (
                    <li key={i} className="text-primary-foreground/90">
                      {fmtTime(it.start)}–{fmtTime(it.end)}
                    </li>
                  ))}
                  {timeline.length > 8 && (
                    <li className="text-[9px] text-primary-foreground/60 italic">+ {timeline.length - 8} more</li>
                  )}
                </ul>
              </div>
            )}
          </aside>
        </div>

        <div className="mt-5">
          <RelayToSpotlightPanel value={relay} onChange={setRelay} />
        </div>
      </section>

      {/* ACTIVE SLOTS */}
      <div className="mt-6">
        <ActiveSlotsPanel
          eyebrow="Unified Availability"
          emptyText="No meeting blocks yet — create one above."
          handlers={Object.fromEntries(
            slots.map((s) => [s.id, {
              onEdit: () => editSlot(s),
              onDelete: () => setConfirmDelete(s.id),
              onDuplicate: (k, d) => duplicate(s, k, d),
            }]),
          )}
        />
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this slot schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              The full meeting block and all generated slots will be removed. This cannot be undone.
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

// ---------- Meeting Card ----------
const MeetingCard = ({
  slot, onEdit, onDelete, onDuplicate,
}: {
  slot: MTSlot;
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
  const A = accessMeta[slot.access] ?? accessMeta.contacts;
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
            <Briefcase className={cn("w-3.5 h-3.5", status === "active" ? "text-primary" : "text-muted-foreground")} />
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

      <div className="mt-2">
        <PriceTag pricing={slot.pricing} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px]">
        <Chip>{slot.callMin}-min meetings</Chip>
        <Chip title="Participants may join early or extend slightly. Does not affect slot count.">
          {slot.bufferMin}-min flexible buffer
        </Chip>
        <Chip>{count} meetings total</Chip>
        <Chip>
          <Repeat className="w-3 h-3" /> {slot.repeats === "none" ? "Once" : slot.repeats}
        </Chip>
      </div>

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
              <button className="grid place-items-center w-8 h-8 rounded-lg ghost-border bg-surface-lowest hover:bg-primary/10 text-primary" aria-label="Duplicate">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-44 p-1 z-[60]" align="end">
              <button onClick={() => { onDuplicate("tomorrow"); setDupOpen(false); }} className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-surface-low">To tomorrow</button>
              <button onClick={() => { onDuplicate("nextweek"); setDupOpen(false); }} className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-surface-low">To next week</button>
              <button onClick={() => { setDupOpen(false); setCustomOpen(true); }} className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-surface-low">Custom date…</button>
            </PopoverContent>
          </Popover>

          <Popover open={customOpen} onOpenChange={setCustomOpen}>
            <PopoverTrigger asChild><span /></PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[60]" align="end">
              <Calendar
                mode="single"
                onSelect={(d) => { if (d) { onDuplicate("custom", toISO(d)); setCustomOpen(false); } }}
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
  <section className="flex flex-col md:flex-row md:items-start md:gap-5">
    <div className="md:w-[40%] md:max-w-[260px] md:shrink-0">
      <h3 className="font-headline font-bold text-primary text-sm flex items-center gap-2 leading-tight">
        <Ic className="w-4 h-4 shrink-0" /> <span className="leading-tight">{title}</span>
      </h3>
      {hint && <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{hint}</p>}
    </div>
    <div className="flex-1 min-w-0 space-y-3 mt-3 md:mt-0">{children}</div>
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

export default FocusMeetingBuilder;