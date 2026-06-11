import { CheckCircle2, Brain, Zap, CalendarClock, PlaneLanding, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type EventKind =
  | "available-now" | "focus-start" | "focus-end" | "quicksync-open"
  | "office-hours" | "calendar-open" | "available-again" | "back-from-leave";

interface FeedItem {
  id: string;
  who: string;
  kind: EventKind;
  detail: string;          // e.g. "Quick Sync Open", "Busy Until 3 PM" — availability only, no private details
  when: string;
  cta?: { label: string; href: string };
}

const META: Record<EventKind, { label: string; icon: typeof Zap; tone: string }> = {
  "available-now":    { label: "Available Now",     icon: CheckCircle2,   tone: "bg-emerald-500/15 text-emerald-700" },
  "focus-start":      { label: "Focus Mode Started", icon: Brain,         tone: "bg-violet-500/15 text-violet-700" },
  "focus-end":        { label: "Focus Mode Ended",   icon: Brain,         tone: "bg-violet-500/15 text-violet-700" },
  "quicksync-open":   { label: "Quick Sync Open",   icon: Zap,            tone: "bg-amber-500/15 text-amber-700" },
  "office-hours":     { label: "Office Hours Open", icon: CalendarClock,  tone: "bg-primary/10 text-primary" },
  "calendar-open":    { label: "Calendar Open",     icon: CalendarClock,  tone: "bg-primary/10 text-primary" },
  "available-again":  { label: "Available Again",   icon: CheckCircle2,   tone: "bg-emerald-500/15 text-emerald-700" },
  "back-from-leave":  { label: "Back From Leave",   icon: PlaneLanding,   tone: "bg-sky-500/15 text-sky-700" },
};

const FEED: FeedItem[] = [
  { id: "f1", who: "Rashid",  kind: "available-now",   detail: "Quick Sync Open",       when: "Just now",   cta: { label: "Book Time", href: "/app/availability/quick-sync" } },
  { id: "f2", who: "Sarah",   kind: "focus-start",     detail: "Busy Until 3 PM",       when: "5m ago" },
  { id: "f3", who: "Julian",  kind: "office-hours",    detail: "Open 3:00 – 5:00 PM",   when: "12m ago",    cta: { label: "Reserve", href: "/app/availability" } },
  { id: "f4", who: "Alex",    kind: "available-again", detail: "Free for 30 minutes",   when: "Today",      cta: { label: "Quick Sync", href: "/app/availability/quick-sync" } },
  { id: "f5", who: "Yara",    kind: "back-from-leave", detail: "Back online tomorrow",  when: "Tomorrow" },
];

const AvailabilityFeed = () => {
  return (
    <section className="rounded-2xl ghost-border bg-surface-lowest p-3 shadow-soft">
      <header className="flex items-center gap-2 mb-2">
        <span className="grid place-items-center w-6 h-6 rounded-lg bg-primary/10 text-primary">
          <Clock className="w-3.5 h-3.5" />
        </span>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground leading-none">
            Availability Feed
          </p>
          <h4 className="text-sm font-bold text-primary leading-tight">Live awareness from your network</h4>
        </div>
      </header>
      <ul className="space-y-1.5">
        {FEED.map((f) => {
          const m = META[f.kind]; const I = m.icon;
          return (
            <li key={f.id} className="flex items-center gap-2 rounded-xl bg-surface-low/40 px-2 py-1.5">
              <span className={cn("grid place-items-center w-7 h-7 rounded-full shrink-0", m.tone)}>
                <I className="w-3.5 h-3.5" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[12px] font-bold text-primary truncate">{f.who}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    {m.label}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight truncate">
                  {f.detail} · {f.when}
                </p>
              </div>
              {f.cta && (
                <Link
                  to={f.cta.href}
                  className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider hover:opacity-95 transition"
                >
                  {f.cta.label} <ArrowRight className="w-2.5 h-2.5" />
                </Link>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-[10px] text-muted-foreground italic">
        Availock shares availability only — never meeting titles, participants, or locations.
      </p>
    </section>
  );
};

export default AvailabilityFeed;