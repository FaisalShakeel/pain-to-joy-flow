import { Link } from "react-router-dom";
import {
  CalendarDays, ArrowRight, Inbox, ShieldCheck, Sparkles, Clock, Users, TrendingUp,
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
      actions={
        <Link
          to="/app/share"
          className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-glass hover:opacity-95 transition"
        >
          <Sparkles className="w-4 h-4" /> Share my vault
        </Link>
      }
    >
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Spotlight board (moved above status) */}
        <div className="lg:col-span-3">
          <SpotlightBoard />
        </div>

        {/* Status card */}
        <div className="lg:col-span-2 rounded-3xl bg-surface-lowest ghost-border p-6 md:p-7 shadow-ambient">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-accent">Your status</p>
              <h2 className="mt-1 font-headline font-extrabold text-primary text-2xl md:text-3xl">
                {status === "available" ? "Available for technical syncs" : status === "busy" ? "Busy — async only" : "Deep focus until 17:00"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                Your status is what seekers see first. It updates automatically with your activity and appointments—or you can change it instantly, without explanation.
              </p>
            </div>
            <StatusPill tone={status} className="text-xs" />
          </div>

          <div className="mt-5 inline-flex p-1 rounded-full bg-surface-low">
            {(["available", "busy", "focus"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-full transition ${
                  status === s ? "bg-primary text-primary-foreground shadow-glass" : "text-muted-foreground hover:text-primary"
                }`}
              >
                {s === "available" ? "Available" : s === "busy" ? "Busy" : "Focus"}
              </button>
            ))}
          </div>

          <div className="mt-6 grid sm:grid-cols-3 gap-3">
            <Stat label="Streak" value={`${me.streak} days`} hint="of protected focus" icon={<TrendingUp className="w-4 h-4" />} />
            <Stat label="Saved this week" value={`${me.interruptionsSavedThisWeek}`} hint="interruptions filtered" icon={<ShieldCheck className="w-4 h-4" />} />
            <Stat label="Vault contacts" value={`${contacts.length}`} hint="approved syncs" icon={<Users className="w-4 h-4" />} />
          </div>
        </div>

        {/* Reserved Time */}
        <div className="rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient">
          <div className="flex items-center justify-between">
            <h3 className="font-headline font-bold text-primary inline-flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-accent" />
              Reserved Time <span aria-hidden>📅</span>
            </h3>
            <Link to="/app/availability" className="text-xs font-semibold text-accent hover:underline">View all</Link>
          </div>
          <ul className="mt-4 space-y-2.5">
            {[
              { t: "10:00", who: "Sarah Jenkins", kind: "Board prep" },
              { t: "13:30", who: "Rashid Al-Amir", kind: "Technical sync" },
              { t: "16:00", who: "Open window", kind: "2 slots free" },
            ].map((s) => (
              <li key={s.t} className="flex items-center gap-3 p-3 rounded-xl ghost-border bg-surface-low/50">
                <span className="grid place-items-center w-10 h-10 rounded-xl bg-primary/10 text-primary text-xs font-bold">
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

        {/* Priority Contacts (6) */}
        <div className="lg:col-span-3">
          <PriorityContactsWidget />
        </div>

        {/* Messages panel */}
        <div className="lg:col-span-1">
          <MessagesPanel />
        </div>

        {/* Access requests */}
        <div className="lg:col-span-2 rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient">
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