import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft, Users as UsersIcon, Calendar as CalIcon, Clock, Globe,
  Crown, Sparkles, Lock, Check, Pencil, Trash2, Video, Radio, Hourglass,
  ChevronRight, X, CheckCircle2, ListChecks, MapPin, Building2,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import DateRangePopover from "@/components/app/DateRangePopover";
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
import ActiveSlotsPanel, { DailyOccupancy } from "@/components/app/ActiveSlotsPanel";
import { Activity, Eye, Layers } from "lucide-react";
import { availabilityStore, findConflict, flashConflict, markCreated, suggestOpenings, fmtTimeHM } from "@/lib/availabilityStore";
import SchedulingSwitcher from "@/components/app/SchedulingSwitcher";

// ---------- Types ----------
type Visibility = "public" | "contacts" | "private";
type Channel = "hybrid" | "online" | "onsite";

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
  channel?: Channel;
  venue?: string;
  locationPin?: string;
  venueNotes?: string;
}

const fmtTime = (m: number) => {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const period = h >= 12 ? "PM" : "AM";
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${mm.toString().padStart(2, "0")} ${period}`;
};

/** Local-time yyyy-mm-dd (avoids UTC off-by-one from toISOString). */
const localISO = (d: Date = new Date()) => format(d, "yyyy-MM-dd");

const visibilityMeta: Record<Visibility, { label: string; icon: React.ComponentType<any>; cls: string }> = {
  public:   { label: "Public",        icon: Globe,    cls: "bg-emerald-500/15 text-emerald-700" },
  contacts: { label: "Selected only", icon: UsersIcon,cls: "bg-sky-500/15 text-sky-700" },
  private:  { label: "Private",       icon: Lock,     cls: "bg-slate-500/15 text-slate-700" },
};

const blank = (): Omit<Webinar, "id" | "createdAt" | "bookedCount" | "waitlistCount"> => ({
  title: "",
  description: "",
  date: localISO(),
  startMin: 15 * 60,
  durationMin: 60,
  capacity: 25,
  approvalRequired: false,
  allowWaitlist: true,
  visibility: "public",
  pricing: defaultPricing,
  channel: "online",
  venue: "",
  locationPin: "",
  venueNotes: "",
});

const seed: Webinar[] = [
  {
    id: "w1",
    title: "Event Access Session",
    description: "Open Q&A on fundraising, hiring, and product strategy.",
    date: localISO(),
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
  const [dirty, setDirty] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [relay, setRelay] = useState<RelayConfig>({ ...DEFAULT_RELAY, tone: "offer" });
  const [viewMode, setViewMode] = useState<"editor" | "live">("editor");
  const { createRelay } = useSpotlight();

  const isEditing = !!draft.id;
  const set = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
    setDirty(true);
  };

  const reset = () => { setDraft(blank()); setDirty(false); };

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
    if (conflictToast(draft.date, draft.startMin, draft.startMin + draft.durationMin, draft.id)) return;
    if (isEditing) {
      setItems((p) => p.map((w) => (w.id === draft.id ? { ...w, ...draft, id: draft.id! } : w)));
      toast({ title: "Session updated" });
      const updatedId = draft.id!;
      setTimeout(() => markCreated(updatedId), 250);
      reset();
      return;
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
      // Defer past the store-sync useEffect + panel render so auto-scroll resolves the new row.
      setTimeout(() => markCreated(next.id), 250);
      if (relay.enabled) {
        createRelay({
          title: `EVENT ACCESS · ${next.title}`,
          body: `${format(new Date(next.date), "EEE, MMM d")} · ${fmtTime(next.startMin)} · ${next.capacity} seats · ${next.channel ?? "online"}${next.venue ? ` @ ${next.venue}` : ""}`,
          tone: relay.tone,
          expiresIn: `expires ${relay.expiry}`,
          relay: {
            source: "event-access",
            sourceId: next.id,
            totalSlots: next.capacity,
            remainingSlots: next.capacity,
            permissions: relay.permissions,
            indicators: relay.indicators,
            audience: relay.audience,
            viewHref: "/app/availability/webinars",
          },
        });
        toast({ title: "Relayed to Spotlight" });
      }
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
      channel: w.channel ?? "online",
      venue: w.venue ?? "",
      locationPin: w.locationPin ?? "",
      venueNotes: w.venueNotes ?? "",
    });
    setDirty(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteOne = (id: string) => {
    setItems((p) => p.filter((w) => w.id !== id));
    setConfirmDelete(null);
    toast({ title: "Session deleted" });
  };

  // Sync to unified availability store
  useEffect(() => {
    availabilityStore.syncSource(
      "event-access",
      items.map((w) => {
        const mode: "hybrid" | "online" | "onsite" =
          w.channel === "hybrid" ? "hybrid" : w.channel === "onsite" ? "onsite" : "online";
        return {
          id: w.id,
          source: "event-access" as const,
          date: w.date,
          startMin: w.startMin,
          endMin: w.startMin + w.durationMin,
          bufferMin: 0,
          mode,
          typeLabel: w.title || "Event Access",
        };
      }),
    );
  }, [items]);

  return (
    <AppShell
      subtitle="Real-time coordination for event access and audience participation"
      title="Event Access Scheduling"
      actions={
        <>
          <div className="inline-flex items-center rounded-full ghost-border bg-surface-lowest p-1">
            <button
              onClick={() => setViewMode("editor")}
              className={cn(
                "px-3 py-1.5 rounded-full text-[11px] font-bold transition inline-flex items-center gap-1",
                viewMode === "editor" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary",
              )}
            >
              <Layers className="w-3 h-3" /> Editor
            </button>
            <button
              onClick={() => setViewMode("live")}
              className={cn(
                "px-3 py-1.5 rounded-full text-[11px] font-bold transition inline-flex items-center gap-1",
                viewMode === "live" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary",
              )}
            >
              <Activity className="w-3 h-3" /> Live View
            </button>
          </div>
          <SchedulingSwitcher current="event" />
          <button
            onClick={() => navigate("/app/availability/builder")}
            className="inline-flex items-center gap-2 px-3 py-2.5 rounded-full ghost-border bg-surface-lowest text-xs font-semibold text-primary hover:bg-surface-low"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Slot Builder
          </button>
        </>
      }
    >
      {/* DAILY OCCUPANCY (today) — parity with Focused & Quick Sync builders */}
      <div className="mb-5">
        <DailyOccupancy
          date={draft.date}
          onBlockClick={(id) => {
            const w = items.find((x) => x.id === id);
            if (w) editOne(w);
          }}
        />
      </div>

      {viewMode === "live" ? (
        <LiveEventView items={items} onEdit={editOne} onDelete={(id) => setConfirmDelete(id)} />
      ) : (
      <>
      {/* CREATION PANEL */}
      <section className="rounded-3xl bg-surface-lowest ghost-border p-4 md:p-6 shadow-ambient">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-primary text-primary-foreground shrink-0">
            <Radio className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">{isEditing ? "Edit" : "New"} Group Session</p>
            <h2 className="font-headline font-extrabold text-primary text-base md:text-lg">Webinar Builder</h2>
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
                  onClick={() => set("channel", k)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition",
                    (draft.channel ?? "online") === k
                      ? "bg-primary text-primary-foreground shadow-glass"
                      : "text-muted-foreground hover:text-primary",
                  )}
                  aria-pressed={(draft.channel ?? "online") === k}
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

        <div className="grid lg:grid-cols-[1fr_320px] gap-5">
          <div className="space-y-5">
            {/* Basics */}
            <Section title="Basics" icon={ListChecks}>
              <Field label="Title">
                <input
                  value={draft.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. Event Access Session"
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
                <DateRangePopover
                  from={draft.date}
                  singleOnly
                  onChange={(from) => set("date", from)}
                />
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
                <p className="font-bold text-primary text-sm flex items-center gap-1.5 mt-1 capitalize">
                  {(draft.channel ?? "online") === "onsite" ? <MapPin className="w-3.5 h-3.5" /> :
                   (draft.channel ?? "online") === "hybrid" ? <Sparkles className="w-3.5 h-3.5" /> :
                   <Video className="w-3.5 h-3.5" />}
                  {draft.channel ?? "online"}
                </p>
              </div>
            </Section>

            {((draft.channel ?? "online") === "onsite" || (draft.channel ?? "online") === "hybrid") && (
              <Section title="Venue & location" icon={MapPin} hint="Where attendees will physically join.">
                <Field label="Venue name">
                  <input
                    value={draft.venue ?? ""}
                    onChange={(e) => set("venue", e.target.value)}
                    placeholder="e.g. Atlas HQ · Studio B"
                    className="w-full px-3 py-2 rounded-lg bg-surface-low ghost-border text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </Field>
                <Field label="Pin location (Google Maps / Plus Code / coords)">
                  <input
                    value={draft.locationPin ?? ""}
                    onChange={(e) => set("locationPin", e.target.value)}
                    placeholder="https://maps.google.com/?q=…"
                    className="w-full px-3 py-2 rounded-lg bg-surface-low ghost-border text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </Field>
                <Field label="Arrival notes (parking, floor, entry, dress code)">
                  <textarea
                    value={draft.venueNotes ?? ""}
                    onChange={(e) => set("venueNotes", e.target.value)}
                    placeholder="Use east entrance. Park P2. Ask reception for Studio B."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-surface-low ghost-border text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                  />
                </Field>
              </Section>
            )}

            {/* Capacity */}
            <Section title="Capacity" icon={UsersIcon} hint="How many can join the session.">
              <CapacitySlider value={draft.capacity} onChange={(n) => set("capacity", n)} />
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

            <RelayToSpotlightPanel value={relay} onChange={setRelay} />

            <div className="flex items-center justify-end gap-2 pt-2">
              {isEditing && (
                <button onClick={reset} className="px-4 py-2 rounded-full ghost-border text-xs font-bold text-muted-foreground hover:text-primary">Cancel</button>
              )}
              <button
                onClick={save}
                disabled={isEditing && !dirty}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-primary text-primary-foreground text-xs font-bold shadow-elevated"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> {isEditing ? "Update session" : "Publish session"}
              </button>
            </div>
          </div>

          {/* Live preview card */}
          <aside className="space-y-3 h-fit">
          <div className="rounded-2xl bg-gradient-vault text-primary-foreground p-4 shadow-elevated">
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
          </div>

          {((draft.channel ?? "online") === "onsite" || (draft.channel ?? "online") === "hybrid") && (
            <>
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
            </>
          )}
          </aside>
        </div>
      </section>

      {/* UNIFIED AVAILABILITY */}
      <div className="mt-6">
        <ActiveSlotsPanel
          eyebrow="Unified Availability"
          emptyText="No group sessions yet — create one above."
          handlers={Object.fromEntries(
            items.map((w) => [w.id, {
              onEdit: () => editOne(w),
              onDelete: () => setConfirmDelete(w.id),
            }]),
          )}
        />
      </div>
      </>
      )}
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

// ---------- Live Event View (command-center display) ----------
const LiveEventView = ({
  items, onEdit, onDelete,
}: {
  items: Webinar[];
  onEdit: (w: Webinar) => void;
  onDelete: (id: string) => void;
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const todayISO = localISO();
  const sorted = [...items].sort(
    (a, b) => (a.date + a.startMin).localeCompare(b.date + b.startMin) || a.startMin - b.startMin,
  );
  if (sorted.length === 0) {
    return (
      <section className="rounded-3xl bg-surface-lowest ghost-border p-10 text-center shadow-ambient">
        <Activity className="w-6 h-6 text-muted-foreground mx-auto" />
        <p className="mt-3 text-sm text-muted-foreground">No active events. Switch to Editor to create one.</p>
      </section>
    );
  }
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between rounded-2xl bg-surface-lowest ghost-border px-4 py-2.5 shadow-ambient">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center w-7 h-7 rounded-lg bg-rose-500/15 text-rose-700">
            <Activity className="w-3.5 h-3.5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">Live View</p>
            <p className="text-[11px] font-bold text-muted-foreground">
              {sorted.length} event{sorted.length === 1 ? "" : "s"} · Command-center mode
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
          <span className="relative flex w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-emerald-500 opacity-75 animate-ping" />
            <span className="relative w-2 h-2 rounded-full bg-emerald-500" />
          </span>
          Streaming
        </span>
      </div>
      <ul className="space-y-3">
        {sorted.map((w) => {
          const seatsLeft = Math.max(0, w.capacity - w.bookedCount);
          const filled = Math.min(100, Math.round((w.bookedCount / Math.max(1, w.capacity)) * 100));
          const isLive = w.date === todayISO;
          const isPast = w.date < todayISO;
          const status = isPast ? "Ended" : isLive ? "Live" : "Upcoming";
          const statusCls = isPast
            ? "bg-muted text-muted-foreground"
            : isLive
              ? "bg-rose-500/15 text-rose-700"
              : "bg-sky-500/15 text-sky-700";
          const isOpen = expandedId === w.id;
          const V = visibilityMeta[w.visibility];
          return (
            <li
              key={w.id}
              className="rounded-2xl bg-surface-lowest ghost-border shadow-ambient overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setExpandedId(isOpen ? null : w.id)}
                className="w-full text-left grid grid-cols-12 items-center gap-3 px-4 py-3 hover:bg-surface-low/40 transition"
              >
                <div className="col-span-12 md:col-span-4 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider", statusCls)}>
                      {status}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground capitalize">
                      {w.channel ?? "online"}
                    </span>
                  </div>
                  <p className="font-headline font-extrabold text-primary text-sm mt-1 truncate">{w.title}</p>
                  <p className="text-[11px] text-muted-foreground tabular-nums">
                    {format(new Date(w.date), "EEE, MMM d")} · {fmtTime(w.startMin)} – {fmtTime(w.startMin + w.durationMin)}
                  </p>
                </div>
                <div className="col-span-6 md:col-span-3">
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Occupancy</p>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-surface-low overflow-hidden">
                    <div className="h-full bg-gradient-primary" style={{ width: `${filled}%` }} />
                  </div>
                  <p className="text-[11px] font-bold text-primary mt-0.5 tabular-nums">
                    {w.bookedCount}/{w.capacity} · {seatsLeft} left
                  </p>
                </div>
                <div className="col-span-6 md:col-span-3">
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Audience</p>
                  <p className="text-[11px] font-bold text-primary mt-1 inline-flex items-center gap-1.5">
                    {V?.icon ? <V.icon className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                    {V?.label ?? w.visibility}
                  </p>
                  {w.waitlistCount > 0 && (
                    <p className="text-[10px] text-amber-700 font-bold">+{w.waitlistCount} on waitlist</p>
                  )}
                </div>
                <div className="col-span-12 md:col-span-2 md:text-right">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Relay synced
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{isOpen ? "Hide" : "Expand"}</p>
                </div>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-outline-variant/30 grid md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Description</p>
                    <p className="text-xs text-primary/80 mt-1 leading-relaxed">
                      {w.description || "—"}
                    </p>
                    {w.venue && (
                      <p className="text-[11px] text-muted-foreground mt-2 inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {w.venue}
                      </p>
                    )}
                  </div>
                  <div className="flex md:justify-end items-start gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(w); }}
                      className="px-3 py-1.5 rounded-full ghost-border bg-surface-lowest text-[11px] font-bold text-primary hover:bg-surface-low inline-flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(w.id); }}
                      className="px-3 py-1.5 rounded-full ghost-border bg-surface-lowest text-[11px] font-bold text-destructive hover:bg-destructive/10 inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
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

const CapacitySlider = ({ value, onChange }: { value: number; onChange: (n: number) => void }) => {
  const MIN = 1;
  const MAX = 500;
  const presets = [10, 25, 50, 100, 250];
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Capacity
        </span>
        <span className="font-headline font-extrabold text-primary text-base tabular-nums">
          {value} <span className="text-[11px] text-muted-foreground font-bold">participants</span>
        </span>
      </div>
      <Slider
        min={MIN}
        max={MAX}
        step={1}
        value={[Math.min(MAX, Math.max(MIN, value))]}
        onValueChange={(v) => onChange(Math.max(MIN, Math.min(MAX, v[0] ?? MIN)))}
        aria-label="Capacity"
      />
      <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground tabular-nums">
        <span>{MIN}</span>
        <span>{MAX}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "px-2.5 py-1 rounded-full text-[11px] font-bold transition",
              value === n
                ? "bg-primary text-primary-foreground shadow-glass"
                : "bg-surface-low text-muted-foreground hover:text-primary",
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
};

export default WebinarBuilder;