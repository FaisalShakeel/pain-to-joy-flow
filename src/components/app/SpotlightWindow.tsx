import { useMemo, useState } from "react";
import {
  Radio, ChevronDown, ArrowRight, Settings2, Briefcase, Heart,
  Home, Star, Crown, Layers, Plus, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import Avatar from "./Avatar";
import { Link } from "react-router-dom";

/* ------------------------------------------------------------------ */
/* Spotlight Relay Board — Mobile-First Availability Intelligence     */
/* ------------------------------------------------------------------ */

type BoardStatus =
  | "available" | "busy" | "focus" | "driving" | "offline";

interface RelayRow {
  id: string;
  name: string;
  initials: string;
  accent: string;
  status: BoardStatus;
  context: string;
  activity: string;       // e.g. "Quick Sync Opened"
  updatedMinAgo: number;  // sort key — smaller = newer
  action?: "qs" | "fs" | "ea";
}

const STATUS: Record<BoardStatus, { label: string; dot: string; text: string; ring: string }> = {
  available: { label: "Available",  dot: "bg-emerald-500", text: "text-emerald-700", ring: "ring-emerald-500/60" },
  busy:      { label: "Busy",       dot: "bg-amber-500",   text: "text-amber-700",   ring: "ring-amber-500/60"   },
  focus:     { label: "Focus Mode", dot: "bg-rose-500",    text: "text-rose-700",    ring: "ring-rose-500/60"    },
  driving:   { label: "Driving",    dot: "bg-violet-500",  text: "text-violet-700",  ring: "ring-violet-500/60"  },
  offline:   { label: "Offline",    dot: "bg-slate-400",   text: "text-slate-600",   ring: "ring-slate-400/50"   },
};

const ACTION: Record<"qs" | "fs" | "ea", { label: string; cls: string; href: string }> = {
  qs: { label: "Quick Sync", cls: "text-emerald-700 bg-emerald-500/15 hover:bg-emerald-500/25", href: "/app/availability/quick-sync" },
  fs: { label: "Focus",      cls: "text-sky-700 bg-sky-500/15 hover:bg-sky-500/25",             href: "/app/availability/focus-meetings" },
  ea: { label: "Event",      cls: "text-amber-700 bg-amber-500/15 hover:bg-amber-500/25",       href: "/app/availability/webinars" },
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
    { id: "rashid", name: "Rashid", initials: "RA", accent: "from-emerald-500 to-emerald-700", status: "available", context: "Quick Sync Open",       activity: "Quick Sync Opened",    updatedMinAgo: 1,  action: "qs" },
    { id: "maria",  name: "Maria",  initials: "MA", accent: "from-emerald-500 to-emerald-700", status: "available", context: "Full Session Open",     activity: "Recently Available",   updatedMinAgo: 4,  action: "fs" },
    { id: "sarah",  name: "Sarah",  initials: "SA", accent: "from-rose-500 to-rose-700",       status: "focus",     context: "Free at 3:00 PM",       activity: "Focus Mode Started",   updatedMinAgo: 8,  action: "fs" },
    { id: "ahmed",  name: "Ahmed",  initials: "AH", accent: "from-amber-500 to-amber-700",     status: "busy",      context: "Meeting until 2:30 PM", activity: "Availability Updated", updatedMinAgo: 22, action: "ea" },
    { id: "david",  name: "David",  initials: "DA", accent: "from-violet-500 to-violet-700",   status: "driving",   context: "Back by 4:00 PM",       activity: "Driving Started",      updatedMinAgo: 35 },
    { id: "john",   name: "John",   initials: "JO", accent: "from-slate-500 to-slate-700",     status: "offline",   context: "Back tomorrow",         activity: "Went Offline",         updatedMinAgo: 90 },
  ],
  family:  [],
  friends: [],
  office:  [],
  clients: [],
  vip:     [],
};

const RELAY_RANK: Record<BoardStatus, number> = {
  available: 0, busy: 1, focus: 2, driving: 3, offline: 4,
};

const SpotlightWindow = () => {
  const [watchlist, setWatchlist] = useState<WatchlistId>("all");
  const [following, setFollowing] = useState<Record<string, boolean>>(
    () => Object.fromEntries(ROSTER.all.map((r) => [r.id, true]))
  );

  const base = ROSTER[watchlist].length ? ROSTER[watchlist] : ROSTER.all;
  const followed = useMemo(() => base.filter((r) => following[r.id]), [base, following]);

  // Relay strip — priority order: Available → Busy → Focus → Driving → Offline
  const relay = useMemo(
    () => [...followed].sort((a, b) => RELAY_RANK[a.status] - RELAY_RANK[b.status]),
    [followed]
  );

  // Main feed — newest activity first
  const feed = useMemo(
    () => [...followed].sort((a, b) => a.updatedMinAgo - b.updatedMinAgo),
    [followed]
  );

  const active = WATCHLISTS.find((w) => w.id === watchlist) ?? WATCHLISTS[0];
  const ActiveIcon = active.icon;

  const fmtAgo = (m: number) =>
    m < 1 ? "Just now" : m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`;

  return (
    <section className="w-full min-w-0 max-w-full rounded-2xl bg-slate-100 text-slate-900 ghost-border shadow-soft overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2 min-w-0">
          <span className="grid place-items-center w-6 h-6 rounded-md bg-primary/10 text-primary">
            <Radio className="w-3.5 h-3.5" />
          </span>
          <h3 className="font-headline font-extrabold text-[12px] tracking-[0.14em] uppercase text-slate-900">
            Spotlight
          </h3>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 text-[9px] font-bold uppercase tracking-wider">
            <span className="relative grid place-items-center w-1.5 h-1.5">
              <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
              <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </span>
            Live
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700 transition">
                <ActiveIcon className="w-3 h-3 opacity-80" />
                <span className="hidden xs:inline">{active.label}</span>
                <span className="xs:hidden">{active.id === "all" ? "All" : active.label}</span>
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
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                className="grid place-items-center w-7 h-7 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-600"
                aria-label="Manage watchlist"
                title="Manage watchlist"
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[88vw] sm:w-[420px]">
              <SheetHeader>
                <SheetTitle>Manage Watchlist</SheetTitle>
              </SheetHeader>
              <p className="mt-1 text-xs text-muted-foreground">
                Follow or unfollow contacts. Only followed contacts appear in Spotlight.
              </p>
              <ul className="mt-3 divide-y divide-border">
                {base.map((r) => {
                  const isOn = !!following[r.id];
                  return (
                    <li key={r.id} className="flex items-center gap-2 py-2">
                      <Avatar initials={r.initials} accent={r.accent} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{r.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{STATUS[r.status].label}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFollowing((f) => ({ ...f, [r.id]: !isOn }))}
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border transition",
                          isOn
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-foreground border-border hover:bg-muted",
                        )}
                      >
                        {isOn ? <><Check className="w-3 h-3" /> Following</> : <><Plus className="w-3 h-3" /> Follow</>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Watchlist filter chips — horizontal scroll */}
      <div className="px-2 py-1.5 border-b border-slate-200 bg-slate-50/60 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 w-max">
          {WATCHLISTS.map((w) => {
            const I = w.icon;
            const on = w.id === watchlist;
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => setWatchlist(w.id)}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition whitespace-nowrap",
                  on
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                )}
              >
                <I className="w-3 h-3" /> {w.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Relay strip — horizontal scroll, priority order */}
      <div className="px-2 pt-2 pb-1.5 bg-slate-100">
        <div className="flex items-center justify-between px-1 pb-1.5">
          <p className="text-[9px] font-bold tracking-[0.18em] uppercase text-slate-500">Relay</p>
          <p className="text-[9px] font-semibold text-slate-400">{relay.length} followed</p>
        </div>
        <div className="flex items-stretch gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
          {relay.map((r) => {
            const s = STATUS[r.status];
            return (
              <Link
                key={r.id}
                to={`/app/contact/${r.id}`}
                title={`${r.name} · ${s.label}`}
                className="flex flex-col items-center gap-1 shrink-0 w-[58px] rounded-lg bg-white border border-slate-200 px-1 py-1.5 hover:border-slate-300 transition"
              >
                <div className={cn("relative rounded-full ring-2 ring-offset-2 ring-offset-white", s.ring)}>
                  <Avatar initials={r.initials} accent={r.accent} size="sm" />
                  <span className={cn("absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white", s.dot)} />
                </div>
                <span className="text-[10px] font-semibold text-slate-800 truncate w-full text-center leading-tight">
                  {r.name}
                </span>
              </Link>
            );
          })}
          {relay.length === 0 && (
            <p className="text-[11px] text-slate-500 px-2 py-3">No contacts followed yet.</p>
          )}
        </div>
      </div>

      {/* Main feed — newest activity first */}
      <div className="bg-slate-100 px-2 pb-2">
        <div className="flex items-center justify-between px-1 pt-1.5 pb-1.5">
          <p className="text-[9px] font-bold tracking-[0.18em] uppercase text-slate-500">Activity Feed</p>
          <p className="text-[9px] font-semibold text-slate-400">Newest first</p>
        </div>
        <ul className="space-y-1.5">
          {feed.map((r) => {
            const s = STATUS[r.status];
            const a = r.action ? ACTION[r.action] : null;
            return (
              <li key={r.id}>
                <Link
                  to={`/app/contact/${r.id}`}
                  className="flex items-center gap-2 px-2 py-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition"
                >
                  <div className={cn("relative rounded-full ring-2 ring-offset-2 ring-offset-white shrink-0", s.ring)}>
                    <Avatar initials={r.initials} accent={r.accent} size="sm" />
                    <span className={cn("absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white", s.dot)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[13px] font-bold text-slate-900 truncate">{r.name}</span>
                      <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider", s.text)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
                        {s.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 truncate leading-tight">
                      {r.context} · <span className="text-slate-400">{fmtAgo(r.updatedMinAgo)}</span>
                    </p>
                  </div>
                  {a && (
                    <span className={cn("shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition", a.cls)}>
                      {a.label} <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
          {feed.length === 0 && (
            <li className="text-[11px] text-slate-500 px-2 py-4 text-center">
              No followed contacts in this watchlist.
            </li>
          )}
        </ul>
      </div>

      {/* Footer */}
      <Link
        to="/app/contacts"
        className="flex items-center justify-center gap-1.5 px-3 py-2 border-t border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 hover:text-slate-900 transition"
      >
        Full Availability Directory <ArrowRight className="w-3 h-3" />
      </Link>
    </section>
  );
};

export default SpotlightWindow;
