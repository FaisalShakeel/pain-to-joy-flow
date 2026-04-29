import { useState } from "react";
import { Inbox, Check, X, CalendarPlus, ArrowRight, ListChecks, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import AppShell from "@/components/app/AppShell";
import Avatar from "@/components/app/Avatar";
import StatusPill from "@/components/app/StatusPill";
import EmptyState from "@/components/app/EmptyState";
import { contacts, requests as initial } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";
import { useRole } from "@/lib/role";

const AccessRequests = () => {
  const [list, setList] = useState(initial);
  const [tab, setTab] = useState<"incoming" | "outgoing">("incoming");
  const [role] = useRole();

  const filtered = list.filter((r) => r.direction === tab);

  const act = (id: string, state: "approved" | "denied" | "scheduled") => {
    setList((prev) => prev.map((r) => (r.id === id ? { ...r, state } : r)));
    toast({
      title:
        state === "approved" ? "Request approved" : state === "denied" ? "Request denied" : "Scheduled — invite sent",
    });
  };

  return (
    <AppShell
      subtitle={role === "provider" ? "Provider control" : "Your activity"}
      title="Access requests"
      actions={
        role === "provider" && (
          <div className="flex items-center gap-2">
            <Link
              to="/app/requests/queues"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full ghost-border bg-surface-lowest text-sm font-semibold text-primary hover:bg-surface-low transition"
            >
              <ListChecks className="w-4 h-4" /> Queues
            </Link>
            <Link
              to="/app/requests/manage"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-elevated hover:opacity-95 transition"
            >
              <ShieldCheck className="w-4 h-4" /> Approval flow
            </Link>
          </div>
        )
      }
    >
      <div className="inline-flex p-1 rounded-full bg-surface-low ghost-border mb-5">
        {(["incoming", "outgoing"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full capitalize ${
              tab === t ? "bg-primary text-primary-foreground shadow-glass" : "text-muted-foreground hover:text-primary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No requests in this view"
          description="When new requests arrive they'll appear here in priority order."
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((r) => {
            const c = contacts.find((x) => x.id === r.contactId)!;
            return (
              <li key={r.id} className="rounded-2xl ghost-border bg-surface-lowest p-4 md:p-5 shadow-ambient">
                <div className="flex items-start gap-4">
                  <Avatar initials={c.initials} accent={c.accent} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={`/app/contact/${c.id}`} className="font-headline font-bold text-primary hover:underline">
                        {c.name}
                      </Link>
                      <span className="text-xs text-muted-foreground">{c.title} · {c.org}</span>
                      <StatusPill tone={r.state === "pending" ? "pending" : r.state === "approved" ? "approved" : r.state === "denied" ? "denied" : "scheduled"} />
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          r.urgency === "high"
                            ? "bg-destructive/10 text-destructive"
                            : r.urgency === "medium"
                            ? "bg-amber-500/10 text-amber-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {r.urgency} urgency
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-foreground/80">{r.reason}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{r.receivedAt}</p>
                  </div>
                </div>

                {tab === "incoming" && r.state === "pending" && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => act(r.id, "approved")}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-500/90 transition"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                    <Link
                      to={`/app/schedule/${c.id}`}
                      onClick={() => act(r.id, "scheduled")}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full ghost-border bg-surface-low text-xs font-semibold text-primary hover:bg-surface transition"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" /> Schedule
                    </Link>
                    <button
                      onClick={() => act(r.id, "denied")}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full ghost-border text-xs font-semibold text-destructive hover:bg-destructive/5 transition"
                    >
                      <X className="w-3.5 h-3.5" /> Deny
                    </button>
                  </div>
                )}

                {tab === "outgoing" && (
                  <div className="mt-4">
                    <Link
                      to={`/app/contact/${c.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
                    >
                      View profile <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
};

export default AccessRequests;