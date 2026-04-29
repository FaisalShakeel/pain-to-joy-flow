import AppShell from "@/components/app/AppShell";
import { Filter, Zap, ShieldCheck, Plus, ArrowRight, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const velocity = [4, 7, 6, 9, 12, 8, 11, 13, 10, 9, 14, 11];
const filters = [
  { name: "Auto-approve verified colleagues", on: true },
  { name: "Route 'investor' tag to Mark Thompson", on: true },
  { name: "Hold cold requests for 24h review", on: false },
  { name: "Decline outside office hours", on: true },
];

const ApprovalFlow = () => (
  <AppShell
    subtitle="Provider control"
    title="Approval flow"
    actions={
      <Link
        to="/app/requests/queues"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full ghost-border bg-surface-lowest text-sm font-semibold text-primary hover:bg-surface-low transition"
      >
        Queues <ArrowRight className="w-4 h-4" />
      </Link>
    }
  >
    <div className="grid lg:grid-cols-3 gap-5">
      {/* Velocity */}
      <div className="lg:col-span-2 rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Request velocity</p>
            <h3 className="mt-1 font-headline font-bold text-primary text-lg">Last 12 weeks</h3>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
            <TrendingUp className="w-3.5 h-3.5" /> +18%
          </span>
        </div>
        <div className="mt-6 flex items-end gap-2 h-40">
          {velocity.map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-md bg-gradient-to-t from-primary to-accent/70"
              style={{ height: `${(v / 14) * 100}%` }}
              title={`Week ${i + 1}: ${v}`}
            />
          ))}
        </div>
        <div className="mt-2 grid grid-cols-12 gap-2 text-[10px] text-muted-foreground text-center">
          {velocity.map((_, i) => (
            <span key={i}>W{i + 1}</span>
          ))}
        </div>
      </div>

      {/* Smart filter */}
      <div className="rounded-3xl bg-gradient-vault p-6 text-primary-foreground shadow-elevated">
        <Filter className="w-5 h-5 text-gold" />
        <h3 className="mt-2 font-headline font-bold text-lg">Smart Filter</h3>
        <p className="mt-1 text-sm text-primary-foreground/85">
          Let Availock route, hold or auto-approve based on rules — so you only see what needs you.
        </p>
        <button
          onClick={() => toast({ title: "Smart Filter active", description: "Rules will run on the next inbound request." })}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold text-primary text-xs font-bold hover:bg-gold/90 transition"
        >
          <Zap className="w-3.5 h-3.5" /> Run filter now
        </button>
      </div>

      {/* Rules */}
      <div className="lg:col-span-3 rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient">
        <div className="flex items-center justify-between">
          <h3 className="font-headline font-bold text-primary">Filter rules</h3>
          <button
            onClick={() => toast({ title: "Rule added", description: "Configure conditions and actions." })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ghost-border bg-surface-low text-xs font-semibold text-primary hover:bg-surface transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add rule
          </button>
        </div>
        <ul className="mt-4 divide-y divide-border/50">
          {filters.map((f) => (
            <li key={f.name} className="py-3 flex items-center gap-3">
              <span className={`grid place-items-center w-9 h-9 rounded-xl ${f.on ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                <ShieldCheck className="w-4 h-4" />
              </span>
              <p className="flex-1 text-sm font-medium text-primary">{f.name}</p>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${f.on ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                {f.on ? "Active" : "Off"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </AppShell>
);

export default ApprovalFlow;