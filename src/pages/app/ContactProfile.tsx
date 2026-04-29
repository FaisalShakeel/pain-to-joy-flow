import { useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Phone, MessageSquare, CalendarDays, Mail, Smartphone,
  MapPin, Briefcase, Clock, Building2, Share2, Camera, Send, Download,
  ShieldCheck, Lock, Zap, BadgeCheck, BellRing, BellOff, PhoneCall,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import Avatar from "@/components/app/Avatar";
import AccessRequestComposer from "@/components/app/AccessRequestComposer";
import PingButton from "@/components/app/PingButton";
import { findContact } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";

const ContactProfile = () => {
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

  if (!contact) {
    return (
      <AppShell title="Contact not found">
        <Link to="/app/contacts" className="text-accent hover:underline">← Back to contacts</Link>
      </AppShell>
    );
  }

  const isLocked = contact.syncStatus === "locked";
  const isPending = contact.syncStatus === "pending";
  const isApproved = contact.syncStatus === "approved";
  const firstName = contact.name.split(" ")[0];

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

  const toggleAlert = (k: "callback" | "message" | "calendar") => {
    const next = { ...alerts, [k]: !alerts[k] };
    setAlerts(next);
    const labelMap = { callback: "Callback alert", message: "Message alert", calendar: "Calendar alert" } as const;
    toast({
      title: `${labelMap[k]} ${next[k] ? "on" : "off"}`,
      description: next[k] ? `We'll ping you the moment ${firstName} is reachable.` : "You won't be notified about status changes.",
    });
  };

  // Mock comms data — derived from contact id for stability (purely presentational)
  const handle = contact.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z_]/g, "");
  const emailDomain = contact.org.toLowerCase().replace(/[^a-z]/g, "") || "company";
  const email = `${handle.split("_")[0]}@${emailDomain}.io`;

  return (
    <AppShell subtitle="Contact profile" title={contact.name}>
      <button
        onClick={goBack}
        className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full ghost-border bg-surface-lowest text-xs font-semibold text-primary hover:bg-surface-low transition"
        aria-label="Back to contacts"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to contacts
      </button>

      {/* TOP: Profile Window */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Portrait + Spotlight */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className={`aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-br ${contact.accent} shadow-elevated ring-8 ${statusData.ringClass} relative grid place-items-center`}>
            <span className="text-white font-headline font-extrabold text-6xl tracking-tight drop-shadow-lg">
              {contact.initials}
            </span>
            <div className={`absolute top-3 right-3 h-3.5 w-3.5 ${statusData.dotClass} rounded-full ring-4 ring-white shadow-lg z-10 animate-pulse`} />
          </div>

          {/* Spotlight */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 via-primary/5 to-primary/30 rounded-3xl blur opacity-75 transition" />
            <div className="relative bg-surface-lowest rounded-2xl p-5 ghost-border overflow-hidden shadow-ambient">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Building2 className="w-10 h-10 text-primary" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Spotlight</h4>
              </div>
              <p className="text-sm font-headline font-light italic leading-relaxed text-foreground/90">
                "{contact.bio}"
              </p>
              <div className="mt-4 pt-3 border-t border-primary/5 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Security Layer</span>
                  <span className="text-[11px] font-mono text-primary/70">v2.4 handshake active</span>
                </div>
                <Zap className="w-4 h-4 text-primary/40" />
              </div>
            </div>
          </div>

          {/* Quick Ping */}
          <div className="rounded-2xl bg-surface-lowest ghost-border p-4 shadow-ambient flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Quick Ping</p>
              <p className="text-sm font-semibold text-primary mt-0.5">Tap to nudge {firstName}</p>
            </div>
            <PingButton contact={contact} size="md" />
          </div>
        </div>

        {/* Right: Profile info */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Hero card */}
          <div className="bg-surface-lowest rounded-2xl p-6 md:p-8 shadow-ambient ghost-border relative overflow-hidden">
            {/* Status block (top-right) */}
            <div className="absolute top-5 right-5 md:top-6 md:right-6 flex flex-col items-end gap-2">
              <div className={`${statusData.chipClass} border px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5`}>
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusData.pingClass} opacity-75`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${statusData.dotClass}`} />
                </span>
                <span className="text-[10px] font-bold tracking-wider uppercase font-headline">{statusData.label}</span>
                <span className={`ml-0.5 hidden sm:flex items-center gap-1 ${statusData.subClass} bg-white/40 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider`}>
                  <Zap className="w-3 h-3" /> {statusData.subLabel}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`grid place-items-center w-6 h-6 rounded-full ${statusData.chipClass}`}>
                  <Clock className="w-3 h-3" />
                </span>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Current availability</span>
                  <span className={`text-[10px] font-bold ${statusData.subClass}`}>{contact.availabilityContext}</span>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2.5 max-w-2xl pr-28 md:pr-44">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold font-headline tracking-tight text-primary leading-tight">
                  {firstName}
                </h1>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold tracking-wide mt-1">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  <span className="truncate">{contact.org}</span>
                </div>
              </div>
              <p className="text-sm md:text-base font-light text-foreground/80 font-headline leading-snug">{contact.title}</p>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {contact.tags.map((t) => (
                  <span key={t} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary/5 text-primary">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Operations Center */}
            <div className="pt-5 mt-5 border-t border-surface-container">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-4 flex items-center gap-2">
                <span className="h-px w-6 bg-surface-container" /> Operations Center
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <OpsItem icon={CalendarDays} label="Operation Days" value="Monday — Friday" sub="Weekend access by priority only" />
                <OpsItem icon={Briefcase} label="Operation Hours" value="09:00 — 18:00 (GMT+0)" />
                <OpsItem icon={MapPin} label="Headquarters" value={contact.org} sub={`${firstName}'s primary base`} />
              </div>
            </div>
          </div>

          {/* Comms grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CommsCard
              title="Primary Comms"
              badge="Secure Tunnels"
              locked={isLocked}
              items={[
                { icon: Mail, label: "Email", value: email, href: `mailto:${email}` },
                { icon: Phone, label: "Office Number", value: "+44 20 7946 0123", href: "tel:+442079460123" },
                { icon: Smartphone, label: "Mobile Number", value: "+44 7700 900 123", href: "tel:+447700900123" },
              ]}
            />
            <CommsCard
              title="Social Protocols"
              badge="Personalized Reach"
              locked={isLocked}
              footer="Visibility is determined per-seeker by the provider"
              items={[
                { icon: Share2, label: "X (Twitter)", value: `@${handle}`, href: "#" },
                { icon: Camera, label: "Instagram", value: `@${handle.split("_")[0]}.work`, href: "#" },
              ]}
            />
          </div>

          {/* Availability alerts */}
          <div className="rounded-2xl bg-surface-lowest ghost-border p-5 shadow-ambient">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Availability alerts</p>
                <h3 className="mt-1 font-headline font-bold text-primary text-sm">
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
      <section className="mt-6 rounded-2xl overflow-hidden relative bg-primary text-primary-foreground shadow-elevated">
        <div className="absolute inset-0 opacity-40 pointer-events-none bg-[radial-gradient(circle_at_top_right,hsl(var(--primary-glow)/0.4),transparent_60%)]" />
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 p-6 md:p-8">
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
    </AppShell>
  );
};

/* --- Subcomponents --- */

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
  title, badge, items, locked, footer,
}: {
  title: string;
  badge: string;
  items: { icon: any; label: string; value: string; href: string }[];
  locked: boolean;
  footer?: string;
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

  const button = (
    <button
      disabled={!to}
      className={`w-full mt-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${ctaClass}`}
    >
      <CtaIcon className="w-3.5 h-3.5" /> {cta}
    </button>
  );

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
      {to ? <Link to={to} className="relative z-10">{button}</Link> : <div className="relative z-10">{button}</div>}
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full blur-3xl" />
    </div>
  );
};

export default ContactProfile;
