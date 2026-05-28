import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Phone, MessageSquare, CalendarDays, Calendar, Mail, Smartphone,
  MapPin, Briefcase, Clock, Building2, Share2, Camera, Send, Check,
  ShieldCheck, Lock, Zap, BadgeCheck, BellRing, BellOff, PhoneCall,
  Linkedin, Github, Globe, MessageCircle, Radio, Bell, Twitter,
  ArrowDown, ArrowUp, Activity,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import Avatar from "@/components/app/Avatar";
import AccessRequestComposer from "@/components/app/AccessRequestComposer";
import PingButton from "@/components/app/PingButton";
import PriorityBypassButton from "@/components/app/PriorityBypassButton";
import { findContact, ownerProfileFor, canSee, type ViewerAccess } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";
import AuthGateDialog, { isGuestAuthed } from "@/components/guest/AuthGateDialog";
import { type SyncWindow } from "@/components/app/QuickSyncBadge";
import QuickSyncSlotsDialog from "@/components/app/QuickSyncSlotsDialog";
import { type ActionItem } from "@/components/app/ActionPanel";
import PreviewModeBanner from "@/components/app/PreviewModeBanner";
import { trackMetric } from "@/lib/metrics";

interface CanonicalProfileProps {
  guestMode?: boolean;
}

const CanonicalProfile = ({ guestMode = false }: CanonicalProfileProps) => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate("/app/contacts"));
  const baseContact = useMemo(() => findContact(id), [id]);
  const [contact, setContact] = useState(baseContact);
  const [openSent, setOpenSent] = useState(false);
  const [identity, setIdentity] = useState<"client" | "colleague" | "partner">("client");
  const [alerts, setAlerts] = useState<{ callback: boolean; message: boolean; calendar: boolean }>({
    callback: false, message: false, calendar: false,
  });
  const [authOpen, setAuthOpen] = useState(false);
  const [qsOpen, setQsOpen] = useState(false);
  const [pingOpen, setPingOpen] = useState(false);

  // Registered seeker detection: if user lands on /v/:id but is already authed,
  // promote them straight to the interactive in-app profile view.
  useEffect(() => {
    if (guestMode && isGuestAuthed() && id) {
      navigate(`/app/contact/${id}`, { replace: true });
    }
  }, [guestMode, id, navigate]);

  // Track profile view (counts as an interruption avoided —
  // seeker opened profile instead of dialing).
  useEffect(() => {
    if (!id) return;
    trackMetric("profile_viewed", {
      actor: id,
      dedupeKey: `profile:${id}:${guestMode ? "guest" : "app"}`,
    });
    if (baseContact && baseContact.status !== "available") {
      trackMetric("access_blocked", {
        actor: id,
        dedupeKey: `blocked:${id}:${baseContact.status}`,
      });
    }
  }, [id, guestMode, baseContact]);

  // In guest mode, intercept clicks on any interactive element and gate them behind auth.
  const handleGuestCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!guestMode) return;
    if (isGuestAuthed()) return;
    const target = e.target as HTMLElement;
    // Allow the back button + sign-in link in the public header to behave normally
    if (target.closest("[data-guest-allow]")) return;
    const interactive = target.closest("a, button, [role='button']");
    if (!interactive) return;
    e.preventDefault();
    e.stopPropagation();
    setAuthOpen(true);
  };

  if (!contact) {
    return (
      guestMode ? (
        <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Profile not found.</div>
      ) : (
        <AppShell title="Contact not found">
          <Link to="/app/contacts" className="text-accent hover:underline">← Back to contacts</Link>
        </AppShell>
      )
    );
  }

  const isLocked = contact.syncStatus === "locked";
  const isPending = contact.syncStatus === "pending";
  const isApproved = contact.syncStatus === "approved";
  const firstName = contact.name.split(" ")[0];

  // Owner-controlled profile + per-field visibility
  const owner = useMemo(() => ownerProfileFor(contact), [contact]);
  const viewer: ViewerAccess = isApproved ? "approved" : "public";
  const show = (rule: keyof typeof owner.visibility) => canSee(owner.visibility[rule], viewer);

  const visiblePrimaryComms = show("primaryCommsSection")
    ? owner.primaryComms.filter((c) => canSee(c.visibility, viewer))
    : [];
  const visibleSocials = show("socialHandlesSection")
    ? owner.socialHandles.filter((s) => canSee(s.visibility, viewer))
    : [];

  // Status pill data
  const statusData = (() => {
    switch (contact.status) {
      case "available":
        return { label: "Available", subLabel: "Open Window", chipClass: "bg-emerald-100 border-emerald-200 text-emerald-900", dotClass: "bg-emerald-500", pingClass: "bg-emerald-400", subClass: "text-emerald-700", ringClass: "ring-emerald-400" };
      case "focus":
        return { label: "Focus", subLabel: "Focus Mode Active", chipClass: "bg-sky-100 border-sky-200 text-sky-900", dotClass: "bg-sky-500", pingClass: "bg-sky-400", subClass: "text-sky-700", ringClass: "ring-sky-400" };
      case "busy":
        return { label: "Busy", subLabel: "Focus Mode Active", chipClass: "bg-amber-100 border-amber-200 text-amber-900", dotClass: "bg-amber-500", pingClass: "bg-amber-400", subClass: "text-amber-700", ringClass: "ring-amber-400" };
      default:
        return { label: "Offline", subLabel: "Async only", chipClass: "bg-slate-100 border-slate-200 text-slate-700", dotClass: "bg-slate-400", pingClass: "bg-slate-300", subClass: "text-slate-600", ringClass: "ring-slate-300" };
    }
  })();

  // Sync status banner data for portal
  const syncBannerData = isApproved
    ? { dotColor: "bg-emerald-400", textColor: "text-emerald-400", chipBg: "bg-emerald-500/10 border-emerald-500/20", icon: ShieldCheck, label: "Connection Portal Active" }
    : isPending
    ? { dotColor: "bg-amber-400", textColor: "text-amber-400", chipBg: "bg-amber-500/10 border-amber-500/20", icon: Clock, label: "Sync Pending Approval" }
    : { dotColor: "bg-rose-400", textColor: "text-rose-300", chipBg: "bg-rose-500/10 border-rose-500/20", icon: Lock, label: "Sync Locked" };

  // Derive Quick Sync windows (mock): only when status is "available" or "focus".
  const syncWindows: SyncWindow[] = (() => {
    if (contact.status === "available") return [{ start: "10:00", end: "10:30" }, { start: "14:00", end: "14:30" }];
    if (contact.status === "focus") return [{ start: "16:30", end: "17:00" }];
    return [];
  })();

  // Smart-CTA action list — Book Meeting / Quick Sync / Ping / Request Access.
  const goSchedule = () => navigate(`/app/schedule/${contact.id}`);
  const goMessage = () => navigate("/app/messages");
  const onPing = () => setPingOpen(true);
  const hasUnread = (contact.alerts ?? []).includes("message");
  const hasPendingBooking = (contact.alerts ?? []).includes("calendar");
  const sendPingKind = (kind: "call" | "message" | "calendar") => {
    if (kind === "message" && !hasUnread) {
      toast({ title: "No unread thread", description: "Message Ping only nudges existing unread messages." });
      return;
    }
    if (kind === "calendar" && !hasPendingBooking) {
      toast({ title: "No pending booking", description: "Calendar Ping only escalates a pending booking approval." });
      return;
    }
    const titleMap = {
      call: "Call Ping sent",
      message: "Message Ping sent",
      calendar: "Calendar Ping sent",
    } as const;
    const bodyMap = {
      call: `${firstName} will see your live connection request.`,
      message: `${firstName} will be reminded of your unread message.`,
      calendar: `${firstName} will be nudged to review the pending booking.`,
    } as const;
    toast({ title: titleMap[kind], description: bodyMap[kind] });
    setPingOpen(false);
  };

  const actions: ActionItem[] = (() => {
    const a: ActionItem[] = [];
    if (contact.status === "available") {
      a.push({ key: "connect", label: "Connect Now", icon: Phone, onClick: () => navigate(`/app/contact/${contact.id}/call`), variant: "primary" });
    }
    a.push({ key: "book", label: "Book Meeting", icon: CalendarDays, onClick: goSchedule, variant: contact.status === "available" ? "secondary" : "primary" });
    if (syncWindows.length > 0) {
      a.push({ key: "qsync", label: "Quick Sync", icon: Zap, onClick: () => setQsOpen(true), variant: "secondary" });
    }
    a.push({ key: "ping", label: "Ping", icon: BellRing, onClick: onPing, variant: contact.status === "busy" || contact.status === "focus" ? "primary" : "ghost" });
    if (isLocked) {
      a.push({ key: "request", label: "Request Access", icon: ShieldCheck, onClick: () => setOpenSent(true), variant: "warn" });
    }
    if (isApproved) {
      a.push({ key: "msg", label: "Message", icon: MessageSquare, onClick: goMessage, variant: "ghost" });
    }
    a.push({ key: "log", label: "Connection Log", icon: Activity, onClick: () => navigate(`/app/contact/${contact.id}/log`), variant: "ghost" });
    return a;
  })();

  const headerStatusStack = (
    <div className="flex flex-col gap-1.5 sm:items-end">
      <div className="inline-flex items-center gap-2 self-start sm:self-end bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-full shadow-sm">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold tracking-wider uppercase text-amber-900">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> {statusData.label}
        </span>
        <span className="h-3 w-px bg-amber-300/70" />
        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold tracking-wider uppercase text-amber-900">
          <Zap className="w-3 h-3 fill-amber-500 text-amber-600" /> Focus
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {show("availabilityContext") && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-amber-700">{owner.availabilityContext}</span>
          </span>
        )}
        {syncWindows.length > 0 && (
          <button
            type="button"
            onClick={() => setQsOpen(true)}
            title="Open Quick Sync slots"
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ghost-border bg-surface-lowest hover:bg-surface-low transition"
          >
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Quick Sync</span>
            <span className="text-[11px] font-bold text-primary tabular-nums">
              {syncWindows[0].start}—{syncWindows[0].end}
            </span>
          </button>
        )}
      </div>
    </div>
  );

  const toggleAlert = (k: "callback" | "message" | "calendar") => {
    const next = { ...alerts, [k]: !alerts[k] };
    setAlerts(next);
    const labelMap = { callback: "Callback alert", message: "Message alert", calendar: "Calendar alert" } as const;
    toast({
      title: `${labelMap[k]} ${next[k] ? "on" : "off"}`,
      description: next[k] ? `We'll ping you the moment ${firstName} is reachable.` : "You won't be notified about status changes.",
    });
  };

  // === GUEST (demo /v/:id) — restructured white profile details ===
  const guestTopSection = (
    <section id="profile-identity" className="scroll-mt-4 space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
      {/* LEFT — Portrait card with identity inside */}
      <div className="lg:col-span-5 flex">
        <div className={`flex-1 rounded-2xl overflow-hidden bg-surface-lowest shadow-ambient ring-4 ${statusData.ringClass} ring-offset-2 ring-offset-surface-low flex flex-col`}>
          <div className={`relative aspect-[5/4] bg-gradient-to-br ${contact.accent} grid place-items-center`}>
            <span className="text-white font-headline font-extrabold text-4xl lg:text-5xl tracking-tight drop-shadow-2xl select-none">
              {contact.initials}
            </span>
            <div className={`absolute top-2 right-2 h-2.5 w-2.5 ${statusData.dotClass} rounded-full ring-[3px] ring-white shadow-lg`} />
          </div>
          <div className="p-3 sm:p-4 space-y-1">
            <h1 className="text-xl sm:text-2xl font-extrabold font-headline tracking-tighter text-primary leading-[1.05]">
              {firstName}
            </h1>
            {show("org") && (
              <div className="flex items-center gap-1.5 text-foreground/70 font-semibold tracking-wide text-[11px] uppercase">
                <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">{owner.org}</span>
              </div>
            )}
            {show("title") && (
              <p className="text-[11px] font-light italic text-foreground/80 font-headline leading-snug">{owner.title}</p>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT — Focus/Status header card, height-matched to avatar */}
      <div className="lg:col-span-7 flex">
        <div className="flex-1 bg-surface-lowest rounded-2xl p-4 sm:p-5 shadow-ambient flex flex-col">
          {/* Header row */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 flex-1">
            <div className="md:col-span-3 space-y-2">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full shadow-sm border ${statusData.chipClass} w-fit`}>
                <span className={`h-1.5 w-1.5 rounded-full ${statusData.dotClass}`} />
                <span className="text-[10px] font-extrabold tracking-wider uppercase">{statusData.label}</span>
              </div>
              <p className="italic text-xs text-foreground/70">Available for technical sync</p>
              <h2 className="text-xl sm:text-2xl font-extrabold font-headline tracking-tight text-primary uppercase leading-tight">
                Hopen 4 Business.
              </h2>
              {syncWindows.length > 0 && (
                <button
                  type="button"
                  onClick={() => setQsOpen(true)}
                  className="block w-full text-left rounded-2xl bg-emerald-50/60 border border-emerald-100 p-3 hover:bg-emerald-50 transition"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Quick Sync Slots</p>
                  <p className="text-base font-bold text-emerald-700 tabular-nums">
                    {syncWindows.map((w) => `${w.start}–${w.end}`).join("  |  ")}
                  </p>
                </button>
              )}
            </div>
            {/* Spotlight */}
            <div className="md:col-span-2 rounded-2xl bg-surface-low p-3 flex flex-col h-full">
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Spotlight</h4>
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              </div>
              <p className="text-xs font-headline font-light italic leading-snug text-foreground">
                "{contact.bio}"
              </p>
              <div className="mt-2 pt-2 flex items-center justify-between border-t border-primary/5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">v2.4 handshake</span>
                <Zap className="w-3.5 h-3.5 text-primary/40" />
              </div>
            </div>
          </div>

          {/* Primary Comms — fills the vacant bottom of the focus card */}
          <div className="mt-3 pt-3 border-t border-surface-container">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">Primary Comms</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {visiblePrimaryComms.length === 0 && (
                <p className="text-xs text-muted-foreground italic">Owner has hidden all channels</p>
              )}
              {visiblePrimaryComms.map((c) => {
                const Icon = commsIcon(c.kind);
                return (
                  <div key={c.label} className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-surface-low grid place-items-center flex-shrink-0">
                      <Icon className="w-3 h-3 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{c.label}</p>
                      <p className="text-xs font-semibold text-primary truncate">{c.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Two-column details: Social Protocols | Operations Center */}
      <div className="bg-surface-lowest rounded-2xl p-4 sm:p-5 shadow-ambient">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">Social Protocols</h3>
              <div className="space-y-2">
                {visibleSocials.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">Owner has hidden all handles</p>
                )}
                {visibleSocials.map((s) => {
                  const Icon = socialIcon(s.kind);
                  return (
                    <div key={s.label} className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-surface-low grid place-items-center flex-shrink-0">
                        <Icon className="w-3 h-3 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{s.label}</p>
                        <p className="text-xs font-semibold text-primary truncate">{s.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">Operations Center</h3>
              <div className="space-y-2">
                {show("operationDays") && <OpsItem icon={CalendarDays} label="Operation Days" value={owner.operationDays} sub={owner.operationDaysSub} />}
                {show("operationHours") && <OpsItem icon={Briefcase} label="Hours" value={owner.operationHours} />}
                {show("headquarters") && <OpsItem icon={MapPin} label="HQ" value={owner.headquarters} sub={owner.headquartersSub} />}
              </div>
            </div>
          </div>
      </div>
    </section>
  );

  const body = (
    <>
      {!guestMode && (
        <button
          onClick={goBack}
          className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full ghost-border bg-surface-lowest text-xs font-semibold text-primary hover:bg-surface-low transition"
          aria-label="Back to contacts"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to contacts
        </button>
      )}

      {guestMode ? guestTopSection : (
      <>
      {/* TOP SECTION — Profile identity */}
      <section id="profile-identity" className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch scroll-mt-4">
        {/* Portrait */}
        <div className="lg:col-span-3 flex justify-center lg:block">
          <div className={`w-28 sm:w-36 lg:w-auto aspect-square sm:aspect-[3/4] lg:aspect-auto lg:h-full lg:min-h-[180px] rounded-2xl overflow-hidden shadow-ambient bg-gradient-to-br ${contact.accent} ring-4 ${statusData.ringClass} ring-offset-2 ring-offset-surface-low relative grid place-items-center transition-[--tw-ring-color] duration-500`}>
            <span className="text-white font-headline font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight drop-shadow-2xl select-none">
              {contact.initials}
            </span>
            <div className={`absolute top-2.5 right-2.5 h-3 w-3 sm:h-3.5 sm:w-3.5 ${statusData.dotClass} rounded-full ring-[3px] ring-white shadow-lg z-10 animate-pulse`} />
          </div>
        </div>

        {/* Hero info card */}
        <div className="lg:col-span-9">
          <div className="bg-surface-lowest rounded-2xl p-3 sm:p-5 shadow-ambient relative overflow-hidden h-full">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-3">
              <div className="space-y-1 min-w-0 flex-1 text-center md:text-left">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold font-headline tracking-tighter text-primary leading-[1.05]">
                  {firstName}
                </h1>
                {show("org") && (
                  <div className="flex items-center justify-center md:justify-start gap-1.5 text-foreground/70 font-semibold tracking-wide text-xs">
                    <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{owner.org}</span>
                  </div>
                )}
                {show("title") && (
                  <p className="text-xs sm:text-sm md:text-base font-light text-foreground/80 font-headline leading-snug">{owner.title}</p>
                )}
              </div>
              {/* Right-aligned 3-row status stack: status · context · quick sync */}
              <div className="flex flex-col items-center md:items-end gap-1.5 shrink-0">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm border ${statusData.chipClass}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusData.dotClass}`} />
                  <span className="text-[10px] font-extrabold tracking-wider uppercase">{statusData.label}</span>
                </div>
                {show("availabilityContext") && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground max-w-[240px] md:text-right">
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="text-amber-700 truncate">Available till 3:00 PM</span>
                  </span>
                )}
                {syncWindows.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setQsOpen(true)}
                    title="Open Quick Sync slots"
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ghost-border bg-surface-lowest hover:bg-surface-low transition"
                  >
                    <Zap className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Quick Sync</span>
                    <span className="text-[11px] font-bold text-primary tabular-nums">
                      {syncWindows[0].start}—{syncWindows[0].end}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Operations Center */}
            {(show("operationDays") || show("operationHours") || show("headquarters")) && (
              <div className="mt-3 pt-3 border-t border-surface-container">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2 flex items-center gap-2">
                  <span className="h-px w-8 bg-border" /> Operations Center
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {show("operationDays") && <OpsItem icon={CalendarDays} label="Operation Days" value={owner.operationDays} sub={owner.operationDaysSub} />}
                  {show("operationHours") && <OpsItem icon={Briefcase} label="Operation Hours" value={owner.operationHours} />}
                  {show("headquarters") && <OpsItem icon={MapPin} label="Headquarters" value={owner.headquarters} sub={owner.headquartersSub} />}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* THREE-COLUMN ROW: Spotlight | Primary Comms | Social Protocols */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
        {/* Spotlight */}
        <div className="bg-surface-lowest rounded-2xl p-4 ghost-border shadow-ambient flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Spotlight
            </h4>
            <Zap className="w-3.5 h-3.5 text-primary/30" />
          </div>
          <p className="text-xs font-headline font-light italic leading-snug text-foreground flex-1">
            "{contact.bio}"
          </p>
          <div className="mt-2 pt-2 border-t border-primary/5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Security Layer</span>
              <span className="text-[10px] font-mono text-primary/60">v2.4 handshake</span>
            </div>
            <Zap className="w-4 h-4 text-primary/40" />
          </div>
        </div>

        {/* Primary Comms */}
        <CommsCard
          title="Primary Comms"
          badge="Secure"
          locked={true}
          footer={undefined}
          emptyLabel={visiblePrimaryComms.length === 0 ? "Owner has hidden all channels" : undefined}
          items={visiblePrimaryComms.map((c) => ({
            icon: commsIcon(c.kind),
            label: c.label,
            value: c.value,
            href: hrefFor(c.kind, c.value),
          }))}
        />

        {/* Social Protocols */}
        <CommsCard
          title="Social Protocols"
          badge="Personalized"
          locked={isLocked}
          footer="Visibility is determined per-seeker"
          emptyLabel={visibleSocials.length === 0 ? "Owner has hidden all handles" : undefined}
          items={visibleSocials.map((s) => ({
            icon: socialIcon(s.kind),
            label: s.label,
            value: s.value,
            href: s.href,
          }))}
        />
      </section>
      </>
      )}

      <div className="h-2" aria-hidden />

      {/* BOTTOM: Connection Portal — Secure Interaction Layer (blue contact/sync) */}
      <section
        id="contact-actions"
        className="rounded-2xl overflow-hidden relative bg-primary text-primary-foreground shadow-elevated scroll-mt-4"
      >
        <div className="absolute inset-0 opacity-40 pointer-events-none bg-[radial-gradient(circle_at_top_right,hsl(var(--primary-glow)/0.4),transparent_60%)]" />
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 p-3 md:p-4">
          {/* Header row: title left, identity card right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start mb-2">
            <div className="lg:col-span-8 space-y-1.5">
              <div className={`inline-flex items-center gap-2 ${syncBannerData.chipBg} px-3 py-1 rounded-full border backdrop-blur-md`}>
                <syncBannerData.icon className={`w-3 h-3 ${syncBannerData.textColor}`} />
                <span className={`${syncBannerData.textColor} text-[10px] uppercase font-bold tracking-[0.2em]`}>{syncBannerData.label}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-headline font-extrabold tracking-tight leading-tight">
                Secure Interaction Layer
              </h2>
              <p className="text-primary-foreground/70 text-xs leading-relaxed font-light max-w-xl">
                {isApproved && "Strategic alignment established. Select your context to initiate optimized communication protocols for this session."}
                {isPending && `${firstName} is reviewing your request — typically responds within ${contact.responseTime}. Channels unlock on approval.`}
                {isLocked && `Send an access request to unlock secure communication channels with ${firstName}.`}
              </p>
            </div>

            {/* Identity Verified card */}
            <div className="lg:col-span-4">
              <div className="bg-white/5 rounded-2xl border border-white/10 backdrop-blur-3xl p-3 flex flex-col items-center text-center relative overflow-hidden">
              <div className={`w-10 h-10 rounded-full grid place-items-center mb-2 ${
                  isApproved ? "bg-emerald-500/20" : isPending ? "bg-amber-500/20" : "bg-rose-500/20"
                }`}>
                  {isApproved && <BadgeCheck className="w-5 h-5 text-emerald-400" strokeWidth={1.75} />}
                  {isPending && <Clock className="w-5 h-5 text-amber-400" strokeWidth={1.75} />}
                  {isLocked && <Lock className="w-5 h-5 text-rose-300" strokeWidth={1.75} />}
                </div>
                <h4 className="font-headline font-extrabold text-sm">
                  {isApproved && "Identity Verified"}
                  {isPending && "Awaiting Approval"}
                  {isLocked && "Access Required"}
                </h4>
                <p className="text-primary-foreground/60 text-[10px] mb-2">
                  {isApproved && `Level: ${identity.charAt(0).toUpperCase() + identity.slice(1)} Alpha Prime`}
                  {isPending && `Reviews within ${contact.responseTime}`}
                  {isLocked && "Channels are sealed"}
                </p>
                {isApproved && (
                  <button
                    onClick={() => toast({ title: "Access approved", description: `You have full access to ${firstName}'s channels.` })}
                    className="w-full bg-emerald-500 text-white py-2 rounded-xl font-headline font-bold text-[10px] shadow-lg shadow-emerald-900/40 hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
                  >
                    ACCESS APPROVED <Check className="w-3 h-3" />
                  </button>
                )}
                {isLocked && (
                  <button
                    onClick={() => setOpenSent(true)}
                    className="w-full bg-white text-primary py-2 rounded-xl font-headline font-bold text-[10px] shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                  >
                    REQUEST ACCESS <ShieldCheck className="w-3 h-3" />
                  </button>
                )}
                {isPending && (
                  <div className="w-full bg-amber-500/10 border border-amber-500/20 text-amber-300 py-2 rounded-xl font-headline font-semibold text-[10px] flex items-center justify-center gap-2">
                    <Clock className="w-3 h-3" /> Request pending
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bypass full-width row */}
          <div className="rounded-2xl bg-white/5 border border-emerald-400/20 backdrop-blur-md px-3 py-2 flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="grid place-items-center w-8 h-8 rounded-lg bg-emerald-400/10 text-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">Bypass Call &amp; Message</p>
                <p className="text-[10px] text-primary-foreground/60">Direct priority override for mission-critical sync</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/app/contact/${contact.id}/call`)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-bold uppercase tracking-[0.2em] text-white/80"
            >
              Activate Vault <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Four interaction tiles */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Call */}
                <PortalTile
                  icon={Phone}
                  badge={isApproved ? { label: "POWER CALL", color: "bg-rose-500" } : null}
                  title="Call Sync"
                  desc="Direct high-priority audio line"
                  cta={isApproved ? "Request Sync" : isPending ? "Pending" : "Locked"}
                  ctaIcon={Phone}
                  ctaClass={isApproved ? "bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-900/40" : "bg-white/10 text-white/60 cursor-not-allowed"}
                  to={isApproved ? `/app/contact/${contact.id}/call` : null}
                  variant={isApproved ? "emerald" : "default"}
                />
                {/* Message */}
                <PortalTile
                  icon={MessageSquare}
                  badge={isApproved ? { label: "LIVE", color: "bg-emerald-500" } : null}
                  title="Instant Message"
                  desc="End-to-end encrypted direct messaging"
                  preview={isApproved ? "Awaiting uplink..." : isPending ? "Channel unlocks on approval" : "Send access request first"}
                  cta={isApproved ? "Open Channel" : isPending ? "Pending" : "Locked"}
                  ctaIcon={Send}
                  ctaClass={isApproved ? "bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-900/40" : "bg-white/10 text-white/60 cursor-not-allowed"}
                  to={isApproved ? "/app/messages" : null}
                  variant={isApproved ? "emerald" : "default"}
                />
                {/* Schedule */}
                <PortalTile
                  icon={CalendarDays}
                  title="Schedule"
                  desc="Review availability and book sessions"
                  dots
                  cta={isApproved ? "View Calendar" : isPending ? "Pending" : "Locked"}
                  ctaIcon={CalendarDays}
                  ctaClass={isApproved ? "bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-900/40" : "bg-white/10 text-white/60 cursor-not-allowed"}
                  to={isApproved ? `/app/schedule/${contact.id}` : null}
                  variant={isApproved ? "emerald" : "default"}
                  topRight={
                    null
                  }
                />
                {/* Ping */}
                <PortalTile
                  icon={Radio}
                  badge={isApproved ? { label: "ACTIVE", color: "bg-emerald-500" } : null}
                  title="Ping"
                  desc="Send a quick awareness signal"
                  cta={isApproved ? "Send Ping" : isPending ? "Pending" : "Locked"}
                  ctaIcon={Bell}
                  ctaClass={isApproved ? "bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-900/40" : "bg-white/10 text-white/60 cursor-not-allowed"}
                  to={null}
                  onClick={isApproved ? onPing : undefined}
                  variant={isApproved ? "emerald" : "default"}
                />
          </div>

          {/* Identity selector */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Select Identity:</span>
            <div className="flex flex-wrap gap-1.5">
              {(["client", "colleague", "partner"] as const).map((r) => {
                const active = identity === r;
                return (
                  <button
                    key={r}
                    onClick={() => setIdentity(r)}
                    className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all ${
                      active
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                        : "border-white/10 bg-white/5 text-white/40 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <AccessRequestComposer
        open={openSent}
        onOpenChange={setOpenSent}
        contact={contact}
        onSubmitted={() => setContact({ ...contact, syncStatus: "pending" })}
      />

      <QuickSyncSlotsDialog
        open={qsOpen}
        onOpenChange={setQsOpen}
        contactName={contact.name}
        windows={syncWindows}
      />

      {pingOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 animate-in fade-in"
          onClick={() => setPingOpen(false)}
        >
          <div
            role="dialog"
            aria-label="Choose ping type"
            className="w-full max-w-sm rounded-2xl bg-surface-lowest ghost-border shadow-elevated p-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">Quick Ping</p>
              <button onClick={() => setPingOpen(false)} className="text-muted-foreground hover:text-primary text-xs">Close</button>
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug mb-3">
              Silent signal — request connection without interrupting {firstName}.
            </p>

            <button
              onClick={() => sendPingKind("call")}
              className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-left transition hover:bg-surface-low"
            >
              <span className="grid place-items-center w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-700">
                <PhoneCall className="w-4 h-4" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-primary">Call Ping</span>
                <span className="block text-[11px] text-muted-foreground">Request connection without interrupting</span>
              </span>
            </button>

            <button
              disabled={!hasUnread}
              onClick={() => sendPingKind("message")}
              className={`mt-1 w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-left transition ${
                hasUnread ? "hover:bg-surface-low" : "opacity-50 cursor-not-allowed"
              }`}
            >
              <span className="grid place-items-center w-9 h-9 rounded-full bg-sky-500/15 text-sky-700">
                {hasUnread ? <MessageSquare className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-primary">Message Ping</span>
                <span className="block text-[11px] text-muted-foreground">
                  {hasUnread ? "Nudge an unread message" : "No unread thread to nudge"}
                </span>
              </span>
            </button>

            <button
              disabled={!hasPendingBooking}
              onClick={() => sendPingKind("calendar")}
              className={`mt-1 w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-left transition ${
                hasPendingBooking ? "hover:bg-surface-low" : "opacity-50 cursor-not-allowed"
              }`}
            >
              <span className="grid place-items-center w-9 h-9 rounded-full bg-violet-500/15 text-violet-700">
                {hasPendingBooking ? <CalendarDays className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-primary">Calendar Ping</span>
                <span className="block text-[11px] text-muted-foreground">
                  {hasPendingBooking ? "Remind about pending booking" : "No booking awaiting approval"}
                </span>
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Spacer to keep the sticky mobile CTA from covering content */}
      <div className="md:hidden h-20" aria-hidden />
    </>
  );

  if (guestMode) {
    return (
      <div className="min-h-screen bg-surface-low">
        <header className="sticky top-0 z-30 bg-surface-lowest/80 backdrop-blur border-b border-border/60">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <button
              data-guest-allow
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <PreviewModeBanner />
            <Link data-guest-allow to="/login" className="text-xs font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </header>
        <div onClickCapture={handleGuestCapture} className="max-w-6xl mx-auto px-4 py-4 space-y-4">
          {body}
        </div>
        <AuthGateDialog
          open={authOpen}
          onOpenChange={setAuthOpen}
          actionLabel="Continue on Availock"
          onAuthenticated={() => navigate("/app")}
        />
      </div>
    );
  }

  return (
    <AppShell subtitle="Contact profile" title={contact.name}>
      {body}
    </AppShell>
  );
};

/* --- Subcomponents --- */

const commsIcon = (kind: string) => {
  switch (kind) {
    case "email": return Mail;
    case "mobile": return Smartphone;
    case "whatsapp": return MessageCircle;
    case "sms": return MessageSquare;
    default: return Phone;
  }
};

const socialIcon = (kind: string) => {
  switch (kind) {
    case "linkedin": return Linkedin;
    case "github": return Github;
    case "instagram": return Camera;
    case "website": return Globe;
    case "x": return Twitter;
    default: return Share2;
  }
};

const hrefFor = (kind: string, value: string) => {
  if (kind === "email") return `mailto:${value}`;
  if (kind === "phone" || kind === "mobile" || kind === "sms") return `tel:${value.replace(/\s+/g, "")}`;
  if (kind === "whatsapp") return `https://wa.me/${value.replace(/[^\d]/g, "")}`;
  return value.startsWith("http") ? value : "#";
};

const OpsItem = ({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) => (
  <div className="flex gap-2">
    <div className="w-8 h-8 rounded-full bg-surface-low grid place-items-center flex-shrink-0">
      <Icon className="w-3.5 h-3.5 text-primary" />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-xs font-semibold text-primary truncate">{value}</p>
      {sub && <p className="text-[10px] font-medium text-muted-foreground truncate">{sub}</p>}
    </div>
  </div>
);

const CommsCard = ({
  title, badge, items, locked, footer, emptyLabel,
}: {
  title: string;
  badge: string;
  items: { icon: any; label: string; value: string; href: string }[];
  locked: boolean;
  footer?: string;
  emptyLabel?: string;
}) => (
  <div className="bg-surface-lowest rounded-2xl p-4 ghost-border shadow-ambient flex flex-col relative">
    <div className="flex justify-between items-start mb-2">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent flex items-center gap-2">
        <span className="h-px w-6 bg-surface-container" /> {title}
      </h3>
      <span className="text-[9px] font-bold uppercase tracking-wider text-primary/60 bg-primary/5 px-2 py-0.5 rounded">
        {badge}
      </span>
    </div>
    <div className="relative">
      <div className={`space-y-2 ${locked ? "select-none pointer-events-none" : ""}`}>
        {items.length === 0 && !locked && emptyLabel && (
          <p className="text-xs text-muted-foreground italic py-1">{emptyLabel}</p>
        )}
        {items.map((it) => (
        <a key={it.label} href={locked ? "#" : it.href} className="flex items-center justify-between group">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-surface-low grid place-items-center group-hover:bg-primary/5 transition-colors flex-shrink-0">
              <it.icon className="w-3 h-3 text-primary" />
            </div>
            <div className={`min-w-0 ${locked ? "blur-sm" : ""}`}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{it.label}</p>
              <p className="text-xs font-semibold text-primary truncate">{it.value}</p>
            </div>
          </div>
          {!locked && <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />}
        </a>
        ))}
      </div>
      {locked && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Lock className="w-3 h-3" /> Unlocks on approval
          </div>
        </div>
      )}
    </div>
    {footer && !locked && (
      <p className="mt-auto pt-2 text-[10px] text-muted-foreground italic text-center border-t border-surface-container">
        {footer}
      </p>
    )}
  </div>
);

const PortalTile = ({
  icon: Icon, badge, title, desc, preview, dots, cta, ctaIcon: CtaIcon, ctaClass, to, onClick, variant, topRight,
}: {
  icon: any;
  badge?: { label: string; color: string } | null;
  title: string;
  desc: string;
  preview?: string;
  dots?: boolean;
  cta: string;
  ctaIcon: any;
  ctaClass: string;
  to: string | null;
  onClick?: () => void;
  variant: "default" | "emerald";
  topRight?: ReactNode;
}) => {
  const wrapperBase =
    variant === "emerald"
      ? "bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/30"
      : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20";
  const iconBox =
    variant === "emerald"
      ? "bg-emerald-500/20 text-emerald-400"
      : "bg-white/10 text-white/60 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors";

  const ctaContent = (
    <>
      <CtaIcon className="w-3 h-3" /> {cta}
    </>
  );
  const ctaClassName = `w-full mt-2 py-2 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-2 ${ctaClass}`;

  return (
    <div className={`group relative overflow-hidden rounded-2xl backdrop-blur-xl p-3 transition-all flex flex-col justify-between min-h-[120px] shadow-xl ${wrapperBase}`}>
      <div className="space-y-1.5 relative z-10">
        <div className="flex items-center justify-between">
          <div className={`h-8 w-8 rounded-xl grid place-items-center ${iconBox}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          {topRight ? topRight : badge && (
            <span className={`${badge.color} text-white px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${badge.label === "POWER CALL" ? "animate-pulse" : ""}`}>
              {badge.label}
            </span>
          )}
        </div>
        {preview && (
          <div className="bg-black/20 px-2 py-1 rounded-lg border border-white/5">
            <p className="text-emerald-400/60 text-[9px] italic font-mono uppercase tracking-wider">{preview}</p>
          </div>
        )}
        {dots && (
          <div className="flex gap-1 opacity-40">
            <div className="h-1 w-4 bg-white rounded-full" />
            <div className="h-1 w-4 bg-white rounded-full" />
            <div className="h-1 w-4 bg-white/20 rounded-full" />
          </div>
        )}
        <div>
          <h5 className="font-bold text-xs font-headline">{title}</h5>
          <p className="text-primary-foreground/60 text-[10px] mt-0.5 leading-relaxed">{desc}</p>
        </div>
      </div>
      {to ? (
        <Link to={to} className={`${ctaClassName} relative z-10`}>
          {ctaContent}
        </Link>
      ) : onClick ? (
        <button onClick={onClick} className={`${ctaClassName} relative z-10`}>
          {ctaContent}
        </button>
      ) : (
        <button disabled className={`${ctaClassName} relative z-10`}>
          {ctaContent}
        </button>
      )}
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full blur-3xl" />
    </div>
  );
};

export default CanonicalProfile;
