import { useMemo, useState } from "react";
import {
  TrendingUp,
  Timer,
  ShieldCheck,
  Inbox,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Crown,
} from "lucide-react";
import { Link } from "react-router-dom";
import AppShell from "@/components/app/AppShell";
import Avatar from "@/components/app/Avatar";
import { contacts } from "@/lib/mockData";

type Range = "7d" | "30d" | "90d";

const weeklyVolume = [
  { d: "Mon", approved: 6, denied: 2 },
  { d: "Tue", approved: 9, denied: 3 },
  { d: "Wed", approved: 4, denied: 1 },
  { d: "Thu", approved: 11, denied: 4 },
  { d: "Fri", approved: 8, denied: 2 },
  { d: "Sat", approved: 2, denied: 0 },
  { d: "Sun", approved: 1, denied: 0 },
];

const responseSeries = [42, 38, 35, 30, 28, 24, 22]; // minutes — trending down (better)

const requestMix = [
  { label: "Approved", value: 68, color: "bg-emerald-500" },
  { label: "Scheduled", value: 18, color: "bg-accent" },
  { label: "Denied", value: 9, color: "bg-rose-500" },
  { label: "Auto-routed", value: 5, color: "bg-primary" },
];

const Analytics = () => {
  const [range, setRange] = useState<Range>("7d");

  const maxBar = useMemo(
    () => Math.max(...weeklyVolume.map((w) => w.approved + w.denied)),
    [],
  );
  const maxResp = Math.max(...responseSeries);
  const minResp = Math.min(...responseSeries);
  const respPath = useMemo(() => {
    const w = 280;
    const h = 80;
    const step = w / (responseSeries.length - 1);
    return responseSeries
      .map((v, i) => {
        const x = i * step;
        const y = h - ((v - minResp) / (maxResp - minResp || 1)) * h;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [maxResp, minResp]);

  const topContacts = contacts.slice(0, 4);

  return (
    <AppShell
      subtitle="Provider insights"
      title="Analytics"
      actions={
        <div className="inline-flex p-1 rounded-full bg-surface-low ghost-border">
          {(["7d", "30d", "90d"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full transition ${
                range === r ? "bg-primary text-primary-foreground shadow-glass" : "text-muted-foreground hover:text-primary"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      }
    >
      {/* KPI row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          icon={<Timer className="w-4 h-4" />}
          label="Time saved"
          value="14h 22m"
          delta="+18%"
          deltaPositive
          sub="vs previous period"
        />
        <Kpi
          icon={<Inbox className="w-4 h-4" />}
          label="Requests handled"
          value="64"
          delta="+9"
          deltaPositive
          sub="41 approved · 23 routed"
        />
        <Kpi
          icon={<TrendingUp className="w-4 h-4" />}
          label="Avg response"
          value="22 min"
          delta="−42%"
          deltaPositive
          sub="faster than last week"
        />
        <Kpi
          icon={<ShieldCheck className="w-4 h-4" />}
          label="Focus protected"
          value="27 blocks"
          delta="+5"
          deltaPositive
          sub="interruptions filtered"
        />
      </div>

      <div className="mt-5 grid lg:grid-cols-3 gap-5">
        {/* Weekly velocity */}
        <section className="lg:col-span-2 rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Request velocity</p>
              <h3 className="font-headline font-extrabold text-primary text-xl mt-1">This week</h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Approved
              </span>
              <span className="flex items-center gap-1.5 text-rose-700">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Denied
              </span>
            </div>
          </header>

          <div className="mt-6 grid grid-cols-7 gap-3 items-end h-56">
            {weeklyVolume.map((w) => {
              const total = w.approved + w.denied;
              const aH = (w.approved / maxBar) * 100;
              const dH = (w.denied / maxBar) * 100;
              return (
                <div key={w.d} className="flex flex-col items-center gap-2 h-full">
                  <div className="flex-1 w-full flex flex-col justify-end gap-1">
                    <div
                      className="w-full rounded-t-md bg-rose-500/80 transition-all"
                      style={{ height: `${dH}%` }}
                      title={`${w.denied} denied`}
                    />
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-emerald-500 to-emerald-400 transition-all"
                      style={{ height: `${aH}%` }}
                      title={`${w.approved} approved`}
                    />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{w.d}</p>
                  <p className="text-[10px] text-primary font-semibold">{total}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Response trend */}
        <section className="rounded-3xl bg-gradient-vault text-primary-foreground p-6 shadow-elevated relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-accent-soft/20 blur-3xl" />
          <div className="relative">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">Response time</p>
            <h3 className="font-headline font-extrabold text-2xl mt-1">22 min avg</h3>
            <p className="mt-1 text-xs text-primary-foreground/80 inline-flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-300" /> 42% faster than last week
            </p>

            <svg viewBox="0 0 280 90" className="mt-4 w-full h-24">
              <defs>
                <linearGradient id="resp" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--brand-gold))" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="hsl(var(--brand-gold))" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={`${respPath} L280,90 L0,90 Z`} fill="url(#resp)" />
              <path d={respPath} fill="none" stroke="hsl(var(--brand-gold))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {responseSeries.map((v, i) => {
                const w = 280, h = 80;
                const step = w / (responseSeries.length - 1);
                const x = i * step;
                const y = h - ((v - minResp) / (maxResp - minResp || 1)) * h;
                return <circle key={i} cx={x} cy={y} r="2.5" fill="hsl(var(--brand-gold))" />;
              })}
            </svg>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <Mini label="Best" value="22m" />
              <Mini label="Median" value="30m" />
              <Mini label="Slowest" value="42m" />
            </div>
          </div>
        </section>
      </div>

      <div className="mt-5 grid lg:grid-cols-3 gap-5">
        {/* Request mix */}
        <section className="rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Request mix</p>
          <h3 className="font-headline font-extrabold text-primary text-xl mt-1">How you replied</h3>

          <div className="mt-5 flex h-3 rounded-full overflow-hidden ghost-border">
            {requestMix.map((r) => (
              <div key={r.label} className={r.color} style={{ width: `${r.value}%` }} title={`${r.label} ${r.value}%`} />
            ))}
          </div>

          <ul className="mt-4 space-y-2.5">
            {requestMix.map((r) => (
              <li key={r.label} className="flex items-center gap-3 text-sm">
                <span className={`w-2.5 h-2.5 rounded-sm ${r.color}`} />
                <span className="flex-1 text-foreground/80">{r.label}</span>
                <span className="font-semibold text-primary">{r.value}%</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Top requesters */}
        <section className="lg:col-span-2 rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Top requesters</p>
              <h3 className="font-headline font-extrabold text-primary text-xl mt-1">Who's reaching out</h3>
            </div>
            <Link to="/app/requests" className="text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1">
              View requests <ArrowUpRight className="w-3 h-3" />
            </Link>
          </header>

          <ul className="mt-5 divide-y divide-border/40">
            {topContacts.map((c, i) => {
              const reqs = [12, 9, 7, 4][i];
              const approval = [92, 78, 64, 50][i];
              return (
                <li key={c.id} className="flex items-center gap-4 py-3">
                  <span className="text-xs font-bold text-muted-foreground w-5 text-right">#{i + 1}</span>
                  <Avatar initials={c.initials} accent={c.accent} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-primary text-sm truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.org}</p>
                  </div>
                  <div className="hidden sm:flex flex-col items-end">
                    <p className="text-sm font-bold text-primary">{reqs}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">requests</p>
                  </div>
                  <div className="w-24">
                    <div className="h-1.5 rounded-full bg-surface-low overflow-hidden">
                      <div className="h-full bg-gradient-primary" style={{ width: `${approval}%` }} />
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground text-right">{approval}% approved</p>
                  </div>
                  {i === 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : approval < 60 ? (
                    <XCircle className="w-4 h-4 text-rose-500" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-accent" />
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {/* Upgrade prompt */}
      <div className="mt-6 rounded-3xl bg-gradient-vault text-primary-foreground p-6 md:p-8 shadow-elevated flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-start gap-4 max-w-xl">
          <span className="grid place-items-center w-12 h-12 rounded-2xl bg-white/10">
            <Crown className="w-5 h-5 text-gold" />
          </span>
          <div>
            <p className="font-headline font-extrabold text-xl">Unlock advanced cohorts</p>
            <p className="mt-1 text-sm text-primary-foreground/80">
              Segment by org, urgency or referral source. Export weekly digests to your team.
            </p>
          </div>
        </div>
        <Link
          to="/app/upgrade"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gold text-primary font-bold hover:bg-gold/90 transition"
        >
          Upgrade to Pro <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    </AppShell>
  );
};

function Kpi({
  icon,
  label,
  value,
  delta,
  deltaPositive,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta: string;
  deltaPositive?: boolean;
  sub: string;
}) {
  return (
    <div className="rounded-3xl bg-surface-lowest ghost-border p-5 shadow-ambient">
      <div className="flex items-center justify-between">
        <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary/10 text-primary">{icon}</span>
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
            deltaPositive ? "bg-emerald-500/10 text-emerald-700" : "bg-rose-500/10 text-rose-700"
          }`}
        >
          {deltaPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {delta}
        </span>
      </div>
      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-headline font-extrabold text-primary text-2xl">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 ghost-border py-2">
      <p className="text-[10px] uppercase tracking-wider text-primary-foreground/70">{label}</p>
      <p className="font-headline font-bold text-gold mt-0.5">{value}</p>
    </div>
  );
}

export default Analytics;