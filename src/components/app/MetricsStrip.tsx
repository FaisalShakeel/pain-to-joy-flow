import { useState } from "react";
import { Zap, CheckCircle2, Timer, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMetrics } from "@/hooks/use-metrics";
import { formatProtected } from "@/lib/metrics";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

type Range = "today" | "week" | "all";

const RANGE_LABEL: Record<Range, string> = {
  today: "Today",
  week: "This week",
  all: "All time",
};

const MetricsStrip = () => {
  const [range, setRange] = useState<Range>("week");
  const m = useMetrics(range);

  return (
    <div className="rounded-2xl bg-surface-lowest ghost-border p-3 shadow-ambient">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Your impact · {RANGE_LABEL[range]}
        </p>
        <div className="inline-flex p-0.5 rounded-full bg-surface-low">
          {(Object.keys(RANGE_LABEL) as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "px-2 py-0.5 text-[10px] font-semibold rounded-full transition",
                range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary",
              )}
            >
              {RANGE_LABEL[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <MetricTile
          icon={<Zap className="w-3.5 h-3.5" />}
          tone="amber"
          label="Avoided"
          value={`${m.avoided}`}
          detail={
            <BreakdownList
              rows={[
                ["Profile views (no call)", m.breakdown.profileViews],
                ["Pings sent", m.breakdown.pings],
                ["Messages left", m.breakdown.messages],
                ["Blocked by status", m.breakdown.blocked],
              ]}
            />
          }
        />
        <MetricTile
          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          tone="emerald"
          label="Connected"
          value={`${m.connected}`}
          detail={
            <BreakdownList
              rows={[
                ["Quick Sync completed", m.breakdown.quickSync],
                ["Meetings attended", m.breakdown.meetings],
                ["Ping → connect", m.breakdown.pingConnects],
                ["Approved interactions", m.breakdown.approvedInteractions],
              ]}
            />
          }
        />
        <MetricTile
          icon={<Timer className="w-3.5 h-3.5" />}
          tone="sky"
          label="Protected"
          value={formatProtected(m.protectedMinutes)}
          detail={
            <BreakdownList
              rows={[
                [`Avoided × 3 min`, m.avoided * 3 + "m"],
                [`QS batching × 2 min`, m.breakdown.qsBatched * 2 + "m"],
                [`Total`, formatProtected(m.protectedMinutes)],
              ]}
            />
          }
        />
      </div>
    </div>
  );
};

const TONE: Record<string, { bg: string; text: string; ring: string }> = {
  amber:   { bg: "bg-amber-500/10",   text: "text-amber-700",   ring: "ring-amber-500/30" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-700", ring: "ring-emerald-500/30" },
  sky:     { bg: "bg-sky-500/10",     text: "text-sky-700",     ring: "ring-sky-500/30" },
};

function MetricTile({
  icon, label, value, tone, detail,
}: { icon: React.ReactNode; label: string; value: string; tone: keyof typeof TONE; detail: React.ReactNode }) {
  const t = TONE[tone];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={cn(
          "group flex flex-col items-start gap-1 p-2.5 rounded-xl ghost-border bg-surface-low/50 hover:bg-surface-low transition text-left ring-1",
          t.ring,
        )}>
          <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider", t.text)}>
            <span className={cn("grid place-items-center w-5 h-5 rounded-full", t.bg)}>{icon}</span>
            {label}
          </span>
          <span className="font-headline font-extrabold text-primary text-xl leading-none tabular-nums">
            {value}
          </span>
          <span className="text-[10px] text-muted-foreground inline-flex items-center gap-0.5">
            Tap for breakdown <ChevronDown className="w-2.5 h-2.5" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
          {label} · breakdown
        </p>
        {detail}
      </PopoverContent>
    </Popover>
  );
}

function BreakdownList({ rows }: { rows: [string, number | string][] }) {
  return (
    <ul className="text-xs">
      {rows.map(([k, v]) => (
        <li key={k} className="flex items-center justify-between py-1 border-b border-border/40 last:border-0">
          <span className="text-muted-foreground">{k}</span>
          <span className="font-bold text-primary tabular-nums">{v}</span>
        </li>
      ))}
    </ul>
  );
}

export default MetricsStrip;
