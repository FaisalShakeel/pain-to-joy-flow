import { useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, BadgeCheck, MapPin, Building2, Clock, CalendarDays, Briefcase,
  UserPlus, MessageSquare, Phone, Download, ShieldCheck, Globe, Linkedin, Twitter,
  Instagram, Sparkles, Lock, Zap,
} from "lucide-react";
import Avatar from "@/components/app/Avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { contacts, ownerProfileFor, findContact } from "@/lib/mockData";
import AuthGateDialog, { isGuestAuthed } from "@/components/guest/AuthGateDialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/** Mock services + slots so guests have something rich to browse */
const SERVICES = [
  { name: "Strategy Sync", duration: "30 min", desc: "Align on a single goal or decision." },
  { name: "Deep Work Review", duration: "60 min", desc: "Walk through artefacts and unblock." },
  { name: "Office Hours", duration: "15 min", desc: "Quick advice & introductions." },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SLOTS = ["09:30", "10:15", "11:00", "13:30", "15:00", "16:45"];

type GatedAction =
  | { kind: "connect" }
  | { kind: "message" }
  | { kind: "save" }
  | { kind: "request" }
  | { kind: "book"; day: string; slot: string };

const labelFor = (a: GatedAction) => {
  switch (a.kind) {
    case "connect": return "Send connection request";
    case "message": return "Send a message";
    case "save": return "Save contact";
    case "request": return "Request access";
    case "book": return `Book ${a.day} · ${a.slot}`;
  }
};

const GuestProfile = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();

  const contact = useMemo(() => findContact(id) ?? contacts[0], [id]);
  const owner = useMemo(() => ownerProfileFor(contact), [contact]);

  const [authOpen, setAuthOpen] = useState(false);
  const [pending, setPending] = useState<GatedAction | null>(null);
  const [selectedDay, setSelectedDay] = useState(DAYS[0]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  /** Wrap any interactive action: if guest is unauthenticated, gate it and resume after sign-in. */
  const gate = (action: GatedAction, run: () => void) => {
    if (isGuestAuthed()) {
      run();
      return;
    }
    setPending(action);
    setAuthOpen(true);
    // Stash the resumer on the pending action via closure
    (pendingResumers as Record<string, () => void>)[action.kind + (action.kind === "book" ? `:${action.day}:${action.slot}` : "")] = run;
  };

  // Simple in-memory map keyed by action signature so we can resume after auth
  const pendingResumers: Record<string, () => void> = (GuestProfile as any)._resumers ??= {};

  const onAuthenticated = () => {
    if (!pending) return;
    const key = pending.kind + (pending.kind === "book" ? `:${pending.day}:${pending.slot}` : "");
    const resume = pendingResumers[key];
    setPending(null);
    resume?.();
  };

  const status = contact.status;
  const statusChip =
    status === "available"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : status === "focus" || status === "busy"
      ? "bg-amber-100 text-amber-800 border-amber-200"
      : "bg-slate-100 text-slate-700 border-slate-200";

  const socialIcon = (kind: string) => {
    switch (kind) {
      case "linkedin": return Linkedin;
      case "x": return Twitter;
      case "instagram": return Instagram;
      case "website": return Globe;
      default: return Globe;
    }
  };

  return (
    <div className="min-h-screen bg-surface-low">
      {/* Public top bar */}
      <header className="sticky top-0 z-30 bg-surface-lowest/80 backdrop-blur border-b border-border/60">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
            <ShieldCheck className="w-3 h-3" /> Public profile preview
          </div>
          <Link to="/login" className="text-xs font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Hero */}
        <section className="rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient">
          <div className="flex items-start gap-4">
            <Avatar initials={contact.initials} accent={contact.accent} size="xl" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-2xl font-headline font-extrabold text-primary leading-tight truncate">
                  {contact.name}
                </h1>
                <BadgeCheck className="w-5 h-5 text-sky-500" />
              </div>
              <p className="text-sm text-foreground/80 mt-0.5">{owner.title}</p>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Building2 className="w-3.5 h-3.5" />
                <span className="truncate">{owner.org}</span>
                <span className="opacity-50">·</span>
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate">{owner.location}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={cn("px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider", statusChip)}>
                  {status === "available" ? "Available" : status === "offline" ? "Offline" : "Focus"}
                </span>
                <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Replies in {owner.responseTime}
                </span>
              </div>
            </div>
          </div>

          {/* Action row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">
            <Button
              size="sm"
              className="rounded-full"
              onClick={() =>
                gate({ kind: "connect" }, () =>
                  toast({ title: "Connection request sent", description: `We'll notify ${contact.name.split(" ")[0]}.` }),
                )
              }
            >
              <UserPlus className="w-3.5 h-3.5" /> Connect
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() =>
                gate({ kind: "message" }, () =>
                  toast({ title: "Message thread opened", description: `You can now message ${contact.name.split(" ")[0]}.` }),
                )
              }
            >
              <MessageSquare className="w-3.5 h-3.5" /> Message
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() =>
                gate({ kind: "save" }, () =>
                  toast({ title: "Contact saved", description: `${contact.name} added to your contacts.` }),
                )
              }
            >
              <Download className="w-3.5 h-3.5" /> Save
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="rounded-full"
              onClick={() =>
                gate({ kind: "request" }, () =>
                  toast({ title: "Access request sent", description: "You'll be notified when it's reviewed." }),
                )
              }
            >
              <Lock className="w-3.5 h-3.5" /> Request access
            </Button>
          </div>
        </section>

        {/* About */}
        <section className="rounded-2xl bg-surface-lowest ghost-border p-5 shadow-ambient">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">About</p>
          <p className="mt-2 text-sm text-foreground/90 leading-relaxed">{owner.bio}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {owner.tags.map((t) => (
              <Badge key={t} variant="outline" className="text-[10px] font-semibold">
                {t}
              </Badge>
            ))}
          </div>
        </section>

        {/* Social links */}
        <section className="rounded-2xl bg-surface-lowest ghost-border p-5 shadow-ambient">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Social links</p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {owner.socialHandles.map((s) => {
              const Icon = socialIcon(s.kind);
              return (
                <a
                  key={s.id}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-low hover:bg-surface transition"
                >
                  <span className="grid place-items-center w-8 h-8 rounded-lg bg-primary/5 text-primary">
                    <Icon className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-primary">{s.label}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{s.value}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        {/* Services */}
        <section className="rounded-2xl bg-surface-lowest ghost-border p-5 shadow-ambient">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Services</p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SERVICES.map((s) => (
              <div key={s.name} className="rounded-xl border border-border/60 bg-surface-low p-4">
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-primary" />
                  <p className="text-sm font-semibold text-primary">{s.name}</p>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{s.duration}</p>
                <p className="text-xs text-foreground/80 mt-2 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Availability + calendar preview */}
        <section className="rounded-2xl bg-surface-lowest ghost-border p-5 shadow-ambient">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Availability</p>
              <p className="mt-1 text-sm text-foreground/90 font-semibold">{owner.availabilityContext}</p>
              <p className="text-[11px] text-muted-foreground">
                {owner.operationDays} · {owner.operationHours}
              </p>
            </div>
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary/10 text-primary">
              <CalendarDays className="w-4 h-4" />
            </span>
          </div>

          {/* Day picker */}
          <div className="mt-4 flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {DAYS.map((d) => (
              <button
                key={d}
                onClick={() => {
                  setSelectedDay(d);
                  setSelectedSlot(null);
                }}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                  selectedDay === d
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-surface-low text-muted-foreground border-border/60 hover:text-primary",
                )}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Slots */}
          <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2">
            {SLOTS.map((slot) => {
              const active = selectedSlot === slot;
              return (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={cn(
                    "px-2 py-2 rounded-lg text-xs font-semibold border tabular-nums transition-colors",
                    active
                      ? "bg-primary/10 text-primary border-primary"
                      : "bg-surface-low text-foreground/80 border-border/60 hover:border-primary/40",
                  )}
                >
                  {slot}
                </button>
              );
            })}
          </div>

          <Button
            disabled={!selectedSlot}
            className="mt-4 w-full rounded-full"
            onClick={() => {
              if (!selectedSlot) return;
              gate({ kind: "book", day: selectedDay, slot: selectedSlot }, () =>
                toast({
                  title: "Booking confirmed",
                  description: `${selectedDay} at ${selectedSlot} with ${contact.name}.`,
                }),
              );
            }}
          >
            <Zap className="w-3.5 h-3.5" />
            {selectedSlot ? `Book ${selectedDay} · ${selectedSlot}` : "Select a slot to book"}
          </Button>
        </section>

        <p className="text-center text-[11px] text-muted-foreground py-4 inline-flex items-center justify-center gap-1 w-full">
          <Sparkles className="w-3 h-3 text-accent" /> Powered by Availock — permission-first networking.
        </p>
      </main>

      <AuthGateDialog
        open={authOpen}
        onOpenChange={(o) => {
          setAuthOpen(o);
          if (!o) setPending(null);
        }}
        actionLabel={pending ? labelFor(pending) : undefined}
        onAuthenticated={onAuthenticated}
      />
    </div>
  );
};

export default GuestProfile;