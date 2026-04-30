import { useEffect, useMemo, useState } from "react";
import {
  Loader2, CalendarDays, Plus, Sparkles, History, Activity,
  Briefcase, Zap, Radio, Clock, TrendingUp, AlertTriangle, Shield, ChevronRight, X,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Link } from "react-router-dom";
import { addDays, format, startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

// ---------- Activity model ----------
type ActivityKind = "meeting" | "quicksync" | "live";

interface DayActivity {
  date: string; // yyyy-mm-dd
  meetings: { count: number; minutes: number };
  quickSync: { count: number; minutes: number };
  liveConnect: { count: number; minutes: number };
  status: { busyPct: number; availablePct: number; focusPct: number };
  capacityMin: number; // total available capacity in minutes (e.g. 480 = 8h)
  interruptions: number;
}

// Deterministic mock generator so the layout is stable.
const mockDay = (d: Date): DayActivity => {
  const seed = d.getDate() + d.getMonth() * 31;
  const r = (n: number) => ((seed * 9301 + n * 49297) % 233280) / 233280;
  const meetingsCount = Math.floor(r(1) * 5);
  const qsCount = Math.floor(r(2) * 12);
  const liveCount = Math.floor(r(3) * 8);
  const meetingsMin = meetingsCount * 30;
  const qsMin = qsCount * 5;
  const liveMin = liveCount * 4;
  const capacityMin = 480;
  const usedMin = meetingsMin + qsMin + liveMin;
  const busy = Math.min(100, Math.round((usedMin / capacityMin) * 100));
  const focus = Math.max(0, Math.round(20 + r(4) * 25));
  const available = Math.max(0, 100 - busy - focus);
  return {
    date: d.toISOString().slice(0, 10),
    meetings: { count: meetingsCount, minutes: meetingsMin },
    quickSync: { count: qsCount, minutes: qsMin },
    liveConnect: { count: liveCount, minutes: liveMin },
    status: { busyPct: busy, availablePct: available, focusPct: focus },
    capacityMin,
    interruptions: liveCount + Math.floor(qsCount / 2),
  };
};

const minToHr = (m: number) => {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h === 0) return `${mm}m`;
  if (mm === 0) return `${h}h`;
  return `${h}h ${mm}m`;
};

const tagFor = (a: DayActivity): { label: string; cls: string; Ic: any } => {
  if (a.interruptions >= 8) return { label: "High Interruption", cls: "bg-rose-500/15 text-rose-700", Ic: AlertTriangle };
  if (a.meetings.count >= 3) return { label: "Meeting Heavy", cls: "bg-indigo-500/15 text-indigo-700", Ic: Briefcase };
  if (a.status.focusPct >= 35) return { label: "Focus Heavy", cls: "bg-emerald-500/15 text-emerald-700", Ic: Shield };
  if (a.status.busyPct + a.status.focusPct < 60) return { label: "Balanced", cls: "bg-sky-500/15 text-sky-700", Ic: Activity };
  return { label: "Balanced", cls: "bg-sky-500/15 text-sky-700", Ic: Activity };
};

// ---------- Page ----------
const Availability = () => {
  const [connecting, setConnecting] = useState(true);
  const [view, setView] = useState<"week" | "month">("week");
  const [mode, setMode] = useState<"live" | "history">("live");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setConnecting(false), 600);
    return () => clearTimeout(t);
  }, []);

  const days = useMemo(() => {
    if (view === "week") {
      const start = startOfWeek(new Date(), { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }
    const s = startOfMonth(new Date());
    const e = endOfMonth(new Date());
    return eachDayOfInterval({ start: s, end: e });
  }, [view]);

  const activity = useMemo(() => days.map(mockDay), [days]);

  const totals = useMemo(() => {
    return activity.reduce(
      (acc, a) => ({
        meetings: acc.meetings + a.meetings.count,
        qs: acc.qs + a.quickSync.count,
        live: acc.live + a.liveConnect.count,
        usedMin:
          acc.usedMin + a.meetings.minutes + a.quickSync.minutes + a.liveConnect.minutes,
        capacityMin: acc.capacityMin + a.capacityMin,
        interruptions: acc.interruptions + a.interruptions,
      }),
      { meetings: 0, qs: 0, live: 0, usedMin: 0, capacityMin: 0, interruptions: 0 },
    );
  }, [activity]);

  const peakBusy = useMemo(
    () => [...activity].sort((a, b) => b.status.busyPct - a.status.busyPct)[0],
    [activity],
  );
  const peakFocus = useMemo(
    () => [...activity].sort((a, b) => b.status.focusPct - a.status.focusPct)[0],
    [activity],
  );
  const peakInterruption = useMemo(
    () => [...activity].sort((a, b) => b.interruptions - a.interruptions)[0],
    [activity],
  );

  if (connecting) {
    return (
      <AppShell title="Calendar Intelligence">
        <div className="grid place-items-center h-[60vh] text-center">
          <div>
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
            <p className="mt-4 font-headline font-bold text-primary">Reading your activity…</p>
            <p className="text-sm text-muted-foreground">Compiling meetings, sync calls and live connects.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const selectedDay = selected ? activity.find((a) => a.date === selected) ?? null : null;

  return (
    <AppShell
      subtitle={mode === "live" ? "Communication performance" : "Activity history"}
      title="Don't just see time. Understand how it was used."
      actions={
        <>
          <div className="inline-flex items-center rounded-full ghost-border bg-surface-lowest p-1">
            <button
              onClick={() => setView("week")}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-bold transition",
                view === "week" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary",
              )}
            >Week</button>
            <button
              onClick={() => setView("month")}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-bold transition",
                view === "month" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary",
              )}
            >Month</button>
          </div>

          <button
            onClick={() => setMode((m) => (m === "live" ? "history" : "live"))}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-2.5 rounded-full text-xs font-semibold transition",
              mode === "history"
                ? "bg-primary text-primary-foreground"
                : "ghost-border bg-surface-lowest text-primary hover:bg-surface-low",
            )}
          >
            <History className="w-3.5 h-3.5" /> {mode === "history" ? "History on" : "Activity history"}
          </button>

          <Link
            to="/app/availability/builder"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full ghost-border bg-surface-lowest text-primary text-sm font-semibold hover:bg-surface-low transition"
          >
            <Sparkles className="w-4 h-4" /> Slot builder
          </Link>
          <button
            onClick={() => toast({ title: "Window added", description: "A new open slot is now visible to approved contacts." })}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-elevated hover:opacity-95 transition"
          >
            <Plus className="w-4 h-4" /> Add window
          </button>
        </>
      }
    >
      {/* SUMMARY STRIP */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-5">
        <SummaryTile
          icon={Briefcase}
          tone="indigo"
          label="Meetings"
          value={`${totals.meetings}`}
          sub={minToHr(totals.usedMin > 0 ? activity.reduce((s, a) => s + a.meetings.minutes, 0) : 0)}
        />
        <SummaryTile
          icon={Zap}
          tone="fuchsia"
          label="Quick Sync"
          value={`${totals.qs}`}
          sub={minToHr(activity.reduce((s, a) => s + a.quickSync.minutes, 0))}
        />
        <SummaryTile
          icon={Radio}
          tone="amber"
          label="Live Connects"
          value={`${totals.live}`}
          sub={minToHr(activity.reduce((s, a) => s + a.liveConnect.minutes, 0))}
        />
        <SummaryTile
          icon={Clock}
          tone="emerald"
          label="Time used / available"
          value={minToHr(totals.usedMin)}
          sub={`of ${minToHr(totals.capacityMin)}`}
        />
      </section>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        {/* DAILY ACTIVITY GRID */}
        <div className={cn(
          "rounded-3xl bg-surface-lowest ghost-border p-4 md:p-5 shadow-ambient",
        )}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {mode === "history" ? "Activity history" : "Live activity"}
              </p>
              <h3 className="font-headline font-extrabold text-primary text-base md:text-lg">
                {view === "week" ? "This week" : format(new Date(), "MMMM yyyy")}
              </h3>
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Activity className="w-3 h-3" /> {activity.length} days
            </p>
          </div>

          <div className={cn(
            "grid gap-2",
            view === "week" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-7" : "grid-cols-2 sm:grid-cols-4 lg:grid-cols-7",
          )}>
            {activity.map((a) => (
              <DayCard
                key={a.date}
                a={a}
                onClick={() => setSelected(a.date)}
                compact={view === "month"}
              />
            ))}
          </div>
        </div>

        {/* INSIGHTS RAIL */}
        <aside className="space-y-3">
          <div className="rounded-3xl bg-surface-lowest ghost-border p-4">
            <h3 className="font-headline font-bold text-primary text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Insights
            </h3>
            <ul className="mt-3 space-y-2 text-xs">
              <InsightRow
                color="bg-rose-500"
                label="Peak busy day"
                value={peakBusy ? `${format(new Date(peakBusy.date), "EEE")} · ${peakBusy.status.busyPct}%` : "—"}
              />
              <InsightRow
                color="bg-emerald-500"
                label="Highest focus"
                value={peakFocus ? `${format(new Date(peakFocus.date), "EEE")} · ${peakFocus.status.focusPct}%` : "—"}
              />
              <InsightRow
                color="bg-amber-500"
                label="Most interrupted"
                value={peakInterruption ? `${format(new Date(peakInterruption.date), "EEE")} · ${peakInterruption.interruptions} pings` : "—"}
              />
            </ul>
          </div>

          <div className="rounded-3xl bg-surface-lowest ghost-border p-4">
            <h3 className="font-headline font-bold text-primary text-sm">Legend</h3>
            <ul className="mt-3 space-y-2 text-xs">
              <LegendRow color="bg-indigo-500" label="Meetings (focus work)" />
              <LegendRow color="bg-fuchsia-500" label="Quick Sync calls" />
              <LegendRow color="bg-amber-500" label="Live connects" />
              <LegendRow color="bg-emerald-500" label="Available capacity" />
            </ul>
          </div>

          <div className="rounded-3xl bg-gradient-vault text-primary-foreground p-5 shadow-elevated">
            <CalendarDays className="w-5 h-5 text-gold" />
            <p className="mt-2 font-headline font-bold">Communication performance</p>
            <p className="mt-1 text-xs text-primary-foreground/80">
              This isn't just a calendar — it's how you understand and protect your time.
            </p>
          </div>
        </aside>
      </div>

      {/* DETAIL DRAWER */}
      {selectedDay && (
        <DayDetailDrawer day={selectedDay} onClose={() => setSelected(null)} />
      )}
    </AppShell>
  );
};

// ---------- Day Card ----------
const DayCard = ({ a, onClick, compact }: { a: DayActivity; onClick: () => void; compact: boolean }) => {
  const date = new Date(a.date);
  const today = format(new Date(), "yyyy-MM-dd") === a.date;
  const usedMin = a.meetings.minutes + a.quickSync.minutes + a.liveConnect.minutes;
  const usedPct = Math.min(100, Math.round((usedMin / a.capacityMin) * 100));
  const tag = tagFor(a);

  // Stacked activity bar shares
  const total = Math.max(1, usedMin);
  const mShare = (a.meetings.minutes / total) * 100;
  const qShare = (a.quickSync.minutes / total) * 100;
  const lShare = (a.liveConnect.minutes / total) * 100;

  return (
    <button
      onClick={onClick}
      className={cn(
        "text-left rounded-2xl ghost-border bg-surface-low p-3 hover:shadow-elevated transition group flex flex-col gap-2",
        today && "ring-2 ring-primary/40 bg-gradient-to-br from-primary/5 to-accent/5",
      )}
    >
      {/* Top: date */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {format(date, "EEE")}
          </p>
          <p className="font-headline font-extrabold text-primary text-lg leading-none mt-0.5">
            {format(date, "d")}
          </p>
        </div>
        {today && (
          <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[8px] font-bold uppercase tracking-wider">Today</span>
        )}
      </div>

      {/* Activity bars */}
      <div className="space-y-1">
        <div className="h-2 w-full rounded-full bg-surface-lowest overflow-hidden flex">
          {mShare > 0 && <div style={{ width: `${mShare}%` }} className="bg-indigo-500" title={`Meetings ${minToHr(a.meetings.minutes)}`} />}
          {qShare > 0 && <div style={{ width: `${qShare}%` }} className="bg-fuchsia-500" title={`Quick Sync ${minToHr(a.quickSync.minutes)}`} />}
          {lShare > 0 && <div style={{ width: `${lShare}%` }} className="bg-amber-500" title={`Live ${minToHr(a.liveConnect.minutes)}`} />}
          {usedMin === 0 && <div className="w-full bg-muted-foreground/10" />}
        </div>

        {!compact && (
          <div className="grid grid-cols-3 gap-1 text-[9px] font-bold">
            <Mini icon={Briefcase} count={a.meetings.count} color="text-indigo-700" />
            <Mini icon={Zap} count={a.quickSync.count} color="text-fuchsia-700" />
            <Mini icon={Radio} count={a.liveConnect.count} color="text-amber-700" />
          </div>
        )}
      </div>

      {/* Status ring (segmented) */}
      <div>
        <div className="h-1.5 w-full rounded-full overflow-hidden flex bg-surface-lowest">
          <div style={{ width: `${a.status.busyPct}%` }} className="bg-rose-500/70" title={`Busy ${a.status.busyPct}%`} />
          <div style={{ width: `${a.status.focusPct}%` }} className="bg-emerald-500/70" title={`Focus ${a.status.focusPct}%`} />
          <div style={{ width: `${a.status.availablePct}%` }} className="bg-sky-500/50" title={`Available ${a.status.availablePct}%`} />
        </div>
        {!compact && (
          <p className="mt-1 text-[9px] text-muted-foreground font-bold">
            {minToHr(usedMin)} used · {minToHr(Math.max(0, a.capacityMin - usedMin))} free
          </p>
        )}
      </div>

      {/* Smart tag */}
      {!compact && (
        <span className={cn("inline-flex items-center gap-1 self-start px-1.5 py-0.5 rounded-md text-[9px] font-bold", tag.cls)}>
          <tag.Ic className="w-2.5 h-2.5" /> {tag.label}
        </span>
      )}
    </button>
  );
};

const Mini = ({ icon: Ic, count, color }: { icon: any; count: number; color: string }) => (
  <span className={cn("inline-flex items-center gap-0.5", color)}>
    <Ic className="w-2.5 h-2.5" /> {count}
  </span>
);

// ---------- Summary Tile ----------
const SummaryTile = ({
  icon: Ic, tone, label, value, sub,
}: { icon: any; tone: "indigo" | "fuchsia" | "amber" | "emerald"; label: string; value: string; sub: string }) => {
  const cls =
    tone === "indigo" ? "from-indigo-500/15 to-violet-500/15 text-indigo-900" :
    tone === "fuchsia" ? "from-fuchsia-500/15 to-pink-500/15 text-fuchsia-900" :
    tone === "amber" ? "from-amber-500/15 to-rose-500/15 text-amber-900" :
                       "from-emerald-500/15 to-sky-500/15 text-emerald-900";
  return (
    <div className={cn("rounded-2xl bg-gradient-to-br p-3 ghost-border", cls)}>
      <div className="flex items-center gap-1.5">
        <Ic className="w-3.5 h-3.5" />
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</span>
      </div>
      <p className="font-headline font-extrabold text-2xl mt-1 leading-none">{value}</p>
      <p className="text-[10px] opacity-70 mt-1">{sub}</p>
    </div>
  );
};

const InsightRow = ({ color, label, value }: { color: string; label: string; value: string }) => (
  <li className="flex items-center justify-between gap-2">
    <span className="flex items-center gap-2 text-muted-foreground">
      <span className={cn("w-2 h-2 rounded-full", color)} /> {label}
    </span>
    <span className="font-bold text-primary text-[11px]">{value}</span>
  </li>
);

const LegendRow = ({ color, label }: { color: string; label: string }) => (
  <li className="flex items-center gap-2">
    <span className={cn("w-3 h-3 rounded", color)} /> {label}
  </li>
);

// ---------- Day Detail Drawer ----------
const DayDetailDrawer = ({ day, onClose }: { day: DayActivity; onClose: () => void }) => {
  const date = new Date(day.date);
  const usedMin = day.meetings.minutes + day.quickSync.minutes + day.liveConnect.minutes;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-full max-w-[460px] h-full bg-surface-lowest shadow-elevated overflow-y-auto">
        <header className="sticky top-0 z-10 bg-surface-lowest/95 backdrop-blur border-b border-border/50 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">Daily breakdown</p>
            <h2 className="font-headline font-extrabold text-primary text-lg">{format(date, "EEEE, MMM d")}</h2>
          </div>
          <button onClick={onClose} className="grid place-items-center w-8 h-8 rounded-full ghost-border bg-surface-low" aria-label="Close">
            <X className="w-4 h-4 text-primary" />
          </button>
        </header>

        <div className="p-5 space-y-5">
          {/* Status distribution ring */}
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Status distribution</h3>
            <div className="h-3 w-full rounded-full overflow-hidden flex bg-surface-low">
              <div style={{ width: `${day.status.busyPct}%` }} className="bg-rose-500/80" />
              <div style={{ width: `${day.status.focusPct}%` }} className="bg-emerald-500/80" />
              <div style={{ width: `${day.status.availablePct}%` }} className="bg-sky-500/60" />
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
              <Stat label="Busy" value={`${day.status.busyPct}%`} dot="bg-rose-500" />
              <Stat label="Focus" value={`${day.status.focusPct}%`} dot="bg-emerald-500" />
              <Stat label="Available" value={`${day.status.availablePct}%`} dot="bg-sky-500" />
            </div>
          </section>

          {/* Activity blocks */}
          <section className="space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Activity</h3>
            <ActivityRow icon={Briefcase} label="Meetings" count={day.meetings.count} minutes={day.meetings.minutes} tone="bg-indigo-500/15 text-indigo-700" />
            <ActivityRow icon={Zap} label="Quick Sync" count={day.quickSync.count} minutes={day.quickSync.minutes} tone="bg-fuchsia-500/15 text-fuchsia-700" />
            <ActivityRow icon={Radio} label="Live connects" count={day.liveConnect.count} minutes={day.liveConnect.minutes} tone="bg-amber-500/15 text-amber-700" />
          </section>

          {/* Capacity */}
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Capacity</h3>
            <div className="rounded-2xl bg-surface-low p-3 ghost-border">
              <p className="text-xs text-muted-foreground">Time used</p>
              <p className="font-headline font-extrabold text-primary text-2xl">{minToHr(usedMin)}</p>
              <p className="text-[11px] text-muted-foreground mt-1">of {minToHr(day.capacityMin)} planned · {minToHr(Math.max(0, day.capacityMin - usedMin))} free</p>
            </div>
          </section>

          {/* Interruptions */}
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Interruption density</h3>
            <div className="flex items-center gap-2">
              <AlertTriangle className={cn("w-4 h-4", day.interruptions >= 8 ? "text-rose-600" : "text-muted-foreground")} />
              <p className="text-sm font-bold text-primary">{day.interruptions} interruption pings</p>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
};

const ActivityRow = ({
  icon: Ic, label, count, minutes, tone,
}: { icon: any; label: string; count: number; minutes: number; tone: string }) => (
  <div className="flex items-center justify-between rounded-xl bg-surface-low ghost-border p-3">
    <div className="flex items-center gap-2">
      <span className={cn("grid place-items-center w-7 h-7 rounded-lg", tone)}>
        <Ic className="w-3.5 h-3.5" />
      </span>
      <div>
        <p className="text-xs font-bold text-primary">{label}</p>
        <p className="text-[10px] text-muted-foreground">{count} call{count === 1 ? "" : "s"} · {minToHr(minutes)}</p>
      </div>
    </div>
    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
  </div>
);

const Stat = ({ label, value, dot }: { label: string; value: string; dot: string }) => (
  <div className="rounded-lg bg-surface-low p-2 ghost-border">
    <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
      <span className={cn("w-2 h-2 rounded-full", dot)} /> {label}
    </span>
    <p className="font-headline font-extrabold text-primary text-sm mt-0.5">{value}</p>
  </div>
);

export default Availability;