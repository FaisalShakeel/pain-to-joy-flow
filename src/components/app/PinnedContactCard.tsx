import { Link } from "react-router-dom";
import {
  Star, Briefcase, Clock, Phone, MessageSquare,
  CalendarDays, Radio, ShieldCheck, Sparkles, Pin, PinOff, Car, Zap,
} from "lucide-react";
import Avatar from "./Avatar";
import PingButton from "./PingButton";
import { cn } from "@/lib/utils";
import { useSpotlight } from "./SpotlightContext";
import type { Contact, AvailabilityStatus } from "@/lib/mockData";

interface Props {
  contact: Contact;
  pinned: boolean;
  onTogglePin: (id: string) => void;
  drivingOverride?: boolean;
}

const statusMeta = (s: AvailabilityStatus | "driving") => {
  switch (s) {
    case "available": return { label: "AVAILABLE", dot: "bg-emerald-500", chip: "bg-emerald-500/15 text-emerald-700", ring: "ring-emerald-400/70", sub: "Available for sync" };
    case "busy":      return { label: "BUSY",      dot: "bg-amber-500",   chip: "bg-amber-500/15 text-amber-700",   ring: "ring-amber-400/70",   sub: "In a meeting" };
    case "focus":     return { label: "FOCUS",     dot: "bg-violet-500",  chip: "bg-violet-500/15 text-violet-700", ring: "ring-violet-400/70",  sub: "Deep work block" };
    case "driving":   return { label: "DRIVING",   dot: "bg-orange-500",  chip: "bg-orange-500/15 text-orange-700", ring: "ring-orange-400/70",  sub: "On the road" };
    default:          return { label: "OFFLINE",   dot: "bg-slate-400",   chip: "bg-slate-500/15 text-slate-600",   ring: "ring-slate-300/70",   sub: "Offline" };
  }
};

const PinnedContactCard = ({ contact: c, pinned, onTogglePin, drivingOverride }: Props) => {
  const effective: AvailabilityStatus | "driving" = drivingOverride ? "driving" : c.status;
  const meta = statusMeta(effective);
  const approved = c.syncStatus === "approved";
  const pending = c.syncStatus === "pending";

  const { unseenForContact, markSeen, markContactPostsViewed } = useSpotlight();
  const unseen = unseenForContact(c.id);

  const tileBase =
    "relative rounded-xl p-2.5 flex flex-col gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10 transition";
  const lockTile = "opacity-60 hover:bg-white/5 cursor-not-allowed";

  return (
    <div className="group relative rounded-2xl overflow-hidden ghost-border bg-surface-lowest shadow-ambient flex flex-col">
      {unseen > 0 && (
        <Link
          to={`/app/contact/${c.id}`}
          onClick={() => { markSeen(c.id); markContactPostsViewed(c.id); }}
          title={`${unseen} new spotlight ${unseen === 1 ? "post" : "posts"}`}
          className="absolute top-2 left-2 z-20 grid place-items-center w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 text-white shadow-glass ring-2 ring-surface-lowest animate-pulse"
        >
          <Sparkles className="w-3 h-3" />
        </Link>
      )}

      {/* ───── Identity layer (white) ───── */}
      <div className="relative bg-surface-lowest p-4 pb-3">
        <div className="flex items-start gap-3">
          <Link to={`/app/contact/${c.id}`} className="shrink-0">
            <div className={cn(
              "rounded-xl p-[3px] ring-2 ring-offset-2 ring-offset-surface-lowest transition-[--tw-ring-color] duration-500",
              meta.ring,
            )}>
              <Avatar initials={c.initials} accent={c.accent} size="lg" className="!rounded-lg" />
            </div>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link to={`/app/contact/${c.id}`} className="block">
                  <h4 className="font-headline font-extrabold text-primary text-base leading-tight truncate hover:text-accent">
                    {c.name.split(" ")[0]}
                  </h4>
                </Link>
                <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground truncate max-w-full">
                  <Briefcase className="w-3 h-3 shrink-0" />
                  <span className="truncate">{c.org}</span>
                </p>
                <p className="text-[10px] text-muted-foreground/80 truncate">{c.title}</p>
              </div>

              <button
                onClick={() => onTogglePin(c.id)}
                title={pinned ? "Unpin" : "Pin"}
                className={cn(
                  "shrink-0 grid place-items-center w-7 h-7 rounded-full transition",
                  pinned ? "bg-gold/20 text-gold" : "bg-surface-low text-muted-foreground hover:text-primary",
                )}
              >
                {pinned ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
              </button>
            </div>

            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider", meta.chip)}>
                <span className={cn("w-1.5 h-1.5 rounded-full", meta.dot)} />
                {meta.label}
                {c.favorite && <Star className="w-2.5 h-2.5 fill-current" />}
              </span>
              {effective === "driving" && (
                <span className="inline-flex items-center gap-1 text-[10px] text-orange-700">
                  <Car className="w-2.5 h-2.5" />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Operations strip */}
        <div className="mt-3 pt-3 border-t border-surface-container/60 flex items-center gap-2">
          <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
          <p className="text-[10px] text-muted-foreground truncate flex-1" title={c.availabilityContext}>
            {c.availabilityContext || meta.sub}
          </p>
          <span className="text-[9px] font-bold uppercase tracking-wider text-accent shrink-0">
            ~{c.responseTime}
          </span>
        </div>
      </div>

      {/* ───── Communication layer (blue) ───── */}
      <div className="relative bg-gradient-to-br from-primary to-[hsl(var(--primary))] text-primary-foreground p-3 pt-2.5">
        <div className="flex items-center justify-between mb-2">
          <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-300">
            <ShieldCheck className="w-3 h-3" />
            {approved ? "Connection Active" : pending ? "Awaiting Approval" : "Channels Sealed"}
          </span>
          {approved && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[8px] font-bold uppercase tracking-wider">
              <Zap className="w-2.5 h-2.5" /> Live
            </span>
          )}
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {/* Call */}
          {approved ? (
            <Link to={`/app/contact/${c.id}/call`} className={tileBase} title="Call Sync">
              <span className="grid place-items-center w-7 h-7 rounded-lg bg-white/10"><Phone className="w-3.5 h-3.5" /></span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/80">Call</span>
            </Link>
          ) : (
            <div className={cn(tileBase, lockTile)} title="Call locked">
              <span className="grid place-items-center w-7 h-7 rounded-lg bg-white/10"><Phone className="w-3.5 h-3.5" /></span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">Call</span>
            </div>
          )}

          {/* Message */}
          {approved ? (
            <Link to="/app/messages" className={cn(tileBase, "bg-emerald-500/15 border-emerald-400/20 hover:bg-emerald-500/25")} title="Message">
              <span className="grid place-items-center w-7 h-7 rounded-lg bg-emerald-500/30 text-emerald-200"><MessageSquare className="w-3.5 h-3.5" /></span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-200">Msg</span>
            </Link>
          ) : (
            <div className={cn(tileBase, lockTile)} title="Message locked">
              <span className="grid place-items-center w-7 h-7 rounded-lg bg-white/10"><MessageSquare className="w-3.5 h-3.5" /></span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">Msg</span>
            </div>
          )}

          {/* Schedule */}
          {approved ? (
            <Link to={`/app/schedule/${c.id}`} className={tileBase} title="Schedule">
              <span className="grid place-items-center w-7 h-7 rounded-lg bg-white/10"><CalendarDays className="w-3.5 h-3.5" /></span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/80">Plan</span>
            </Link>
          ) : (
            <div className={cn(tileBase, lockTile)} title="Schedule locked">
              <span className="grid place-items-center w-7 h-7 rounded-lg bg-white/10"><CalendarDays className="w-3.5 h-3.5" /></span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">Plan</span>
            </div>
          )}

          {/* Ping — always available */}
          <div className={cn(tileBase, "items-start")} title="Ping">
            <div className="flex items-center justify-between w-full">
              <span className="grid place-items-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300"><Radio className="w-3.5 h-3.5" /></span>
              <PingButton contact={c} drivingOverride={drivingOverride} />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300">Ping</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinnedContactCard;
