import { Link } from "react-router-dom";
import {
  CalendarDays, ArrowRight, Inbox, ShieldCheck, Clock, Users, TrendingUp,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import StatusPill from "@/components/app/StatusPill";
import Avatar from "@/components/app/Avatar";
import MessagesPanel from "@/components/app/MessagesPanel";
import PriorityContactsWidget from "@/components/app/PriorityContactsWidget";
import SpotlightBoard from "@/components/app/SpotlightBoard";
import { me, contacts, threads } from "@/lib/mockData";
import { useRequests } from "@/components/app/RequestsContext";
import { useState } from "react";
import { useRole } from "@/lib/role";

const Dashboard = () => {
  const [status, setStatus] = useState<"available" | "busy" | "focus">("available");
  const [role] = useRole();
  const { list } = useRequests();
  const incoming = list.filter((r) => r.direction === "incoming" && r.state === "pending");

  return (
    <AppShell
      subtitle="Control center"
      title={`Good morning, ${me.name.split(" ")[0]}`}
      hideBell
      headerInline={
        <div className="inline-flex items-center gap-2 ml-2">
          <span className="hidden sm:inline-flex p-0.5 rounded-full bg-surface-low">
            {(["available", "busy", "focus"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-full transition ${
                  status === s ? "bg-primary text-primary-foreground shadow-glass" : "text-muted-foreground hover:text-primary"
                }`}
              >
                {s === "available" ? "Available" : s === "busy" ? "Busy" : "Focus"}
              </button>
            ))}
          </span>
          <StatusPill tone={status} className="text-[10px] sm:hidden" />
        </div>
      }
    >
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Compact full-width Status pane */}
        <div className="lg:col-span-3 rounded-2xl bg-surface-lowest ghost-border px-4 py-3 shadow-ambient flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <StatusPill tone={status} className="text-[10px]" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-accent leading-none">Your status</p>
              <h2 className="mt-0.5 font-headline font-bold text-primary text-sm md:text-base truncate">
                {status === "available" ? "Available for technical syncs" : status === "busy" ? "Busy — async only" : "Deep focus until 17:00"}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Chip icon={<TrendingUp className="w-3 h-3" />} label="Streak" value={`${me.streak}d`} />
            <Chip icon={<ShieldCheck className="w-3 h-3" />} label="Saved" value={`${me.interruptionsSavedThisWeek}`} />
            <Chip icon={<Users className="w-3 h-3" />} label="Vault" value={`${contacts.length}`} />
          </div>
        </div>

        {/* Spotlight + Signal (no outer title; new spotlight inside tile) */}
        <div className="lg:col-span-3">
          <SpotlightBoard />
        </div>

        {/* Priority Contacts */}
        <div className="lg:col-span-3">
          <PriorityContactsWidget />
        </div>

        {/* Reserved Time */}
        <div className="lg:col-span-3 rounded-3xl bg-surface-lowest ghost-border p-5 shadow-ambient">
          <div className="flex items-center justify-between">
            <h3 className="font-headline font-bold text-primary inline-flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-accent" />
              Reserved Time <span aria-hidden>📅</span>
            </h3>
            <Link to="/app/availability" className="text-xs font-semibold text-accent hover:underline">View all</Link>
          </div>
          <ul className="mt-3 grid md:grid-cols-3 gap-2.5">
            {[
              { t: "10:00", who: "Sarah Jenkins", kind: "Board prep" },
              { t: "13:30", who: "Rashid Al-Amir", kind: "Technical sync" },
              { t: "16:00", who: "Open window", kind: "2 slots free" },
            ].map((s) => (
              <li key={s.t} className="flex items-center gap-3 p-2.5 rounded-xl ghost-border bg-surface-low/50">
                <span className="grid place-items-center w-10 h-10 rounded-xl bg-primary/10 text-primary text-xs font-bold shrink-0">
                  {s.t}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary truncate">{s.who}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.kind}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Messages panel */}
        <div className="lg:col-span-3">
          <MessagesPanel />
        </div>

        {/* Access requests */}
        <div className="lg:col-span-3 rounded-3xl bg-surface-lowest ghost-border p-5 shadow-ambient">
          <div className="flex items-center justify-between">
            <h3 className="font-headline font-bold text-primary">Access requests</h3>
            <Link to="/app/requests" className="text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1">
              Manage all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-border/50">
            {incoming.slice(0, 3).map((r) => {
              const c = contacts.find((x) => x.id === r.contactId)!;
              return (
                <li key={r.id}>
                  <Link
                    to={`/app/requests?id=${r.id}`}
                    className="py-3 flex items-center gap-3 hover:bg-surface-low/50 -mx-2 px-2 rounded-xl transition"
                  >
                    <Avatar initials={c.initials} accent={c.accent} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-primary truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.reason}</p>
                    </div>
                    <StatusPill tone="pending" />
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Recent activity */}
        <div className="lg:col-span-3 rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient">
          <h3 className="font-headline font-bold text-primary">Recent activity</h3>
          <ul className="mt-4 grid md:grid-cols-3 gap-3">
            {threads.map((t) => {
              const c = contacts.find((x) => x.id === t.contactId)!;
              return (
                <li key={t.id}>
                  <Link to="/app/messages" className="flex items-center gap-3 p-3 rounded-xl ghost-border bg-surface-low/50 hover:bg-surface-low transition">
                    <Avatar initials={c.initials} accent={c.accent} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-primary truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{t.preview}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {t.lastAt}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {role === "provider" && (
          <Link
            to="/app/analytics"
            className="lg:col-span-3 rounded-3xl ghost-border bg-surface-lowest p-5 flex items-center justify-between hover:bg-surface-low transition"
          >
            <div className="flex items-center gap-3">
              <span className="grid place-items-center w-10 h-10 rounded-xl bg-accent/10 text-accent">
                <CalendarDays className="w-5 h-5" />
              </span>
              <div>
                <p className="font-semibold text-primary text-sm">See how Availock is protecting your time</p>
                <p className="text-xs text-muted-foreground">Provider analytics — interruptions saved, response time, request mix.</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-primary" />
          </Link>
        )}
        {role !== "provider" && (
          <Link
            to="/app/contacts"
            className="lg:col-span-3 rounded-3xl ghost-border bg-surface-lowest p-5 flex items-center justify-between hover:bg-surface-low transition"
          >
            <div className="flex items-center gap-3">
              <span className="grid place-items-center w-10 h-10 rounded-xl bg-accent/10 text-accent">
                <Inbox className="w-5 h-5" />
              </span>
              <div>
                <p className="font-semibold text-primary text-sm">Find someone you want to reach</p>
                <p className="text-xs text-muted-foreground">Browse contacts and request access in one tap.</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-primary" />
          </Link>
        )}
      </div>
    </AppShell>
  );
};

function Stat({ label, value, hint, icon }: { label: string; value: string; hint: string; icon: React.ReactNode }) {
  return (
    <div className="p-3.5 rounded-2xl ghost-border bg-surface-low/50">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {icon} {label}
      </div>
      <p className="mt-1.5 font-headline font-extrabold text-primary text-2xl leading-none">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}

export default Dashboard;