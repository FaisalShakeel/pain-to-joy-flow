import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Phone, MessageSquare, CalendarDays, Mail, Smartphone,
  MapPin, Briefcase, Clock, Building2, Share2, Camera, Send, Download,
  ShieldCheck, Lock, Zap, BadgeCheck, BellRing, BellOff, PhoneCall,
  Linkedin, Github, Globe, MessageCircle, Megaphone, Link2, Radio, Bell,
  ArrowDown, ArrowUp,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import Avatar from "@/components/app/Avatar";
import AccessRequestComposer from "@/components/app/AccessRequestComposer";
import PingButton from "@/components/app/PingButton";
import PriorityBypassButton from "@/components/app/PriorityBypassButton";
import { findContact, ownerProfileFor, canSee, type ViewerAccess } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";
import AuthGateDialog, { isGuestAuthed } from "@/components/guest/AuthGateDialog";
import QuickSyncBadge, { type SyncWindow } from "@/components/app/QuickSyncBadge";
import ActionPanel, { type ActionItem } from "@/components/app/ActionPanel";
import PreviewModeBanner from "@/components/app/PreviewModeBanner";
import { trackMetric } from "@/lib/metrics";

interface ContactProfileProps {
  guestMode?: boolean;
}

const ContactProfile = ({ guestMode = false }: ContactProfileProps) => {
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
        return { label: "Focus", subLabel: "Focus Mode Active", chipClass: "bg-amber-100 border-amber-200 text-amber-900", dotClass: "bg-amber-500", pingClass: "bg-amber-400", subClass: "text-amber-700", ringClass: "ring-amber-400" };
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
  const onPing = () => toast({ title: "Ping sent", description: `${firstName} will see your nudge.` });

  const actions: ActionItem[] = (() => {
    const a: ActionItem[] = [];
    if (contact.status === "available") {
      a.push({ key: "connect", label: "Connect Now", icon: Phone, onClick: () => navigate(`/app/contact/${contact.id}/call`), variant: "primary" });
    }
    a.push({ key: "book", label: "Book Meeting", icon: CalendarDays, onClick: goSchedule, variant: contact.status === "available" ? "secondary" : "primary" });
    if (syncWindows.length > 0) {
      a.push({ key: "qsync", label: "Quick Sync", icon: Zap, onClick: goSchedule, variant: "secondary" });
    }
    a.push({ key: "ping", label: "Ping", icon: BellRing, onClick: onPing, variant: contact.status === "busy" || contact.status === "focus" ? "primary" : "ghost" });
    if (isLocked) {
      a.push({ key: "request", label: "Request Access", icon: ShieldCheck, onClick: () => setOpenSent(true), variant: "warn" });
    }
    if (isApproved) {
      a.push({ key: "msg", label: "Message", icon: MessageSquare, onClick: goMessage, variant: "ghost" });
    }
    return a;
  })();

  const toggleAlert = (k: "callback" | "message" | "calendar") => {
    const next = { ...alerts, [k]: !alerts[k] };
    setAlerts(next);
    const labelMap = { callback: "Callback alert", message: "Message alert", calendar: "Calendar alert" } as const;
    toast({
      title: `${labelMap[k]} ${next[k] ? "on" : "off"}`,
      description: next[k] ? `We'll ping you the moment ${firstName} is reachable.` : "You won't be notified about status changes.",
    });
  };

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

      {/* TOP SECTION — Profile identity */}
      <section id="profile-identity" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch scroll-mt-4">
        {/* Portrait */}
        <div className="lg:col-span-3">
          <div className={`aspect-[4/5] lg:aspect-auto lg:h-full lg:min-h-[280px] rounded-2xl overflow-hidden shadow-ambient bg-gradient-to-br ${contact.accent} ring-4 ${statusData.ringClass} relative grid place-items-center`}>
            <span className="text-white font-headline font-extrabold text-7xl tracking-tight drop-shadow-2xl select-none">
              {contact.initials}
            </span>
            <div className={`absolute top-3 right-3 h-3.5 w-3.5 ${statusData.dotClass} rounded-full ring-[3px] ring-white shadow-lg z-10 animate-pulse`} />
          </div>
        </div>

        {/* Hero info card */}
        <div className="lg:col-span-9">
          <div className="bg-surface-lowest rounded-2xl p-6 md:p-7 shadow-ambient relative overflow-hidden h-full">
            {/* Status pills + meta — top right */}
            <div className="absolute top-5 right-5 flex flex-col gap-2 items-end">
              <div className="flex items-center gap-1.5 bg-amber-100/80 border border-amber-200 px-3 py-1.5 rounded-full shadow-sm">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase text-amber-900">
                  <span className={`h-1.5 w-1.5 rounded-full ${statusData.dotClass}`} /> {statusData.label}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase text-amber-900 ml-1">
                  <Zap className="w-3 h-3" /> Focus
                </span>
              </div>
              {show("availabilityContext") && (
                <div className="flex items-center gap-2 text-right">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Availability</span>
                    <span className="text-[11px] font-bold text-amber-700">{owner.availabilityContext}</span>
                  </div>
                </div>
              )}
              {syncWindows.length > 0 && (
                <div className="flex items-center gap-2 text-right">
                  <Clock className="w-3.5 h-3.5 text-primary/60" />
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Quick Sync</span>
                    <span className="text-[11px] font-bold text-primary">
                      {syncWindows[0].start} — {syncWindows[0].end} AM
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-5 pr-40">
              <div className="space-y-2">
                <h1 className="text-5xl md:text-6xl font-extrabold font-headline tracking-tighter text-primary leading-[1.05]">
                  {firstName}
                </h1>
                {show("org") && (
                  <div className="flex items-center gap-1.5 text-foreground/70 font-semibold tracking-wide text-sm">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span>{owner.org}</span>
                  </div>
                )}
                {show("title") && (
                  <p className="text-lg md:text-xl font-light text-foreground/80 font-headline leading-snug">{owner.title}</p>
                )}
              </div>
            </div>

            {/* Operations Center */}
            {(show("operationDays") || show("operationHours") || show("headquarters")) && (
              <div className="mt-6 pt-5 border-t border-surface-container">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4 flex items-center gap-2">
                  <span className="h-px w-8 bg-border" /> Operations Center
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
        {/* Spotlight */}
        <div className="bg-surface-lowest rounded-2xl p-5 ghost-border shadow-ambient flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Spotlight
            </h4>
            <Zap className="w-3.5 h-3.5 text-primary/30" />
          </div>
          <p className="text-sm font-headline font-light italic leading-snug text-foreground flex-1">
            "{contact.bio}"
          </p>
          <div className="mt-4 pt-3 border-t border-primary/5 flex items-center justify-between">
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
          locked={isLocked}
          footer={isApproved ? "Displayed if approved" : undefined}
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

      {/* Soft gradient divider + scroll affordance */}
      <div className="relative h-12 md:h-14 mt-5 flex items-center justify-center">
        <div className="inline-flex flex-col rounded-full bg-surface-lowest shadow-ambient ghost-border overflow-hidden">
          <button
            type="button"
            onClick={() =>
              document.getElementById("contact-actions")?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            className="grid place-items-center w-10 h-10 hover:bg-surface-low transition"
            aria-label="Jump to contact actions"
          >
            <ArrowDown className="w-3.5 h-3.5 text-primary" />
          </button>
          <button
            type="button"
            onClick={() =>
              document.getElementById("profile-identity")?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            className="grid place-items-center w-10 h-10 border-t border-surface-container hover:bg-surface-low transition"
            aria-label="Back to profile identity"
          >
            <ArrowUp className="w-3.5 h-3.5 text-primary" />
          </button>
        </div>
      </div>

      {/* BOTTOM: Connection Portal — Secure Interaction Layer (blue contact/sync) */}
      <section
        id="contact-actions"
        className="rounded-2xl overflow-hidden relative bg-primary text-primary-foreground shadow-elevated scroll-mt-4"
      >
        <div className="absolute inset-0 opacity-40 pointer-events-none bg-[radial-gradient(circle_at_top_right,hsl(var(--primary-glow)/0.4),transparent_60%)]" />
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 p-5 md:p-6">
          {/* Header row: title left, identity card right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mb-5">
            <div className="lg:col-span-8 space-y-3">
              <div className={`inline-flex items-center gap-2 ${syncBannerData.chipBg} px-3 py-1.5 rounded-full border backdrop-blur-md`}>
                <syncBannerData.icon className={`w-3 h-3 ${syncBannerData.textColor}`} />
                <span className={`${syncBannerData.textColor} text-[10px] uppercase font-bold tracking-[0.2em]`}>{syncBannerData.label}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-headline font-extrabold tracking-tight leading-tight">
                Secure Interaction Layer
              </h2>
              <p className="text-primary-foreground/70 text-sm leading-relaxed font-light max-w-xl">
                {isApproved && "Strategic alignment established. Select your context to initiate optimized communication protocols for this session."}
                {isPending && `${firstName} is reviewing your request — typically responds within ${contact.responseTime}. Channels unlock on approval.`}
                {isLocked && `Send an access request to unlock secure communication channels with ${firstName}.`}
              </p>
            </div>

            {/* Identity Verified card */}
            <div className="lg:col-span-4">
              <div className="bg-white/5 rounded-2xl border border-white/10 backdrop-blur-3xl p-5 flex flex-col items-center text-center relative overflow-hidden">
                <div className={`w-12 h-12 rounded-full grid place-items-center mb-3 ${
                  isApproved ? "bg-emerald-500/20" : isPending ? "bg-amber-500/20" : "bg-rose-500/20"
                }`}>
                  {isApproved && <BadgeCheck className="w-7 h-7 text-emerald-400" strokeWidth={1.75} />}
                  {isPending && <Clock className="w-6 h-6 text-amber-400" strokeWidth={1.75} />}
                  {isLocked && <Lock className="w-6 h-6 text-rose-300" strokeWidth={1.75} />}
                </div>
                <h4 className="font-headline font-extrabold text-base">
                  {isApproved && "Identity Verified"}
                  {isPending && "Awaiting Approval"}
                  {isLocked && "Access Required"}
                </h4>
                <p className="text-primary-foreground/60 text-[11px] mb-3">
                  {isApproved && `Level: ${identity.charAt(0).toUpperCase() + identity.slice(1)} Alpha Prime`}
                  {isPending && `Reviews within ${contact.responseTime}`}
                  {isLocked && "Channels are sealed"}
                </p>
                {isApproved && (
                  <button
                    onClick={() => toast({ title: "Access approved", description: `You have full access to ${firstName}'s channels.` })}
                    className="w-full bg-emerald-500 text-white py-2.5 rounded-xl font-headline font-bold text-xs shadow-lg shadow-emerald-900/40 hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
                  >
                    ACCESS APPROVED <Download className="w-3.5 h-3.5" />
                  </button>
                )}
                {isLocked && (
                  <button
                    onClick={() => setOpenSent(true)}
                    className="w-full bg-white text-primary py-2.5 rounded-xl font-headline font-bold text-xs shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                  >
                    REQUEST ACCESS <ShieldCheck className="w-3.5 h-3.5" />
                  </button>
                )}
                {isPending && (
                  <div className="w-full bg-amber-500/10 border border-amber-500/20 text-amber-300 py-2.5 rounded-xl font-headline font-semibold text-xs flex items-center justify-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> Request pending
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bypass full-width row */}
          <div className="rounded-2xl bg-white/5 border border-emerald-400/20 backdrop-blur-md px-4 py-3 flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <span className="grid place-items-center w-9 h-9 rounded-lg bg-emerald-400/10 text-emerald-300">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300">Bypass Call &amp; Message</p>
                <p className="text-[11px] text-primary-foreground/60">Direct priority override for mission-critical sync</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/app/contact/${contact.id}/call`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-bold uppercase tracking-[0.2em] text-white/80"
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
                  ctaClass={isApproved ? "bg-white text-primary hover:bg-white/90" : "bg-white/10 text-white/60 cursor-not-allowed"}
                  to={isApproved ? `/app/contact/${contact.id}/call` : null}
                  variant="default"
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
                  variant="emerald"
                />
                {/* Schedule */}
                <PortalTile
                  icon={CalendarDays}
                  badge={isApproved ? { label: "QS", color: "bg-amber-500" } : null}
                  title="Schedule"
                  desc="Review availability and book sessions"
                  dots
                  cta={isApproved ? "View Calendar" : isPending ? "Pending" : "Locked"}
                  ctaIcon={CalendarDays}
                  ctaClass={isApproved ? "bg-white/10 border border-white/20 hover:bg-white/20 text-white" : "bg-white/10 text-white/60 cursor-not-allowed"}
                  to={isApproved ? `/app/schedule/${contact.id}` : null}
                  variant="default"
                />
                {/* Ping */}
                <PortalTile
                  icon={Radio}
                  badge={{ label: "ACTIVE", color: "bg-amber-500" }}
                  title="Ping"
                  desc="Send a quick awareness signal"
                  cta="Send Ping"
                  ctaIcon={Bell}
                  ctaClass="bg-white/10 border border-white/20 hover:bg-white/20 text-white"
                  to={null}
                  onClick={onPing}
                  variant="default"
                />
          </div>

          {/* Identity selector */}
          <div className="flex flex-wrap items-center gap-3 pt-5">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Select Identity:</span>
            <div className="flex flex-wrap gap-1.5">
              {(["client", "colleague", "partner"] as const).map((r) => {
                const active = identity === r;
                return (
                  <button
                    key={r}
                    onClick={() => setIdentity(r)}
                    className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all ${
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
    case "x": return Share2;
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
  <div className="flex gap-2.5">
    <div className="w-9 h-9 rounded-full bg-surface-low grid place-items-center flex-shrink-0">
      <Icon className="w-4 h-4 text-primary" />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-primary truncate">{value}</p>
      {sub && <p className="text-[11px] font-medium text-muted-foreground truncate">{sub}</p>}
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
  <div className="bg-surface-lowest rounded-2xl p-5 ghost-border shadow-ambient flex flex-col relative">
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent flex items-center gap-2">
        <span className="h-px w-6 bg-surface-container" /> {title}
      </h3>
      <span className="text-[9px] font-bold uppercase tracking-wider text-primary/60 bg-primary/5 px-2 py-0.5 rounded">
        {badge}
      </span>
    </div>
    <div className={`space-y-3 ${locked ? "blur-sm select-none pointer-events-none" : ""}`}>
      {items.length === 0 && !locked && emptyLabel && (
        <p className="text-xs text-muted-foreground italic py-2">{emptyLabel}</p>
      )}
      {items.map((it) => (
        <a key={it.label} href={locked ? "#" : it.href} className="flex items-center justify-between group">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-surface-low grid place-items-center group-hover:bg-primary/5 transition-colors flex-shrink-0">
              <it.icon className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{it.label}</p>
              <p className="text-xs font-semibold text-primary truncate">{it.value}</p>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
        </a>
      ))}
    </div>
    {locked && (
      <div className="absolute inset-0 grid place-items-center bg-surface-lowest/40 backdrop-blur-[2px] rounded-2xl">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <Lock className="w-3 h-3" /> Unlocks on approval
        </div>
      </div>
    )}
    {footer && !locked && (
      <p className="mt-auto pt-3 text-[10px] text-muted-foreground italic text-center border-t border-surface-container">
        {footer}
      </p>
    )}
  </div>
);

const PortalTile = ({
  icon: Icon, badge, title, desc, preview, dots, cta, ctaIcon: CtaIcon, ctaClass, to, onClick, variant,
}: {
  icon: any;
  badge: { label: string; color: string } | null;
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
}) => {
  const wrapperBase =
    variant === "emerald"
      ? "bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/30"
      : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20";
  const iconBox = variant === "emerald" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white";

  const ctaContent = (
    <>
      <CtaIcon className="w-3.5 h-3.5" /> {cta}
    </>
  );
  const ctaClassName = `w-full mt-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${ctaClass}`;

  return (
    <div className={`relative overflow-hidden rounded-2xl backdrop-blur-xl p-4 transition-all flex flex-col justify-between min-h-[170px] shadow-xl ${wrapperBase}`}>
      <div className="space-y-2.5 relative z-10">
        <div className="flex items-center justify-between">
          <div className={`h-9 w-9 rounded-xl grid place-items-center ${iconBox}`}>
            <Icon className="w-4 h-4" />
          </div>
          {badge && (
            <span className={`${badge.color} text-white px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${badge.label === "POWER CALL" ? "animate-pulse" : ""}`}>
              {badge.label}
            </span>
          )}
        </div>
        {preview && (
          <div className="bg-black/20 px-2.5 py-1.5 rounded-lg border border-white/5">
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
          <h5 className="font-bold text-sm font-headline">{title}</h5>
          <p className="text-primary-foreground/60 text-[11px] mt-1 leading-relaxed">{desc}</p>
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

export default ContactProfile;
