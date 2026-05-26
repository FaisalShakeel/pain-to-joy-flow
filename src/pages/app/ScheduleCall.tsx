import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  CalendarDays, Video, Check, MapPin, Zap, Users,
  Lock, Globe, Sparkles, Clock, Timer, ChevronLeft, ChevronRight, X,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import Avatar from "@/components/app/Avatar";
import { findContact } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";
import { PriceTag, formatPrice, type Pricing } from "@/components/app/PricingField";
import MockPaymentDialog from "@/components/app/MockPaymentDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// =============================================================================
//  Availock Calendar — Book the right time, in the right format, instantly.
// =============================================================================

type BookingType = "meeting" | "quick" | "event";
type Channel = "online" | "onsite" | "hybrid";
type HybridPick = "online" | "onsite";

interface MeetingSlot {
  id: string;
  kind: "meeting";
  date: string;          // YYYY-MM-DD
  time: string;          // "10:00"
  durations: number[];   // available [15,20,25,30,35]
  channel: Channel;
  location?: string;
  approval?: boolean;
  taken?: HybridPick;    // for hybrid: which side already booked
  full?: boolean;
  pricing?: Pricing;
}
interface QuickSlot {
  id: string;
  kind: "quick";
  date: string;
  time: string;
  duration: 3 | 5 | 8;
  approval?: boolean;
  full?: boolean;
  pricing?: Pricing;
}
type Slot = MeetingSlot | QuickSlot;

// ---------- Seed (provider's published windows) ----------
const todayISO = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

const SLOTS: Slot[] = [
  // Day +0
  { id: "m1", kind: "meeting", date: todayISO(0), time: "10:00", durations: [15,20,30], channel: "hybrid", location: "Studio · DIFC L12", approval: true, pricing: { mode: "paid", amount: 75, currency: "USD", note: "Includes recording" } },
  { id: "m2", kind: "meeting", date: todayISO(0), time: "11:30", durations: [15,20,25,30,35], channel: "online" },
  { id: "m3", kind: "meeting", date: todayISO(0), time: "14:00", durations: [25,30,35], channel: "onsite", location: "Atlas HQ Reception", pricing: { mode: "paid", amount: 120, currency: "USD" } },
  { id: "q1", kind: "quick",   date: todayISO(0), time: "16:10", duration: 5 },
  { id: "q2", kind: "quick",   date: todayISO(0), time: "16:20", duration: 3 },
  { id: "q3", kind: "quick",   date: todayISO(0), time: "16:35", duration: 8, full: true },
  // Day +1
  { id: "m4", kind: "meeting", date: todayISO(1), time: "09:30", durations: [15,20], channel: "online" },
  { id: "m5", kind: "meeting", date: todayISO(1), time: "13:00", durations: [25,30,35], channel: "hybrid", location: "Studio · DIFC L12", taken: "onsite" },
  { id: "q4", kind: "quick",   date: todayISO(1), time: "11:00", duration: 5 },
  { id: "q5", kind: "quick",   date: todayISO(1), time: "11:08", duration: 3, pricing: { mode: "paid", amount: 9, currency: "USD" } },
  // Day +2
  { id: "m6", kind: "meeting", date: todayISO(2), time: "15:00", durations: [20,25,30], channel: "onsite", location: "Atlas HQ Reception", approval: true },
  { id: "q6", kind: "quick",   date: todayISO(2), time: "10:00", duration: 8 },
  { id: "q7", kind: "quick",   date: todayISO(2), time: "10:12", duration: 5 },
  // Day +4
  { id: "m7", kind: "meeting", date: todayISO(4), time: "10:00", durations: [15,20,25,30,35], channel: "online" },
  { id: "q8", kind: "quick",   date: todayISO(4), time: "17:00", duration: 5, approval: true },
];

const channelMeta: Record<Channel, { label: string; icon: React.ComponentType<any>; cls: string; dot: string }> = {
  online: { label: "Online",  icon: Video,    cls: "bg-sky-500/10 text-sky-700 border-sky-500/30",       dot: "bg-sky-500" },
  onsite: { label: "On-site", icon: MapPin,   cls: "bg-indigo-500/10 text-indigo-700 border-indigo-500/30", dot: "bg-indigo-500" },
  hybrid: { label: "Hybrid",  icon: Sparkles, cls: "bg-violet-500/10 text-violet-700 border-violet-500/30", dot: "bg-violet-500" },
};

const monthLabel = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
};
const dayShort = (iso: string) => {
  const d = new Date(iso);
  return { dow: d.toLocaleDateString(undefined, { weekday: "short" }), num: d.getDate() };
};

// Time math + duration constraints
// Meetings: 15–35 min only. Quick Syncs: 3–8 min only.
const MEETING_MIN = 15;
const MEETING_MAX = 35;
const QUICK_ALLOWED = [3, 5, 8] as const;

const clampMeetingDurations = (ds: number[]): number[] => {
  const filtered = ds.filter((d) => d >= MEETING_MIN && d <= MEETING_MAX);
  return filtered.length ? filtered : [MEETING_MIN];
};
const clampQuickDuration = (d: number): 3 | 5 | 8 => {
  if (d <= 3) return 3;
  if (d <= 5) return 5;
  return 8;
};

const addMinutes = (hhmm: string, mins: number): string => {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

// =============================================================================
const ScheduleCall = () => {
  const { id = "" } = useParams();
  const contact = useMemo(() => findContact(id), [id]);
  const navigate = useNavigate();

  const [bookingType, setBookingType] = useState<BookingType>("meeting");
  const [activeDate, setActiveDate] = useState<string>(todayISO(0));
  const [slotId, setSlotId] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [hybridPick, setHybridPick] = useState<HybridPick>("online");
  const [notes, setNotes] = useState("");
  const [tz] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  // 14-day strip
  const dayStrip = useMemo(() => Array.from({ length: 14 }, (_, i) => todayISO(i)), []);

  const slotKindForType = bookingType === "quick" ? "quick" : "meeting";
  const filtered = useMemo(
    () =>
      bookingType === "event"
        ? []
        : SLOTS.filter((s) => s.date === activeDate && s.kind === slotKindForType),
    [activeDate, bookingType, slotKindForType]
  );

  const selected = useMemo(() => SLOTS.find((s) => s.id === slotId) || null, [slotId]);

  // Reset duration when slot changes
  const pickSlot = (s: Slot) => {
    setSlotId(s.id);
    if (s.kind === "meeting") {
      setDuration(s.durations[0]);
      if (s.channel === "hybrid") setHybridPick(s.taken === "online" ? "onsite" : "online");
    } else {
      setDuration(s.duration);
    }
    setSummaryOpen(true);
  };

  if (!contact) {
    return (
      <AppShell title="Contact not found">
        <Link to="/app/contacts" className="text-accent hover:underline">← Back to contacts</Link>
      </AppShell>
    );
  }

  const channelLabelForSelected = (): string => {
    if (!selected) return "";
    if (selected.kind === "quick") return `Quick Sync · ${selected.duration} min`;
    if (selected.channel === "hybrid")
      return hybridPick === "online" ? "Online meeting" : `On-site · ${selected.location}`;
    if (selected.channel === "online") return "Online meeting";
    return `On-site · ${selected.location}`;
  };

  const confirm = () => {
    if (!selected || !duration) return;
    const needsApproval = selected.approval;
    const isPaid = selected.pricing?.mode === "paid";
    if (isPaid) {
      setPaymentOpen(true);
      return;
    }
    toast({
      title: needsApproval ? "Booking requested" : "Booked",
      description: `${dayShort(selected.date).dow} ${dayShort(selected.date).num} · ${selected.time} · ${duration} min · ${channelLabelForSelected()}`,
    });
    navigate("/app");
  };

  const finalizeAfterPayment = () => {
    if (!selected || !duration) return;
    const needsApproval = selected.approval;
    toast({
      title: needsApproval ? "Paid · booking requested" : "Paid · booked",
      description: `${dayShort(selected.date).dow} ${dayShort(selected.date).num} · ${selected.time} · ${duration} min · ${channelLabelForSelected()}`,
    });
    navigate("/app");
  };

  const meetingCount = SLOTS.filter(s => s.date === activeDate && s.kind === "meeting").length;
  const quickCount   = SLOTS.filter(s => s.date === activeDate && s.kind === "quick").length;
  const eventCount   = 0;

  return (
    <AppShell
      backTo={`/app/contact/${contact.id}`}
      title={contact.name}
      subtitle="Schedule"
    >
      <div className="space-y-5 max-w-3xl mx-auto">
        {/* THREE EQUAL TABS */}
        <div className="grid grid-cols-3 gap-2">
          <TypeTab
            active={bookingType === "meeting"}
            onClick={() => { setBookingType("meeting"); setSlotId(null); setDuration(null); }}
            icon={<Video className="w-4 h-4" />}
            label="Focus Meeting"
            count={meetingCount}
            tone="focus"
          />
          <TypeTab
            active={bookingType === "quick"}
            onClick={() => { setBookingType("quick"); setSlotId(null); setDuration(null); }}
            icon={<Zap className="w-4 h-4" />}
            label="Quick Sync"
            count={quickCount}
            tone="quick"
          />
          <TypeTab
            active={bookingType === "event"}
            onClick={() => { setBookingType("event"); setSlotId(null); setDuration(null); }}
            icon={<Users className="w-4 h-4" />}
            label="Event Access"
            count={eventCount}
            tone="event"
          />
        </div>

        <div>
          {/* Day strip */}
          <div className="rounded-3xl bg-surface-lowest ghost-border p-5 shadow-ambient">
            <div className="flex items-center justify-between mb-3">
              <p className="font-headline font-bold text-primary">{monthLabel(activeDate)}</p>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] text-muted-foreground bg-surface-low ghost-border rounded-full px-2.5 py-1">
                  <Globe className="w-3 h-3" /> {tz}
                </span>
                <button className="p-1.5 rounded-lg hover:bg-surface ghost-border" aria-label="Previous"><ChevronLeft className="w-4 h-4" /></button>
                <button className="p-1.5 rounded-lg hover:bg-surface ghost-border" aria-label="Next"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
              {dayStrip.map((iso) => {
                const d = dayShort(iso);
                const has = bookingType !== "event" && SLOTS.some(s => s.date === iso && s.kind === slotKindForType);
                const isActive = iso === activeDate;
                return (
                  <button
                    key={iso}
                    onClick={() => { setActiveDate(iso); setSlotId(null); setDuration(null); }}
                    className={`snap-start shrink-0 w-14 py-2.5 rounded-2xl text-center transition flex flex-col items-center gap-0.5 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-glass"
                        : has
                        ? "bg-surface-low ghost-border text-primary hover:bg-surface"
                        : "bg-surface-low/50 ghost-border text-muted-foreground"
                    }`}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{d.dow}</span>
                    <span className="text-base font-bold leading-none">{d.num}</span>
                    <span className={`mt-1 w-1.5 h-1.5 rounded-full ${has ? (isActive ? "bg-gold" : bookingType === "meeting" ? "bg-indigo-500" : bookingType === "quick" ? "bg-amber-500" : "bg-amber-900") : "bg-transparent"}`} />
                  </button>
                );
              })}
            </div>

            {/* Slots grid */}
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
                  {bookingType === "meeting" ? "Focus Meetings" : bookingType === "quick" ? "Quick Syncs" : "Event Access"} · {filtered.length} open
                </p>
                <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {tz}</span>
              </div>

              {filtered.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No {bookingType === "meeting" ? "Focus Meeting" : bookingType === "quick" ? "Quick Sync" : "Event Access"} slots on this day.
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {filtered.map((s) => (
                    <SlotMini key={s.id} slot={s} active={s.id === slotId} onPick={() => pickSlot(s)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Summary Dialog */}
      <Dialog open={summaryOpen && !!selected} onOpenChange={setSummaryOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline">Booking summary</DialogTitle>
          </DialogHeader>
          {selected && duration && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-low ghost-border">
                <Avatar initials={contact.initials} accent={contact.accent} status={contact.status} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-primary truncate">{contact.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{contact.title}</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-primary">
                <li className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-accent" />
                  {dayShort(selected.date).dow} {dayShort(selected.date).num} · {selected.time}
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-accent" />
                  {duration} min
                  <span className="text-xs text-muted-foreground">· 3m buffer</span>
                </li>
                <li className="flex items-center gap-2">
                  {selected.kind === "quick" ? <Zap className="w-4 h-4 text-accent" />
                    : selected.channel === "hybrid"
                    ? (hybridPick === "online" ? <Video className="w-4 h-4 text-accent" /> : <MapPin className="w-4 h-4 text-accent" />)
                    : selected.channel === "online" ? <Video className="w-4 h-4 text-accent" />
                    : <MapPin className="w-4 h-4 text-accent" />}
                  <span>{channelLabelForSelected()}</span>
                </li>
                <li className="flex items-center gap-2 text-xs">
                  {selected.approval ? <Lock className="w-3.5 h-3.5 text-accent" /> : <Check className="w-3.5 h-3.5 text-accent" />}
                  {selected.approval ? "Requires approval" : "Instant booking"}
                </li>
                <li className="flex items-center gap-2 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <span className="font-semibold">{formatPrice(selected.pricing)}</span>
                </li>
                <li className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Globe className="w-3.5 h-3.5" /> {tz}
                </li>
              </ul>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              onClick={() => setSummaryOpen(false)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-surface-low ghost-border text-sm font-semibold text-primary hover:bg-surface transition"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
            <button
              onClick={() => { setSummaryOpen(false); confirm(); }}
              disabled={!selected || !duration}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40 hover:bg-primary/90 transition"
            >
              <Check className="w-4 h-4" />
              {selected?.pricing?.mode === "paid"
                ? `Pay & ${selected.approval ? "request" : "book"}`
                : selected?.approval ? "Request booking" : "Confirm booking"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selected?.pricing?.mode === "paid" && (
        <MockPaymentDialog
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          pricing={selected.pricing}
          title={`Pay for ${selected.kind === "quick" ? "Quick Sync" : "Meeting"}`}
          description={`${dayShort(selected.date).dow} ${dayShort(selected.date).num} · ${selected.time} · ${duration ?? ""} min`}
          onSuccess={finalizeAfterPayment}
        />
      )}
    </AppShell>
  );
};

// ---------- Subcomponents ----------
function BookingTab({
  active, onClick, icon, title, sub, accent, count,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; sub: string; accent: "primary" | "gold"; count: number }) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-5 rounded-3xl ghost-border transition shadow-ambient ${
        active
          ? accent === "primary"
            ? "bg-primary text-primary-foreground border-primary shadow-elevated"
            : "bg-amber-500 text-white border-amber-500 shadow-elevated"
          : "bg-surface-lowest text-primary hover:bg-surface"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`grid place-items-center w-11 h-11 rounded-2xl ${
          active ? "bg-white/15" : accent === "primary" ? "bg-primary/10 text-primary" : "bg-amber-500/15 text-amber-700"
        }`}>{icon}</span>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
          active ? "bg-white/15" : "bg-surface ghost-border text-muted-foreground"
        }`}>
          {count} today
        </span>
      </div>
      <p className="mt-3 font-headline font-bold text-lg leading-tight">{title}</p>
      <p className={`text-xs mt-0.5 ${active ? "text-white/80" : "text-muted-foreground"}`}>{sub}</p>
    </button>
  );
}

function MeetingCard({
  slot, active, onPick, hybridPick, onPickChannel,
}: {
  slot: MeetingSlot;
  active: boolean;
  onPick: () => void;
  hybridPick: HybridPick;
  onPickChannel: (ch: HybridPick) => void;
}) {
  const C = channelMeta[slot.channel];
  const disabled = slot.full;
  const durations = clampMeetingDurations(slot.durations);
  const maxDur = durations[durations.length - 1];
  const endTime = addMinutes(slot.time, maxDur);
  return (
    <button
      onClick={onPick}
      disabled={disabled}
      className={`text-left p-2 rounded-lg border transition ${
        disabled
          ? "bg-muted/40 border-border text-muted-foreground cursor-not-allowed line-through"
          : active
          ? "bg-primary text-primary-foreground border-primary shadow-elevated"
          : "bg-surface-low ghost-border text-primary hover:bg-surface hover:shadow-ambient"
      }`}
    >
      <div className="flex items-center justify-between gap-1.5">
        <span className="font-headline font-bold text-[12px] tabular-nums leading-none">
          {slot.time}<span className="opacity-70">–{endTime}</span>
        </span>
        <span className="inline-flex items-center gap-1">
          {slot.channel === "hybrid" ? (
            <>
              <HybridIcon
                Icon={Video}
                title="Online"
                active={active && hybridPick === "online"}
                taken={slot.taken === "online"}
                onClick={(e) => { e.stopPropagation(); onPickChannel("online"); }}
                tone="sky"
                cardActive={active}
              />
              <HybridIcon
                Icon={MapPin}
                title="On-site"
                active={active && hybridPick === "onsite"}
                taken={slot.taken === "onsite"}
                onClick={(e) => { e.stopPropagation(); onPickChannel("onsite"); }}
                tone="indigo"
                cardActive={active}
              />
            </>
          ) : (
            <C.icon className={`w-3 h-3 ${active ? "text-primary-foreground" : slot.channel === "online" ? "text-sky-600" : "text-indigo-600"}`} />
          )}
        </span>
      </div>
      <p className={`mt-0.5 text-[10px] leading-tight ${active ? "text-primary-foreground/85" : "text-muted-foreground"}`}>
        {durations[0]}–{maxDur} min
        {slot.location && slot.channel !== "online" ? ` · ${slot.location}` : ""}
      </p>
      <div className="mt-1">
        <PriceTag pricing={slot.pricing} />
      </div>
      <div className={`mt-1 flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-[9px] ${active ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
        <span className="inline-flex items-center gap-0.5"><Timer className="w-2.5 h-2.5" /> 3m buf</span>
        {slot.approval && <span className="inline-flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> Approval</span>}
        {slot.channel === "hybrid" && slot.taken && (
          <span>{slot.taken === "online" ? "On-site only" : "Online only"}</span>
        )}
        {slot.channel === "hybrid" && !slot.taken && active && (
          <span className="font-semibold">
            · {hybridPick === "online" ? "Online" : "On-site"}
          </span>
        )}
      </div>
    </button>
  );
}

function HybridIcon({
  Icon, title, active, taken, onClick, tone, cardActive,
}: {
  Icon: React.ComponentType<any>;
  title: string;
  active: boolean;
  taken: boolean;
  onClick: (e: React.MouseEvent) => void;
  tone: "sky" | "indigo";
  cardActive: boolean;
}) {
  const toneRing = tone === "sky" ? "ring-sky-400 bg-sky-500/15 text-sky-700" : "ring-indigo-400 bg-indigo-500/15 text-indigo-700";
  return (
    <span
      role="button"
      title={title}
      aria-pressed={active}
      onClick={taken ? undefined : onClick}
      className={`grid place-items-center w-6 h-6 rounded-md transition cursor-pointer ${
        taken
          ? "opacity-30 cursor-not-allowed"
          : active
          ? `ring-2 ${toneRing}`
          : cardActive
          ? "bg-white/15 text-primary-foreground hover:bg-white/25"
          : `${toneRing} hover:brightness-110`
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
    </span>
  );
}

function QuickCard({ slot, active, onPick }: { slot: QuickSlot; active: boolean; onPick: () => void }) {
  const disabled = slot.full;
  const dur = clampQuickDuration(slot.duration);
  const endTime = addMinutes(slot.time, dur);
  return (
    <button
      onClick={onPick}
      disabled={disabled}
      className={`text-left p-2 rounded-lg border transition relative overflow-hidden ${
        disabled
          ? "bg-muted/40 border-border text-muted-foreground cursor-not-allowed line-through"
          : active
          ? "bg-amber-500 text-white border-amber-500 shadow-elevated"
          : "bg-amber-500/5 border-amber-500/30 text-primary hover:bg-amber-500/10"
      }`}
    >
      <div className="flex items-center justify-between gap-1.5">
        <span className="font-headline font-bold text-[12px] tabular-nums inline-flex items-center gap-1 leading-none">
          <Zap className={`w-3 h-3 ${active ? "text-white" : "text-amber-600"}`} />
          {slot.time}<span className="opacity-70">–{endTime}</span>
        </span>
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${active ? "bg-white/20" : "bg-amber-500/15 text-amber-700"}`}>
          {dur} min
        </span>
      </div>
      <p className={`mt-0.5 text-[10px] leading-tight inline-flex items-center gap-1 ${active ? "text-white/85" : "text-muted-foreground"}`}>
        <Video className="w-2.5 h-2.5" /> Online · one-tap
      </p>
      <div className="mt-1">
        <PriceTag pricing={slot.pricing} />
      </div>
      <div className={`mt-1 flex items-center gap-1.5 text-[9px] ${active ? "text-white/75" : "text-muted-foreground"}`}>
        {slot.approval ? <span className="inline-flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> Approval</span>
          : <span className="inline-flex items-center gap-0.5"><Timer className="w-2.5 h-2.5" /> Instant</span>}
      </div>
    </button>
  );
}

function ChannelBtn({
  picked, onClick, icon, title, sub, disabled,
}: { picked: boolean; onClick: () => void; icon: React.ReactNode; title: string; sub: string; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-start gap-3 p-4 rounded-2xl text-left transition ${
        disabled
          ? "bg-muted/40 ghost-border text-muted-foreground cursor-not-allowed"
          : picked
          ? "bg-primary text-primary-foreground shadow-elevated"
          : "bg-surface-low ghost-border text-primary hover:bg-surface"
      }`}
    >
      <span className={`grid place-items-center w-10 h-10 rounded-xl ${picked && !disabled ? "bg-white/15" : "bg-primary/10 text-primary"}`}>
        {icon}
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className={`text-xs ${picked && !disabled ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{sub}</p>
      </div>
    </button>
  );
}

export default ScheduleCall;
