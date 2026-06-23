import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight, Filter, Briefcase, Heart, Home, Star, Crown, Layers, Radio, Network,
  Plus, Check, Users, MoreHorizontal, Pencil, Trash2, Undo2, Search, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
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

type IconKey = "star" | "layers" | "briefcase" | "crown" | "heart" | "home" | "users";
const ICONS: Record<IconKey, React.ComponentType<{ className?: string }>> = {
  star: Star, layers: Layers, briefcase: Briefcase, crown: Crown,
  heart: Heart, home: Home, users: Users,
};
interface Watchlist { id: string; label: string; icon: IconKey; members: string[]; system?: boolean; }
const ALL_IDS = (rows: RelayRow[]) => rows.map((r) => r.id);
const DEFAULT_WATCHLISTS = (rows: RelayRow[]): Watchlist[] => [
  { id: "mine",       label: "My Watchlist", icon: "star",      members: ALL_IDS(rows), system: true },
  { id: "all",        label: "All",          icon: "layers",    members: ALL_IDS(rows), system: true },
  { id: "colleagues", label: "Colleagues",   icon: "briefcase", members: ["rashid","sarah","ahmed","jd"] },
  { id: "clients",    label: "Clients",      icon: "crown",     members: ["ahmed","david"] },
  { id: "friends",    label: "Friends",      icon: "heart",     members: ["elena","kl","rt"] },
  { id: "family",     label: "Family",       icon: "home",      members: [] },
];

const ALL_ROWS: RelayRow[] = [
  { id: "rashid", name: "Rashid",   initials: "RA", accent: "from-emerald-500 to-emerald-700", status: "available", context: "Open for Quick Sync calls after sprint review.", activity: "1m ago",     updatedMinAgo: 1,  action: "qs" },
  { id: "sarah",  name: "Sarah",    initials: "SA", accent: "from-rose-500 to-rose-700",       status: "focus",     context: "Drafting security audit. Available at 3:00 PM.",  activity: "2h steady",  updatedMinAgo: 8,  action: "fs" },
  { id: "ahmed",  name: "Ahmed",    initials: "AH", accent: "from-amber-500 to-amber-700",     status: "busy",      context: "Client meeting until 2:30 PM (Architectural Hub).", activity: "22m active", updatedMinAgo: 22, action: "ea" },
  { id: "david",  name: "David",    initials: "DA", accent: "from-violet-500 to-violet-700",   status: "driving",   context: "Traveling. Hands-free only. Desk by 4:00 PM.",    activity: "35m ago",    updatedMinAgo: 35 },
  { id: "elena",  name: "Elena M.", initials: "EM", accent: "from-emerald-500 to-emerald-700", status: "available", context: "Coffee shop co-working. Open for sync.",           activity: "Just now",   updatedMinAgo: 0,  action: "qs" },
  { id: "jd",     name: "Jordan",   initials: "JD", accent: "from-rose-500 to-rose-700",       status: "focus",     context: "Deep work block until 5:00 PM.",                  activity: "12m",        updatedMinAgo: 12, action: "fs" },
  { id: "kl",     name: "Kai L.",   initials: "KL", accent: "from-amber-500 to-amber-700",     status: "busy",      context: "On a call. Try again at 4 PM.",                   activity: "18m",        updatedMinAgo: 18 },
  { id: "rt",     name: "Riya T.",  initials: "RT", accent: "from-violet-500 to-violet-700",   status: "driving",   context: "Driving home. ETA 30 min.",                       activity: "5m",         updatedMinAgo: 5 },
];

const RELAY_RANK: Record<BoardStatus, number> = {
  available: 0, busy: 1, focus: 2, driving: 3, offline: 4,
};

/* -------- Coordination Board (12-person fixed layout) -------- */
interface BoardTile {
  id: string;
  name: string;
  initials: string;
  status: BoardStatus;
  context: string;
  time: string;
}
const BOARD_COLOR: Record<BoardStatus, { bg: string; dot: string; text: string }> = {
  available: { bg: "bg-emerald-500", dot: "bg-emerald-500", text: "text-emerald-600" },
  busy:      { bg: "bg-amber-500",   dot: "bg-amber-500",   text: "text-amber-600"   },
  offline:   { bg: "bg-slate-400",   dot: "bg-slate-400",   text: "text-slate-500"   },
  focus:     { bg: "bg-rose-500",    dot: "bg-rose-500",    text: "text-rose-600"    },
  driving:   { bg: "bg-violet-500",  dot: "bg-violet-500",  text: "text-violet-600"  },
};
const BOARD_LEFT: BoardTile[] = [
  { id: "elena",  name: "Elena M.", initials: "EM", status: "available", context: "Coffee shop co-working. Open for sync.",            time: "2m ago" },
  { id: "kl",     name: "Kai L.",   initials: "KL", status: "busy",      context: "On a call. Try again at 4 PM.",                     time: "2m ago" },
  { id: "ahmed",  name: "Ahmed",    initials: "AH", status: "offline",   context: "Client meeting until 2:30 PM (Architectural Hub).", time: "2m ago" },
  { id: "rashid", name: "Rashid",   initials: "RA", status: "available", context: "Open for Quick Sync calls after sprint review.",    time: "2m ago" },
  { id: "lisa",   name: "Lisa S.",  initials: "LS", status: "available", context: "Available for support.",                            time: "2m ago" },
  { id: "maya",   name: "Maya T.",  initials: "MT", status: "offline",   context: "Out of office. Back tomorrow.",                     time: "2m ago" },
];
const BOARD_RIGHT: BoardTile[] = [
  { id: "sarah",  name: "Sarah",    initials: "SA", status: "focus",     context: "Drafting security audit. Available at 3:00 PM.",   time: "2m ago" },
  { id: "jd",     name: "Jordan",   initials: "JD", status: "focus",     context: "Deep work block until 5:00 PM.",                   time: "2m ago" },
  { id: "rt",     name: "Riya T.",  initials: "RT", status: "driving",   context: "Driving home. ETA 30 min.",                        time: "2m ago" },
  { id: "daniel", name: "Daniel S.",initials: "DS", status: "focus",     context: "Focus time. Do not disturb.",                      time: "2m ago" },
  { id: "priya",  name: "Priya C.", initials: "PC", status: "focus",     context: "Code review focus block.",                         time: "2m ago" },
  { id: "naveed", name: "Naveed W.",initials: "NW", status: "driving",   context: "On the way to client site.",                       time: "2m ago" },
];

const BoardRow = ({ t }: { t: BoardTile }) => {
  const c = BOARD_COLOR[t.status];
  return (
    <Link
      to={`/app/contact/${t.id}`}
      className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-slate-50 transition border-b border-slate-100 last:border-b-0 min-h-[52px]"
    >
      <div className="relative shrink-0">
        <div className={cn("w-8 h-8 rounded-full grid place-items-center text-white text-[10px] font-bold", c.bg)}>
          {t.initials}
        </div>
        <span className={cn("absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-white", c.dot)} />
      </div>
      {/* Desktop/tablet: context | name+time on the right */}
      <div className="hidden sm:flex flex-1 min-w-0 items-center gap-2">
        <p className="flex-1 min-w-0 text-[12px] text-slate-700 leading-tight line-clamp-2">
          {t.context}
        </p>
        <div className="text-right shrink-0 max-w-[40%]">
          <p className="text-[12px] font-semibold text-slate-900 leading-tight truncate">{t.name}</p>
          <p className="text-[10px] text-slate-400 leading-tight truncate">{t.time}</p>
        </div>
      </div>
      {/* Mobile: two stacked rows — context, then name • time */}
      <div className="flex sm:hidden flex-1 min-w-0 flex-col">
        <p className="text-[12px] text-slate-700 leading-tight line-clamp-2">{t.context}</p>
        <p className="text-[11px] leading-tight truncate">
          <span className="font-semibold text-slate-900">{t.name}</span>
          <span className="text-slate-400"> • {t.time}</span>
        </p>
      </div>
    </Link>
  );
};

const SpotlightWindow = () => {
  const base = ALL_ROWS;
  const [tab, setTab] = useState<"pulse" | "coordination">("pulse");
  const [lists, setLists] = useState<Watchlist[]>(() => DEFAULT_WATCHLISTS(base));
  const [activeId, setActiveId] = useState<string>("mine");
  const [manageOpen, setManageOpen] = useState(false);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [bulk, setBulk] = useState<Set<string>>(new Set());
  const [trash, setTrash] = useState<{ list: Watchlist; index: number } | null>(null);
  const trashTimer = useRef<number | null>(null);
  const [newListName, setNewListName] = useState("");

  const active = lists.find((l) => l.id === activeId) ?? lists[0];
  const followed = useMemo(
    () => base.filter((r) => active?.members.includes(r.id)),
    [base, active]
  );

  const relay = useMemo(
    () => [...followed].sort((a, b) => RELAY_RANK[a.status] - RELAY_RANK[b.status]),
    [followed]
  );

  // Build 12-tile board (6 left, 6 right) from followed contacts, padded if needed.
  const board = useMemo(() => {
    const toTile = (r: RelayRow): BoardTile => ({
      id: r.id, name: r.name, initials: r.initials, status: r.status,
      context: r.context, time: r.activity,
    });
    const leftStatuses: BoardStatus[] = ["available", "busy", "offline"];
    const rightStatuses: BoardStatus[] = ["focus", "driving"];
    const left = followed.filter((r) => leftStatuses.includes(r.status)).map(toTile);
    const right = followed.filter((r) => rightStatuses.includes(r.status)).map(toTile);
    const padL = [...BOARD_LEFT].filter((t) => !left.find((x) => x.id === t.id));
    const padR = [...BOARD_RIGHT].filter((t) => !right.find((x) => x.id === t.id));
    return {
      left: [...left, ...padL].slice(0, 6),
      right: [...right, ...padR].slice(0, 6),
    };
  }, [followed]);

  // Mutators
  const toggleMember = (listId: string, contactId: string) => {
    setLists((ls) =>
      ls.map((l) =>
        l.id === listId
          ? { ...l, members: l.members.includes(contactId)
              ? l.members.filter((m) => m !== contactId)
              : [...l.members, contactId] }
          : l,
      ),
    );
  };
  const bulkAdd = (listId: string) => {
    setLists((ls) =>
      ls.map((l) =>
        l.id === listId
          ? { ...l, members: Array.from(new Set([...l.members, ...Array.from(bulk)])) }
          : l,
      ),
    );
    setBulk(new Set());
  };
  const bulkRemove = (listId: string) => {
    setLists((ls) =>
      ls.map((l) =>
        l.id === listId ? { ...l, members: l.members.filter((m) => !bulk.has(m)) } : l,
      ),
    );
    setBulk(new Set());
  };
  const createList = () => {
    const name = newListName.trim();
    if (!name) return;
    const id = `wl_${Date.now()}`;
    setLists((ls) => [...ls, { id, label: name, icon: "users", members: [] }]);
    setNewListName("");
    setActiveId(id);
  };
  const renameList = (id: string, label: string) => {
    setLists((ls) => ls.map((l) => (l.id === id ? { ...l, label } : l)));
  };
  const setListIcon = (id: string, icon: IconKey) => {
    setLists((ls) => ls.map((l) => (l.id === id ? { ...l, icon } : l)));
  };
  const deleteList = (id: string) => {
    const idx = lists.findIndex((l) => l.id === id);
    if (idx < 0) return;
    const removed = lists[idx];
    if (removed.system) return;
    setTrash({ list: removed, index: idx });
    setLists((ls) => ls.filter((l) => l.id !== id));
    if (activeId === id) setActiveId("mine");
    if (trashTimer.current) window.clearTimeout(trashTimer.current);
    trashTimer.current = window.setTimeout(() => setTrash(null), 8000);
  };
  const undoDelete = () => {
    if (!trash) return;
    setLists((ls) => {
      const next = [...ls];
      next.splice(trash.index, 0, trash.list);
      return next;
    });
    setTrash(null);
  };

  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter((r) => r.name.toLowerCase().includes(q));
  }, [base, search]);

  return (
    <section className="w-full min-w-0 max-w-full rounded-2xl bg-white text-slate-900 ghost-border shadow-soft overflow-hidden">
      {/* Contact Pulse header — match dashboard module header treatment */}
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 pt-4 pb-3 border-b border-slate-200">
        <div className="min-w-0">
          <p className="module-eyebrow inline-flex items-center gap-1.5">
            {tab === "pulse" ? <Radio className="w-3 h-3 text-accent/80" /> : <Network className="w-3 h-3 text-accent/80" />}
            {tab === "pulse" ? "Contact · Live" : "Coordination · Board"}
          </p>
          <h2 className="module-title mt-1.5">
            {tab === "pulse" ? "Contact Pulse" : "Coordination"}
          </h2>
          <p className="module-meta mt-1">
            {tab === "pulse"
              ? "Live availability of people you care about right now."
              : "Real-time board of who's reachable, busy, or focused."}
          </p>
          {/* Tab switcher */}
          <div className="mt-2 inline-flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
            <button
              type="button"
              onClick={() => setTab("pulse")}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-[0.14em] uppercase transition",
                tab === "pulse" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Radio className="w-3 h-3" /> Contact Pulse
            </button>
            <button
              type="button"
              onClick={() => setTab("coordination")}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-[0.14em] uppercase transition",
                tab === "coordination" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Network className="w-3 h-3" /> Coordination
            </button>
          </div>
        </div>
        {/* RIGHT: single watch-list dropdown — groups live behind it to maximize contact visibility */}
        <div className="flex items-center gap-1.5 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-[12px] font-semibold text-slate-700"
                aria-label="Switch watch list"
              >
                {active && (() => { const I = ICONS[active.icon]; return <I className="w-3.5 h-3.5" />; })()}
                <span className="max-w-[140px] truncate">{active?.label ?? "My Watch List"}</span>
                <span className="text-slate-400">▾</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-slate-500">
                Watch Lists
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {lists.map((w) => {
                const I = ICONS[w.icon];
                const on = w.id === activeId;
                return (
                  <DropdownMenuItem key={w.id} onClick={() => setActiveId(w.id)}>
                    <I className="w-3.5 h-3.5 mr-2" />
                    <span className="flex-1">{w.label}</span>
                    <span className="text-[10px] text-slate-400 mr-1">{w.members.length}</span>
                    {on && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setManageOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-2" /> Create New List
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setManageOpen(true)}>
                <Pencil className="w-3.5 h-3.5 mr-2" /> Manage watch lists
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {tab === "pulse" ? (
      <>
      {/* Watchlist avatar strip */}
      <div className="px-3 pt-3 pb-2">
        <div className="rounded-2xl bg-slate-50 border border-slate-200/70 px-3 py-3">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
            {relay.map((r) => {
              const s = STATUS[r.status];
              return (
                <Link
                  key={r.id}
                  to={`/app/contact/${r.id}`}
                  title={`${r.name} · ${s.label}`}
                  className="relative shrink-0"
                >
                  <Avatar initials={r.initials} accent={r.accent} size="md" />
                  <span className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-slate-50", s.dot)} />
                </Link>
              );
            })}
            {relay.length === 0 && (
              <div className="w-full text-center py-4">
                <p className="text-[12px] text-slate-600 mb-2">
                  Create your first watch list to monitor the people who matter most.
                </p>
                <button
                  type="button"
                  onClick={() => setManageOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-900 text-white text-[11px] font-semibold"
                >
                  <Plus className="w-3 h-3" /> Create Watch List
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compact Pulse board (12 entries) */}
      <div className="px-3 pt-2 pb-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="rounded-lg bg-white border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-2.5 py-1.5 border-b border-slate-100 text-left">
              <span className="text-[11px] font-bold tracking-[0.08em]">
                <span className="text-emerald-600">AVAILABLE</span>
                <span className="text-slate-300 mx-1">/</span>
                <span className="text-amber-600">BUSY</span>
                <span className="text-slate-300 mx-1">/</span>
                <span className="text-slate-500">OFFLINE</span>
              </span>
            </div>
            <div
              className="no-scrollbar overflow-y-auto overscroll-contain"
              style={{ maxHeight: 52 * 6, WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
            >
              {board.left.map((t) => <BoardRow key={t.id} t={t} />)}
            </div>
          </div>
          <div className="rounded-lg bg-white border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-2.5 py-1.5 border-b border-slate-100 text-left">
              <span className="text-[11px] font-bold tracking-[0.08em]">
                <span className="text-violet-600">DRIVING</span>
                <span className="text-slate-300 mx-1">/</span>
                <span className="text-rose-600">FOCUS</span>
              </span>
            </div>
            <div
              className="no-scrollbar overflow-y-auto overscroll-contain"
              style={{ maxHeight: 52 * 6, WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
            >
              {board.right.map((t) => <BoardRow key={t.id} t={t} />)}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Link
        to="/app/contacts"
        className="flex items-center justify-center gap-1.5 px-3 py-2 border-t border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 hover:text-slate-900 transition"
      >
        Full Availability Directory <ArrowRight className="w-3 h-3" />
      </Link>
      </>
      ) : (
      <div className="p-3 bg-[#F8FAFC]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* LEFT: Available / Busy / Offline */}
          <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-3 py-2.5 border-b border-slate-100 text-left">
              <span className="text-[13px] font-bold tracking-[0.08em]">
                <span className="text-emerald-600">AVAILABLE</span>
                <span className="text-slate-300 mx-1.5">/</span>
                <span className="text-amber-600">BUSY</span>
                <span className="text-slate-300 mx-1.5">/</span>
                <span className="text-slate-500">OFFLINE</span>
              </span>
            </div>
            <div>
              {BOARD_LEFT.map((t) => <BoardRow key={t.id} t={t} />)}
            </div>
          </div>
          {/* RIGHT: Driving / Focus */}
          <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-3 py-2.5 border-b border-slate-100 text-left">
              <span className="text-[13px] font-bold tracking-[0.08em]">
                <span className="text-violet-600">DRIVING</span>
                <span className="text-slate-300 mx-1.5">/</span>
                <span className="text-rose-600">FOCUS</span>
              </span>
            </div>
            <div>
              {BOARD_RIGHT.map((t) => <BoardRow key={t.id} t={t} />)}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Manage Watchlists Sheet */}
      <Sheet open={manageOpen} onOpenChange={setManageOpen}>
        <SheetContent side="right" className="w-[92vw] sm:w-[480px] flex flex-col">
          <SheetHeader>
            <SheetTitle>Manage Watchlists</SheetTitle>
          </SheetHeader>

          {/* Create new list */}
          <div className="mt-3 flex items-center gap-2">
            <Input
              placeholder="New watch list name…"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") createList(); }}
              className="h-9"
            />
            <button
              type="button"
              onClick={createList}
              disabled={!newListName.trim()}
              className="inline-flex items-center gap-1 px-3 h-9 rounded-md bg-slate-900 text-white text-[12px] font-semibold disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" /> Create
            </button>
          </div>

          {/* List of watchlists */}
          <div className="mt-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Your lists</p>
            <ul className="rounded-lg border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {lists.map((l) => {
                const I = ICONS[l.icon];
                const isActive = l.id === activeId;
                const isEditing = editingListId === l.id;
                return (
                  <li key={l.id} className={cn("flex items-center gap-2 px-2 py-1.5", isActive && "bg-slate-50")}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button type="button" className="grid place-items-center w-7 h-7 rounded-md hover:bg-slate-100 text-slate-600" title="Change icon">
                          <I className="w-3.5 h-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {(Object.keys(ICONS) as IconKey[]).map((k) => {
                          const Ic = ICONS[k];
                          return (
                            <DropdownMenuItem key={k} onClick={() => setListIcon(l.id, k)}>
                              <Ic className="w-3.5 h-3.5 mr-2" /> {k}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {isEditing ? (
                      <Input
                        autoFocus
                        defaultValue={l.label}
                        onBlur={(e) => { renameList(l.id, e.target.value || l.label); setEditingListId(null); }}
                        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                        className="h-7 text-[13px] flex-1"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveId(l.id)}
                        className="flex-1 min-w-0 text-left text-[13px] font-semibold text-slate-800 truncate"
                      >
                        {l.label}
                      </button>
                    )}
                    <span className="text-[10px] text-slate-400">{l.members.length}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button type="button" className="grid place-items-center w-7 h-7 rounded-md hover:bg-slate-100 text-slate-500" aria-label="More">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem disabled={!!l.system} onClick={() => setEditingListId(l.id)}>
                          <Pencil className="w-3.5 h-3.5 mr-2" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={!!l.system}
                          onClick={() => {
                            if (confirm(`Delete watch list "${l.label}"?`)) deleteList(l.id);
                          }}
                          className="text-rose-600 focus:text-rose-700"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                );
              })}
            </ul>
            {trash && (
              <div className="mt-2 flex items-center justify-between gap-2 rounded-md bg-amber-50 border border-amber-200 px-2 py-1.5 text-[12px] text-amber-800">
                <span>Deleted "{trash.list.label}"</span>
                <button onClick={undoDelete} className="inline-flex items-center gap-1 font-semibold underline">
                  <Undo2 className="w-3 h-3" /> Undo
                </button>
              </div>
            )}
          </div>

          {/* Contact editor for the active list */}
          <div className="mt-4 flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                Members of <span className="text-slate-700 font-semibold">{active?.label}</span>
              </p>
              {bulk.size > 0 && active && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => bulkAdd(active.id)}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white"
                  >
                    Add {bulk.size}
                  </button>
                  <button
                    onClick={() => bulkRemove(active.id)}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white"
                  >
                    Remove {bulk.size}
                  </button>
                  <button
                    onClick={() => setBulk(new Set())}
                    className="px-1.5 py-0.5 rounded text-[10px] text-slate-500 hover:text-slate-700"
                    aria-label="Clear selection"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search contacts…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-7 text-[13px]"
              />
            </div>
            <ul className="flex-1 min-h-0 overflow-y-auto no-scrollbar divide-y divide-slate-100 border border-slate-200 rounded-lg">
              {filteredContacts.map((r) => {
                const inList = active?.members.includes(r.id);
                const selected = bulk.has(r.id);
                return (
                  <li key={r.id} className="flex items-center gap-2 px-2 py-1.5">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(e) => {
                        setBulk((b) => {
                          const next = new Set(b);
                          if (e.target.checked) next.add(r.id); else next.delete(r.id);
                          return next;
                        });
                      }}
                      className="h-3.5 w-3.5"
                    />
                    <Avatar initials={r.initials} accent={r.accent} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-800 truncate">{r.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{STATUS[r.status].label}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => active && toggleMember(active.id, r.id)}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition",
                        inList
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
                      )}
                    >
                      {inList ? <><Check className="w-3 h-3" /> In list</> : <><Plus className="w-3 h-3" /> Add</>}
                    </button>
                  </li>
                );
              })}
              {filteredContacts.length === 0 && (
                <li className="text-center text-[12px] text-slate-500 py-6">No contacts match "{search}".</li>
              )}
            </ul>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
};

export default SpotlightWindow;
