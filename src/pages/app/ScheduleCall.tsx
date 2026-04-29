import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, CalendarDays, Phone, Video, Check, MapPin, Zap,
  Lock, Repeat, Crown, Globe, Users as UsersIcon, Sparkles, Clock, Timer,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import Avatar from "@/components/app/Avatar";
import { findContact } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";

// ---------- Mock: slots created in Slot Builder (mirrors SlotBuilder seed) ----------
type SlotMode = "hybrid" | "online" | "onsite" | "quicksync";
type SlotChannel = "voice" | "video";
type Access = "public" | "contacts" | "approved" | "priority";

interface BookableSlot {
  id: string;
  title: string;
  day: string;     // "Wed 14"
  time: string;    // "15:00"
  mode: SlotMode;
  duration: number; // minutes (whole window or per-call for quicksync)
  access: Access;
  recurring: boolean;
  approval: boolean;
  // hybrid -> both channels offered; user picks one (auto-closes the other)
  channels?: SlotChannel[];
  // online -> single channel
  channel?: SlotChannel;
  // onsite -> location
  location?: string;
  // quicksync -> micro-call grid
  quickSync?: { callMin: 5 | 8; bufferMin: 1 | 2; capacity: number };
}

const days = ["Mon 12", "Tue 13", "Wed 14", "Thu 15", "Fri 16"];

const bookable: BookableSlot[] = [
  { id: "s1", title: "Hybrid Consult", day: "Mon 12", time: "15:00", mode: "hybrid",
    duration: 30, access: "contacts", recurring: true, approval: true,
    channels: ["video", "voice"], location: "Studio · DIFC Lvl 12" },
  { id: "s2a", title: "Quick Sync", day: "Tue 13", time: "10:00", mode: "quicksync",
    duration: 5, access: "public", recurring: true, approval: false,
    quickSync: { callMin: 5, bufferMin: 2, capacity: 8 } },
  { id: "s2b", title: "Quick Sync", day: "Tue 13", time: "10:35", mode: "quicksync",
    duration: 8, access: "public", recurring: true, approval: false,
    quickSync: { callMin: 8, bufferMin: 2, capacity: 5 } },
  { id: "s3", title: "VIP Fast Lane", day: "Wed 14", time: "14:00", mode: "online",
    duration: 15, access: "priority", recurring: false, approval: true, channel: "voice" },
  { id: "s4", title: "Office Hours", day: "Thu 15", time: "11:00", mode: "onsite",
    duration: 30, access: "approved", recurring: true, approval: false,
    location: "Atlas HQ Reception" },
  { id: "s5", title: "Deep Work Break", day: "Fri 16", time: "13:30", mode: "online",
    duration: 30, access: "contacts", recurring: false, approval: false, channel: "video" },
];

const accessMeta: Record<Access, { label: string; icon: React.ComponentType<any>; cls: string }> = {
  public:   { label: "Public",        icon: Globe,    cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  contacts: { label: "Contacts",      icon: UsersIcon,cls: "bg-sky-500/15 text-sky-700 border-sky-500/30" },
  approved: { label: "Approved",      icon: Check,    cls: "bg-indigo-500/15 text-indigo-700 border-indigo-500/30" },
  priority: { label: "Priority only", icon: Crown,    cls: "bg-amber-500/20 text-amber-800 border-amber-500/40" },
};

const modeMeta: Record<SlotMode, { label: string; icon: React.ComponentType<any> }> = {
  hybrid:    { label: "Hybrid",     icon: Sparkles },
  online:    { label: "Online",     icon: Video },
  onsite:    { label: "On-site",    icon: MapPin },
  quicksync: { label: "Quick sync", icon: Zap },
};

const ScheduleCall = () => {
  const { id = "" } = useParams();
  const contact = useMemo(() => findContact(id), [id]);
  const navigate = useNavigate();

  const [day, setDay] = useState(days[2]);
  const [slotId, setSlotId] = useState<string>("s3");
  // hybrid channel pick (one-window, two icons → auto-close alternate)
  const [hybridPick, setHybridPick] = useState<SlotChannel>("video");

  const dayslots = useMemo(() => bookable.filter((s) => s.day === day), [day]);
  const selected = useMemo(() => bookable.find((s) => s.id === slotId), [slotId]);

  if (!contact) {
    return (
      <AppShell title="Contact not found">
        <Link to="/app/contacts" className="text-accent hover:underline">← Back to contacts</Link>
      </AppShell>
    );
  }

  const confirm = () => {
    if (!selected) return;
    const channelLabel =
      selected.mode === "hybrid" ? (hybridPick === "video" ? "Video" : "Voice")
      : selected.mode === "online" ? (selected.channel === "video" ? "Video" : "Voice")
      : selected.mode === "onsite" ? `On-site · ${selected.location}`
      : `Quick sync · ${selected.quickSync?.callMin}m`;
    toast({
      title: "Booked",
      description: `${day} · ${selected.time} · ${channelLabel} with ${contact.name}.`,
    });
    navigate("/app");
  };

  return (
    <AppShell subtitle="Book against open slots" title={`Schedule with ${contact.name.split(" ")[0]}`}>
      <Link to={`/app/contact/${contact.id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to profile
      </Link>

      <div className="grid lg:grid-cols-[1fr_340px] gap-5">
        <div className="space-y-5">
          {/* Day picker */}
          <div className="rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient">
            <div className="flex items-center justify-between">
              <p className="font-headline font-bold text-primary">October 2026</p>
              <span className="text-xs text-muted-foreground">Times in your timezone · slots set by {contact.name.split(" ")[0]}</span>
            </div>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {days.map((d) => {
                const count = bookable.filter((s) => s.day === d).length;
                return (
                  <button
                    key={d}
                    onClick={() => { setDay(d); const first = bookable.find((s) => s.day === d); if (first) setSlotId(first.id); }}
                    className={`p-3 rounded-2xl text-sm font-semibold transition flex flex-col items-center gap-0.5 ${
                      day === d ? "bg-primary text-primary-foreground shadow-glass" : "bg-surface-low ghost-border text-primary hover:bg-surface"
                    }`}
                  >
                    <span>{d}</span>
                    <span className={`text-[10px] font-medium ${day === d ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
                      {count} {count === 1 ? "slot" : "slots"}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Open slots — {day}</p>
            {dayslots.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No published slots for this day.
              </div>
            ) : (
              <div className="mt-3 grid sm:grid-cols-2 gap-3">
                {dayslots.map((s) => {
                  const Mode = modeMeta[s.mode];
                  const A = accessMeta[s.access];
                  const picked = s.id === slotId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSlotId(s.id)}
                      className={`text-left p-4 rounded-2xl border transition ${
                        picked
                          ? "bg-primary text-primary-foreground border-primary shadow-elevated"
                          : "bg-surface-low ghost-border text-primary hover:bg-surface"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                          <Mode.icon className="w-3.5 h-3.5" /> {Mode.label}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${picked ? "bg-white/15 border-white/30 text-primary-foreground" : A.cls}`}>
                          {A.label}
                        </span>
                      </div>
                      <p className="mt-2 font-headline font-bold text-base leading-tight">{s.title}</p>
                      <div className={`mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ${picked ? "text-primary-foreground/85" : "text-muted-foreground"}`}>
                        <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {s.time} · {s.duration}m</span>
                        {s.approval && <span className="inline-flex items-center gap-1"><Lock className="w-3 h-3" /> Approval</span>}
                        {s.recurring && <span className="inline-flex items-center gap-1"><Repeat className="w-3 h-3" /> Weekly</span>}
                        {s.mode === "quicksync" && s.quickSync && (
                          <span className="inline-flex items-center gap-1"><Timer className="w-3 h-3" /> {s.quickSync.capacity} micro-calls</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Slot-specific configuration */}
            {selected && (
              <div className="mt-6 rounded-2xl bg-surface-low ghost-border p-4">
                {selected.mode === "hybrid" && (
                  <>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Hybrid · pick how to meet</p>
                    <p className="mt-1 text-xs text-muted-foreground">One window, two ways. Booking either auto-closes the alternate.</p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <ModeBtn picked={hybridPick === "video"} onClick={() => setHybridPick("video")}
                        icon={<Video className="w-5 h-5" />} title="Video meeting" sub="Secure link generated" />
                      <ModeBtn picked={hybridPick === "voice"} onClick={() => setHybridPick("voice")}
                        icon={<MapPin className="w-5 h-5" />} title={`On-site`} sub={selected.location || "Studio"} />
                    </div>
                  </>
                )}
                {selected.mode === "online" && (
                  <div className="flex items-center gap-3 text-sm">
                    {selected.channel === "video" ? <Video className="w-4 h-4 text-accent" /> : <Phone className="w-4 h-4 text-accent" />}
                    <span className="text-primary">{selected.channel === "video" ? "Video meeting" : "Voice call"} — link issued on confirm.</span>
                  </div>
                )}
                {selected.mode === "onsite" && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-accent" />
                    <span className="text-primary">{selected.location}</span>
                  </div>
                )}
                {selected.mode === "quicksync" && selected.quickSync && (
                  <>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Quick sync · micro-call</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {selected.quickSync.callMin}-min calls with {selected.quickSync.bufferMin}-min reflection buffer.
                      Instant book — first available picked from the queue.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Tag>📞 {selected.quickSync.callMin}m call</Tag>
                      <Tag>⏱ {selected.quickSync.bufferMin}m buffer</Tag>
                      <Tag>🎯 {selected.quickSync.capacity} slots in window</Tag>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <aside className="rounded-3xl bg-gradient-vault text-primary-foreground p-6 shadow-elevated h-fit lg:sticky lg:top-24">
          <div className="flex items-center gap-3">
            <Avatar initials={contact.initials} accent={contact.accent} />
            <div>
              <p className="font-headline font-bold">{contact.name}</p>
              <p className="text-xs text-primary-foreground/80">{contact.title}</p>
            </div>
          </div>

          <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.2em] text-gold">Booking summary</p>
          {selected ? (
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-gold" /> {day} · {selected.time} · {selected.duration}m</li>
              <li className="flex items-center gap-2">
                {selected.mode === "hybrid"
                  ? (hybridPick === "video" ? <Video className="w-4 h-4 text-gold" /> : <MapPin className="w-4 h-4 text-gold" />)
                  : selected.mode === "online"
                  ? (selected.channel === "video" ? <Video className="w-4 h-4 text-gold" /> : <Phone className="w-4 h-4 text-gold" />)
                  : selected.mode === "onsite"
                  ? <MapPin className="w-4 h-4 text-gold" />
                  : <Zap className="w-4 h-4 text-gold" />}
                <span>
                  {selected.mode === "hybrid" && (hybridPick === "video" ? "Video meeting" : `On-site · ${selected.location}`)}
                  {selected.mode === "online" && (selected.channel === "video" ? "Video meeting" : "Voice call")}
                  {selected.mode === "onsite" && `On-site · ${selected.location}`}
                  {selected.mode === "quicksync" && `Quick sync · ${selected.quickSync?.callMin}m`}
                </span>
              </li>
              <li className="flex items-center gap-2 text-xs text-primary-foreground/85">
                {selected.approval ? <Lock className="w-3.5 h-3.5 text-gold" /> : <Check className="w-3.5 h-3.5 text-gold" />}
                {selected.approval ? "Requires approval" : "Instant booking"}
              </li>
              <li className="text-xs text-primary-foreground/75">Both calendars will be updated. Reschedule any time.</li>
            </ul>
          ) : (
            <p className="mt-3 text-xs text-primary-foreground/75">Pick an open slot to continue.</p>
          )}

          <button
            onClick={confirm}
            disabled={!selected}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-gold text-primary font-bold hover:bg-gold/90 transition"
          >
            <Check className="w-4 h-4" /> {selected?.approval ? "Request booking" : "Confirm booking"}
          </button>
          <Link to={`/app/contact/${contact.id}/call`} className="mt-3 block text-center text-xs font-semibold text-gold hover:underline">
            Or try Live Call now <ArrowRight className="w-3 h-3 inline" />
          </Link>
        </aside>
      </div>
    </AppShell>
  );
};

function ModeBtn({ picked, onClick, icon, title, sub }: { picked: boolean; onClick: () => void; icon: React.ReactNode; title: string; sub: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-start gap-3 p-4 rounded-2xl text-left transition ${
        picked ? "bg-primary text-primary-foreground shadow-elevated" : "bg-surface-low ghost-border text-primary hover:bg-surface"
      }`}
    >
      <span className={`grid place-items-center w-10 h-10 rounded-xl ${picked ? "bg-white/15" : "bg-primary/10 text-primary"}`}>{icon}</span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className={`text-xs ${picked ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{sub}</p>
      </div>
    </button>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-surface ghost-border text-primary">
      {children}
    </span>
  );
}

export default ScheduleCall;