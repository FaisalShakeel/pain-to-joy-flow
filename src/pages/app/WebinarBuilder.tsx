import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft, Users as UsersIcon, Calendar as CalIcon, Clock, Globe,
  Crown, Sparkles, Lock, Check, Pencil, Trash2, Video, Radio, Hourglass,
  ChevronRight, X, CheckCircle2, ListChecks,
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

interface Webinar {
  id: string;
  title: string;
  description: string;
  date: string; // yyyy-mm-dd
  startMin: number;
  durationMin: number;
  capacity: number;
  approvalRequired: boolean;
  allowWaitlist: boolean;
  visibility: Visibility;
  pricing: Pricing;
  bookedCount: number; // mock
  waitlistCount: number; // mock
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
  public:   { label: "Public",        icon: Globe,    cls: "bg-emerald-500/15 text-emerald-700" },
  contacts: { label: "Selected only", icon: UsersIcon,cls: "bg-sky-500/15 text-sky-700" },
  private:  { label: "Private",       icon: Lock,     cls: "bg-slate-500/15 text-slate-700" },
};

const blank = (): Omit<Webinar, "id" | "createdAt" | "bookedCount" | "waitlistCount"> => ({
  title: "",
  description: "",
  date: new Date().toISOString().slice(0, 10),
  startMin: 15 * 60,
  durationMin: 60,
  capacity: 25,
  approvalRequired: false,
  allowWaitlist: true,
  visibility: "public",
  pricing: defaultPricing,
});

const seed: Webinar[] = [
  {
    id: "w1",
    title: "Startup AMA Session",
    description: "Open Q&A on fundraising, hiring, and product strategy.",
    date: new Date().toISOString().slice(0, 10),
    startMin: 15 * 60,
    durationMin: 60,
    capacity: 25,
    approvalRequired: false,
    allowWaitlist: true,
    visibility: "public",
    pricing: { mode: "free" },
    bookedCount: 18,
    waitlistCount: 0,
    createdAt: Date.now() - 100000,
  },
];

const WebinarBuilder = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Webinar[]>(seed);
  const [draft, setDraft] = useState<Omit<Webinar, "id" | "createdAt" | "bookedCount" | "waitlistCount"> & { id?: string }>(blank());
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const isEditing = !!draft.id;
  const set = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const reset = () => setDraft(blank());

  const save = () => {
    if (!draft.title.trim()) {
      toast({ title: "Title required", description: "Give the session a clear title." });
      return;
    }
    if (draft.durationMin <= 0) {
      toast({ title: "Duration invalid", description: "Duration must be greater than zero." });
      return;
    }
    if (draft.capacity < 1) {
      toast({ title: "Capacity invalid", description: "At least 1 seat is required." });
      return;
    }
    if (draft.pricing.mode === "paid" && (!draft.pricing.amount || draft.pricing.amount <= 0)) {
      toast({ title: "Set a price", description: "Paid sessions must have a price greater than zero." });
      return;
    }
    if (isEditing) {
      setItems((p) => p.map((w) => (w.id === draft.id ? { ...w, ...draft, id: draft.id! } : w)));
      toast({ title: "Session updated" });
    } else {
      const next: Webinar = {
        ...(draft as Omit<Webinar, "id" | "createdAt" | "bookedCount" | "waitlistCount">),
        id: `w${Date.now()}`,
        createdAt: Date.now(),
        bookedCount: 0,
        waitlistCount: 0,
      };
      setItems((p) => [next, ...p]);
      toast({ title: "Group session created", description: `${draft.title} · ${draft.capacity} seats` });
    }
    reset();
  };

  const editOne = (w: Webinar) => {
    setDraft({
      id: w.id,
      title: w.title,
      description: w.description,
      date: w.date,
      startMin: w.startMin,
      durationMin: w.durationMin,
      capacity: w.capacity,
      approvalRequired: w.approvalRequired,
      allowWaitlist: w.allowWaitlist,
      visibility: w.visibility,
      pricing: w.pricing,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteOne = (id: string) => {
    setItems((p) => p.filter((w) => w.id !== id));
    setConfirmDelete(null);
    toast({ title: "Session deleted" });
  };

  return (
    <AppShell
      subtitle="Group Session / Webinar"
      title="Speak to many, in one open window."
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
            <Radio className="w-4 h-4" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">{isEditing ? "Edit" : "New"} Group Session</p>
            <h2 className="font-headline font-extrabold text-primary text-base md:text-lg">Webinar Builder</h2>
          </div>
          {isEditing && (
            <button onClick={reset} className="ml-auto text-[11px] font-bold text-muted-foreground hover:text-primary inline-flex items-center gap-1">
              <X className="w-3 h-3" /> Discard edit
            </button>
          )}
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-5">
          <div className="space-y-5">
            {/* Basics */}
            <Section title="Basics" icon={ListChecks}>
              <Field label="Title">
                <input
                  value={draft.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. Startup AMA Session"
                  className="w-full px-3 py-2 rounded-lg bg-surface-low ghost-border text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </Field>
              <Field label="Description">
                <textarea
                  value={draft.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="What attendees will get out of this session…"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-surface-low ghost-border text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                />
              </Field>
            </Section>

            {/* Date & Time */}
            <Section title="Date & time" icon={CalIcon}>
              <Field label="Date">
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-full inline-flex items-center justify-between px-3 py-2 rounded-lg bg-surface-low ghost-border text-sm outline-none hover:bg-surface-low/80"
                    >
                      <span className="truncate">{format(new Date(draft.date), "EEEE, MMM d, yyyy")}</span>
                      <CalIcon className="w-4 h-4 text-muted-foreground" />
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
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Start time">
                  <TimeInput value={draft.startMin} onChange={(v) => set("startMin", v)} />
                </Field>
                <Field label="Duration (min)">
                  <input
                    type="number"
                    min={15}
                    step={15}
                    value={draft.durationMin}
                    onChange={(e) => set("durationMin", Math.max(15, +e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-surface-low ghost-border text-sm font-bold text-primary outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </Field>
              </div>
              <div className="rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 p-3 ghost-border">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Channel</p>
                <p className="font-bold text-primary text-sm flex items-center gap-1.5 mt-1">
                  <Video className="w-3.5 h-3.5" /> Online (default)
                </p>
              </div>
            </Section>

            {/* Capacity */}
            <Section title="Capacity" icon={UsersIcon} hint="How many can join the session.">
              <div className="flex flex-wrap gap-1.5">
                {[10, 25, 50, 100, 250].map((n) => (
                  <button
                    key={n}
                    onClick={() => set("capacity", n)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[11px] font-bold transition",
                      draft.capacity === n
                        ? "bg-primary text-primary-foreground shadow-glass"
                        : "bg-surface-low text-muted-foreground hover:text-primary",
                    )}
                  >
                    {n} seats
                  </button>
                ))}
                <input
                  type="number"
                  min={1}
                  value={draft.capacity}
                  onChange={(e) => set("capacity", Math.max(1, +e.target.value))}
                  className="w-24 px-2 py-1.5 rounded-full bg-surface-low ghost-border text-sm font-bold text-primary outline-none text-center"
                  aria-label="Custom capacity"
                />
              </div>
            </Section>

            {/* Controls */}
            <Section title="Controls" icon={Hourglass}>
              <Toggle
                label="Approval required"
                hint={draft.approvalRequired ? "Each booking goes to pending until you approve." : "Seats confirmed instantly."}
                value={draft.approvalRequired}
                onChange={(v) => set("approvalRequired", v)}
                icon={Check}
              />
              <Toggle
                label="Allow waitlist when full"
                hint={draft.allowWaitlist ? "Extra signups join a waitlist for cancellations." : "When full, no further signups are accepted."}
                value={draft.allowWaitlist}
                onChange={(v) => set("allowWaitlist", v)}
                icon={UsersIcon}
              />
              <Field label="Visibility">
                <div className="grid grid-cols-3 gap-1.5">
                  {(Object.keys(visibilityMeta) as Visibility[]).map((v) => {
                    const M = visibilityMeta[v];
                    return (
                      <button
                        key={v}
                        onClick={() => set("visibility", v)}
                        className={cn(
                          "flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[11px] font-bold transition",
                          draft.visibility === v
                            ? "bg-primary text-primary-foreground shadow-glass"
                            : `${M.cls} hover:opacity-90`,
                        )}
                      >
                        <M.icon className="w-3.5 h-3.5" /> {M.label}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </Section>

            {/* Pricing */}
            <Section title="Pricing" icon={Sparkles} hint="Free by default. Switch to Paid to set a price.">
              <PricingField value={draft.pricing} onChange={(p) => set("pricing", p)} />
            </Section>

            <div className="flex items-center justify-end gap-2 pt-2">
              {isEditing && (
                <button onClick={reset} className="px-4 py-2 rounded-full ghost-border text-xs font-bold text-muted-foreground hover:text-primary">Cancel</button>
              )}
              <button
                onClick={save}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-primary text-primary-foreground text-xs font-bold shadow-elevated"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> {isEditing ? "Update session" : "Publish session"}
              </button>
            </div>
          </div>

          {/* Live preview card */}
          <aside className="rounded-2xl bg-gradient-vault text-primary-foreground p-4 shadow-elevated h-fit">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold">Live preview</p>
            <h4 className="font-headline font-extrabold text-base mt-1 truncate">{draft.title || "Untitled session"}</h4>
            <p className="text-[12px] text-primary-foreground/80 mt-0.5">
              {format(new Date(draft.date), "EEE, MMM d")} · {fmtTime(draft.startMin)} – {fmtTime(draft.startMin + draft.durationMin)}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
              <Stat label="Seats" value={`${draft.capacity}`} />
              <Stat label="Duration" value={`${draft.durationMin}m`} />
              <Stat label="Booking" value={draft.approvalRequired ? "Approval" : "Instant"} />
              <Stat label="Visibility" value={visibilityMeta[draft.visibility].label} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <PriceTag pricing={draft.pricing} />
              {draft.allowWaitlist && (
                <span className="px-2 py-0.5 rounded-full bg-primary-foreground/15 text-[10px] font-bold">
                  Waitlist on
                </span>
              )}
            </div>
            {draft.pricing.mode === "paid" && draft.pricing.note && (
              <p className="mt-2 text-[10px] text-primary-foreground/70 italic line-clamp-2">"{draft.pricing.note}"</p>
            )}
          </aside>
        </div>
      </section>

      {/* ACTIVE WEBINARS */}
      <section className="mt-6 rounded-3xl bg-surface-lowest ghost-border p-4 md:p-6 shadow-ambient">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">Manage</p>
            <h3 className="font-headline font-extrabold text-primary text-base md:text-lg">Active Group Sessions</h3>
          </div>
          <span className="text-[11px] text-muted-foreground">{items.length} active</span>
        </div>

        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground py-10 text-center">
            No group sessions yet — fill out the form above to publish your first.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {items.map((w) => (
              <WebinarCard
                key={w.id}
                webinar={w}
                onEdit={() => editOne(w)}
                onDelete={() => setConfirmDelete(w.id)}
              />
            ))}
          </div>
        )}
      </section>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this group session?</AlertDialogTitle>
            <AlertDialogDescription>
              The session and any pending bookings will be removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && deleteOne(confirmDelete)}
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

// ---------- Webinar Card (provider view) ----------
const WebinarCard = ({
  webinar, onEdit, onDelete,
}: {
  webinar: Webinar;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const seatsLeft = Math.max(0, webinar.capacity - webinar.bookedCount);
  const filledPct = Math.min(100, Math.round((webinar.bookedCount / webinar.capacity) * 100));
  const lowSeats = seatsLeft > 0 && seatsLeft <= Math.max(2, Math.floor(webinar.capacity * 0.1));
  const isFull = seatsLeft === 0;
  const V = visibilityMeta[webinar.visibility];

  return (
    <article className="relative rounded-2xl ghost-border bg-surface-low p-4 hover:shadow-ambient transition">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-accent" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent">Group Session</span>
          </div>
          <p className="font-headline font-extrabold text-primary text-sm mt-1 truncate">{webinar.title}</p>
          <p className="text-[12px] text-muted-foreground">
            {format(new Date(webinar.date), "EEE, MMM d")} · {fmtTime(webinar.startMin)} – {fmtTime(webinar.startMin + webinar.durationMin)}
          </p>
        </div>
        <PriceTag pricing={webinar.pricing} />
      </div>

      {webinar.description && (
        <p className="mt-2 text-[11px] text-muted-foreground line-clamp-2">{webinar.description}</p>
      )}

      {/* Seats progress */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="font-bold text-primary inline-flex items-center gap-1">
            <UsersIcon className="w-3 h-3" />
            {isFull ? "Full" : `${seatsLeft} of ${webinar.capacity} seats left`}
          </span>
          <span className={cn(
            "font-bold",
            isFull ? "text-rose-700" : lowSeats ? "text-amber-700" : "text-muted-foreground",
          )}>
            {filledPct}%
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-surface-lowest overflow-hidden">
          <div
            style={{ width: `${filledPct}%` }}
            className={cn(
              "h-full",
              isFull ? "bg-rose-500" : lowSeats ? "bg-amber-500" : "bg-gradient-primary",
            )}
          />
        </div>
        {webinar.waitlistCount > 0 && (
          <p className="mt-1 text-[10px] text-amber-700 font-bold">
            +{webinar.waitlistCount} on waitlist
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px]">
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold", V.cls)}>
          <V.icon className="w-2.5 h-2.5" /> {V.label}
        </span>
        <span className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold",
          webinar.approvalRequired ? "bg-amber-500/15 text-amber-800" : "bg-emerald-500/15 text-emerald-700",
        )}>
          {webinar.approvalRequired ? <Lock className="w-2.5 h-2.5" /> : <Check className="w-2.5 h-2.5" />}
          {webinar.approvalRequired ? "Approval" : "Instant"}
        </span>
        {webinar.allowWaitlist && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-sky-500/15 text-sky-700">
            <Hourglass className="w-2.5 h-2.5" /> Waitlist
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-end gap-1">
        <button
          onClick={onEdit}
          className="grid place-items-center w-8 h-8 rounded-lg ghost-border bg-surface-lowest hover:bg-primary/10 text-primary"
          aria-label="Edit session"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="grid place-items-center w-8 h-8 rounded-lg ghost-border bg-surface-lowest hover:bg-destructive/10 text-destructive"
          aria-label="Delete session"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
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

const Toggle = ({ label, hint, value, onChange, icon: Ic }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void; icon: React.ComponentType<any> }) => (
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

const TimeInput = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  const h = Math.floor(value / 60);
  const m = value % 60;
  return (
    <input
      type="time"
      value={`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`}
      onChange={(e) => {
        const [hs, ms] = e.target.value.split(":");
        onChange(parseInt(hs, 10) * 60 + parseInt(ms, 10));
      }}
      className="w-full px-3 py-2 rounded-lg bg-surface-low ghost-border text-sm font-bold text-primary outline-none focus:ring-2 focus:ring-primary/30"
    />
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-primary-foreground/10 p-2">
    <p className="text-[9px] uppercase tracking-wider text-primary-foreground/60 font-bold">{label}</p>
    <p className="font-headline font-extrabold text-sm mt-0.5 truncate">{value}</p>
  </div>
);

export default WebinarBuilder;