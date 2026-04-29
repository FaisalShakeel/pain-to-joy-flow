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
      <div style={{ zoom: 0.5 }}>
      <button
        onClick={goBack}
        className="inline-flex items-center gap-2 mb-9 px-4 py-2 rounded-full ghost-border bg-surface-lowest text-xs font-semibold text-primary hover:bg-surface-low transition"
        aria-label="Back to contacts"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to contacts
      </button>

      {/* TOP: Profile Window */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* Left: Portrait + Spotlight */}
        <div className="lg:col-span-4 flex flex-col gap-9">
          <div className={`aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-br ${contact.accent} shadow-elevated ring-8 ${statusData.ringClass} relative grid place-items-center`}>
            <span className="text-white font-headline font-extrabold text-8xl tracking-tight drop-shadow-lg">
              {contact.initials}
            </span>
            <div className={`absolute top-4 right-4 h-5 w-5 ${statusData.dotClass} rounded-full ring-4 ring-white shadow-lg z-10 animate-pulse`} />
          </div>

          {/* Spotlight */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 via-primary/5 to-primary/30 rounded-3xl blur opacity-75 transition" />
            <div className="relative bg-surface-lowest rounded-3xl p-8 ghost-border overflow-hidden shadow-ambient">
              <div className="absolute top-0 right-0 p-5 opacity-10">
                <Building2 className="w-16 h-16 text-primary" />
              </div>
              <div className="flex items-center gap-2 mb-5">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Spotlight</h4>
              </div>
              <p className="text-lg font-headline font-light italic leading-relaxed text-foreground/90">
                "{contact.bio}"
              </p>
              <div className="mt-7 pt-5 border-t border-primary/5 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Security Layer</span>
                  <span className="text-[10px] font-mono text-primary/70">v2.4 handshake active</span>
                </div>
                <Zap className="w-4 h-4 text-primary/40" />
              </div>
            </div>
          </div>

          {/* Quick Ping */}
          <div className="rounded-2xl bg-surface-lowest ghost-border p-6 shadow-ambient flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Quick Ping</p>
              <p className="text-base font-semibold text-primary mt-1">Tap to nudge {firstName}</p>
            </div>
            <PingButton contact={contact} size="md" />
          </div>
        </div>

        {/* Right: Profile info */}
        <div className="lg:col-span-8 flex flex-col gap-9">
          {/* Hero card */}
          <div className="bg-surface-lowest rounded-3xl p-10 md:p-14 shadow-ambient ghost-border relative overflow-hidden">
            {/* Status block (top-right) */}
            <div className="absolute top-8 right-8 md:top-10 md:right-10 flex flex-col items-end gap-3">
              <div className={`${statusData.chipClass} border px-4 py-1.5 rounded-full shadow-sm flex items-center gap-2`}>
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusData.pingClass} opacity-75`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${statusData.dotClass}`} />
                </span>
                <span className="text-[11px] font-bold tracking-wider uppercase font-headline">{statusData.label}</span>
                <span className={`ml-1 hidden sm:flex items-center gap-1 ${statusData.subClass} bg-white/40 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider`}>
                  <Zap className="w-3 h-3" /> {statusData.subLabel}
                </span>
              </div>
              <div className="flex items-center gap-2.5 mt-1">
                <span className={`grid place-items-center w-8 h-8 rounded-full ${statusData.chipClass}`}>
                  <Clock className="w-4 h-4" />
                </span>
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">Current availability</span>
                  <span className={`text-[11px] font-bold ${statusData.subClass}`}>{contact.availabilityContext}</span>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-5 max-w-2xl pr-32 md:pr-48">
              <div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold font-headline tracking-tighter text-primary leading-[1.05]">
                  {firstName}
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground font-semibold tracking-wide mt-3">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span>{contact.org}</span>
                </div>
              </div>
              <p className="text-xl md:text-2xl font-light text-foreground/70 font-headline leading-snug">{contact.title}</p>

              <div className="flex flex-wrap gap-2.5 pt-2">
                {contact.tags.map((t) => (
                  <span key={t} className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-primary/5 text-primary">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Operations Center */}
            <div className="pt-12 mt-12 border-t border-surface-container">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-8 flex items-center gap-2">
                <span className="h-px w-8 bg-surface-container" /> Operations Center
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-9">
                <OpsItem icon={CalendarDays} label="Operation Days" value="Monday — Friday" sub="Weekend access by priority only" />
                <OpsItem icon={Briefcase} label="Operation Hours" value="09:00 — 18:00 (GMT+0)" />
                <OpsItem icon={MapPin} label="Headquarters" value={contact.org} sub={`${firstName}'s primary base`} />
              </div>
            </div>
          </div>

          {/* Comms grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
          <div className="rounded-3xl bg-surface-lowest ghost-border p-8 shadow-ambient">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Availability alerts</p>
                <h3 className="mt-2 font-headline font-bold text-primary text-lg">
                  Notify me when {firstName} is reachable
                </h3>
              </div>
              <span className={`grid place-items-center w-12 h-12 rounded-xl ${Object.values(alerts).some(Boolean) ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                {Object.values(alerts).some(Boolean) ? <BellRing className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                    className={`flex items-center justify-between gap-3 p-4 rounded-2xl ghost-border text-left transition ${on ? "bg-primary/5" : "bg-surface-low hover:bg-surface"}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`grid place-items-center w-9 h-9 rounded-xl ${on ? "bg-primary text-primary-foreground" : "bg-surface text-primary"}`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <p className="text-sm font-semibold text-primary truncate">{label}</p>
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
      <section className="mt-14 rounded-[2rem] overflow-hidden relative bg-primary text-primary-foreground shadow-elevated">
        <div className="absolute inset-0 opacity-40 pointer-events-none bg-[radial-gradient(circle_at_top_right,hsl(var(--primary-glow)/0.4),transparent_60%)]" />
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 p-12 md:p-16 lg:p-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-16 items-center">
            {/* Left: Portal */}
            <div className="lg:col-span-8 space-y-14">
              <div className="space-y-7">
                <div className={`inline-flex items-center gap-2.5 ${syncBannerData.chipBg} px-5 py-2.5 rounded-full border backdrop-blur-md`}>
                  <syncBannerData.icon className={`w-3.5 h-3.5 ${syncBannerData.textColor}`} />
                  <span className={`${syncBannerData.textColor} text-[10px] uppercase font-bold tracking-[0.2em]`}>{syncBannerData.label}</span>
                </div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-headline font-extrabold tracking-tight leading-[1.05]">
                  Secure Interaction Layer
                </h2>
                <p className="text-primary-foreground/70 text-lg md:text-xl leading-relaxed font-light max-w-2xl">
                  {isApproved && "Strategic alignment established. Select your context to initiate optimized communication protocols for this session."}
                  {isPending && `${firstName} is reviewing your request — typically responds within ${contact.responseTime}. Channels unlock on approval.`}
                  {isLocked && `Send an access request to unlock secure communication channels with ${firstName}.`}
                </p>
              </div>

              {/* Three interaction tiles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
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
              <div className="flex flex-wrap items-center gap-5 pt-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Select Identity:</span>
                <div className="flex flex-wrap gap-2.5">
                  {(["client", "colleague", "partner"] as const).map((r) => {
                    const active = identity === r;
                    return (
                      <button
                        key={r}
                        onClick={() => setIdentity(r)}
                        className={`px-5 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
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
              <div className="bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-3xl p-10 md:p-14 flex flex-col items-center justify-center relative overflow-hidden text-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--accent)/0.15),transparent_60%)]" />
                <div className={`w-28 h-28 rounded-full grid place-items-center mb-10 ring-[12px] relative ${
                  isApproved ? "bg-emerald-500/20 ring-emerald-500/5" : isPending ? "bg-amber-500/20 ring-amber-500/5" : "bg-rose-500/20 ring-rose-500/5"
                }`}>
                  {isApproved && <BadgeCheck className="w-16 h-16 text-emerald-400" strokeWidth={1.5} />}
                  {isPending && <Clock className="w-14 h-14 text-amber-400" strokeWidth={1.5} />}
                  {isLocked && <Lock className="w-14 h-14 text-rose-300" strokeWidth={1.5} />}
                </div>
                <div className="space-y-3 mb-10 relative z-10">
                  <h4 className="font-headline font-extrabold text-2xl md:text-3xl">
                    {isApproved && "Identity Verified"}
                    {isPending && "Awaiting Approval"}
                    {isLocked && "Access Required"}
                  </h4>
                  <p className="text-primary-foreground/60 text-sm md:text-base">
                    {isApproved && `Auth Level: ${identity.charAt(0).toUpperCase() + identity.slice(1)} Alpha`}
                    {isPending && `${firstName} typically reviews within ${contact.responseTime}`}
                    {isLocked && "Calendar, contact, and live channels are sealed"}
                  </p>
                </div>

                {isApproved && (
                  <button
                    onClick={() => toast({ title: "Brief downloaded", description: `${firstName}'s engagement brief saved.` })}
                    className="group w-full bg-emerald-500 text-white py-6 rounded-3xl font-headline font-black text-lg shadow-2xl shadow-emerald-900/40 hover:bg-emerald-400 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-3 relative z-10"
                  >
                    DOWNLOAD BRIEF
                    <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                  </button>
                )}
                {isLocked && (
                  <button
                    onClick={() => setOpenSent(true)}
                    className="group w-full bg-white text-primary py-6 rounded-3xl font-headline font-black text-lg shadow-2xl hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-3 relative z-10"
                  >
                    REQUEST ACCESS
                    <ShieldCheck className="w-4 h-4" />
                  </button>
                )}
                {isPending && (
                  <div className="w-full bg-amber-500/10 border border-amber-500/20 text-amber-300 py-5 rounded-3xl font-headline font-bold text-base flex items-center justify-center gap-2 relative z-10">
                    <Clock className="w-4 h-4" /> Request pending
                  </div>
                )}

                <div className="mt-10 flex flex-col items-center gap-2.5 relative z-10">
                  <p className="text-emerald-400 text-[10px] font-bold tracking-[0.4em] uppercase">Session Encrypted</p>
                  <div className="flex gap-1.5">
                    <div className="h-1.5 w-4 bg-emerald-400 rounded-full" />
                    <div className="h-1.5 w-4 bg-emerald-400 rounded-full" />
                    <div className={`h-1.5 w-4 rounded-full ${isApproved ? "bg-emerald-400" : "bg-emerald-400/30"}`} />
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
  <div className="flex gap-4">
    <div className="w-12 h-12 rounded-full bg-surface-low grid place-items-center flex-shrink-0">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <div className="min-w-0 space-y-1">
      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-base font-semibold text-primary truncate">{value}</p>
      {sub && <p className="text-xs font-medium text-muted-foreground">{sub}</p>}
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
  <div className="bg-surface-lowest rounded-2xl p-8 ghost-border shadow-ambient flex flex-col relative">
    <div className="flex justify-between items-start mb-7">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
        <span className="h-px w-8 bg-surface-container" /> {title}
      </h3>
      <span className="text-[8px] font-bold uppercase tracking-widest text-primary/60 bg-primary/5 px-2.5 py-1.5 rounded">
        {badge}
      </span>
    </div>
    <div className={`space-y-6 ${locked ? "blur-sm select-none pointer-events-none" : ""}`}>
      {items.map((it) => (
        <a key={it.label} href={locked ? "#" : it.href} className="flex items-center justify-between group">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-11 h-11 rounded-full bg-surface-low grid place-items-center group-hover:bg-primary/5 transition-colors flex-shrink-0">
              <it.icon className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{it.label}</p>
              <p className="text-base font-semibold text-primary truncate">{it.value}</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
        </a>
      ))}
    </div>
    {locked && (
      <div className="absolute inset-0 grid place-items-center bg-surface-lowest/40 backdrop-blur-[2px] rounded-2xl">
        <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-semibold">
          <Lock className="w-3.5 h-3.5" /> Unlocks on approval
        </div>
      </div>
    )}
    {footer && !locked && (
      <p className="mt-auto pt-6 text-[10px] text-muted-foreground italic text-center border-t border-surface-container">
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
      className={`w-full mt-8 py-4 rounded-2xl text-sm font-extrabold transition-all flex items-center justify-center gap-2.5 ${ctaClass}`}
    >
      <CtaIcon className="w-4 h-4" /> {cta}
    </button>
  );

  return (
    <div className={`relative overflow-hidden rounded-3xl backdrop-blur-xl p-8 md:p-9 transition-all flex flex-col justify-between min-h-[300px] shadow-2xl ${wrapperBase}`}>
      <div className="space-y-5 relative z-10">
        <div className="flex items-center justify-between">
          <div className={`h-12 w-12 rounded-2xl grid place-items-center ${iconBox}`}>
            <Icon className="w-6 h-6" />
          </div>
          {badge && (
            <span className={`${badge.color} text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${badge.label === "POWER CALL" ? "animate-pulse" : ""}`}>
              {badge.label}
            </span>
          )}
        </div>
        {preview && (
          <div className="bg-black/20 p-3.5 rounded-xl border border-white/5">
            <p className="text-emerald-400/60 text-[10px] italic font-mono uppercase tracking-widest">{preview}</p>
          </div>
        )}
        {dots && (
          <div className="flex gap-1.5 opacity-40">
            <div className="h-1.5 w-6 bg-white rounded-full" />
            <div className="h-1.5 w-6 bg-white rounded-full" />
            <div className="h-1.5 w-6 bg-white/20 rounded-full" />
          </div>
        )}
        <div>
          <h5 className="font-bold text-xl font-headline">{title}</h5>
          <p className="text-primary-foreground/60 text-sm mt-2 leading-relaxed">{desc}</p>
        </div>
      </div>
      {to ? <Link to={to} className="relative z-10">{button}</Link> : <div className="relative z-10">{button}</div>}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
    </div>
  );
};

export default ContactProfile;
