import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Phone, MessageSquare, CalendarDays, Mail, Smartphone,
  MapPin, Briefcase, Clock, Building2, Share2, Camera, Send, Download,
  ShieldCheck, Lock, Zap, BadgeCheck, BellRing, BellOff, PhoneCall,
  Linkedin, Github, Globe, MessageCircle,
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
import DemoQRCard from "@/components/app/DemoQRCard";
import PreviewModeBanner from "@/components/app/PreviewModeBanner";

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

      {/* COMPACT HEADER — identity + status + Quick Sync + actions, all above the fold */}
      <section className="rounded-2xl bg-surface-lowest ghost-border shadow-ambient p-4 md:p-5 mb-4">
        <div className="flex items-start gap-4">
          {/* Avatar with status dot + Quick Sync badge overlay */}
          <div className="relative flex-shrink-0">
            <div className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden bg-gradient-to-br ${contact.accent} shadow-elevated ring-4 ${statusData.ringClass} relative grid place-items-center`}>
              <span className="text-white font-headline font-extrabold text-2xl md:text-3xl tracking-tight drop-shadow-lg">
                {contact.initials}
              </span>
              <div className={`absolute top-1.5 right-1.5 h-2.5 w-2.5 ${statusData.dotClass} rounded-full ring-2 ring-white shadow-lg z-10 animate-pulse`} />
            </div>
            {syncWindows.length > 0 && (
              <QuickSyncBadge
                windows={syncWindows}
                onBook={goSchedule}
                className="absolute -bottom-2 -right-2"
              />
            )}
          </div>

          {/* Identity + status + ops chips */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-extrabold font-headline tracking-tight text-primary leading-tight truncate">
                  {firstName}
                </h1>
                {show("title") && (
                  <p className="text-xs md:text-sm font-light text-foreground/80 leading-snug truncate">{owner.title}</p>
                )}
                {show("org") && (
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground font-semibold">
                    <Building2 className="w-3 h-3 text-primary" />
                    <span className="truncate">{owner.org}</span>
                  </div>
                )}
              </div>
              <div className={`${statusData.chipClass} border px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1.5 flex-shrink-0`}>
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusData.pingClass} opacity-75`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${statusData.dotClass}`} />
                </span>
                <span className="text-[10px] font-bold tracking-wider uppercase font-headline">{statusData.label}</span>
              </div>
            </div>
            {/* 3-line status system: state + context + sub */}
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
              <span className={`inline-flex items-center gap-1 ${statusData.subClass} font-bold uppercase tracking-wider`}>
                <Zap className="w-3 h-3" /> {statusData.subLabel}
              </span>
              {show("availabilityContext") && (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-3 h-3" /> {owner.availabilityContext}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                Responds in <span className="font-semibold text-primary">{contact.responseTime}</span>
              </span>
            </div>

            {/* Action panel — desktop inline (mobile becomes sticky bottom CTA) */}
            <div className="mt-3">
              <ActionPanel status={contact.status} actions={actions} stickyMobile />
            </div>
          </div>
        </div>
      </section>

      {/* SECONDARY: Spotlight + Ops Center + Quick Ping (compact two-column) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-4 flex flex-col gap-3">
          {/* Spotlight */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 via-primary/5 to-primary/30 rounded-3xl blur opacity-75 transition" />
            <div className="relative bg-surface-lowest rounded-2xl p-4 ghost-border overflow-hidden shadow-ambient">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Building2 className="w-10 h-10 text-primary" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Spotlight</h4>
              </div>
              <p className="text-[13px] font-headline font-light italic leading-snug text-foreground/90">
                "{contact.bio}"
              </p>
            </div>
          </div>

          {/* Quick Ping */}
          <div className="rounded-2xl bg-surface-lowest ghost-border p-3 shadow-ambient flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Quick Ping</p>
              <p className="text-xs font-semibold text-primary mt-0.5">Tap to nudge {firstName}</p>
            </div>
            <PingButton contact={contact} size="md" />
          </div>

          {/* Demo QR (compact in registered view; prominent in guest preview) */}
          {!guestMode && (
            <DemoQRCard to="/v/elena-vance" variant="compact" />
          )}
        </div>

        {/* Right: Profile info */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          {/* Tags + Operations Center (compact) */}
          {(show("tags") || show("operationDays") || show("operationHours") || show("headquarters")) && (
            <div className="bg-surface-lowest rounded-2xl p-4 shadow-ambient ghost-border">
              {show("tags") && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {owner.tags.map((t) => (
                    <span key={t} className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/5 text-primary">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {(show("operationDays") || show("operationHours") || show("headquarters")) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {show("operationDays") && <OpsItem icon={CalendarDays} label="Operation Days" value={owner.operationDays} sub={owner.operationDaysSub} />}
                  {show("operationHours") && <OpsItem icon={Briefcase} label="Operation Hours" value={owner.operationHours} />}
                  {show("headquarters") && <OpsItem icon={MapPin} label="Headquarters" value={owner.headquarters} sub={owner.headquartersSub} />}
                </div>
              )}
            </div>
          )}

          {/* Comms grid */}
          {(visiblePrimaryComms.length > 0 || visibleSocials.length > 0 || isLocked || isPending) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(visiblePrimaryComms.length > 0 || isLocked || isPending) && (
                <CommsCard
                  title="Primary Comms"
                  badge="Secure Tunnels"
                  locked={isLocked}
                  emptyLabel={visiblePrimaryComms.length === 0 ? "Owner has hidden all channels" : undefined}
                  items={visiblePrimaryComms.map((c) => ({
                    icon: commsIcon(c.kind),
                    label: c.label,
                    value: c.value,
                    href: hrefFor(c.kind, c.value),
                  }))}
                />
              )}
              {(visibleSocials.length > 0 || isLocked || isPending) && (
                <CommsCard
                  title="Social Protocols"
                  badge="Personalized Reach"
                  locked={isLocked}
                  footer="Visibility is determined per-seeker by the provider"
                  emptyLabel={visibleSocials.length === 0 ? "Owner has hidden all handles" : undefined}
                  items={visibleSocials.map((s) => ({
                    icon: socialIcon(s.kind),
                    label: s.label,
                    value: s.value,
                    href: s.href,
                  }))}
                />
              )}
            </div>
          )}

          {/* Availability alerts (compact) */}
          <div className="rounded-2xl bg-surface-lowest ghost-border p-4 shadow-ambient">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Availability alerts</p>
                <h3 className="mt-0.5 font-headline font-bold text-primary text-xs">
                  Notify me when {firstName} is reachable
                </h3>
              </div>
              <span className={`grid place-items-center w-9 h-9 rounded-xl ${Object.values(alerts).some(Boolean) ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                {Object.values(alerts).some(Boolean) ? <BellRing className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {[
                { key: "callback" as const, icon: PhoneCall, label: "Callback" },
                { key: "message" as const, icon: MessageSquare, label: "Message" },
                { key: "calendar" as const, icon: CalendarDays, label: "Calendar" },
              ].map(({ key, icon: Icon, label }) => {
                const on = alerts[key];
                return (
                  <button
                    key={key}
                    onClick={() => toggleAlert(key)}
                    className={`flex items-center justify-between gap-2 p-2.5 rounded-xl ghost-border text-left transition ${on ? "bg-primary/5" : "bg-surface-low hover:bg-surface"}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`grid place-items-center w-7 h-7 rounded-lg ${on ? "bg-primary text-primary-foreground" : "bg-surface text-primary"}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <p className="text-xs font-semibold text-primary truncate">{label}</p>
                    </div>
                    <span className={`relative inline-flex h-4 w-7 items-center rounded-full transition ${on ? "bg-primary" : "bg-muted"}`} aria-hidden>
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition ${on ? "translate-x-3.5" : "translate-x-0.5"}`} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM: Connection Portal — Secure Interaction Layer */}
      <section className="mt-4 rounded-2xl overflow-hidden relative bg-primary text-primary-foreground shadow-elevated">
        <div className="absolute inset-0 opacity-40 pointer-events-none bg-[radial-gradient(circle_at_top_right,hsl(var(--primary-glow)/0.4),transparent_60%)]" />
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 p-5 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left: Portal */}
            <div className="lg:col-span-8 space-y-5">
              <div className="space-y-3">
                <div className={`inline-flex items-center gap-2 ${syncBannerData.chipBg} px-3 py-1.5 rounded-full border backdrop-blur-md`}>
                  <syncBannerData.icon className={`w-3 h-3 ${syncBannerData.textColor}`} />
                  <span className={`${syncBannerData.textColor} text-[10px] uppercase font-bold tracking-[0.2em]`}>{syncBannerData.label}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-headline font-extrabold tracking-tight leading-tight">
                  Secure Interaction Layer
                </h2>
                <p className="text-primary-foreground/70 text-sm leading-relaxed font-light max-w-xl">
                  {isApproved && "Strategic alignment established. Select your context to initiate optimized communication protocols for this session."}
                  {isPending && `${firstName} is reviewing your request — typically responds within ${contact.responseTime}. Channels unlock on approval.`}
                  {isLocked && `Send an access request to unlock secure communication channels with ${firstName}.`}
                </p>
              </div>

              {/* Three interaction tiles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Call */}
                <PortalTile
                  icon={Phone}
                  badge={isApproved ? { label: "POWER CALL", color: "bg-rose-500" } : null}
                  title="Call Sync"
                  desc="Direct high-priority encrypted audio line"
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
                  badge={null}
                  title="Schedule"
                  desc="Review availability and book deep-dive sessions"
                  dots
                  cta={isApproved ? "View Calendar" : isPending ? "Pending" : "Locked"}
                  ctaIcon={CalendarDays}
                  ctaClass={isApproved ? "bg-white/10 border border-white/20 hover:bg-white/20 text-white" : "bg-white/10 text-white/60 cursor-not-allowed"}
                  to={isApproved ? `/app/schedule/${contact.id}` : null}
                  variant="default"
                />
              </div>

              {/* Priority Bypass — controlled privilege */}
              <div className="rounded-2xl bg-white/5 border border-gold/30 backdrop-blur-md p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="grid place-items-center w-8 h-8 rounded-lg bg-gold/20 text-gold">
                      <Zap className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">Priority Bypass</p>
                      <p className="text-[11px] text-primary-foreground/60">Reach through when it truly matters</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <PriorityBypassButton
                    contactId={contact.id}
                    contactName={firstName}
                    kind="call"
                    variant="tile"
                    to={`/app/contact/${contact.id}/call`}
                  />
                  <PriorityBypassButton
                    contactId={contact.id}
                    contactName={firstName}
                    kind="message"
                    variant="tile"
                    to="/app/messages"
                  />
                </div>
              </div>

              {/* Identity selector */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
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

            {/* Right: Verification card */}
            <div className="lg:col-span-4">
              <div className="bg-white/5 rounded-2xl border border-white/10 backdrop-blur-3xl p-5 md:p-6 flex flex-col items-center justify-center relative overflow-hidden text-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--accent)/0.15),transparent_60%)]" />
                <div className={`w-16 h-16 rounded-full grid place-items-center mb-4 ring-[6px] relative ${
                  isApproved ? "bg-emerald-500/20 ring-emerald-500/5" : isPending ? "bg-amber-500/20 ring-amber-500/5" : "bg-rose-500/20 ring-rose-500/5"
                }`}>
                  {isApproved && <BadgeCheck className="w-9 h-9 text-emerald-400" strokeWidth={1.75} />}
                  {isPending && <Clock className="w-8 h-8 text-amber-400" strokeWidth={1.75} />}
                  {isLocked && <Lock className="w-8 h-8 text-rose-300" strokeWidth={1.75} />}
                </div>
                <div className="space-y-1 mb-4 relative z-10">
                  <h4 className="font-headline font-extrabold text-base md:text-lg">
                    {isApproved && "Identity Verified"}
                    {isPending && "Awaiting Approval"}
                    {isLocked && "Access Required"}
                  </h4>
                  <p className="text-primary-foreground/60 text-xs">
                    {isApproved && `Auth Level: ${identity.charAt(0).toUpperCase() + identity.slice(1)} Alpha`}
                    {isPending && `${firstName} typically reviews within ${contact.responseTime}`}
                    {isLocked && "Calendar, contact, and live channels are sealed"}
                  </p>
                </div>

                {isApproved && (
                  <button
                    onClick={() => toast({ title: "Brief downloaded", description: `${firstName}'s engagement brief saved.` })}
                    className="group w-full bg-emerald-500 text-white py-2.5 rounded-xl font-headline font-bold text-sm shadow-lg shadow-emerald-900/40 hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 relative z-10"
                  >
                    DOWNLOAD BRIEF
                    <Download className="w-3.5 h-3.5" />
                  </button>
                )}
                {isLocked && (
                  <button
                    onClick={() => setOpenSent(true)}
                    className="group w-full bg-white text-primary py-2.5 rounded-xl font-headline font-bold text-sm shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 relative z-10"
                  >
                    REQUEST ACCESS
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </button>
                )}
                {isPending && (
                  <div className="w-full bg-amber-500/10 border border-amber-500/20 text-amber-300 py-2.5 rounded-xl font-headline font-semibold text-xs flex items-center justify-center gap-2 relative z-10">
                    <Clock className="w-3.5 h-3.5" /> Request pending
                  </div>
                )}

                <div className="mt-4 flex flex-col items-center gap-1.5 relative z-10">
                  <p className="text-emerald-400 text-[9px] font-bold tracking-[0.3em] uppercase">Session Encrypted</p>
                  <div className="flex gap-1">
                    <div className="h-1 w-3 bg-emerald-400 rounded-full" />
                    <div className="h-1 w-3 bg-emerald-400 rounded-full" />
                    <div className={`h-1 w-3 rounded-full ${isApproved ? "bg-emerald-400" : "bg-emerald-400/30"}`} />
                  </div>
                </div>
              </div>
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
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
              <ShieldCheck className="w-3 h-3" /> Public profile preview
            </div>
            <Link data-guest-allow to="/login" className="text-xs font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </header>
        <div onClickCapture={handleGuestCapture} className="max-w-6xl mx-auto px-4 py-6">
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
  icon: Icon, badge, title, desc, preview, dots, cta, ctaIcon: CtaIcon, ctaClass, to, variant,
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
