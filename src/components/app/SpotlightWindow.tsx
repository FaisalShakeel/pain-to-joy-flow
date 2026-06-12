import { useMemo, useState } from "react";
import {
  Radio, ChevronDown, ArrowRight, Users as UsersIcon, Briefcase, Heart,
  Home, Star, Crown, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Avatar from "./Avatar";
import { Link } from "react-router-dom";

/* ------------------------------------------------------------------ */
/* Spotlight Relay Board — Availability Intelligence                   */
/* ------------------------------------------------------------------ */

type BoardStatus =
  | "available" | "busy" | "focus" | "meeting" | "away" | "offline";

interface RelayRow {
  id: string;
  name: string;
  initials: string;
  accent: string;
  status: BoardStatus;
  context: string;
  action?: "qs" | "fs" | "ea";
}

const STATUS: Record<BoardStatus, { label: string; dot: string; text: string }> = {
  available: { label: "Available",  dot: "bg-emerald-500", text: "text-emerald-400" },
  busy:      { label: "Busy",       dot: "bg-amber-500",   text: "text-amber-400"   },
  focus:     { label: "Focus Mode", dot: "bg-rose-500",    text: "text-rose-400"    },
  meeting:   { label: "In Meeting", dot: "bg-sky-500",     text: "text-sky-400"     },
  away:      { label: "Away",       dot: "bg-slate-500",   text: "text-slate-400"   },
  offline:   { label: "Offline",    dot: "bg-zinc-400",    text: "text-zinc-400"    },
};

const ACTION: Record<"qs" | "fs" | "ea", { label: string; cls: string; href: string }> = {
  qs: { label: "Book QS", cls: "text-emerald-400 hover:text-emerald-300", href: "/app/availability/quick-sync" },
  fs: { label: "Book FS", cls: "text-sky-400 hover:text-sky-300",         href: "/app/availability/focus-meetings" },
  ea: { label: "Book EA", cls: "text-amber-400 hover:text-amber-300",     href: "/app/availability/webinars" },
};

type WatchlistId = "family" | "friends" | "office" | "clients" | "vip" | "all";

const WATCHLISTS: { id: WatchlistId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "all",     label: "My Watchlist", icon: Layers },
  { id: "family",  label: "Family",       icon: Home },
  { id: "friends", label: "Friends",      icon: Heart },
  { id: "office",  label: "Office",       icon: Briefcase },
  { id: "clients", label: "Clients",      icon: Star },
  { id: "vip",     label: "VIP",          icon: Crown },
];

const ROSTER: Record<WatchlistId, RelayRow[]> = {
  all: [
    { id: "rashid", name: "Rashid", initials: "RA", accent: "from-emerald-500 to-emerald-700", status: "available", context: "Quick Sync Open",     action: "qs" },
    { id: "sarah",  name: "Sarah",  initials: "SA", accent: "from-rose-500 to-rose-700",       status: "focus",     context: "Free by 3:00 PM",     action: "fs" },
    { id: "ahmed",  name: "Ahmed",  initials: "AH", accent: "from-amber-500 to-amber-700",     status: "busy",      context: "Meeting until 2:30 PM", action: "ea" },
    { id: "david",  name: "David",  initials: "DA", accent: "from-sky-500 to-sky-700",         status: "meeting",   context: "Free by 4:00 PM",     action: "fs" },
    { id: "maria",  name: "Maria",  initials: "MA", accent: "from-emerald-500 to-emerald-700", status: "available", context: "Full Session Open",   action: "fs" },
    { id: "john",   name: "John",   initials: "JO", accent: "from-slate-500 to-slate-700",     status: "away",      context: "Back tomorrow" },
  ],
  family:  [],
  friends: [],
  office:  [],
  clients: [],
  vip:     [],
};

const STATUS_RANK: Record<BoardStatus, number> = {
  available: 0, busy: 3, focus: 2, meeting: 4, away: 5, offline: 6,
};

const SpotlightWindow = () => {
  const [watchlist, setWatchlist] = useState<WatchlistId>("all");
  const [expanded, setExpanded] = useState(false);

  const rows = useMemo(() => {
    const base = ROSTER[watchlist].length ? ROSTER[watchlist] : ROSTER.all;
    const sorted = [...base].sort((a, b) => {
      // Available + Quick Sync first
      const aq = a.status === "available" && a.action === "qs" ? -1 : 0;
      const bq = b.status === "available" && b.action === "qs" ? -1 : 0;
      if (aq !== bq) return aq - bq;
      return STATUS_RANK[a.status] - STATUS_RANK[b.status];
    });
    return expanded ? sorted.slice(0, 12) : sorted.slice(0, 6);
  }, [watchlist, expanded]);

  const summary = useMemo(() => {
    const c = { available: 0, focus: 0, busy: 0, meeting: 0, away: 0 } as Record<string, number>;
    rows.forEach((r) => { if (r.status in c) c[r.status]++; });
    return c;
  }, [rows]);

  const active = WATCHLISTS.find((w) => w.id === watchlist) ?? WATCHLISTS[0];
  const ActiveIcon = active.icon;

  return (
    <section className="w-full min-w-0 max-w-full rounded-[1.35rem] bg-[#0b1220] text-slate-100 ghost-border shadow-soft overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between gap-2 px-3 md:px-4 py-2.5 border-b border-white/5 bg-gradient-to-r from-[#0b1220] via-[#0d1628] to-[#0b1220]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="grid place-items-center w-6 h-6 rounded-md bg-primary/20 text-primary">
            <Radio className="w-3.5 h-3.5" />
          </span>
          <h3 className="font-headline font-extrabold text-[12px] md:text-[13px] tracking-[0.14em] uppercase text-slate-100">
            Spotlight Relay
          </h3>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 text-[9px] font-bold uppercase tracking-wider">
            <span className="relative grid place-items-center w-1.5 h-1.5">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
              <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </span>
            Live
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-slate-200 transition">
                <ActiveIcon className="w-3 h-3 opacity-80" />
                {active.label}
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {WATCHLISTS.map((w) => {
                const I = w.icon;
                return (
                  <DropdownMenuItem key={w.id} onClick={() => setWatchlist(w.id)}>
                    <I className="w-3.5 h-3.5 mr-2" /> {w.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="grid place-items-center w-7 h-7 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300"
            aria-label={expanded ? "Show 6 contacts" : "Expand to 12"}
            title={expanded ? "Show 6" : "Expand to 12"}
          >
            <UsersIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-px bg-white/5">
        {/* Left — Tabular roster */}
        <div className="bg-[#0b1220] p-2.5 md:p-3">
          <div className="grid grid-cols-[1.1fr_1fr_1.4fr_auto] gap-2 px-2 pb-1.5 text-[9px] font-bold tracking-[0.18em] uppercase text-slate-500">
            <span>Name</span>
            <span>Status</span>
            <span>Context</span>
            <span className="text-right">Action</span>
          </div>
          <ul className="divide-y divide-white/5">
            {rows.map((r) => {
              const s = STATUS[r.status];
              const a = r.action ? ACTION[r.action] : null;
              return (
                <li key={r.id}>
                  <Link
                    to={`/app/contact/${r.id}`}
                    className="grid grid-cols-[1.1fr_1fr_1.4fr_auto] gap-2 items-center px-2 py-2 rounded-md hover:bg-white/[0.04] transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar initials={r.initials} accent={r.accent} size="sm" />
                      <span className="text-[12px] font-semibold text-slate-100 truncate">{r.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", s.dot)} />
                      <span className={cn("text-[11px] font-semibold truncate", s.text)}>{s.label}</span>
                    </div>
                    <div className="text-[11px] text-slate-300 truncate">{r.context}</div>
                    <div className="text-right">
                      {a ? (
                        <span className={cn("inline-flex items-center gap-1 text-[11px] font-bold whitespace-nowrap", a.cls)}>
                          {a.label} <ArrowRight className="w-2.5 h-2.5" />
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[11px]">—</span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right — Relay strip + Summary */}
        <div className="bg-[#0b1220] p-2.5 md:p-3 space-y-2.5">
          {/* Relay strip */}
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
            <p className="text-[9px] font-bold tracking-[0.18em] uppercase text-slate-500 mb-2">Relay Strip</p>
            <div className="grid grid-cols-6 gap-1.5">
              {rows.slice(0, 6).map((r) => {
                const s = STATUS[r.status];
                return (
                  <Link
                    key={r.id}
                    to={`/app/contact/${r.id}`}
                    className="flex flex-col items-center gap-1 rounded-md p-1 hover:bg-white/[0.04] transition"
                    title={`${r.name} · ${s.label}`}
                  >
                    <div className="relative">
                      <Avatar initials={r.initials} accent={r.accent} size="sm" />
                      <span className={cn("absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-[#0b1220]", s.dot)} />
                    </div>
                    <span className="text-[9px] font-semibold text-slate-200 truncate w-full text-center">{r.name}</span>
                    <span className={cn("text-[8px] font-semibold uppercase tracking-wider truncate w-full text-center", s.text)}>
                      {s.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
            <p className="text-[9px] font-bold tracking-[0.18em] uppercase text-slate-500 mb-2">Summary</p>
            <div className="grid grid-cols-5 gap-1.5">
              {([
                { k: "available", label: "Available" },
                { k: "focus",     label: "Focus" },
                { k: "busy",      label: "Busy" },
                { k: "meeting",   label: "Meeting" },
                { k: "away",      label: "Away" },
              ] as const).map((c) => {
                const s = STATUS[c.k];
                return (
                  <div key={c.k} className="rounded-md bg-white/[0.03] border border-white/5 px-1.5 py-1.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
                      <span className="text-[13px] font-extrabold text-slate-100 leading-none">{summary[c.k] ?? 0}</span>
                    </div>
                    <p className={cn("mt-1 text-[9px] font-semibold uppercase tracking-wider", s.text)}>{c.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Link
        to="/app/contacts"
        className="flex items-center justify-center gap-1.5 px-3 py-2 border-t border-white/5 bg-[#0a111d] text-[11px] font-semibold text-slate-300 hover:text-slate-100 transition"
      >
        View Full Availability Directory <ArrowRight className="w-3 h-3" />
      </Link>
    </section>
  );
};

export default SpotlightWindow;
};