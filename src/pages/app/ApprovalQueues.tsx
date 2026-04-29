import { useState } from "react";
import { Link } from "react-router-dom";
import { Layers, Bot, Clock, ArrowRight } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import Avatar from "@/components/app/Avatar";
import StatusPill from "@/components/app/StatusPill";
import { contacts, requests } from "@/lib/mockData";

type Q = "pending" | "review" | "auto";

const ApprovalQueues = () => {
  const [q, setQ] = useState<Q>("pending");

  const items = requests.filter((r) => r.direction === "incoming").map((r) => {
    const lane: Q = r.state === "scheduled" ? "auto" : r.urgency === "high" ? "review" : "pending";
    return { ...r, lane };
  });
  const filtered = items.filter((i) => i.lane === q);

  return (
    <AppShell
      subtitle="Approval protocol"
      title="Approval queues"
      actions={
        <Link
          to="/app/requests/manage"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full ghost-border bg-surface-lowest text-sm font-semibold text-primary hover:bg-surface-low transition"
        >
          Approval flow <ArrowRight className="w-4 h-4" />
        </Link>
      }
    >
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <Lane label="Pending" count={items.filter((i) => i.lane === "pending").length} icon={<Clock className="w-4 h-4" />} active={q === "pending"} onClick={() => setQ("pending")} />
        <Lane label="In review" count={items.filter((i) => i.lane === "review").length} icon={<Layers className="w-4 h-4" />} active={q === "review"} onClick={() => setQ("review")} />
        <Lane label="Auto-routed" count={items.filter((i) => i.lane === "auto").length} icon={<Bot className="w-4 h-4" />} active={q === "auto"} onClick={() => setQ("auto")} />
      </div>

      <ul className="space-y-3">
        {filtered.map((r) => {
          const c = contacts.find((x) => x.id === r.contactId)!;
          return (
            <li key={r.id} className="flex items-center gap-4 p-4 rounded-2xl ghost-border bg-surface-lowest">
              <Avatar initials={c.initials} accent={c.accent} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-primary truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground truncate">{r.reason}</p>
              </div>
              <StatusPill tone={r.state === "pending" ? "pending" : r.state === "scheduled" ? "scheduled" : "approved"} />
              <Link to="/app/requests" className="text-xs font-semibold text-accent hover:underline">Review →</Link>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="text-center text-sm text-muted-foreground py-12 rounded-2xl ghost-border bg-surface-lowest">
            Nothing waiting in this lane.
          </li>
        )}
      </ul>

      <div className="mt-6 rounded-3xl bg-gradient-vault text-primary-foreground p-6 shadow-elevated">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">Request approval protocol</p>
        <p className="mt-2 text-sm text-primary-foreground/85 max-w-2xl">
          Every request enters a queue. Smart Filter routes obvious approvals automatically; uncertain ones come to you.
          Cold or low-context requests are held for batch review during your office hours.
        </p>
      </div>
    </AppShell>
  );
};

function Lane({ label, count, icon, active, onClick }: { label: string; count: number; icon: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-4 rounded-2xl transition ${active ? "bg-primary text-primary-foreground shadow-elevated" : "bg-surface-lowest ghost-border hover:bg-surface-low text-primary"}`}
    >
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] opacity-80">
        {icon} {label}
      </div>
      <p className={`mt-1 font-headline font-extrabold text-3xl leading-none ${active ? "" : "text-primary"}`}>{count}</p>
    </button>
  );
}

export default ApprovalQueues;