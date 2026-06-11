import { useMemo, useState } from "react";
import {
  CalendarDays, Bell, Megaphone, PartyPopper, HelpCircle, Zap,
  Home, Heart, Briefcase, Gem, Star, Users as UsersIcon, ArrowRight, CalendarPlus, Share2, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import QuickSyncWidget from "./QuickSyncWidget";

type GroupId = "family" | "friends" | "office" | "clients" | "projects" | "vip";
type CardType = "meeting" | "reminder" | "announcement" | "event" | "availability-request" | "quicksync-request";

const GROUPS: { id: GroupId; label: string; icon: typeof Home }[] = [
  { id: "office",   label: "Office",   icon: Briefcase },
  { id: "family",   label: "Family",   icon: Home },
  { id: "friends",  label: "Friends",  icon: Heart },
  { id: "clients",  label: "Clients",  icon: Gem },
  { id: "projects", label: "Projects", icon: UsersIcon },
  { id: "vip",      label: "VIP",      icon: Star },
];

const TYPE_META: Record<CardType, { label: string; icon: typeof CalendarDays; tone: string; emoji: string }> = {
  "meeting":              { label: "Meeting",            icon: CalendarDays, tone: "bg-primary/10 text-primary",        emoji: "📅" },
  "reminder":             { label: "Reminder",           icon: Bell,         tone: "bg-amber-500/15 text-amber-700",    emoji: "⏰" },
  "announcement":         { label: "Announcement",       icon: Megaphone,    tone: "bg-sky-500/15 text-sky-700",        emoji: "📣" },
  "event":                { label: "Event",              icon: PartyPopper,  tone: "bg-pink-500/15 text-pink-700",      emoji: "🎉" },
  "availability-request": { label: "Availability Ask",   icon: HelpCircle,   tone: "bg-violet-500/15 text-violet-700",  emoji: "❓" },
  "quicksync-request":    { label: "Quick Sync Ask",     icon: Zap,          tone: "bg-amber-500/15 text-amber-700",    emoji: "⚡" },
};

interface CoordCard {
  id: string;
  group: GroupId;
  type: CardType;
  title: string;
  when: string;
  location?: string; // group-shared, not from private calendar
  cta: { label: string; href: string };
}

const CARDS: CoordCard[] = [
  { id: "c1", group: "office",   type: "meeting",       title: "Weekly Meeting", when: "Today 5:00 PM",     cta: { label: "Open Details", href: "/app/schedule-call" } },
  { id: "c2", group: "friends",  type: "event",         title: "Lunch",          when: "Today 2:00 PM",     location: "McDonald's", cta: { label: "RSVP", href: "/app/notifications" } },
  { id: "c3", group: "clients",  type: "meeting",       title: "Project Review", when: "Tomorrow 11:00 AM", cta: { label: "Join", href: "/app/live-call" } },
  { id: "c4", group: "family",   type: "event",         title: "Family Gathering", when: "Saturday 6:00 PM", cta: { label: "View", href: "/app/notifications" } },
  { id: "c5", group: "projects", type: "reminder",      title: "Submit weekly recap", when: "Friday EOD",   cta: { label: "Open", href: "/app/notifications" } },
  { id: "c6", group: "vip",      type: "announcement",  title: "Q3 office hours open", when: "Next week",   cta: { label: "Reserve", href: "/app/availability" } },
];

const CoordinationPanel = () => {
  const [group, setGroup] = useState<GroupId | "all">("all");
  const [showShare, setShowShare] = useState(false);

  const filtered = useMemo(
    () => CARDS.filter((c) => group === "all" || c.group === group),
    [group],
  );

  return (
    <div className="px-3 md:px-5 pt-3 pb-4 space-y-2.5">
      {/* Group scope notice */}
      <div className="rounded-xl bg-primary/5 ghost-border px-3 py-2 flex items-center gap-2">
        <Lock className="w-3.5 h-3.5 text-primary/70 shrink-0" />
        <p className="text-[11px] text-primary leading-tight">
          Coordination is private to approved groups — never public, never a social feed.
        </p>
      </div>

      {/* Group filter chips */}
      <div className="flex flex-wrap gap-1.5">
        <Chip active={group === "all"} onClick={() => setGroup("all")}>All Groups</Chip>
        {GROUPS.map((g) => {
          const I = g.icon;
          return (
            <Chip key={g.id} active={group === g.id} onClick={() => setGroup(g.id)}>
              <I className="w-3 h-3" /> {g.label}
            </Chip>
          );
        })}
      </div>

      <QuickSyncWidget />

      {/* Calendar -> Coordination Card */}
      <section className="rounded-2xl ghost-border bg-surface-lowest p-3 shadow-soft">
        <header className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center w-6 h-6 rounded-lg bg-primary/10 text-primary">
              <CalendarPlus className="w-3.5 h-3.5" />
            </span>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground leading-none">
                From Calendar
              </p>
              <h4 className="text-sm font-bold text-primary leading-tight">Share an event with a group</h4>
            </div>
          </div>
          <button
            onClick={() => setShowShare((v) => !v)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider hover:opacity-95 transition"
          >
            <Share2 className="w-3 h-3" /> {showShare ? "Close" : "Share"}
          </button>
        </header>
        {showShare && (
          <div className="rounded-xl bg-surface-low/60 p-2 space-y-1.5">
            {[
              { label: "Create Coordination Card", desc: "Surface a card to the chosen group." },
              { label: "Share Availability Only",  desc: "Only show that you're busy — no event details." },
              { label: "Share Event Window",        desc: "Share start/end window without titles or attendees." },
              { label: "Share Booking Opportunity", desc: "Open the slot for the group to book into." },
            ].map((o) => (
              <button key={o.label} className="w-full text-left rounded-lg bg-surface-lowest ghost-border px-2.5 py-2 hover:bg-surface-low transition">
                <p className="text-[11.5px] font-bold text-primary leading-tight">{o.label}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{o.desc}</p>
              </button>
            ))}
            <p className="text-[10px] text-muted-foreground italic px-1">
              Private calendar details are never shared by default.
            </p>
          </div>
        )}
      </section>

      {/* Cards */}
      {filtered.length === 0 ? (
        <p className="px-1 py-3 text-[11px] text-muted-foreground italic">No coordination cards in this group.</p>
      ) : (
        <ul className="space-y-1.5">
          {filtered.map((c) => {
            const m = TYPE_META[c.type];
            const g = GROUPS.find((x) => x.id === c.group)!;
            const GIcon = g.icon;
            return (
              <li key={c.id} className="rounded-2xl ghost-border bg-surface-lowest p-2.5 shadow-soft">
                <div className="flex items-start gap-2.5">
                  <span className={cn("grid place-items-center w-9 h-9 rounded-xl shrink-0", m.tone)}>
                    <span className="text-base leading-none">{m.emoji}</span>
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-surface-low text-muted-foreground">
                        <GIcon className="w-2.5 h-2.5" /> {g.label}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                        {m.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[13px] font-semibold text-primary leading-snug">{c.title}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      {c.when}{c.location ? ` · ${c.location}` : ""}
                    </p>
                  </div>
                  <Link
                    to={c.cta.href}
                    className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider hover:opacity-95 transition"
                  >
                    {c.cta.label} <ArrowRight className="w-2.5 h-2.5" />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={cn(
      "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold border transition",
      active ? "bg-primary text-primary-foreground border-primary"
             : "bg-surface-lowest text-primary border-border hover:bg-surface-low",
    )}
  >
    {children}
  </button>
);

export default CoordinationPanel;