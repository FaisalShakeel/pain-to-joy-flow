import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight, Briefcase, Heart, Home, Star, Crown, Layers, Radio, Network,
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
import { useDragScroll } from "@/hooks/use-drag-scroll";
import CoordinationBoard from "./spotlight/CoordinationBoard";
import { contacts, type Contact } from "@/lib/mockData";

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

const contactById = (id: string) => contacts.find((c) => c.id === id)!;

const toPulseRow = (
  contact: Contact,
  overrides: Partial<Pick<RelayRow, "status" | "context" | "activity" | "updatedMinAgo" | "action">> = {},
): RelayRow => ({
  id: contact.id,
  name: contact.name.split(" ")[0],
  initials: contact.initials,
  accent: contact.accent,
  status: (overrides.status ?? contact.status) as BoardStatus,
  context: overrides.context ?? contact.availabilityContext,
  activity: overrides.activity ?? "2m ago",
  updatedMinAgo: overrides.updatedMinAgo ?? 2,
  action: overrides.action,
});

type IconKey = "star" | "layers" | "briefcase" | "crown" | "heart" | "home" | "users";
const ICONS: Record<IconKey, React.ComponentType<{ className?: string }>> = {
  star: Star, layers: Layers, briefcase: Briefcase, crown: Crown,
  heart: Heart, home: Home, users: Users,
};
interface Watchlist {
  id: string;
  label: string;
  icon: IconKey;
  members: string[];
  system?: boolean;
}
const ALL_IDS = (rows: RelayRow[]) => rows.map((r) => r.id);
const DEFAULT_WATCHLISTS = (rows: RelayRow[]): Watchlist[] => [
  { id: "mine",       label: "My Watchlist", icon: "star",      members: ALL_IDS(rows), system: true },
  { id: "all",        label: "All",          icon: "layers",    members: ALL_IDS(rows), system: true },
  { id: "colleagues", label: "Colleagues",   icon: "briefcase", members: ["rashid-al-amir","sarah-jenkins","samir-khan","julian-vane"] },
  { id: "clients",    label: "Clients",      icon: "crown",     members: ["elena-vance","david-okafor"] },
  { id: "friends",    label: "Friends",      icon: "heart",     members: ["kenji-tanaka","yara-nasser"] },
  { id: "family",     label: "Family",       icon: "home",      members: [] },
];

const ALL_ROWS: RelayRow[] = [
  toPulseRow(contactById("rashid-al-amir"), { status: "available", context: "Open for Quick Sync calls after sprint review.", activity: "1m ago", updatedMinAgo: 1, action: "qs" }),
  toPulseRow(contactById("sarah-jenkins"), { status: "focus", context: "Drafting security audit. Available at 3:00 PM.", activity: "2h steady", updatedMinAgo: 8, action: "fs" }),
  toPulseRow(contactById("samir-khan"), { status: "busy", context: "Client meeting until 2:30 PM (Architectural Hub).", activity: "22m active", updatedMinAgo: 22, action: "ea" }),
  toPulseRow(contactById("david-okafor"), { status: "driving", context: "Traveling. Hands-free only. Desk by 4:00 PM.", activity: "35m ago", updatedMinAgo: 35 }),
  toPulseRow(contactById("elena-vance"), { status: "available", context: "Coffee shop co-working. Open for sync.", activity: "Just now", updatedMinAgo: 0, action: "qs" }),
  toPulseRow(contactById("julian-vane"), { status: "focus", context: "Deep work block until 5:00 PM.", activity: "12m", updatedMinAgo: 12, action: "fs" }),
  toPulseRow(contactById("kenji-tanaka"), { status: "busy", context: "On a call. Try again at 4 PM.", activity: "18m", updatedMinAgo: 18 }),
  toPulseRow(contactById("yara-nasser"), { status: "driving", context: "Driving home. ETA 30 min.", activity: "5m", updatedMinAgo: 5 }),
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
const boardTile = (id: string, status?: BoardStatus, context?: string): BoardTile => {
  const c = contactById(id);
  return {
    id: c.id,
    name: c.name,
    initials: c.initials,
    status: status ?? (c.status as BoardStatus),
    context: context ?? c.availabilityContext,
    time: "2m ago",
  };
};

const BOARD_LEFT: BoardTile[] = [
  boardTile("elena-vance", "available", "Coffee shop co-working. Open for sync."),
  boardTile("kenji-tanaka", "busy", "On a call. Try again at 4 PM."),
  boardTile("samir-khan", "offline", "Client meeting until 2:30 PM (Architectural Hub)."),
  boardTile("rashid-al-amir", "available", "Open for Quick Sync calls after sprint review."),
  boardTile("amelia-reyes", "available", "Available for support."),
  boardTile("mira-coelho", "offline", "Out of office. Back tomorrow."),
];
const BOARD_RIGHT: BoardTile[] = [
  boardTile("sarah-jenkins", "focus", "Drafting security audit. Available at 3:00 PM."),
  boardTile("julian-vane", "focus", "Deep work block until 5:00 PM."),
  boardTile("yara-nasser", "driving", "Driving home. ETA 30 min."),
  boardTile("david-okafor", "focus", "Focus time. Do not disturb."),
  boardTile("priya-shah", "focus", "Code review focus block."),
  boardTile("mark-thompson", "driving", "On the way to client site."),
];

const BoardRow = ({ t }: { t: BoardTile }) => {
  const c = BOARD_COLOR[t.status];
  return (
    <Link
      to={`/app/contact/${t.id}`}
      data-no-drag-scroll
      draggable={false}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
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
  const stripRef = useDragScroll<HTMLDivElement>("x");
  const leftBoardRef = useDragScroll<HTMLDivElement>("y");
  const rightBoardRef = useDragScroll<HTMLDivElement>("y");
  const [lists, setLists] = useState<Watchlist[]>(() => DEFAULT_WATCHLISTS(base));
  const [activeId, setActiveId] = useState<string>("mine");
  const [manageOpen, setManageOpen] = useState(false);
  const [manageListId, setManageListId] = useState<string>("mine");
  const [draftMembers, setDraftMembers] = useState<Set<string>>(new Set());
  const [draftName, setDraftName] = useState<string>("");
  const [draftIcon, setDraftIcon] = useState<IconKey>("users");
  // (visibility moved to /app/settings/relay — watch lists are organization only)
  const [isNewList, setIsNewList] = useState(false);
  const [search, setSearch] = useState("");
  const [trash, setTrash] = useState<{ list: Watchlist; index: number } | null>(null);
  const trashTimer = useRef<number | null>(null);

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

  // Open manage drawer for an existing list
  const openManage = (listId: string) => {
    const l = lists.find((x) => x.id === listId);
    if (!l) return;
    setIsNewList(false);
    setManageListId(listId);
    setDraftMembers(new Set(l.members));
    setDraftName(l.label);
    setDraftIcon(l.icon);
    setSearch("");
    setManageOpen(true);
  };
  // Open manage drawer for a brand-new list
  const openCreate = () => {
    setIsNewList(true);
    setManageListId("__new__");
    setDraftMembers(new Set());
    setDraftName("");
    setDraftIcon("users");
    setSearch("");
    setManageOpen(true);
  };
  const saveManage = () => {
    const name = draftName.trim() || (isNewList ? "Untitled list" : "");
    if (isNewList) {
      const id = `wl_${Date.now()}`;
      setLists((ls) => [...ls, { id, label: name, icon: draftIcon, members: Array.from(draftMembers) }]);
      setActiveId(id);
    } else {
      setLists((ls) =>
        ls.map((l) =>
          l.id === manageListId
            ? { ...l, label: l.system ? l.label : name, icon: draftIcon, members: Array.from(draftMembers) }
            : l,
        ),
      );
    }
    setManageOpen(false);
  };
  const moveContactTo = (contactId: string, targetListId: string) => {
    setLists((ls) =>
      ls.map((l) => {
        if (l.id === targetListId && !l.members.includes(contactId)) {
          return { ...l, members: [...l.members, contactId] };
        }
        return l;
      }),
    );
    // Also reflect in current draft if managing target
    if (targetListId === manageListId) {
      setDraftMembers((m) => new Set([...Array.from(m), contactId]));
    }
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
                <span className="max-w-[160px] truncate">
                  {active?.label ?? "My Watch List"}{" "}
                  <span className="text-slate-400 font-normal">({active?.members.length ?? 0})</span>
                </span>
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
                    <span className="flex-1">
                      {w.label}
                    </span>
                    <span className="text-[10px] text-slate-400 mr-1">{w.members.length}</span>
                    {on && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={openCreate}>
                <Plus className="w-3.5 h-3.5 mr-2" /> Create New List
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openManage(activeId)}>
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
          <div
            ref={stripRef}
            className="flex items-center gap-3 overflow-x-auto no-scrollbar overscroll-contain select-none"
            style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x" }}
          >
            {relay.map((r) => {
              const s = STATUS[r.status];
              return (
                <Link
                  key={r.id}
                  to={`/app/contact/${r.id}`}
                  title={`${r.name} · ${s.label}`}
                  className="relative shrink-0"
                  data-no-drag-scroll
                  draggable={false}
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
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
              ref={leftBoardRef}
              className="no-scrollbar overflow-y-auto overscroll-contain"
              style={{ maxHeight: 52 * 6, WebkitOverflowScrolling: "touch", touchAction: "pan-y", userSelect: "none" }}
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
              ref={rightBoardRef}
              className="no-scrollbar overflow-y-auto overscroll-contain"
              style={{ maxHeight: 52 * 6, WebkitOverflowScrolling: "touch", touchAction: "pan-y", userSelect: "none" }}
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
      <CoordinationBoard />
      )}

      {/* Manage Watchlists Sheet */}
      <Sheet open={manageOpen} onOpenChange={setManageOpen}>
        <SheetContent side="right" className="w-[92vw] sm:w-[480px] flex flex-col p-0">
          {/* Header: list identity + Save/Cancel — no permanent group selectors */}
          <div className="px-4 pt-4 pb-3 border-b border-slate-200">
            <SheetHeader>
              <SheetTitle className="text-[13px] uppercase tracking-[0.14em] text-slate-500 font-semibold">
                {isNewList ? "Create Watch List" : "Manage Watch List"}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-3 flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="grid place-items-center w-9 h-9 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700"
                    title="Change icon"
                  >
                    {(() => { const I = ICONS[draftIcon]; return <I className="w-4 h-4" />; })()}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {(Object.keys(ICONS) as IconKey[]).map((k) => {
                    const Ic = ICONS[k];
                    return (
                      <DropdownMenuItem key={k} onClick={() => setDraftIcon(k)}>
                        <Ic className="w-3.5 h-3.5 mr-2" /> {k}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
              <Input
                placeholder="Watch list name…"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="h-9 flex-1"
                disabled={!isNewList && lists.find((l) => l.id === manageListId)?.system}
              />
              <span className="text-[11px] font-semibold text-slate-500 px-1.5 py-0.5 rounded bg-slate-100">
                {draftMembers.size}
              </span>
              {!isNewList && !lists.find((l) => l.id === manageListId)?.system && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete watch list "${draftName}"?`)) {
                      deleteList(manageListId);
                      setManageOpen(false);
                    }
                  }}
                  className="grid place-items-center w-9 h-9 rounded-md hover:bg-rose-50 text-rose-600 border border-transparent hover:border-rose-200"
                  title="Delete list"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            {trash && (
              <div className="mt-2 flex items-center justify-between gap-2 rounded-md bg-amber-50 border border-amber-200 px-2 py-1.5 text-[12px] text-amber-800">
                <span>Deleted "{trash.list.label}"</span>
                <button onClick={undoDelete} className="inline-flex items-center gap-1 font-semibold underline">
                  <Undo2 className="w-3 h-3" /> Undo
                </button>
              </div>
            )}
            {/* Visibility Window — per-list cut-off policy */}
            <p className="mt-3 text-[11px] text-slate-500 px-1">
              Visibility rules moved to{" "}
              <Link to="/app/settings/relay" className="font-semibold text-slate-800 underline">
                Settings · Relay Control
              </Link>
              .
            </p>
          </div>

          {/* Search */}
          <div className="px-4 pt-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search contacts…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-8 text-[13px]"
              />
            </div>
          </div>

          {/* Contacts — maximum vertical space */}
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 py-3">
            <ul className="rounded-lg border border-slate-200 divide-y divide-slate-100 overflow-hidden">
              {filteredContacts.map((r) => {
                const inList = draftMembers.has(r.id);
                return (
                  <li key={r.id} className="flex items-center gap-2 px-2.5 py-2">
                    <input
                      type="checkbox"
                      checked={inList}
                      onChange={(e) => {
                        setDraftMembers((m) => {
                          const next = new Set(m);
                          if (e.target.checked) next.add(r.id); else next.delete(r.id);
                          return next;
                        });
                      }}
                      className="h-4 w-4 accent-emerald-600"
                      aria-label={inList ? `Remove ${r.name}` : `Add ${r.name}`}
                    />
                    <Avatar initials={r.initials} accent={r.accent} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-800 truncate">{r.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{STATUS[r.status].label}</p>
                    </div>
                    {/* Move To dropdown — direct cross-list move */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 px-2 h-7 rounded-md border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700"
                          title="Move to another list"
                        >
                          Move To <span className="text-slate-400">▾</span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-slate-500">
                          Move to
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {lists
                          .filter((l) => !l.system && l.id !== manageListId)
                          .map((l) => {
                            const Ic = ICONS[l.icon];
                            return (
                              <DropdownMenuItem
                                key={l.id}
                                onClick={() => moveContactTo(r.id, l.id)}
                              >
                                <Ic className="w-3.5 h-3.5 mr-2" />
                                <span className="flex-1">{l.label}</span>
                                <span className="text-[10px] text-slate-400">{l.members.length}</span>
                              </DropdownMenuItem>
                            );
                          })}
                        {lists.filter((l) => !l.system && l.id !== manageListId).length === 0 && (
                          <div className="px-2 py-1.5 text-[11px] text-slate-500">No other lists yet.</div>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                );
              })}
              {filteredContacts.length === 0 && (
                <li className="text-center text-[12px] text-slate-500 py-6">No contacts match "{search}".</li>
              )}
            </ul>
          </div>

          {/* Footer: Save / Cancel */}
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-end gap-2 bg-slate-50">
            <button
              type="button"
              onClick={() => setManageOpen(false)}
              className="px-3 h-9 rounded-md border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveManage}
              className="px-4 h-9 rounded-md bg-slate-900 text-white text-[12px] font-semibold hover:bg-slate-800"
            >
              Save
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
};

export default SpotlightWindow;
