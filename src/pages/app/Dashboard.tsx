import { Link } from "react-router-dom";
import {
  CalendarDays, ArrowRight, Inbox, ShieldCheck, Clock, Users, TrendingUp, ChevronDown, Pencil, Check,
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
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type StatusKey = "available" | "busy" | "focus" | "driving" | "offline";

const statusMeta: Record<StatusKey, { label: string; activeBg: string; activeText: string; ring: string; pillBg: string; pillText: string; dot: string }> = {
  available: { label: "Available", activeBg: "bg-emerald-500",  activeText: "text-white", ring: "ring-emerald-500/30",  pillBg: "bg-emerald-500/10",  pillText: "text-emerald-700",  dot: "bg-emerald-500" },
  busy:      { label: "Busy",      activeBg: "bg-rose-500",     activeText: "text-white", ring: "ring-rose-500/30",     pillBg: "bg-rose-500/10",     pillText: "text-rose-700",     dot: "bg-rose-500" },
  focus:     { label: "Focus",     activeBg: "bg-violet-600",   activeText: "text-white", ring: "ring-violet-600/30",   pillBg: "bg-violet-600/10",   pillText: "text-violet-700",   dot: "bg-violet-600" },
  driving:   { label: "Driving",   activeBg: "bg-orange-500",   activeText: "text-white", ring: "ring-orange-500/30",   pillBg: "bg-orange-500/10",   pillText: "text-orange-700",   dot: "bg-orange-500" },
  offline:   { label: "Offline",   activeBg: "bg-muted-foreground/70", activeText: "text-white", ring: "ring-muted-foreground/30", pillBg: "bg-muted",  pillText: "text-muted-foreground", dot: "bg-muted-foreground/60" },
};

// Auto status (Line 2) — system-synced based on current mode
const AUTO_STATUS: Record<StatusKey, string> = {
  available: "Available for technical sync",
  busy:      "In a meeting",
  focus:     "In deep work mode",
  driving:   "Driving — hands-free only",
  offline:   "Offline — back tomorrow",
};

// Default context (Line 3) — switches with status mode, brand-flavored
const DEFAULT_CONTEXT: Record<StatusKey, string> = {
  available: "HOPEN 4 Business.",
  busy:      "BUSY — Ping, don't call.",
  focus:     "FOCUS mode — no interruptions.",
  driving:   "DRIVING — hands-free only.",
  offline:   "OFFLINE — back tomorrow.",
};

// Quick context (Line 3) — categorized with personality
const CONTEXT_GROUPS: { label: string; items: string[] }[] = [
  { label: "Practical", items: [
    "Leave a message if urgent",
    "Available for quick sync",
    "Call only if urgent",
    "Will respond shortly",
    "Back soon",
    "On the move",
    "Offline for now",
  ]},
  { label: "Personal", items: [
    "With guests",
    "At prayers",
    "Taking a short break",
    "Stepping out",
    "In between meetings",
  ]},
  { label: "Boundaries", items: [
    "Do not call",
    "Do not disturb",
    "Messages only",
    "Focus time — no interruptions",
  ]},
  { label: "Human", items: [
    "Waiting 4 business",
    "Brain loading…",
    "Running on coffee ☕",
    "Quick ping works best",
    "Keep it short, I'm in flow",
    "Silent but working",
  ]},
  { label: "Light humor", items: [
    "Powder room break",
    "On a mission 🚀",
    "In a thinking loop",
    "Available… mentally negotiating 😄",
    "Multitasking like a pro",
  ]},
];

const Dashboard = () => {
  const [status, setStatus] = useState<StatusKey>("available");
  const [contextMessage, setContextMessage] = useState<string>(DEFAULT_CONTEXT.available);
  const [contextTouched, setContextTouched] = useState(false);
  const [lastCustom, setLastCustom] = useState<string>("");
  const [editingCustom, setEditingCustom] = useState(false);
  const [customDraft, setCustomDraft] = useState("");
  const [role] = useRole();
  const { list } = useRequests();
  const incoming = list.filter((r) => r.direction === "incoming" && r.state === "pending");
  const meta = statusMeta[status];
  const autoStatus = AUTO_STATUS[status];

  const handleStatusChange = (s: StatusKey) => {
    setStatus(s);
    if (!contextTouched) setContextMessage(DEFAULT_CONTEXT[s]);
  };

  const handleContextSelect = (m: string) => {
    setContextMessage(m);
    setContextTouched(true);
  };

  return (
    <AppShell
      subtitle="Control center"
      title={`Good morning, ${me.name.split(" ")[0]}`}
      hideBell
      headerInline={
        <div className="inline-flex items-center gap-2 ml-2">
          <span className={cn("hidden sm:inline-flex p-0.5 rounded-full bg-surface-low ring-1 transition-colors", meta.ring)}>
            {(Object.keys(statusMeta) as StatusKey[]).map((s) => {
              const m = statusMeta[s];
              const active = status === s;
              return (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-semibold rounded-full transition inline-flex items-center gap-1.5",
                    active ? cn(m.activeBg, m.activeText, "shadow-glass") : "text-muted-foreground hover:text-primary",
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full", active ? "bg-current opacity-90" : m.dot)} />
                  {m.label}
                </button>
              );
            })}
          </span>
          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold sm:hidden", meta.pillBg, meta.pillText)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", meta.dot)} />
            {meta.label}
          </span>
        </div>
      }
    >
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Compact full-width Status pane */}
        <div className={cn(
          "lg:col-span-3 rounded-2xl bg-surface-lowest ghost-border px-4 py-3 shadow-ambient flex items-center justify-between gap-4 flex-wrap border-l-4 transition-colors",
        )} style={{ borderLeftColor: "currentColor" }}>
          <div className="flex items-center gap-3 min-w-0">
            <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold", meta.pillBg, meta.pillText)}>
              <span className={cn("w-1.5 h-1.5 rounded-full", meta.dot)} />
              {meta.label}
            </span>
            <div className="min-w-0">
              {/* Line 1 — Primary status (bold) */}
              <p className={cn("font-headline font-extrabold text-sm md:text-base leading-tight", meta.pillText)}>
                {meta.label}
              </p>
              {/* Line 2 — Auto status (system-synced) */}
              <p className="text-xs md:text-[13px] font-semibold text-primary/80 leading-tight mt-0.5 truncate max-w-[60vw] md:max-w-[28rem]">
                {autoStatus}
              </p>
              {/* Line 3 — Quick context (styled like brand tagline) */}
              <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                {editingCustom ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const v = customDraft.trim();
                      if (v) {
                        const trimmed = v.slice(0, 60);
                        setContextMessage(trimmed);
                        setLastCustom(trimmed);
                      }
                      setEditingCustom(false);
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <Input
                      autoFocus
                      value={customDraft}
                      onChange={(e) => setCustomDraft(e.target.value)}
                      maxLength={60}
                      placeholder="Type a custom context…"
                      className="h-7 text-xs w-56"
                    />
                    <button type="submit" className="grid place-items-center w-7 h-7 rounded-md bg-primary text-primary-foreground hover:opacity-90" aria-label="Save context">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="inline-flex items-center gap-1.5 text-xs md:text-[13px] font-medium italic text-muted-foreground hover:text-primary transition max-w-full">
                        <span className="truncate max-w-[60vw] md:max-w-[28rem]">
                          {contextMessage}
                        </span>
                        <ChevronDown className="w-3 h-3 shrink-0 opacity-70" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-80 max-h-[70vh] overflow-y-auto p-2 rounded-2xl border border-outline-variant/40 bg-surface-lowest/95 backdrop-blur shadow-elevated"
                    >
                      <div className="px-2 pt-1 pb-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Set your context</p>
                        <p className="text-xs text-primary/80 mt-0.5">Tell people how to approach you.</p>
                      </div>
                      {CONTEXT_GROUPS.map((group, gi) => {
                        const accent = ["bg-emerald-500", "bg-violet-500", "bg-rose-500", "bg-amber-500", "bg-sky-500"][gi % 5];
                        return (
                          <div key={group.label} className="mb-1">
                            <div className="flex items-center gap-1.5 px-2 pt-2 pb-1">
                              <span className={cn("w-1.5 h-1.5 rounded-full", accent)} />
                              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{group.label}</span>
                            </div>
                            <div className="grid grid-cols-1 gap-0.5">
                              {group.items.map((m) => {
                                const active = contextMessage === m;
                                return (
                                  <DropdownMenuItem
                                    key={m}
                                    onClick={() => setContextMessage(m)}
                                    className={cn(
                                      "text-xs rounded-lg px-2.5 py-1.5 cursor-pointer transition-colors",
                                      active ? "bg-primary/10 text-primary font-semibold" : "hover:bg-surface-low text-foreground/85",
                                    )}
                                  >
                                    <span className="flex-1 truncate">{m}</span>
                                    {active && <Check className="w-3.5 h-3.5 ml-2 text-primary shrink-0" />}
                                  </DropdownMenuItem>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                      {lastCustom && (
                        <>
                          <DropdownMenuSeparator className="my-1.5" />
                          <div className="flex items-center gap-1.5 px-2 pt-1 pb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Last custom</span>
                          </div>
                          <DropdownMenuItem
                            onClick={() => setContextMessage(lastCustom)}
                            className="text-xs italic rounded-lg px-2.5 py-1.5 hover:bg-surface-low cursor-pointer"
                          >
                            <span className="truncate flex-1">“{lastCustom}”</span>
                            {contextMessage === lastCustom && <Check className="w-3.5 h-3.5 ml-2 text-primary shrink-0" />}
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator className="my-1.5" />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          setCustomDraft(contextMessage);
                          setEditingCustom(true);
                        }}
                        className="text-xs rounded-lg px-2.5 py-2 cursor-pointer bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/15 hover:to-accent/15 text-primary font-semibold"
                      >
                        <Pencil className="w-3.5 h-3.5 mr-2" /> Write custom context…
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
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

function Chip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ghost-border bg-surface-low/60 text-[11px]">
      <span className="text-accent">{icon}</span>
      <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[9px]">{label}</span>
      <span className="font-bold text-primary">{value}</span>
    </span>
  );
}

export default Dashboard;