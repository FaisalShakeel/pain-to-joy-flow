import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format, addDays, addWeeks } from "date-fns";
import {
  ArrowLeft, Briefcase, Calendar as CalIcon, Clock, Timer, Copy as CloneIcon, Lock, Check,
  Globe, Users as UsersIcon, Crown, Sparkles, Plus, Pencil, Trash2, Copy,
  ChevronRight, X, CheckCircle2, CalendarPlus, Video, MapPin,
} from "lucide-react";
import { Eye, Tag, ShieldCheck, Radio, Wifi, Monitor, Minus } from "lucide-react";
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
import SchedulingSwitcher from "@/components/app/SchedulingSwitcher";

// ---------- Types ----------
type CallMin = 15 | 20 | 25 | 30 | 35;
type BufferMin = 0 | 5 | 10 | 15 | 30;
type Repeats = "none" | "daily" | "weekly" | "monthly";
type Booking = "instant" | "approval";
type Access = "public" | "contacts" | "priority" | "paid" | "private";

interface MTSlot {
  id: string;
  date: string; // ISO yyyy-mm-dd
  dateTo?: string; // optional end of range (inclusive)
  startMin: number; // minutes from 00:00
  endMin: number;
  callMin: CallMin;
  bufferMin: BufferMin;
  repeats: Repeats;
  weekdays?: number[]; // 0..6 if weekly (legacy)
  cloneDates?: string[]; // additional dates to clone this slot to on creation
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
  private:  { label: "Private",           icon: Lock,     cls: "bg-rose-500/15 text-rose-700" },
};

const weekdayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ---------- Defaults ----------
const blank = (): Omit<MTSlot, "id" | "createdAt"> => ({
  date: toISO(new Date()),
  dateTo: undefined,
  startMin: 11 * 60,
  endMin: 11 * 60 + 15,
  callMin: 15,
  bufferMin: 5,
  repeats: "none",
  weekdays: [],
  cloneDates: [],
  booking: "instant",
  access: "public",
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [slots, setSlots] = useState<MTSlot[]>(seed);
  const [draft, setDraft] = useState<Omit<MTSlot, "id" | "createdAt"> & { id?: string }>(blank());
  const [step, setStep] = useState<1 | 2>(1);
  const [dirty, setDirty] = useState(false);
  const [justCreated, setJustCreated] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [channel, setChannel] = useState<"hybrid" | "online" | "onsite">("hybrid");
  const [relay, setRelay] = useState<RelayConfig>({ ...DEFAULT_RELAY, tone: "info" });
  const [rangeAnchor, setRangeAnchor] = useState<string | null>(null);
  const { createRelay } = useSpotlight();

  const isEditing = !!draft.id;
  const set = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
    setDirty(true);
    setJustCreated(false);
  };
  const totalMin = Math.max(0, draft.endMin - draft.startMin);
  const count = slotCount({ startMin: draft.startMin, endMin: draft.endMin, callMin: draft.callMin, bufferMin: draft.bufferMin });
  const timeline = useMemo(() => buildTimeline(draft), [draft]);

  const reset = () => { setDraft(blank()); setStep(1); setDirty(false); setJustCreated(false); };

  // Live conflict for the current draft window — drives the Next/Create gate.
  const hasDraftConflict = useMemo(
    () => !!findConflict(draft.date, draft.startMin, draft.endMin, draft.id),
    // recompute when slots change too
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draft.date, draft.startMin, draft.endMin, draft.id, slots],
  );

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
    // Merge clone dates (extra non-contiguous days selected in Step 5).
    for (const cd of draft.cloneDates ?? []) {
      if (!dates.includes(cd)) dates.push(cd);
    }
    // Collect every conflict so the user sees the exact offending dates.
    const conflicts = dates
      .map((dt) => ({ date: dt, block: findConflict(dt, draft.startMin, draft.endMin, draft.id) }))
      .filter((c): c is { date: string; block: NonNullable<ReturnType<typeof findConflict>> } => !!c.block);
    if (conflicts.length) {
      if (conflicts[0].block) flashConflict(conflicts[0].block.id);
      const validDates = dates.filter((d) => !conflicts.some((c) => c.date === d));
      const baseISO = toISO(new Date(draft.date));
      const baseToISO = draft.dateTo ? toISO(new Date(draft.dateTo)) : baseISO;
      const skipSet = new Set(conflicts.map((c) => c.date));
      const baseConflicts = skipSet.has(baseISO) || skipSet.has(baseToISO);
      const list = conflicts
        .map(
          (c) =>
            `• ${format(new Date(c.date), "MMM d, yyyy")} — occupied by ${c.block.typeLabel} (${fmtTimeHM(c.block.startMin)}–${fmtTimeHM(c.block.endMin)})`,
        )
        .join("\n");
      sonner.error(
        `Conflict detected on ${conflicts.length} date${conflicts.length === 1 ? "" : "s"}`,
        {
          description: list,
          duration: 12000,
          closeButton: true,
          action:
            !isEditing && validDates.length && !baseConflicts
              ? {
                  label: `Skip & create ${validDates.length}`,
                  onClick: () => {
                    // Drop conflicting dates from the clone list and run the
                    // creation path directly with the validated dates so we
                    // don't depend on async React state.
                    const nextClones = (draft.cloneDates ?? []).filter((d) => !skipSet.has(d));
                    set("cloneDates", nextClones);
                    proceed(validDates);
                  },
                }
              : undefined,
        },
      );
      return;
    }
    proceed(dates);
  };

  const proceed = (dates: string[]) => {
    if (isEditing) {
      setSlots((p) => p.map((s) => (s.id === draft.id ? { ...s, ...draft, id: draft.id! } : s)));
      toast({ title: "Meeting updated" });
      const updatedId = draft.id!;
      setTimeout(() => markCreated(updatedId), 250);
      reset();
      return;
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
    // Lock the builder: user must press "+" to start a new slot.
    setJustCreated(true);
    setDirty(false);
  };

  const editSlot = (s: MTSlot) => {
    setDraft({ ...s });
    setStep(1);
    setDirty(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Open the editor when arriving from Daily Occupancy on another page.
  useEffect(() => {
    const id = searchParams.get("edit");
    if (!id) return;
    const s = slots.find((x) => x.id === id);
    if (s) {
      editSlot(s);
      setTimeout(() => markCreated(s.id), 300);
      const next = new URLSearchParams(searchParams);
      next.delete("edit");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, slots]);

  const deleteSlot = (id: string) => {
    setSlots((p) => p.filter((s) => s.id !== id));
    setConfirmDelete(null);
    toast({ title: "Meeting block deleted" });
  };

  const duplicate = (
    s: MTSlot,
    kind: "tomorrow" | "nextweek" | "custom",
    customDate?: string,
    customDateTo?: string,
  ) => {
    const base = new Date(s.date);
    const fromD =
      kind === "tomorrow" ? addDays(base, 1) :
      kind === "nextweek" ? addWeeks(base, 1) :
      customDate ? new Date(customDate) : base;
    const toD = kind === "custom" && customDateTo ? new Date(customDateTo) : fromD;
    const dates: string[] = [];
    for (let d = new Date(fromD); d <= toD; d = addDays(d, 1)) dates.push(toISO(d));
    const created: MTSlot[] = [];
    const skipped: string[] = [];
    for (const dt of dates) {
      if (findConflict(dt, s.startMin, s.endMin)) { skipped.push(dt); continue; }
      created.push({ ...s, id: `mt${Date.now()}_${dt}`, date: dt, createdAt: Date.now() + created.length });
    }
    if (created.length === 0) {
      sonner.error("All target dates conflict", { description: "Nothing was cloned.", duration: 6000 });
      return;
    }
    setSlots((p) => [...created, ...p]);
    const subTotal = created.length * slotCount(s);
    toast({
      title: created.length > 1
        ? `Cloned across ${created.length} dates`
        : "Schedule cloned successfully and extended.",
      description: `${subTotal} meeting slot${subTotal === 1 ? "" : "s"} generated${skipped.length ? ` · ${skipped.length} conflicting date${skipped.length === 1 ? "" : "s"} skipped` : ""}.`,
    });
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
      title="Focus Sync Builder"
      subtitle="Dedicated availability for meaningful conversations."
      actions={
        <div className="flex items-center gap-2">
          <SchedulingSwitcher current="hybrid" />
        </div>
      }
    >
      {/* SECTION 1 — Daily Occupancy */}
      <DailyOccupancy
        date={draft.date}
        onBlockClick={(id) => {
          const s = slots.find((x) => x.id === id);
          if (s) editSlot(s);
        }}
      />

      {/* SECTION 2 — Live Preview */}
      <aside className="mt-3 rounded-2xl bg-gradient-vault text-primary-foreground p-3 md:p-4 shadow-elevated">
        <div className="flex flex-wrap md:flex-nowrap items-center gap-x-2 gap-y-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold shrink-0">Live Preview</span>
          <span className="text-primary-foreground/30 hidden md:inline">/</span>
          <p className="text-[11px] text-primary-foreground/90 leading-snug">
            <span className="whitespace-nowrap">{format(new Date(draft.date), "MMMM d, yyyy")}</span>
            <span className="text-primary-foreground/40 mx-1">/</span>
            <span className="whitespace-nowrap">{channel.charAt(0).toUpperCase() + channel.slice(1)}</span>
            <span className="text-primary-foreground/40 mx-1">/</span>
            <span className="whitespace-nowrap">{draft.callMin} Min + {draft.bufferMin} Min Buffer</span>
            <span className="text-primary-foreground/40 mx-1">/</span>
            <span className="whitespace-nowrap">{fmtTime(draft.startMin)}–{fmtTime(draft.endMin)}</span>
            <span className="text-primary-foreground/40 mx-1">/</span>
            <span className="whitespace-nowrap">
              {draft.access === "public" ? "Public" : draft.access === "contacts" ? "Contacts" : draft.access === "priority" ? "Selected" : draft.access === "paid" ? "Paid" : "Private"}
            </span>
            <span className="text-primary-foreground/40 mx-1">/</span>
            <span className="whitespace-nowrap">{draft.booking === "instant" ? "Pre-Approved" : "Approval-Based"}</span>
            <span className="text-primary-foreground/40 mx-1">/</span>
            <span className="whitespace-nowrap">{count} Slot{count === 1 ? "" : "s"}</span>
          </p>
        </div>
      </aside>

      {/* SECTION 3 — Slot Builder */}
      <section className="mt-3 rounded-2xl bg-surface-lowest ghost-border p-3 md:p-4 shadow-ambient">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* LEFT — Calendar */}
          <div className="min-w-0">
            <p className="font-headline font-extrabold text-primary text-[13px] uppercase tracking-[0.18em] mb-2">
              Select a Date
            </p>
            <div className="rounded-xl ghost-border bg-surface-lowest p-1">
              <Calendar
                mode="single"
                selected={new Date(draft.date)}
                onSelect={(d) => { if (d) { setDraft((dr) => ({ ...dr, date: toISO(d), dateTo: undefined })); setDirty(true); } }}
                className="pointer-events-auto w-full"
              />
            </div>
          </div>

          {/* RIGHT — Options */}
          <div className="min-w-0 flex flex-col">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-headline font-extrabold text-primary text-[13px] uppercase tracking-[0.18em]">
                Slot Builder
              </p>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wider">
                {isEditing ? "Editing" : "New"}
              </span>
            </div>

            {/* Mode segmented */}
            <BuilderRow label="Mode">
              <div className="inline-flex w-full rounded-lg ghost-border bg-surface-lowest p-0.5 gap-0.5">
                {([
                  ["online", "Online", Monitor],
                  ["onsite", "Onsite", MapPin],
                  ["hybrid", "Hybrid", UsersIcon],
                ] as const).map(([k, l, Ic]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setChannel(k)}
                    aria-pressed={channel === k}
                    className={cn(
                      "flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-bold transition",
                      channel === k
                        ? "bg-emerald-500 text-white shadow-glass"
                        : "text-muted-foreground hover:text-primary",
                    )}
                  >
                    <Ic className="w-3.5 h-3.5" /> {l}
                  </button>
                ))}
              </div>
            </BuilderRow>

            {/* Call Size + Buffer — inline labels, same row */}
            <div className="py-1.5 flex items-center gap-3 border-b border-border/40">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
                  Call Size
                </span>
                <CompactSelect
                  value={String(draft.callMin)}
                  onChange={(v) => {
                    const next = parseInt(v, 10) as CallMin;
                    const slots = Math.max(1, Math.round((draft.endMin - draft.startMin) / draft.callMin));
                    setDraft((d) => ({ ...d, callMin: next, endMin: d.startMin + slots * next }));
                    setDirty(true);
                  }}
                  options={[15, 20, 25, 30, 35].map((d) => ({ value: String(d), label: `${d} Min` }))}
                />
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
                  Buffer
                </span>
                <CompactSelect
                  value={String(draft.bufferMin)}
                  onChange={(v) => set("bufferMin", parseInt(v, 10) as BufferMin)}
                  options={[0, 5, 10].map((b) => ({ value: String(b), label: `${b} Min` }))}
                />
              </div>
            </div>

            {/* Time block — stepper */}
            <BuilderRow label="Time Block">
              <div className="inline-flex items-stretch rounded-lg ghost-border overflow-hidden w-full">
                <button
                  type="button"
                  onClick={() => {
                    const span = draft.endMin - draft.startMin;
                    const next = Math.max(0, draft.startMin - 15);
                    setDraft((d) => ({ ...d, startMin: next, endMin: next + span }));
                    setDirty(true);
                  }}
                  className="px-3 grid place-items-center bg-surface-lowest hover:bg-primary/10 text-primary"
                  aria-label="Earlier"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1 grid place-items-center text-[12px] font-bold text-primary tabular-nums bg-surface-lowest">
                  {fmtTime(draft.startMin)}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const span = draft.endMin - draft.startMin;
                    const next = Math.min(23 * 60 + 45, draft.startMin + 15);
                    setDraft((d) => ({ ...d, startMin: next, endMin: next + span }));
                    setDirty(true);
                  }}
                  className="px-3 grid place-items-center bg-primary text-primary-foreground hover:opacity-90"
                  aria-label="Later"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </BuilderRow>

            {/* Slots stepper */}
            <BuilderRow label="Slots">
              <div className="inline-flex items-stretch rounded-lg ghost-border overflow-hidden w-full">
                <button
                  type="button"
                  onClick={() => {
                    if (count <= 1) return;
                    set("endMin", draft.endMin - draft.callMin);
                  }}
                  className="px-3 grid place-items-center bg-surface-lowest hover:bg-primary/10 text-primary"
                  aria-label="Decrease"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1 grid place-items-center text-[12px] font-bold text-primary tabular-nums bg-surface-lowest">
                  {count}
                </div>
                <button
                  type="button"
                  onClick={() => set("endMin", draft.endMin + draft.callMin)}
                  className="px-3 grid place-items-center bg-primary text-primary-foreground hover:opacity-90"
                  aria-label="Increase"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </BuilderRow>

            {/* Visibility + Approval — inline labels, single row */}
            <div className="py-1.5 flex items-center gap-3 border-b border-border/40">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
                  Visibility
                </span>
                <CompactSelect
                  value={draft.access}
                  onChange={(v) => set("access", v as Access)}
                  options={[
                    { value: "public", label: "Public" },
                    { value: "contacts", label: "Contacts" },
                    { value: "priority", label: "Selected" },
                    { value: "private", label: "Private" },
                  ]}
                />
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
                  Approval
                </span>
                <CompactSelect
                  value={draft.booking}
                  onChange={(v) => set("booking", v as Booking)}
                  options={[
                    { value: "instant", label: "Pre-Approved" },
                    { value: "approval", label: "Approval-Based" },
                  ]}
                />
              </div>
            </div>

            {/* Pricing + Relay row */}
            <div className="mt-2.5 flex items-center justify-between gap-3">
              <div className="inline-flex rounded-lg ghost-border bg-surface-lowest p-0.5 gap-0.5">
                {(["free", "paid"] as const).map((k) => {
                  const active = (draft.pricing?.mode ?? "free") === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() =>
                        set(
                          "pricing",
                          k === "paid"
                            ? ({ ...(draft.pricing ?? defaultPricing), mode: "paid", amount: draft.pricing?.amount ?? 25, currency: draft.pricing?.currency ?? "USD" } as Pricing)
                            : { mode: "free" },
                        )
                      }
                      className={cn(
                        "px-3 py-1.5 rounded-md text-[11px] font-bold transition capitalize",
                        active ? "bg-primary text-primary-foreground shadow-glass" : "text-muted-foreground hover:text-primary",
                      )}
                      aria-pressed={active}
                    >
                      {k}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={relay.enabled}
                onClick={() => setRelay({ ...relay, enabled: !relay.enabled })}
                className="inline-flex items-center gap-2 select-none"
              >
                <Radio className={cn("w-3.5 h-3.5", relay.enabled ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("text-[11px] font-bold", relay.enabled ? "text-primary" : "text-muted-foreground")}>
                  Relay {relay.enabled ? "On" : "Off"}
                </span>
                <span className={cn(
                  "relative inline-block w-9 h-5 rounded-full transition",
                  relay.enabled ? "bg-primary" : "bg-surface-low ghost-border",
                )}>
                  <span className={cn(
                    "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-primary-foreground shadow transition-transform",
                    relay.enabled && "translate-x-4",
                  )} />
                </span>
              </button>
            </div>

            {/* Primary CTA */}
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={save}
                disabled={hasDraftConflict || justCreated}
                title={
                  hasDraftConflict
                    ? "Time conflict on this date — change date or window"
                    : justCreated
                    ? "Press New to start another slot"
                    : undefined
                }
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-primary text-primary-foreground text-[13px] font-bold shadow-elevated hover:opacity-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CalendarPlus className="w-4 h-4" /> {isEditing ? "Update Focus Sync" : "Create Focus Sync"}
              </button>
              {justCreated && (
                <button onClick={reset} className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-primary/10 text-primary text-[11px] font-bold">
                  <Plus className="w-3.5 h-3.5" /> New
                </button>
              )}
            </div>
          </div>
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
              onDuplicate: (k, d, dt) => duplicate(s, k, d, dt),
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
          <CloneIcon className="w-3 h-3" /> {slot.repeats === "none" ? "Single" : slot.repeats}
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

const RowField = ({
  icon: Ic, label, children, variant = "default",
}: { icon: React.ComponentType<any>; label: string; children: React.ReactNode; variant?: "default" | "fixed" }) => (
  <div
    className={cn(
      "flex items-center gap-2 rounded-xl px-2 py-1.5 min-h-[36px]",
      variant === "fixed"
        ? "bg-gradient-to-br from-primary/10 to-accent/10 ring-1 ring-primary/25 shadow-glass"
        : "ghost-border bg-surface-lowest",
    )}
  >
    <span
      className={cn(
        "grid place-items-center w-6 h-6 rounded-full shrink-0",
        variant === "fixed" ? "bg-primary text-primary-foreground" : "bg-surface-low text-primary",
      )}
    >
      <Ic className="w-3 h-3" />
    </span>
    <span
      className={cn(
        "text-[10px] font-bold shrink-0 w-[70px] uppercase tracking-wider",
        variant === "fixed" ? "text-primary" : "text-muted-foreground",
      )}
    >
      {label}
    </span>
    <div className="flex-1 min-w-0 flex items-center justify-end [&>*]:max-w-full">{children}</div>
  </div>
);

const CompactSelect = ({
  value, onChange, options,
}: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full px-2 py-1 rounded-lg ghost-border bg-surface-lowest text-[11px] font-bold text-primary outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>{o.label}</option>
    ))}
  </select>
);

const BuilderRow = ({
  label, children, stacked,
}: { label: string; children: React.ReactNode; stacked?: boolean }) => (
  <div
    className={cn(
      "py-1.5",
      stacked
        ? "flex flex-col gap-1"
        : "flex items-center gap-3 border-b border-border/40 last:border-b-0",
    )}
  >
    <span
      className={cn(
        "text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0",
        !stacked && "w-[88px]",
      )}
    >
      {label}
    </span>
    <div className="flex-1 min-w-0">{children}</div>
  </div>
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
      className="w-full px-2 py-1 rounded-lg bg-surface-lowest ghost-border text-[12px] font-bold text-primary tabular-nums text-center outline-none focus:ring-2 focus:ring-primary/30"
    />
  );
};

const WindowTabs = ({
  startMin, endMin, callMin, count, onStart, onEnd, onCount,
}: {
  startMin: number; endMin: number; callMin: number; count: number;
  onStart: (v: number) => void; onEnd: (v: number) => void; onCount: (n: number) => void;
}) => {
  const tabBase = "rounded-xl ghost-border bg-surface-low p-3 flex flex-col items-center justify-between gap-2 min-h-[104px]";
  const labelCls = "text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70";
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className={tabBase}>
        <span className={labelCls}>Start Time</span>
        <TimeInput value={startMin} onChange={onStart} />
        <span className="text-[9px] text-muted-foreground/60">window begins</span>
      </div>
      <div className={tabBase}>
        <span className={labelCls}>End Time</span>
        <TimeInput value={endMin} onChange={onEnd} />
        <span className="text-[9px] text-muted-foreground/60">window ends</span>
      </div>
      <div className={tabBase}>
        <span className={labelCls}>Slot Count</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onCount(Math.max(1, count - 1))}
            className="w-7 h-7 rounded-md ghost-border bg-surface-lowest text-primary font-bold hover:bg-surface"
            aria-label="Decrease slot count"
          >−</button>
          <div className="min-w-[44px] text-center font-headline font-extrabold text-primary text-lg tabular-nums">{count}</div>
          <button
            type="button"
            onClick={() => onCount(count + 1)}
            className="w-7 h-7 rounded-md ghost-border bg-surface-lowest text-primary font-bold hover:bg-surface"
            aria-label="Increase slot count"
          >+</button>
        </div>
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground/60 tabular-nums">{callMin}-min each</span>
      </div>
    </div>
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

// ---------- Clone Date Picker (Step 5) ----------
const CloneDatePicker = ({
  baseDate, baseDateTo, value, onChange, startMin, endMin, excludeId,
}: {
  baseDate: string;
  baseDateTo?: string;
  value: string[];
  onChange: (next: string[]) => void;
  startMin: number;
  endMin: number;
  excludeId?: string;
}) => {
  const baseSet = useMemo(() => {
    const s = new Set<string>();
    const start = new Date(baseDate);
    const end = baseDateTo ? new Date(baseDateTo) : start;
    for (let d = new Date(start); d <= end; d = addDays(d, 1)) s.add(toISO(d));
    return s;
  }, [baseDate, baseDateTo]);

  const selected = useMemo(() => value.map((d) => new Date(d)), [value]);
  const conflictISO = useMemo(
    () => value.filter((d) => !!findConflict(d, startMin, endMin, excludeId)),
    [value, startMin, endMin, excludeId],
  );
  const conflictSet = useMemo(() => new Set(conflictISO), [conflictISO]);
  const removeConflicts = () => onChange(value.filter((d) => !conflictSet.has(d)));

  const handleDayClick = (day: Date) => {
    const iso = toISO(day);
    if (baseSet.has(iso)) return; // can't clone onto the source date
    const next = value.includes(iso) ? value.filter((d) => d !== iso) : [...value, iso].sort();
    onChange(next);
  };

  return (
    <div className="rounded-2xl ghost-border bg-surface-lowest p-3">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
          Click a date to clone · click again to remove
        </p>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold">
            {value.length} clone{value.length === 1 ? "" : "s"}
          </span>
          {conflictISO.length > 0 && (
            <button
              type="button"
              onClick={removeConflicts}
              className="px-2 py-0.5 rounded-full bg-destructive/15 text-destructive text-[10px] font-bold hover:bg-destructive/25"
              title="Remove all conflicted dates"
            >
              Remove {conflictISO.length} conflict{conflictISO.length === 1 ? "" : "s"}
            </button>
          )}
          {value.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-[10px] font-bold text-muted-foreground hover:text-primary inline-flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>
      <Calendar
        mode="multiple"
        selected={selected}
        onDayClick={handleDayClick}
        modifiers={{
          source: Array.from(baseSet).map((d) => new Date(d)),
          conflict: conflictISO.map((d) => new Date(d)),
        }}
        modifiersClassNames={{
          source: "bg-accent text-accent-foreground rounded-md",
          conflict:
            "bg-destructive/20 text-destructive ring-1 ring-destructive/60 rounded-md",
        }}
        disabled={(d) => baseSet.has(toISO(d))}
        className={cn("p-2 pointer-events-auto")}
      />
      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {value.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onChange(value.filter((x) => x !== d))}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold",
                conflictSet.has(d)
                  ? "bg-destructive/15 text-destructive hover:bg-destructive/25"
                  : "bg-primary/10 text-primary hover:bg-primary/20",
              )}
              title={conflictSet.has(d) ? "Conflict — already occupied. Click to remove." : "Remove clone date"}
            >
              {format(new Date(d), "MMM d")} <X className="w-2.5 h-2.5" />
            </button>
          ))}
        </div>
      )}
      {conflictISO.length > 0 && (
        <p className="mt-2 text-[10px] text-destructive font-bold">
          {conflictISO.length} selected date{conflictISO.length === 1 ? "" : "s"} already contain occupied availability.
        </p>
      )}
    </div>
  );
};