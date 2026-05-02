import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft, MapPin, Calendar as CalIcon, Clock, Globe, Users as UsersIcon,
  Lock, Pencil, Trash2, Plus, X, CheckCircle2, Building2, DoorOpen, Info,
  Hourglass, ChevronRight,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import PricingField, { Pricing, PriceTag, defaultPricing } from "@/components/app/PricingField";

// ---------- Types ----------
type Visibility = "public" | "contacts" | "private";
type Booking = "instant" | "approval";

interface VenueSession {
  id: string;
  title: string;
  description: string;
  date: string;
  startMin: number;
  durationMin: number;
  capacity: number;
  location: string;
  entryInstructions: string;
  visibility: Visibility;
  booking: Booking;
  allowWaitlist: boolean;
  pricing: Pricing;
  bookedCount: number;
  waitlistCount: number;
  createdAt: number;
}

const fmtTime = (m: number) => {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const period = h >= 12 ? "PM" : "AM";
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${mm.toString().padStart(2, "0")} ${period}`;
};

const visibilityMeta: Record<Visibility, { label: string; icon: React.ComponentType<any>; cls: string }> = {
  public:   { label: "Public",          icon: Globe,    cls: "bg-emerald-500/15 text-emerald-700" },
  contacts: { label: "Selected only",   icon: UsersIcon,cls: "bg-sky-500/15 text-sky-700" },
  private:  { label: "Invite only",     icon: Lock,     cls: "bg-slate-500/15 text-slate-700" },
};

const blank = (): Omit<VenueSession, "id" | "createdAt" | "bookedCount" | "waitlistCount"> => ({
  title: "",
  description: "",
  date: new Date().toISOString().slice(0, 10),
  startMin: 15 * 60,
  durationMin: 90,
  capacity: 20,
  location: "",
  entryInstructions: "",
  visibility: "public",
  booking: "instant",
  allowWaitlist: true,
  pricing: defaultPricing,
});

const seed: VenueSession[] = [
  {
    id: "v1",
    title: "Design Workshop",
    description: "Hands-on UX session — bring your laptop. Light refreshments served.",
    date: new Date().toISOString().slice(0, 10),
    startMin: 15 * 60,
    durationMin: 120,
    capacity: 12,
    location: "Co-working Space, Room 2 · Downtown",
    entryInstructions: "Show confirmation at reception · 2nd floor",
    visibility: "public",
    booking: "instant",
    allowWaitlist: true,
    pricing: { mode: "free" },
    bookedCount: 4,
    waitlistCount: 0,
    createdAt: Date.now() - 200000,
  },
];

// ---------- Page ----------
const VenueBuilder = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<VenueSession[]>(seed);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<VenueSession | null>(null);
  const [draft, setDraft] = useState(blank());
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const openNew = () => {
    setEditing(null);
    setDraft(blank());
    setEditorOpen(true);
  };
  const openEdit = (s: VenueSession) => {
    setEditing(s);
    const { id, createdAt, bookedCount, waitlistCount, ...rest } = s;
    setDraft(rest);
    setEditorOpen(true);
  };

  const save = () => {
    if (!draft.title.trim()) {
      toast({ title: "Add a title", description: "Give your venue session a clear name." });
      return;
    }
    if (!draft.location.trim()) {
      toast({ title: "Add a location", description: "Seekers need to know where to go." });
      return;
    }
    if (draft.capacity < 1) {
      toast({ title: "Capacity must be at least 1" });
      return;
    }
    if (draft.pricing.mode === "paid" && (!draft.pricing.amount || draft.pricing.amount <= 0)) {
      toast({ title: "Set a price", description: "Paid sessions must have a price > 0." });
      return;
    }
    if (editing) {
      setSessions((p) => p.map((s) => (s.id === editing.id ? { ...editing, ...draft } : s)));
      toast({ title: "Venue session updated" });
    } else {
      setSessions((p) => [
        ...p,
        { ...draft, id: `v${Date.now()}`, createdAt: Date.now(), bookedCount: 0, waitlistCount: 0 },
      ]);
      toast({ title: "Venue session created", description: draft.title });
    }
    setEditorOpen(false);
  };

  const sorted = useMemo(
    () => [...sessions].sort((a, b) => `${a.date}${a.startMin}`.localeCompare(`${b.date}${b.startMin}`)),
    [sessions],
  );

  return (
    <AppShell
      subtitle="Venue Sessions"
      title="Host real-world sessions, simply"
      actions={
        <>
          <button
            onClick={() => navigate("/app/availability/builder")}
            className="inline-flex items-center gap-2 px-3 py-2.5 rounded-full ghost-border bg-surface-lowest text-xs font-semibold text-primary hover:bg-surface-low"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Templates
          </button>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-elevated hover:opacity-95"
          >
            <Plus className="w-4 h-4" /> New venue session
          </button>
        </>
      }
    >
      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        {/* LIST */}
        <section className="rounded-3xl bg-surface-lowest ghost-border p-4 md:p-5 shadow-ambient">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-headline font-extrabold text-primary text-base">
              Active venue sessions
            </h3>
            <p className="text-[11px] text-muted-foreground">{sorted.length} total</p>
          </div>

          {sorted.length === 0 ? (
            <div className="py-12 text-center">
              <Building2 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm font-bold text-primary">No venue sessions yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create a workshop, training, or in-person session.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {sorted.map((s) => (
                <VenueCard
                  key={s.id}
                  s={s}
                  onEdit={() => openEdit(s)}
                  onDelete={() => setConfirmDelete(s.id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* SIDE INFO */}
        <aside className="space-y-3">
          <div className="rounded-3xl bg-gradient-vault text-primary-foreground p-5 shadow-elevated">
            <Building2 className="w-5 h-5 text-gold" />
            <p className="mt-2 font-headline font-bold">Venue Mode</p>
            <p className="mt-1 text-xs text-primary-foreground/80 leading-relaxed">
              You're not selling seats — you're controlling access to a shared time and place.
            </p>
          </div>

          <div className="rounded-3xl bg-surface-lowest ghost-border p-4">
            <h3 className="font-headline font-bold text-primary text-sm">Use it for</h3>
            <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
              {["Workshops", "Private sessions", "Small seminars", "Coaching groups", "Paid hybrid talks", "Co-working rooms"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60" /> {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl bg-surface-lowest ghost-border p-4">
            <h3 className="font-headline font-bold text-primary text-sm">Rules</h3>
            <ul className="mt-3 space-y-2 text-[11px] text-muted-foreground leading-snug">
              <li>• No seat-level selection</li>
              <li>• No complex ticketing logic</li>
              <li>• Time-slot + capacity based</li>
            </ul>
          </div>
        </aside>
      </div>

      {/* DELETE CONFIRM */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this venue session?</AlertDialogTitle>
            <AlertDialogDescription>
              Booked attendees will be notified. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) {
                  setSessions((p) => p.filter((x) => x.id !== confirmDelete));
                  toast({ title: "Venue session removed" });
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

      {/* EDITOR */}
      {editorOpen && (
        <VenueEditor
          draft={draft}
          setDraft={setDraft}
          editing={!!editing}
          onClose={() => setEditorOpen(false)}
          onSave={save}
        />
      )}
    </AppShell>
  );
};

// ---------- Venue Card ----------
const VenueCard = ({
  s, onEdit, onDelete,
}: { s: VenueSession; onEdit: () => void; onDelete: () => void }) => {
  const V = visibilityMeta[s.visibility] ?? visibilityMeta.public;
  const remaining = Math.max(0, s.capacity - s.bookedCount);
  const fillPct = Math.min(100, Math.round((s.bookedCount / Math.max(1, s.capacity)) * 100));
  const isFull = remaining === 0;
  const isLow = !isFull && remaining <= Math.max(1, Math.floor(s.capacity * 0.2));
  const date = new Date(s.date);
  const isPast = date < new Date(new Date().toDateString());
  const status = isPast ? "expired" : isFull ? "full" : "open";

  return (
    <article
      className={cn(
        "relative rounded-2xl ghost-border p-4 transition group bg-surface-low",
        status === "open" && "hover:shadow-ambient",
        status === "full" && "ring-1 ring-rose-500/30 bg-gradient-to-br from-rose-500/5 to-transparent",
        status === "expired" && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Building2 className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
              Venue Session
            </span>
            <PriceTag pricing={s.pricing} />
          </div>
          <h4 className="font-headline font-extrabold text-primary truncate">{s.title}</h4>
          {s.description && (
            <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">{s.description}</p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-surface-lowest" aria-label="Edit">
            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-rose-500/10" aria-label="Delete">
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <CalIcon className="w-3 h-3" />
          <span className="font-bold text-primary">{format(date, "EEE, MMM d")}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span className="font-bold text-primary">
            {fmtTime(s.startMin)} · {s.durationMin}m
          </span>
        </div>
      </div>

      <div className="mt-2 flex items-start gap-1.5 text-[11px]">
        <MapPin className="w-3 h-3 mt-0.5 text-muted-foreground shrink-0" />
        <span className="text-primary font-semibold leading-snug">{s.location}</span>
      </div>
      {s.entryInstructions && (
        <div className="mt-1.5 flex items-start gap-1.5 text-[10px] text-muted-foreground">
          <DoorOpen className="w-3 h-3 mt-0.5 shrink-0" />
          <span className="leading-snug">{s.entryInstructions}</span>
        </div>
      )}

      {/* Seats */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[10px] font-bold mb-1">
          <span className={cn(
            "uppercase tracking-wider",
            isFull ? "text-rose-700" : isLow ? "text-amber-700" : "text-emerald-700",
          )}>
            {isFull ? "Full" : `${remaining} seat${remaining === 1 ? "" : "s"} left`}
          </span>
          <span className="text-muted-foreground">
            {s.bookedCount}/{s.capacity}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-surface-lowest overflow-hidden">
          <div
            style={{ width: `${fillPct}%` }}
            className={cn(
              "h-full transition-all",
              isFull ? "bg-rose-500" : isLow ? "bg-amber-500" : "bg-emerald-500",
            )}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold", V.cls)}>
          <V.icon className="w-2.5 h-2.5" /> {V.label}
        </span>
        {s.allowWaitlist && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-800">
            <Hourglass className="w-2.5 h-2.5" /> Waitlist
          </span>
        )}
        {s.booking === "approval" && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/15 text-indigo-700">
            Approval
          </span>
        )}
      </div>
    </article>
  );
};

// ---------- Editor ----------
const VenueEditor = ({
  draft, setDraft, editing, onClose, onSave,
}: {
  draft: Omit<VenueSession, "id" | "createdAt" | "bookedCount" | "waitlistCount">;
  setDraft: (d: Omit<VenueSession, "id" | "createdAt" | "bookedCount" | "waitlistCount">) => void;
  editing: boolean;
  onClose: () => void;
  onSave: () => void;
}) => {
  const set = (patch: Partial<typeof draft>) => setDraft({ ...draft, ...patch });
  const capacityPresets = [10, 20, 50, 100];
  const durationPresets = [60, 90, 120, 180];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-background shadow-elevated">
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur px-5 py-3.5 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            <h2 className="font-headline font-extrabold text-primary">
              {editing ? "Edit venue session" : "New venue session"}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-low" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="p-5 space-y-5">
          {/* Basic */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Basic</h3>
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Title</span>
              <input
                value={draft.title}
                onChange={(e) => set({ title: e.target.value })}
                placeholder="e.g. Design Workshop"
                className="mt-1 w-full px-3 py-2 rounded-lg bg-surface-lowest ghost-border text-sm font-bold text-primary outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Description</span>
              <textarea
                value={draft.description}
                onChange={(e) => set({ description: e.target.value })}
                rows={2}
                placeholder="What's this session about?"
                className="mt-1 w-full px-3 py-2 rounded-lg bg-surface-lowest ghost-border text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </label>
          </section>

          {/* Date / time / duration */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">When</h3>
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-surface-lowest ghost-border text-sm font-semibold text-primary">
                    <span className="flex items-center gap-1.5">
                      <CalIcon className="w-3.5 h-3.5" /> {format(new Date(draft.date), "EEE, MMM d")}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-auto" align="start">
                  <Calendar
                    mode="single"
                    selected={new Date(draft.date)}
                    onSelect={(d) => d && set({ date: d.toISOString().slice(0, 10) })}
                  />
                </PopoverContent>
              </Popover>
              <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-lowest ghost-border">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="time"
                  value={`${Math.floor(draft.startMin / 60).toString().padStart(2, "0")}:${(draft.startMin % 60).toString().padStart(2, "0")}`}
                  onChange={(e) => {
                    const [h, m] = e.target.value.split(":").map(Number);
                    set({ startMin: h * 60 + m });
                  }}
                  className="flex-1 bg-transparent text-sm font-semibold text-primary outline-none"
                />
              </label>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Duration</span>
              <div className="mt-1 grid grid-cols-4 gap-1.5">
                {durationPresets.map((d) => (
                  <button
                    key={d}
                    onClick={() => set({ durationMin: d })}
                    className={cn(
                      "py-1.5 rounded-lg text-[11px] font-bold transition",
                      draft.durationMin === d
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-lowest text-muted-foreground hover:text-primary",
                    )}
                  >
                    {d < 60 ? `${d}m` : `${d / 60}h`}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Capacity */}
          <section className="space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Capacity (max participants)
            </h3>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <div className="grid grid-cols-4 gap-1.5">
                {capacityPresets.map((c) => (
                  <button
                    key={c}
                    onClick={() => set({ capacity: c })}
                    className={cn(
                      "py-1.5 rounded-lg text-[11px] font-bold transition",
                      draft.capacity === c
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-lowest text-muted-foreground hover:text-primary",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={1}
                value={draft.capacity}
                onChange={(e) => set({ capacity: Math.max(1, +e.target.value || 1) })}
                className="w-20 px-2 py-1.5 rounded-lg bg-surface-lowest ghost-border text-sm font-bold text-primary outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </section>

          {/* Venue */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Venue</h3>
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Location
              </span>
              <input
                value={draft.location}
                onChange={(e) => set({ location: e.target.value })}
                placeholder="e.g. Co-working Space, Room 2 · Downtown"
                className="mt-1 w-full px-3 py-2 rounded-lg bg-surface-lowest ghost-border text-sm font-semibold text-primary outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <DoorOpen className="w-3 h-3" /> Entry instructions
              </span>
              <input
                value={draft.entryInstructions}
                onChange={(e) => set({ entryInstructions: e.target.value })}
                placeholder='e.g. "Show confirmation at entrance · Room 204, 2nd floor"'
                className="mt-1 w-full px-3 py-2 rounded-lg bg-surface-lowest ghost-border text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
          </section>

          {/* Pricing */}
          <section className="space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pricing</h3>
            <PricingField value={draft.pricing} onChange={(p) => set({ pricing: p })} compact />
          </section>

          {/* Visibility & booking */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Visibility & access
            </h3>
            <div className="grid grid-cols-3 gap-1.5">
              {(["public", "contacts", "private"] as Visibility[]).map((v) => {
                const M = visibilityMeta[v];
                return (
                  <button
                    key={v}
                    onClick={() => set({ visibility: v })}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold transition",
                      draft.visibility === v
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-lowest text-muted-foreground hover:text-primary",
                    )}
                  >
                    <M.icon className="w-3 h-3" /> {M.label}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => set({ booking: "instant" })}
                className={cn(
                  "py-2 rounded-xl text-[11px] font-bold transition",
                  draft.booking === "instant"
                    ? "bg-emerald-500/20 text-emerald-800 ring-1 ring-emerald-500/40"
                    : "bg-surface-lowest text-muted-foreground hover:text-primary",
                )}
              >
                Instant booking
              </button>
              <button
                onClick={() => set({ booking: "approval" })}
                className={cn(
                  "py-2 rounded-xl text-[11px] font-bold transition",
                  draft.booking === "approval"
                    ? "bg-indigo-500/20 text-indigo-800 ring-1 ring-indigo-500/40"
                    : "bg-surface-lowest text-muted-foreground hover:text-primary",
                )}
              >
                Approval required
              </button>
            </div>
            <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-surface-lowest ghost-border">
              <span className="flex items-center gap-2 text-xs font-bold text-primary">
                <Hourglass className="w-3.5 h-3.5" /> Allow waitlist when full
              </span>
              <Switch
                checked={draft.allowWaitlist}
                onCheckedChange={(c) => set({ allowWaitlist: c })}
              />
            </label>
          </section>

          {/* Live preview */}
          <section className="rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 ghost-border p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Info className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Preview</span>
            </div>
            <p className="font-headline font-extrabold text-primary text-sm">
              {draft.title || "Untitled session"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {fmtTime(draft.startMin)} · {draft.durationMin}m · {format(new Date(draft.date), "EEE, MMM d")}
            </p>
            <p className="text-[11px] text-primary mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {draft.location || "Location pending"}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[11px] text-emerald-700 font-bold">
                {draft.capacity} seat{draft.capacity === 1 ? "" : "s"}
              </span>
              <PriceTag pricing={draft.pricing} />
            </div>
          </section>
        </div>

        <footer className="sticky bottom-0 bg-background/95 backdrop-blur px-5 py-3 border-t flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-bold text-muted-foreground hover:text-primary"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-primary text-primary-foreground text-sm font-bold shadow-elevated hover:opacity-95"
          >
            <CheckCircle2 className="w-4 h-4" /> {editing ? "Save changes" : "Create session"}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default VenueBuilder;