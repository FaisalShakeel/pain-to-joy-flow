import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, CalendarDays, Phone, Video, Check, MapPin, Zap,
  Lock, Globe, Sparkles, Clock, Timer, MessageSquare, ChevronLeft, ChevronRight,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import Avatar from "@/components/app/Avatar";
import { findContact } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";

// =============================================================================
//  Availock Calendar — Book the right time, in the right format, instantly.
// =============================================================================

type BookingType = "meeting" | "quick";
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
}
interface QuickSlot {
  id: string;
  kind: "quick";
  date: string;
  time: string;
  duration: 3 | 5 | 8;
  approval?: boolean;
  full?: boolean;
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
  { id: "m1", kind: "meeting", date: todayISO(0), time: "10:00", durations: [15,20,30], channel: "hybrid", location: "Studio · DIFC L12", approval: true },
  { id: "m2", kind: "meeting", date: todayISO(0), time: "11:30", durations: [15,20,25,30,35], channel: "online" },
  { id: "m3", kind: "meeting", date: todayISO(0), time: "14:00", durations: [25,30,35], channel: "onsite", location: "Atlas HQ Reception" },
  { id: "q1", kind: "quick",   date: todayISO(0), time: "16:10", duration: 5 },
  { id: "q2", kind: "quick",   date: todayISO(0), time: "16:20", duration: 3 },
  { id: "q3", kind: "quick",   date: todayISO(0), time: "16:35", duration: 8, full: true },
  // Day +1
  { id: "m4", kind: "meeting", date: todayISO(1), time: "09:30", durations: [15,20], channel: "online" },
  { id: "m5", kind: "meeting", date: todayISO(1), time: "13:00", durations: [25,30,35], channel: "hybrid", location: "Studio · DIFC L12", taken: "onsite" },
  { id: "q4", kind: "quick",   date: todayISO(1), time: "11:00", duration: 5 },
  { id: "q5", kind: "quick",   date: todayISO(1), time: "11:08", duration: 3 },
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

  // 14-day strip
  const dayStrip = useMemo(() => Array.from({ length: 14 }, (_, i) => todayISO(i)), []);

  const filtered = useMemo(
    () => SLOTS.filter((s) => s.date === activeDate && s.kind === (bookingType === "meeting" ? "meeting" : "quick")),
    [activeDate, bookingType]
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
    if (selected.kind === "quick") return `Quick call · ${selected.duration} min`;
    if (selected.channel === "hybrid")
      return hybridPick === "online" ? "Online meeting" : `On-site · ${selected.location}`;
    if (selected.channel === "online") return "Online meeting";
    return `On-site · ${selected.location}`;
  };

  const confirm = () => {
    if (!selected || !duration) return;
    const needsApproval = selected.approval;
    toast({
      title: needsApproval ? "Booking requested" : "Booked",
      description: `${dayShort(selected.date).dow} ${dayShort(selected.date).num} · ${selected.time} · ${duration} min · ${channelLabelForSelected()}`,
    });
    navigate("/app");
  };

  const meetingCount = SLOTS.filter(s => s.date === activeDate && s.kind === "meeting").length;
  const quickCount   = SLOTS.filter(s => s.date === activeDate && s.kind === "quick").length;

  return (
    <AppShell subtitle="Book the right time, in the right format" title={`Schedule with ${contact.name.split(" ")[0]}`}>
      <Link to={`/app/contact/${contact.id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to profile
      </Link>

      <div className="grid lg:grid-cols-[1fr_360px] gap-5 pb-28 lg:pb-0">
        {/* ============================ MAIN ============================ */}
        <div className="space-y-5">
          {/* Provider mini header */}
          <div className="rounded-3xl bg-surface-lowest ghost-border p-5 shadow-ambient flex items-center gap-4">
            <Avatar initials={contact.initials} accent={contact.accent} />
            <div className="min-w-0 flex-1">
              <p className="font-headline font-bold text-primary truncate">{contact.name}</p>
              <p className="text-xs text-muted-foreground truncate">{contact.title} · {contact.org}</p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground bg-surface-low ghost-border rounded-full px-3 py-1.5">
              <Globe className="w-3.5 h-3.5" /> {tz}
            </div>
          </div>

          {/* BookingTypeTabs */}
          <div className="grid sm:grid-cols-2 gap-3">
            <BookingTab
              active={bookingType === "meeting"}
              onClick={() => { setBookingType("meeting"); setSlotId(null); setDuration(null); }}
              icon={<CalendarDays className="w-5 h-5" />}
              title="Meeting"
              sub="15 – 35 min · depth conversations"
              accent="primary"
              count={meetingCount}
            />
            <BookingTab
              active={bookingType === "quick"}
              onClick={() => { setBookingType("quick"); setSlotId(null); setDuration(null); }}
              icon={<Zap className="w-5 h-5" />}
              title="Quick Call"
              sub="3 / 5 / 8 min · rapid sync"
              accent="gold"
              count={quickCount}
            />
          </div>

          {/* Day strip */}
          <div className="rounded-3xl bg-surface-lowest ghost-border p-5 shadow-ambient">
            <div className="flex items-center justify-between mb-3">
              <p className="font-headline font-bold text-primary">{monthLabel(activeDate)}</p>
              <div className="flex items-center gap-1">
                <button className="p-1.5 rounded-lg hover:bg-surface ghost-border" aria-label="Previous"><ChevronLeft className="w-4 h-4" /></button>
                <button className="p-1.5 rounded-lg hover:bg-surface ghost-border" aria-label="Next"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
              {dayStrip.map((iso) => {
                const d = dayShort(iso);
                const has = SLOTS.some(s => s.date === iso && s.kind === (bookingType === "meeting" ? "meeting" : "quick"));
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
                    <span className={`mt-1 w-1.5 h-1.5 rounded-full ${has ? (isActive ? "bg-gold" : bookingType === "meeting" ? "bg-primary" : "bg-amber-500") : "bg-transparent"}`} />
                  </button>
                );
              })}
            </div>

            {/* Slots grid */}
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
                  {bookingType === "meeting" ? "Meeting slots" : "Quick calls"} · {filtered.length} open
                </p>
                <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {tz}</span>
              </div>

              {filtered.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No {bookingType === "meeting" ? "meeting" : "quick call"} slots on this day.
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                   {filtered.map((s) =>
                     s.kind === "meeting" ? (
                       <MeetingCard
                         key={s.id}
                         slot={s}
                         active={s.id === slotId}
                         hybridPick={hybridPick}
                         onPick={() => pickSlot(s)}
                         onPickChannel={(ch) => { pickSlot(s); setHybridPick(ch); }}
                       />
                     ) : (
                      <QuickCard key={s.id} slot={s} active={s.id === slotId} onPick={() => pickSlot(s)} />
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Slot configuration: Channel + Duration */}
          {selected && (
            <div className="rounded-3xl bg-surface-lowest ghost-border p-5 shadow-ambient space-y-5">
              {/* Channel for hybrid */}
              {selected.kind === "meeting" && selected.channel === "hybrid" && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Channel · choose one</p>
                  <p className="mt-1 text-xs text-muted-foreground">Booking either auto-closes the alternate for this time block.</p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <ChannelBtn
                      picked={hybridPick === "online"}
                      disabled={selected.taken === "online"}
                      onClick={() => setHybridPick("online")}
                      icon={<Video className="w-5 h-5" />}
                      title="Online meeting"
                      sub={selected.taken === "online" ? "Already booked" : "Secure link generated"}
                    />
                    <ChannelBtn
                      picked={hybridPick === "onsite"}
                      disabled={selected.taken === "onsite"}
                      onClick={() => setHybridPick("onsite")}
                      icon={<MapPin className="w-5 h-5" />}
                      title="On-site"
                      sub={selected.taken === "onsite" ? "Already booked" : selected.location || "Studio"}
                    />
                  </div>
                </div>
              )}

              {/* Duration selector */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
                  {selected.kind === "meeting" ? "Meeting length" : "Call length"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(selected.kind === "meeting" ? selected.durations : [selected.duration]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition ghost-border ${
                        duration === d
                          ? selected.kind === "meeting"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-amber-500 text-white border-amber-500"
                          : "bg-surface-low text-primary hover:bg-surface"
                      }`}
                    >
                      {d} min
                    </button>
                  ))}
                </div>
                {selected.kind === "meeting" && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-primary/5 ghost-border p-3 text-xs text-muted-foreground">
                    <Timer className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p>
                      <span className="font-semibold text-primary">3-minute buffer included.</span>{" "}
                      Client can join 3 min before the scheduled time, and the call may extend up to 3 min beyond the allocated duration.
                    </p>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Anything they should know before the call?"
                  className="mt-2 w-full rounded-2xl bg-surface-low ghost-border p-3 text-sm text-primary placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          )}
        </div>

        {/* ============================ SUMMARY ============================ */}
        <aside className="hidden lg:block rounded-3xl bg-gradient-vault text-primary-foreground p-6 shadow-elevated h-fit lg:sticky lg:top-24">
          <div className="flex items-center gap-3">
            <Avatar initials={contact.initials} accent={contact.accent} />
            <div>
              <p className="font-headline font-bold">{contact.name}</p>
              <p className="text-xs text-primary-foreground/80">{contact.title}</p>
            </div>
          </div>

          <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.2em] text-gold">Booking summary</p>
          {selected && duration ? (
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-gold" />
                {dayShort(selected.date).dow} {dayShort(selected.date).num} · {selected.time}
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gold" />
                {duration} minutes
              </li>
              <li className="flex items-center gap-2">
                {selected.kind === "quick" ? <Zap className="w-4 h-4 text-gold" />
                  : selected.channel === "hybrid"
                  ? (hybridPick === "online" ? <Video className="w-4 h-4 text-gold" /> : <MapPin className="w-4 h-4 text-gold" />)
                  : selected.channel === "online" ? <Video className="w-4 h-4 text-gold" />
                  : <MapPin className="w-4 h-4 text-gold" />}
                <span>{channelLabelForSelected()}</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-primary-foreground/85">
                <Globe className="w-3.5 h-3.5 text-gold" /> {tz}
              </li>
              <li className="flex items-center gap-2 text-xs text-primary-foreground/85">
                {selected.approval ? <Lock className="w-3.5 h-3.5 text-gold" /> : <Check className="w-3.5 h-3.5 text-gold" />}
                {selected.approval ? "Requires approval" : "Instant booking"}
              </li>
              {notes && (
                <li className="flex items-start gap-2 text-xs text-primary-foreground/80">
                  <MessageSquare className="w-3.5 h-3.5 text-gold mt-0.5" /> {notes}
                </li>
              )}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-primary-foreground/75">
              Pick a {bookingType === "meeting" ? "meeting" : "quick call"} slot to continue.
            </p>
          )}

          <button
            onClick={confirm}
            disabled={!selected || !duration}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-gold text-primary font-bold hover:bg-gold/90 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" /> {selected?.approval ? "Request booking" : "Confirm booking"}
          </button>
          <Link to={`/app/contact/${contact.id}/call`} className="mt-3 block text-center text-xs font-semibold text-gold hover:underline">
            Or try Live Call now <ArrowRight className="w-3 h-3 inline" />
          </Link>
          <p className="mt-4 text-center text-[10px] uppercase tracking-[0.2em] text-primary-foreground/50">
            Availock Calendar
          </p>
        </aside>
      </div>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface-lowest/95 backdrop-blur ghost-border border-t p-3">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Summary</p>
            <p className="text-sm text-primary truncate font-semibold">
              {selected && duration
                ? `${selected.time} · ${duration}m · ${channelLabelForSelected()}`
                : `Pick a ${bookingType === "meeting" ? "meeting" : "quick call"} slot`}
            </p>
          </div>
          <button
            onClick={confirm}
            disabled={!selected || !duration}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40"
          >
            <Check className="w-4 h-4" /> {selected?.approval ? "Request" : "Confirm"}
          </button>
        </div>
      </div>
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
  return (
    <button
      onClick={onPick}
      disabled={disabled}
      className={`text-left p-3 rounded-xl border transition ${
        disabled
          ? "bg-muted/40 border-border text-muted-foreground cursor-not-allowed line-through"
          : active
          ? "bg-primary text-primary-foreground border-primary shadow-elevated"
          : "bg-surface-low ghost-border text-primary hover:bg-surface hover:shadow-ambient"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-headline font-bold text-sm leading-none">{slot.time}</span>
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
            <C.icon className={`w-3.5 h-3.5 ${active ? "text-primary-foreground" : slot.channel === "online" ? "text-sky-600" : "text-indigo-600"}`} />
          )}
        </span>
      </div>
      <p className={`mt-1 text-[11px] leading-tight ${active ? "text-primary-foreground/85" : "text-muted-foreground"}`}>
        {slot.durations[0]}–{slot.durations[slot.durations.length - 1]} min
        {slot.location && slot.channel !== "online" ? ` · ${slot.location}` : ""}
      </p>
      <div className={`mt-1.5 flex items-center gap-2 text-[10px] ${active ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
        <span className="inline-flex items-center gap-1"><Timer className="w-3 h-3" /> 3-min buffer</span>
        {slot.approval && <span className="inline-flex items-center gap-1"><Lock className="w-3 h-3" /> Approval</span>}
        {slot.channel === "hybrid" && slot.taken && (
          <span className="inline-flex items-center gap-1">{slot.taken === "online" ? "On-site only" : "Online only"}</span>
        )}
        {slot.channel === "hybrid" && !slot.taken && active && (
          <span className="inline-flex items-center gap-1 font-semibold">
            · {hybridPick === "online" ? "Online picked" : "On-site picked"}
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
  return (
    <button
      onClick={onPick}
      disabled={disabled}
      className={`text-left p-3 rounded-xl border transition relative overflow-hidden ${
        disabled
          ? "bg-muted/40 border-border text-muted-foreground cursor-not-allowed line-through"
          : active
          ? "bg-amber-500 text-white border-amber-500 shadow-elevated"
          : "bg-amber-500/5 border-amber-500/30 text-primary hover:bg-amber-500/10"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-headline font-bold text-sm inline-flex items-center gap-1.5 leading-none">
          <Zap className={`w-3.5 h-3.5 ${active ? "text-white" : "text-amber-600"}`} /> {slot.time}
        </span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? "bg-white/20" : "bg-amber-500/15 text-amber-700"}`}>
          {slot.duration} min
        </span>
      </div>
      <p className={`mt-1 text-[11px] leading-tight inline-flex items-center gap-1 ${active ? "text-white/85" : "text-muted-foreground"}`}>
        <Video className="w-3 h-3" /> Online · one-tap
      </p>
      <div className={`mt-1.5 flex items-center gap-2 text-[10px] ${active ? "text-white/75" : "text-muted-foreground"}`}>
        {slot.approval ? <span className="inline-flex items-center gap-1"><Lock className="w-3 h-3" /> Approval</span>
          : <span className="inline-flex items-center gap-1"><Timer className="w-3 h-3" /> Instant</span>}
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
