import { useMemo, useState } from "react";
import {
  Plus, Video, MapPin, Zap, Crown, Lock, Globe, Users as UsersIcon, Star,
  Repeat, Copy, Trash2, Phone, MessageSquare, Link as LinkIcon, X, Check,
  ChevronRight, Sparkles, Clock, Calendar as CalIcon, Shield, Timer, Gauge,
  CalendarPlus, ArrowLeft, Pencil, Briefcase, CopyPlus,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { addDays, addWeeks } from "date-fns";
import { useNavigate } from "react-router-dom";
import AppShell from "@/components/app/AppShell";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// ---------- Types ----------
type Mode = "online" | "onsite" | "hybrid" | "quicksync";
type Channel = "voice" | "video" | "message" | "inperson" | "appcall" | "link";
type Access = "public" | "contacts" | "approved" | "priority" | "paid" | "hidden";
type Booking = "instant" | "approval";
type Buffer = 0 | 5 | 10 | 15;
type Duration = 5 | 10 | 15 | 30 | 60;

interface Slot {
  id: string;
  title: string;
  day: string; // Mon..Fri
  date?: string; // ISO yyyy-mm-dd
  start: number; // hour (9..17)
  end: number;
  mode: Mode;
  duration: Duration;
  buffer: Buffer;
  bookingMode: Booking;
  access: Access;
  recurring: boolean;
  priority?: boolean;
  online?: { channel: Channel; capacity: number; booking: Booking; link?: string };
  onsite?: { location: string; capacity: number; booking: Booking; queue?: boolean };
  quickSync?: { callMin: 3 | 5 | 8 | 10; bufferMin: 1 | 2 | 5 };
  autoCloseAlternate?: boolean;
}

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const hours = Array.from({ length: 10 }, (_, i) => 9 + i); // 9..18

// ---------- Templates ----------
const templates: { id: string; name: string; icon: React.ComponentType<any>; hint: string; route: string }[] = [
  { id: "quicksync", name: "Quick Sync Relief Calls", icon: Zap,       hint: "Handle volume without stress",  route: "/app/availability/quick-sync" },
  { id: "meetings",  name: "Meetings — Focus Work",  icon: Briefcase,  hint: "Protect deep conversations",     route: "/app/availability/focus-meetings" },
];

// ---------- Seed slots ----------
const seed: Slot[] = [
  {
    id: "s1", title: "Hybrid Consult", day: "Mon", start: 15, end: 16,
    mode: "hybrid", duration: 30, buffer: 5, bookingMode: "approval", access: "contacts",
    recurring: true, autoCloseAlternate: true,
    online: { channel: "video", capacity: 1, booking: "approval", link: "meet/availock/jv" },
    onsite: { location: "Studio · DIFC Lvl 12", capacity: 1, booking: "approval", queue: false },
  },
  {
    id: "s2", title: "Quick Sync Hour", day: "Tue", start: 10, end: 11,
    mode: "quicksync", duration: 5, buffer: 5, bookingMode: "instant", access: "public",
    recurring: true, quickSync: { callMin: 5, bufferMin: 2 },
  },
  {
    id: "s3", title: "VIP Fast Lane", day: "Wed", start: 14, end: 15,
    mode: "online", duration: 15, buffer: 10, bookingMode: "approval", access: "priority",
    recurring: false, priority: true,
    online: { channel: "voice", capacity: 1, booking: "approval" },
  },
  {
    id: "s4", title: "Office Hours", day: "Thu", start: 11, end: 12,
    mode: "onsite", duration: 30, buffer: 5, bookingMode: "instant", access: "approved",
    recurring: true, onsite: { location: "Atlas HQ Reception", capacity: 4, booking: "instant", queue: true },
  },
];

// ---------- Helpers ----------
const accessMeta: Record<Access, { label: string; icon: React.ComponentType<any>; cls: string }> = {
  public:    { label: "Public",          icon: Globe,    cls: "bg-emerald-500/15 text-emerald-700" },
  contacts:  { label: "Contacts only",   icon: UsersIcon,cls: "bg-sky-500/15 text-sky-700" },
  approved:  { label: "Approved seekers",icon: Check,    cls: "bg-indigo-500/15 text-indigo-700" },
  priority:  { label: "Priority only",   icon: Crown,    cls: "bg-amber-500/20 text-amber-800" },
  paid:      { label: "Paid only",       icon: Sparkles, cls: "bg-violet-500/15 text-violet-700" },
  hidden:    { label: "Hidden invite",   icon: Lock,     cls: "bg-slate-500/15 text-slate-700" },
};

const channelMeta: Record<Channel, { label: string; icon: React.ComponentType<any> }> = {
  voice:    { label: "Voice Call",   icon: Phone },
  video:    { label: "Video Call",   icon: Video },
  message:  { label: "Message First",icon: MessageSquare },
  inperson: { label: "In-person",    icon: MapPin },
  appcall:  { label: "App Call",     icon: Phone },
  link:     { label: "Custom Link",  icon: LinkIcon },
};

const durations: Duration[] = [5, 10, 15, 30, 60];
const buffers: Buffer[] = [0, 5, 10, 15];

const calcQuickSyncCapacity = (totalMin: number, callMin: number, bufferMin: number) =>
  Math.max(0, Math.floor(totalMin / (callMin + bufferMin)));

// Channel filter (Hybrid / Online / Onsite) — Hybrid default
type ChannelFilter = "hybrid" | "online" | "onsite";

// ---------- Component ----------
const SlotBuilder = () => {
  const navigate = useNavigate();
  const [slots, setSlots] = useState<Slot[]>(seed);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Slot | null>(null);
  const [filter, setFilter] = useState<ChannelFilter>("hybrid");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Show only hybrid/online/onsite slots in Slot Builder.
  // Quick Sync slots are managed in the Quick Sync Builder.
  const filtered = useMemo(
    () => slots.filter((s) => s.mode === filter),
    [slots, filter],
  );

  const openNew = (day = "Mon", start = 14) => {
    setEditing({
      id: `s${Date.now()}`,
      title: "", day, start, end: start + 1,
      mode: "hybrid", duration: 30, buffer: 5, bookingMode: "approval", access: "contacts",
      recurring: false, autoCloseAlternate: true,
      online: { channel: "video", capacity: 1, booking: "approval" },
      onsite: { location: "", capacity: 1, booking: "approval" },
      quickSync: { callMin: 5, bufferMin: 2 },
    });
    setEditorOpen(true);
  };

  const openEdit = (s: Slot) => { setEditing({ ...s }); setEditorOpen(true); };

  const save = () => {
    if (!editing) return;
    setSlots((prev) => {
      const exists = prev.find((p) => p.id === editing.id);
      return exists ? prev.map((p) => (p.id === editing.id ? editing : p)) : [...prev, editing];
    });
    setEditorOpen(false);
    toast({ title: "Slot saved", description: `${editing.title || "Untitled"} · ${editing.day} ${editing.start}:00` });
  };

  const remove = (id: string) => {
    setSlots((p) => p.filter((s) => s.id !== id));
    setEditorOpen(false);
    toast({ title: "Slot removed" });
  };

  const clone = (s: Slot, kind: "tomorrow" | "nextweek" | "weekdays") => {
    const idx = days.indexOf(s.day);
    if (kind === "tomorrow") {
      const next = days[(idx + 1) % days.length];
      setSlots((p) => [...p, { ...s, id: `s${Date.now()}`, day: next }]);
      toast({ title: "Cloned to tomorrow", description: `${s.title} → ${next}` });
    } else if (kind === "nextweek") {
      setSlots((p) => [...p, { ...s, id: `s${Date.now()}`, recurring: true }]);
      toast({ title: "Cloned to next week (recurring)" });
    } else {
      const news = days.filter((d) => d !== s.day).map((d, i) => ({ ...s, id: `s${Date.now()}${i}`, day: d }));
      setSlots((p) => [...p, ...news]);
      toast({ title: "Cloned across weekdays" });
    }
  };

  const cloneSchedule = (s: Slot) => {
    // Clone Schedule: extend the same configuration forward.
    // Default: start from the next cycle (next week, same weekday), preserving recurrence.
    const base = s.date ? new Date(s.date) : new Date();
    const nextDate = addWeeks(base, 1).toISOString().slice(0, 10);
    setSlots((p) => [
      ...p,
      { ...s, id: `s${Date.now()}`, date: nextDate, recurring: true },
    ]);
    toast({ title: "Schedule cloned successfully and extended.", description: `Continues from ${format(new Date(nextDate), "EEE, MMM d")}` });
  };

  const channelOf = (m: Mode): ChannelFilter | "quicksync" =>
    m === "hybrid" ? "hybrid" : m === "online" ? "online" : m === "onsite" ? "onsite" : "quicksync";

  return (
    <AppShell
      subtitle="Slot Builder"
      title="Your time, intelligently permissioned"
      actions={
        <>
          <button
            onClick={() => navigate("/app/availability")}
            className="inline-flex items-center gap-2 px-3 py-2.5 rounded-full ghost-border bg-surface-lowest text-xs font-semibold text-primary hover:bg-surface-low"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Calendar
          </button>
          <button
            onClick={() => navigate("/app/availability/quick-sync")}
            className="inline-flex items-center gap-2 px-3 py-2.5 rounded-full ghost-border bg-surface-lowest text-xs font-semibold text-fuchsia-700 hover:bg-fuchsia-500/10"
          >
            <Zap className="w-3.5 h-3.5" /> Quick Sync
          </button>
          <button
            onClick={() => navigate("/app/availability/focus-meetings")}
            className="inline-flex items-center gap-2 px-3 py-2.5 rounded-full ghost-border bg-surface-lowest text-xs font-semibold text-indigo-700 hover:bg-indigo-500/10"
          >
            <Briefcase className="w-3.5 h-3.5" /> Meetings
          </button>
          <button
            onClick={() => openNew()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-elevated hover:opacity-95"
          >
            <Plus className="w-4 h-4" /> New slot
          </button>
        </>
      }
    >
      <div className="grid lg:grid-cols-[260px_1fr] gap-5">
        {/* LEFT PANEL */}
        <aside className="space-y-4">
          <section className="rounded-3xl bg-surface-lowest ghost-border p-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-1">Channel</h3>
            <p className="text-[10px] text-muted-foreground mb-3">One slot, multiple ways to connect. If one is booked, the other auto-closes.</p>
            <div className="grid grid-cols-3 gap-1.5">
              {([
                ["hybrid", "Hybrid", Sparkles],
                ["online", "Online", Video],
                ["onsite", "Onsite", MapPin],
              ] as const).map(([k, l, Ic]) => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={cn(
                    "flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-[11px] font-bold transition",
                    filter === k
                      ? "bg-primary text-primary-foreground shadow-glass"
                      : "bg-surface-low text-muted-foreground hover:text-primary",
                  )}
                >
                  <Ic className="w-3.5 h-3.5" /> {l}
                </button>
              ))}
            </div>
            {filter === "hybrid" && (
              <p className="mt-2 text-[10px] text-muted-foreground">Default. Slot offers both Online and Onsite.</p>
            )}
          </section>

          <section className="rounded-3xl bg-surface-lowest ghost-border p-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3">Templates</h3>
            <ul className="space-y-2">
              {templates.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => navigate(t.route)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-surface-low hover:bg-primary/5 transition text-left"
                  >
                    <span className="grid place-items-center w-8 h-8 rounded-lg bg-gradient-primary text-primary-foreground">
                      <t.icon className="w-4 h-4" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-primary truncate">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{t.hint}</p>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl bg-gradient-vault text-primary-foreground p-4 shadow-elevated">
            <Sparkles className="w-4 h-4 text-gold" />
            <p className="mt-2 font-headline font-bold text-sm leading-snug">Dual Hybrid Slots</p>
            <p className="mt-1 text-[11px] text-primary-foreground/80 leading-relaxed">
              One time window, multiple ways to connect. Either booking auto-closes the alternate.
            </p>
          </section>
        </aside>

        {/* MAIN GRID */}
        <section className="rounded-3xl bg-surface-lowest ghost-border p-4 md:p-5 shadow-ambient overflow-x-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">This week</p>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Gauge className="w-3 h-3" /> {filtered.length} slot{filtered.length === 1 ? "" : "s"} active
            </p>
          </div>

          <div className="grid grid-cols-[60px_repeat(5,minmax(120px,1fr))] gap-1.5 min-w-[720px]">
            <div />
            {days.map((d) => (
              <div key={d} className="text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{d}</div>
            ))}

            {hours.map((h) => (
              <div key={h} className="contents">
                <div className="text-[10px] text-muted-foreground text-right pr-2 pt-1.5">{h}:00</div>
                {days.map((d) => {
                  const slot = filtered.find((s) => s.day === d && s.start === h);
                  if (!slot) {
                    return (
                      <button
                        key={`${d}-${h}`}
                        onClick={() => openNew(d, h)}
                        className="h-14 rounded-lg border border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/5 transition grid place-items-center group"
                      >
                        <Plus className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary" />
                      </button>
                    );
                  }
                  return <SlotChip key={slot.id} slot={slot} onClick={() => openEdit(slot)} onClone={(k) => clone(slot, k)} />;
                })}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* CREATED SLOTS LIST */}
      <section className="mt-5 rounded-3xl bg-surface-lowest ghost-border p-4 md:p-5 shadow-ambient">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-headline font-bold text-primary text-sm">Created slots</h3>
          <p className="text-[11px] text-muted-foreground">{filtered.length} total</p>
        </div>
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">No slots yet. Click an empty cell or “New slot” to add one.</p>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {filtered.map((s) => (
              <SlotCardCompact
                key={s.id}
                slot={s}
                onEdit={() => openEdit(s)}
                onDelete={() => setConfirmDelete(s.id)}
                onClone={() => cloneSchedule(s)}
              />
            ))}
          </div>
        )}
      </section>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this slot schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              The slot and its configuration will be removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) {
                  setSlots((p) => p.filter((x) => x.id !== confirmDelete));
                  toast({ title: "Slot removed" });
                }
                setConfirmDelete(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* EDITOR DRAWER */}
      {editorOpen && editing && (
        <SlotEditor
          slot={editing}
          onChange={setEditing}
          onClose={() => setEditorOpen(false)}
          onSave={save}
          onDelete={() => remove(editing.id)}
        />
      )}
    </AppShell>
  );
};

// ---------- Slot Card Compact ----------
const SlotCardCompact = ({
  slot, onEdit, onDelete, onClone,
}: {
  slot: Slot;
  onEdit: () => void;
  onDelete: () => void;
  onClone: () => void;
}) => {
  const A = accessMeta[slot.access];
  const channelLabel =
    slot.mode === "hybrid" ? "Hybrid" :
    slot.mode === "online" ? "Online" :
    slot.mode === "onsite" ? "Onsite" : "Quick Sync";
  const ChannelIcon =
    slot.mode === "hybrid" ? Sparkles :
    slot.mode === "online" ? Video :
    slot.mode === "onsite" ? MapPin : Zap;
  const typeLabel = slot.mode === "quicksync" ? "Quick Sync" : "Meeting";

  // Status (lightweight)
  let status: "active" | "upcoming" | "expired" | "full" = "upcoming";
  if (slot.date) {
    const d = new Date(slot.date);
    const today = new Date(new Date().toDateString());
    if (d < today) status = "expired";
    else if (d.getTime() === today.getTime()) status = "active";
  } else {
    status = "active";
  }

  const statusCls: string =
    status === "active"   ? "bg-emerald-500/15 text-emerald-700" :
    status === "upcoming" ? "bg-sky-500/15 text-sky-700" :
    status === "expired"  ? "bg-muted-foreground/15 text-muted-foreground" :
                            "bg-amber-500/20 text-amber-800";

  return (
    <article className="rounded-2xl ghost-border bg-surface-low p-3 hover:shadow-ambient transition">
      {/* Top line: date + time range */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[12px] font-extrabold text-primary truncate flex items-center gap-1.5">
            {slot.priority && <Crown className="w-3 h-3 text-amber-600 shrink-0" />}
            {slot.date ? format(new Date(slot.date), "EEE, MMM d") : slot.day}
            <span className="text-muted-foreground font-bold">·</span>
            {slot.start}:00–{slot.end}:00
          </p>
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">{slot.title || "Untitled"}</p>
        </div>
        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0", statusCls)}>
          {status}
        </span>
      </div>

      {/* Middle: type + duration/buffer */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-surface-lowest ghost-border font-bold text-primary">
          {typeLabel}
        </span>
        <span className="text-muted-foreground font-semibold">
          {slot.mode === "quicksync"
            ? `${slot.quickSync?.callMin ?? slot.duration} min calls • ${slot.quickSync?.bufferMin ?? slot.buffer} min buffer`
            : `${slot.duration} min meeting • ${slot.buffer} min buffer`}
        </span>
      </div>

      {/* Channel + capacity */}
      <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px]">
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-bold">
          <ChannelIcon className="w-2.5 h-2.5" /> {channelLabel}
        </span>
        <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-bold", A.cls)}>
          <A.icon className="w-2.5 h-2.5" /> {A.label}
        </span>
      </div>

      <div className="mt-1.5 text-[10px] text-muted-foreground font-semibold">
        {slot.mode === "quicksync" && slot.quickSync
          ? `${calcQuickSyncCapacity((slot.end - slot.start) * 60, slot.quickSync.callMin, slot.quickSync.bufferMin)} slots generated`
          : `${Math.max(1, Math.floor(((slot.end - slot.start) * 60) / (slot.duration + (slot.buffer || 0))))} slots generated`}
        {slot.recurring && " · recurring"}
      </div>

      {/* Actions */}
      <div className="mt-2.5 flex items-center justify-end gap-1">
        <button
          onClick={onClone}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg ghost-border bg-surface-lowest hover:bg-primary/10 text-primary text-[10px] font-bold"
          aria-label="Clone schedule"
          title="Clone schedule — extend forward"
        >
          <CopyPlus className="w-3 h-3" /> Clone
        </button>
        <button
          onClick={onEdit}
          className="grid place-items-center w-7 h-7 rounded-lg ghost-border bg-surface-lowest hover:bg-primary/10 text-primary"
          aria-label="Edit slot"
        >
          <Pencil className="w-3 h-3" />
        </button>
        <button
          onClick={onDelete}
          className="grid place-items-center w-7 h-7 rounded-lg ghost-border bg-surface-lowest hover:bg-destructive/10 text-destructive"
          aria-label="Delete slot"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </article>
  );
};

// ---------- Slot Chip ----------
const SlotChip = ({ slot, onClick, onClone }: { slot: Slot; onClick: () => void; onClone: (k: "tomorrow" | "nextweek" | "weekdays") => void }) => {
  const [menu, setMenu] = useState(false);
  const accent =
    slot.mode === "hybrid"     ? "from-indigo-500/20 to-violet-500/20 border-indigo-400/40 text-indigo-900" :
    slot.mode === "online"     ? "from-sky-500/20 to-emerald-500/20 border-sky-400/40 text-sky-900" :
    slot.mode === "onsite"     ? "from-amber-500/20 to-rose-500/20 border-amber-400/40 text-amber-900" :
                                  "from-fuchsia-500/20 to-pink-500/20 border-fuchsia-400/40 text-fuchsia-900";
  const A = accessMeta[slot.access];
  return (
    <div className="relative">
      <button
        onClick={onClick}
        className={cn(
          "h-14 w-full rounded-lg border bg-gradient-to-br px-2 py-1.5 text-left transition hover:shadow-elevated overflow-hidden",
          accent,
          slot.priority && "ring-1 ring-amber-400",
        )}
      >
        <div className="flex items-center gap-1 text-[10px] font-bold leading-tight">
          {slot.priority && <Crown className="w-3 h-3 text-amber-600 shrink-0" />}
          <span className="truncate">{slot.title || "Untitled"}</span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          {slot.mode === "hybrid" && (<><Video className="w-3 h-3" /><MapPin className="w-3 h-3" /></>)}
          {slot.mode === "online" && <Video className="w-3 h-3" />}
          {slot.mode === "onsite" && <MapPin className="w-3 h-3" />}
          {slot.mode === "quicksync" && <Zap className="w-3 h-3" />}
          <span className="text-[9px] opacity-80">·{slot.duration}m</span>
          {slot.bookingMode === "approval" && <Lock className="w-2.5 h-2.5 ml-0.5" />}
          {slot.recurring && <Repeat className="w-2.5 h-2.5" />}
        </div>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); setMenu((v) => !v); }}
        className="absolute top-0.5 right-0.5 grid place-items-center w-4 h-4 rounded bg-background/70 hover:bg-background"
        aria-label="Clone slot"
      >
        <Copy className="w-2.5 h-2.5 text-foreground/60" />
      </button>
      {menu && (
        <div className="absolute z-20 right-0 top-5 w-40 rounded-lg bg-popover ghost-border shadow-elevated p-1 text-xs">
          {[
            ["tomorrow", "Clone to tomorrow"],
            ["nextweek", "Clone next week"],
            ["weekdays", "Clone across weekdays"],
          ].map(([k, l]) => (
            <button
              key={k}
              onClick={(e) => { e.stopPropagation(); onClone(k as any); setMenu(false); }}
              className="w-full text-left px-2 py-1.5 rounded hover:bg-surface-low text-foreground"
            >{l}</button>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------- Editor Drawer ----------
const SlotEditor = ({
  slot, onChange, onClose, onSave, onDelete,
}: {
  slot: Slot;
  onChange: (s: Slot) => void;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
}) => {
  const set = <K extends keyof Slot>(k: K, v: Slot[K]) => onChange({ ...slot, [k]: v });
  const totalMin = (slot.end - slot.start) * 60;
  const qsCapacity = slot.quickSync ? calcQuickSyncCapacity(totalMin, slot.quickSync.callMin, slot.quickSync.bufferMin) : 0;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-full max-w-[460px] h-full bg-surface-lowest shadow-elevated overflow-y-auto">
        <header className="sticky top-0 z-10 bg-surface-lowest/95 backdrop-blur border-b border-border/50 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">Slot editor</p>
            <h2 className="font-headline font-extrabold text-primary text-lg">Configure access</h2>
          </div>
          <button onClick={onClose} className="grid place-items-center w-8 h-8 rounded-full ghost-border bg-surface-low" aria-label="Close">
            <X className="w-4 h-4 text-primary" />
          </button>
        </header>

        <div className="p-5 space-y-5">
          {/* Basic */}
          <Section title="Basics" icon={CalIcon}>
            <Field label="Title">
              <input
                value={slot.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Hybrid consult"
                className="w-full px-3 py-2 rounded-lg bg-surface-low ghost-border text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </Field>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Day">
                <select value={slot.day} onChange={(e) => set("day", e.target.value)} className="w-full px-2 py-2 rounded-lg bg-surface-low ghost-border text-sm outline-none">
                  {days.map((d) => <option key={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="Start"><HourPicker value={slot.start} onChange={(v) => set("start", v)} /></Field>
              <Field label="End"><HourPicker value={slot.end} onChange={(v) => set("end", v)} min={slot.start + 1} /></Field>
            </div>
            <Field label="Date">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full inline-flex items-center justify-between px-3 py-2 rounded-lg bg-surface-low ghost-border text-sm outline-none hover:bg-surface-low/80"
                  >
                    <span className={cn("truncate", !slot.date && "text-muted-foreground")}>
                      {slot.date ? format(new Date(slot.date), "PPP") : "Pick a date"}
                    </span>
                    <CalIcon className="w-4 h-4 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[60]" align="start">
                  <Calendar
                    mode="single"
                    selected={slot.date ? new Date(slot.date) : undefined}
                    onSelect={(d) => {
                      if (!d) return;
                      const dayName = days[(d.getDay() + 6) % 7] ?? slot.day;
                      onChange({ ...slot, date: d.toISOString().slice(0, 10), day: days.includes(dayName) ? dayName : slot.day });
                    }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </Field>
            <Toggle label="Recurring weekly" icon={Repeat} value={slot.recurring} onChange={(v) => set("recurring", v)} />
            <Toggle label="Priority slot (VIP / Fast lane)" icon={Crown} value={!!slot.priority} onChange={(v) => set("priority", v)} />
          </Section>

          {/* Mode */}
          <Section title="Connection mode" icon={Sparkles}>
            <div className="grid grid-cols-4 gap-1.5">
              {([
                ["online", "Online", Video],
                ["onsite", "Onsite", MapPin],
                ["hybrid", "Hybrid", Sparkles],
                ["quicksync", "Quick Sync", Zap],
              ] as const).map(([k, l, Ic]) => (
                <button
                  key={k}
                  onClick={() => set("mode", k)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 rounded-xl text-[11px] font-bold transition",
                    slot.mode === k ? "bg-primary text-primary-foreground shadow-glass" : "bg-surface-low text-muted-foreground hover:text-primary",
                  )}
                >
                  <Ic className="w-3.5 h-3.5" />
                  {l}
                </button>
              ))}
            </div>
          </Section>

          {/* Hybrid dual */}
          {slot.mode === "hybrid" && (
            <Section title="Dual hybrid slots" icon={Sparkles} hint="One time window, two ways to connect">
              <div className="rounded-2xl bg-gradient-to-br from-sky-500/10 to-emerald-500/10 p-3 ghost-border space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-900"><Video className="w-3.5 h-3.5" /> Online slot</div>
                <ChannelSelect value={slot.online?.channel ?? "video"} onChange={(ch) => set("online", { ...(slot.online ?? { capacity: 1, booking: "instant" }), channel: ch })} />
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Capacity">
                    <input type="number" min={1} value={slot.online?.capacity ?? 1} onChange={(e) => set("online", { ...(slot.online ?? { channel: "video", booking: "instant" }), capacity: +e.target.value })} className="w-full px-2 py-1.5 rounded-lg bg-background ghost-border text-sm outline-none" />
                  </Field>
                  <Field label="Booking">
                    <BookingSelect value={slot.online?.booking ?? "instant"} onChange={(b) => set("online", { ...(slot.online ?? { channel: "video", capacity: 1 }), booking: b })} />
                  </Field>
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-rose-500/10 p-3 ghost-border space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900"><MapPin className="w-3.5 h-3.5" /> Onsite slot</div>
                <Field label="Location">
                  <input value={slot.onsite?.location ?? ""} onChange={(e) => set("onsite", { ...(slot.onsite ?? { capacity: 1, booking: "instant" }), location: e.target.value })} placeholder="Office / Clinic / Studio" className="w-full px-2 py-1.5 rounded-lg bg-background ghost-border text-sm outline-none" />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Capacity">
                    <input type="number" min={1} value={slot.onsite?.capacity ?? 1} onChange={(e) => set("onsite", { ...(slot.onsite ?? { location: "", booking: "instant" }), capacity: +e.target.value })} className="w-full px-2 py-1.5 rounded-lg bg-background ghost-border text-sm outline-none" />
                  </Field>
                  <Field label="Booking">
                    <BookingSelect value={slot.onsite?.booking ?? "instant"} onChange={(b) => set("onsite", { ...(slot.onsite ?? { location: "", capacity: 1 }), booking: b })} />
                  </Field>
                </div>
                <Toggle label="Queue / walk-in" icon={UsersIcon} value={!!slot.onsite?.queue} onChange={(v) => set("onsite", { ...(slot.onsite ?? { location: "", capacity: 1, booking: "instant" }), queue: v })} />
              </div>

              <Toggle
                label="Auto-close alternate when booked"
                icon={Shield}
                value={!!slot.autoCloseAlternate}
                onChange={(v) => set("autoCloseAlternate", v)}
                hint={slot.autoCloseAlternate ? "Recommended — protects the time block" : "Both slots stay open with separate capacity"}
              />
            </Section>
          )}

          {/* Quick sync */}
          {slot.mode === "quicksync" && (
            <Section title="Quick Sync calls" icon={Zap} hint="Speak to many people in one focused hour">
              <div className="grid grid-cols-2 gap-2">
                <Field label="Call length">
                  <select value={slot.quickSync?.callMin ?? 5} onChange={(e) => set("quickSync", { ...(slot.quickSync ?? { bufferMin: 2 }), callMin: +e.target.value as any })} className="w-full px-2 py-2 rounded-lg bg-surface-low ghost-border text-sm outline-none">
                    {[3, 5, 8, 10].map((n) => <option key={n} value={n}>{n} min</option>)}
                  </select>
                </Field>
                <Field label="Buffer between">
                  <select value={slot.quickSync?.bufferMin ?? 2} onChange={(e) => set("quickSync", { ...(slot.quickSync ?? { callMin: 5 }), bufferMin: +e.target.value as any })} className="w-full px-2 py-2 rounded-lg bg-surface-low ghost-border text-sm outline-none">
                    {[1, 2, 5].map((n) => <option key={n} value={n}>{n} min</option>)}
                  </select>
                </Field>
              </div>
              <div className="rounded-xl bg-gradient-to-r from-fuchsia-500/15 to-pink-500/15 p-3">
                <p className="text-[11px] uppercase tracking-wider text-fuchsia-900/70 font-bold">Auto capacity</p>
                <p className="font-headline font-extrabold text-fuchsia-900 text-2xl mt-0.5">
                  Up to {qsCapacity} <span className="text-sm font-bold">attendees</span>
                </p>
                <p className="text-[11px] text-fuchsia-900/70 mt-0.5">{totalMin} min · {slot.quickSync?.callMin}m calls + {slot.quickSync?.bufferMin}m buffer</p>
              </div>
            </Section>
          )}

          {/* Duration & buffer */}
          {slot.mode !== "quicksync" && (
            <Section title="Duration & buffer" icon={Timer}>
              <Field label="Meeting length">
                <div className="flex flex-wrap gap-1.5">
                  {durations.map((d) => (
                    <button key={d} onClick={() => set("duration", d)} className={cn("px-2.5 py-1.5 rounded-full text-[11px] font-bold", slot.duration === d ? "bg-primary text-primary-foreground" : "bg-surface-low text-muted-foreground hover:text-primary")}>{d}m</button>
                  ))}
                </div>
              </Field>
              <Field label="Buffer (cool-down)">
                <div className="flex flex-wrap gap-1.5">
                  {buffers.map((b) => (
                    <button key={b} onClick={() => set("buffer", b)} className={cn("px-2.5 py-1.5 rounded-full text-[11px] font-bold", slot.buffer === b ? "bg-accent text-accent-foreground" : "bg-surface-low text-muted-foreground hover:text-primary")}>{b === 0 ? "None" : `${b}m`}</button>
                  ))}
                </div>
              </Field>
            </Section>
          )}

          {/* Booking mode */}
          <Section title="Booking confirmation" icon={Lock}>
            <div className="grid grid-cols-2 gap-2">
              {(["instant", "approval"] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => set("bookingMode", b)}
                  className={cn(
                    "p-3 rounded-xl text-left transition",
                    slot.bookingMode === b ? "bg-primary text-primary-foreground shadow-glass" : "bg-surface-low text-muted-foreground hover:text-primary",
                  )}
                >
                  <p className="text-xs font-bold flex items-center gap-1.5">
                    {b === "instant" ? <Check className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    {b === "instant" ? "Instant Confirm" : "Approval Required"}
                  </p>
                  <p className="text-[10px] mt-1 opacity-80 leading-snug">{b === "instant" ? "Auto-reserved on selection" : "Manual approval before booking"}</p>
                </button>
              ))}
            </div>
          </Section>

          {/* Access */}
          <Section title="Access controls" icon={Shield}>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(accessMeta) as Access[]).map((a) => {
                const M = accessMeta[a];
                return (
                  <button key={a} onClick={() => set("access", a)} className={cn("flex items-center gap-2 px-2.5 py-2 rounded-xl text-[11px] font-bold transition", slot.access === a ? "bg-primary text-primary-foreground" : `${M.cls} hover:opacity-90`)}>
                    <M.icon className="w-3.5 h-3.5" /> {M.label}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2">
            <button onClick={onDelete} className="inline-flex items-center gap-1.5 text-xs font-bold text-destructive hover:opacity-80">
              <Trash2 className="w-3.5 h-3.5" /> Delete slot
            </button>
            <div className="flex gap-2">
              <button onClick={onClose} className="px-4 py-2 rounded-full ghost-border text-xs font-bold text-muted-foreground hover:text-primary">Cancel</button>
              <button onClick={onSave} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-primary text-primary-foreground text-xs font-bold shadow-elevated">
                <CalendarPlus className="w-3.5 h-3.5" /> Save slot
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

// ---------- Small UI helpers ----------
const Section = ({ title, icon: Ic, hint, children }: { title: string; icon: React.ComponentType<any>; hint?: string; children: React.ReactNode }) => (
  <section className="space-y-2.5">
    <div>
      <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-1.5">
        <Ic className="w-3.5 h-3.5" /> {title}
      </h3>
      {hint && <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>}
    </div>
    <div className="space-y-2.5">{children}</div>
  </section>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
    <div className="mt-1">{children}</div>
  </label>
);

const Toggle = ({ label, icon: Ic, value, onChange, hint }: { label: string; icon: React.ComponentType<any>; value: boolean; onChange: (v: boolean) => void; hint?: string }) => (
  <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-surface-low">
    <div className="flex items-start gap-2 min-w-0">
      <Ic className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-bold text-primary truncate">{label}</p>
        {hint && <p className="text-[10px] text-muted-foreground leading-snug">{hint}</p>}
      </div>
    </div>
    <Switch checked={value} onCheckedChange={onChange} />
  </div>
);

const HourPicker = ({ value, onChange, min = 9 }: { value: number; onChange: (v: number) => void; min?: number }) => (
  <select value={value} onChange={(e) => onChange(+e.target.value)} className="w-full px-2 py-2 rounded-lg bg-surface-low ghost-border text-sm outline-none">
    {hours.concat([19]).filter((h) => h >= min).map((h) => <option key={h} value={h}>{h}:00</option>)}
  </select>
);

const ChannelSelect = ({ value, onChange }: { value: Channel; onChange: (v: Channel) => void }) => (
  <Field label="Channel">
    <select value={value} onChange={(e) => onChange(e.target.value as Channel)} className="w-full px-2 py-1.5 rounded-lg bg-background ghost-border text-sm outline-none">
      {(Object.keys(channelMeta) as Channel[]).map((c) => <option key={c} value={c}>{channelMeta[c].label}</option>)}
    </select>
  </Field>
);

const BookingSelect = ({ value, onChange }: { value: Booking; onChange: (v: Booking) => void }) => (
  <select value={value} onChange={(e) => onChange(e.target.value as Booking)} className="w-full px-2 py-1.5 rounded-lg bg-background ghost-border text-sm outline-none">
    <option value="instant">Instant</option>
    <option value="approval">Approval</option>
  </select>
);

export default SlotBuilder;
