import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Plus, Users, ArrowRight, ArrowLeft, LayoutGrid, List, Star, Clock, Briefcase, Heart, UserCheck, TrendingUp, Building2, Eye, PhoneCall, MessageSquare, CalendarClock, Pin, PinOff, UserPlus, Send, X, CornerDownLeft, Circle, Dot, Moon, Focus as FocusIcon, SlidersHorizontal, ChevronDown, Activity, Megaphone, Maximize2, Minimize2 } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import Avatar from "@/components/app/Avatar";
import StatusPill from "@/components/app/StatusPill";
import EmptyState from "@/components/app/EmptyState";
import PingButton from "@/components/app/PingButton";
import { contacts, type Relationship, type AlertKind } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import AccessChip from "@/components/app/ui/AccessChip";
import { usePins, MAX_PINS } from "@/lib/pinsStore";
import { useSpotlight } from "@/components/app/SpotlightContext";

type View = "grid" | "list";
type StatusFilter = "available" | "busy" | "focus" | "offline";
type Filter = "all" | "favorites" | "frequent" | StatusFilter | Relationship;
type Density = 8 | 12 | 16;

const FAV_KEY = "availock.favoriteContacts";

const relationshipMeta: Record<Relationship, { label: string; cls: string }> = {
  client:    { label: "Client",    cls: "bg-sky-500/10 text-sky-700" },
  colleague: { label: "Colleague", cls: "bg-violet-500/10 text-violet-700" },
  family:    { label: "Family",    cls: "bg-rose-500/10 text-rose-700" },
  investor:  { label: "Investor",  cls: "bg-amber-500/10 text-amber-700" },
  mentor:    { label: "Mentor",    cls: "bg-emerald-500/10 text-emerald-700" },
  friend:    { label: "Friend",    cls: "bg-fuchsia-500/10 text-fuchsia-700" },
};

const filters: { id: Filter; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "all",       label: "All",        icon: Users },
  { id: "favorites", label: "Favorites",  icon: Star },
  { id: "available", label: "Available",  icon: Circle },
  { id: "busy",      label: "Busy",       icon: Dot },
  { id: "focus",     label: "Focus",      icon: FocusIcon },
  { id: "offline",   label: "Offline",    icon: Moon },
  { id: "frequent",  label: "Frequent",   icon: TrendingUp },
  { id: "client",    label: "Clients",    icon: Briefcase },
  { id: "colleague", label: "Colleagues", icon: UserCheck },
  { id: "family",    label: "Family",     icon: Heart },
];

const alertMeta: Record<AlertKind, { label: string; icon: React.ComponentType<{ className?: string }>; cls: string }> = {
  callback: { label: "Callback alert set",       icon: PhoneCall,     cls: "bg-emerald-500/15 text-emerald-700" },
  message:  { label: "Message alert set",        icon: MessageSquare, cls: "bg-sky-500/15 text-sky-700" },
  calendar: { label: "Calendar booking alert",   icon: CalendarClock, cls: "bg-violet-500/15 text-violet-700" },
};

const AlertIcons = ({ alerts, size = "md" }: { alerts?: AlertKind[]; size?: "xs" | "sm" | "md" }) => {
  if (!alerts || alerts.length === 0) return null;
  const dim = size === "xs" ? "w-3 h-3 p-0.5" : size === "sm" ? "w-4 h-4 p-0.5" : "w-5 h-5 p-1";
  const icon = size === "xs" ? "w-2 h-2" : size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3";
  return (
    <span className="inline-flex items-center gap-0.5" aria-label="Contact attempt set">
      {alerts.map((a) => {
        const m = alertMeta[a];
        const Icon = m.icon;
        return (
          <span key={a} title={m.label} className={cn("inline-flex items-center justify-center rounded-full", dim, m.cls)}>
            <Icon className={icon} />
          </span>
        );
      })}
    </span>
  );
};

const Contacts = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [view, setView] = useState<View>("grid");
  const [filter, setFilter] = useState<Filter>("all");
  const [density, setDensity] = useState<Density>(8);
  const [fullscreen, setFullscreen] = useState(false);
  const [vh, setVh] = useState<number>(typeof window !== "undefined" ? window.innerHeight : 800);
  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const birdsEye = true;
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersWrapRef = useRef<HTMLDivElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { pins: pinned, isPinned: isPinnedFn, canPin, togglePin: storeTogglePin } = usePins();
  const { unseenForContact, markSeen, markContactPostsViewed } = useSpotlight();
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(FAV_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
    } catch {
      /* ignore */
    }
  }, [favorites]);

  // Close dropdown on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!searchWrapRef.current) return;
      if (!searchWrapRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Close filters dropdown on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!filtersWrapRef.current) return;
      if (!filtersWrapRef.current.contains(e.target as Node)) setFiltersOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // ⌘K / Ctrl+K to focus
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setSearchOpen(true);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const togglePin = (id: string) => {
    const result = storeTogglePin(id);
    if (result === "pinned") toast({ title: "Pinned", description: "Contact pinned to the top." });
    else if (result === "unpinned") toast({ title: "Unpinned", description: "Contact removed from pinned." });
    else toast({ title: "Pin limit reached", description: `You can pin up to ${MAX_PINS} contacts.` });
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const has = prev.includes(id);
      if (has) return prev.filter((x) => x !== id);
      return [id, ...prev];
    });
  };

  const isFavorite = (id: string, baseFavorite?: boolean) =>
    favorites.includes(id) || (baseFavorite && !favorites.includes(`__unfav_${id}`));

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = contacts.filter((c) => {
      const fav = favorites.includes(c.id) || c.favorite;
      if (filter === "favorites" && !fav) return false;
      if (filter === "frequent" && !c.frequent) return false;
      if (
        filter !== "all" &&
        filter !== "favorites" &&
        filter !== "frequent" &&
        filter !== "available" &&
        filter !== "busy" &&
        filter !== "focus" &&
        filter !== "offline" &&
        c.relationship !== filter
      ) return false;
      if ((filter === "available" || filter === "busy" || filter === "focus" || filter === "offline") && c.status !== filter) return false;
      if (!s) return true;
      return (
        c.name.toLowerCase().includes(s) ||
        c.title.toLowerCase().includes(s) ||
        c.org.toLowerCase().includes(s) ||
        c.tags.some((t) => t.toLowerCase().includes(s))
      );
    });
    // Pinned first, preserving pin order
    const pinSet = new Set(pinned);
    const pinnedList = pinned
      .map((id) => list.find((c) => c.id === id))
      .filter((c): c is (typeof list)[number] => Boolean(c));
    const rest = list.filter((c) => !pinSet.has(c.id));
    return [...pinnedList, ...rest];
  }, [q, filter, pinned, favorites]);

  // Search-only matches (ignore filter chip), used for the dropdown preview.
  const searchMatches = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [] as typeof contacts;
    return contacts.filter((c) =>
      c.name.toLowerCase().includes(s) ||
      c.title.toLowerCase().includes(s) ||
      c.org.toLowerCase().includes(s) ||
      c.tags.some((t) => t.toLowerCase().includes(s)),
    );
  }, [q]);

  const trimmedQ = q.trim();
  const hasExactNameMatch = useMemo(
    () => trimmedQ.length > 0 && searchMatches.some((c) => c.name.toLowerCase() === trimmedQ.toLowerCase()),
    [searchMatches, trimmedQ],
  );
  const looksLikeContactInput =
    trimmedQ.length >= 2 && /[a-zA-Z@+0-9]/.test(trimmedQ);
  const showNotInVault = looksLikeContactInput && !hasExactNameMatch;

  const handleAddNewContact = () => {
    toast({
      title: "Add to vault",
      description: trimmedQ ? `“${trimmedQ}” will be saved as a new contact.` : "Open the new contact form.",
    });
    setSearchOpen(false);
  };

  const handleSendInvite = () => {
    toast({
      title: "Invite link copied",
      description: trimmedQ ? `Share it with ${trimmedQ} to connect on Availock.` : "Share it with anyone to connect.",
    });
    setSearchOpen(false);
  };

  // Density layouts:
  // - 8:  large vertical tiles (4 cols × 2 rows on desktop)
  // - 12: tighter vertical tiles (6 cols × 2 rows on desktop)
  // - 16: horizontal row tiles (4 cols × 4 rows on desktop) — wide enough
  //        to keep the availability context visible inline.
  const densityCols: Record<Density, string> = {
    8:  "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
    12: "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6",
    16: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };
  const densityRowPx: Record<Density, number> = {
    8:  260,
    12: 200,
    16: 88,
  };
  const rowHeight = densityRowPx[density];
  const headerOffset = fullscreen ? 96 : 240;
  const containerHeight = Math.max(360, vh - headerOffset);

  const statusDot: Record<string, string> = {
    available: "bg-emerald-500",
    busy: "bg-amber-500",
    focus: "bg-sky-500",
    offline: "bg-muted-foreground",
  };
  const statusLabel: Record<string, string> = {
    available: "Available",
    busy: "Busy",
    focus: "In focus",
    offline: "Offline",
  };

  return (
    <AppShell
      hideBell={false}
      subtitle="Real-time availability visibility for respectful, effective reach-outs"
      title="The Contact Vault"
      fullscreen={fullscreen}
      onExitFullscreen={() => setFullscreen(false)}
    >
      <div className="flex items-center gap-2 flex-wrap mb-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            title="Back"
            aria-label="Back"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-surface-lowest ghost-border text-primary hover:bg-surface-low transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div ref={searchWrapRef} className="relative flex-1 min-w-[180px] max-w-sm">
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-full bg-surface-lowest ghost-border transition",
                searchOpen && "shadow-elevated ring-1 ring-accent/40",
              )}
            >
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => { setQ(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search vault…"
                className="flex-1 bg-transparent outline-none text-sm text-primary placeholder:text-muted-foreground"
              />
              {q ? (
                <button type="button" onClick={() => { setQ(""); inputRef.current?.focus(); }} className="text-muted-foreground hover:text-primary" aria-label="Clear search">
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-semibold text-muted-foreground bg-surface-low rounded px-1.5 py-0.5 ghost-border">⌘K</kbd>
              )}
            </div>
            {searchOpen && trimmedQ.length > 0 && (
              <div className="absolute z-30 left-0 right-0 mt-2 rounded-2xl bg-surface-lowest ghost-border shadow-elevated overflow-hidden">
                <div className="px-3 pt-3 pb-1 flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">In your vault</span>
                  <span className="text-[10px] text-muted-foreground">{searchMatches.length} {searchMatches.length === 1 ? "match" : "matches"}</span>
                </div>
                {searchMatches.length > 0 ? (
                  <ul className="max-h-64 overflow-y-auto px-2 pb-2">
                    {searchMatches.slice(0, 6).map((c) => (
                      <li key={c.id}>
                        <Link to={`/app/contact/${c.id}`} onClick={() => setSearchOpen(false)} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface-low transition">
                          <Avatar initials={c.initials} accent={c.accent} status={c.status} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-primary truncate">{c.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{c.title} · {c.org}</p>
                          </div>
                          <CornerDownLeft className="w-3.5 h-3.5 text-muted-foreground" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 pb-3 text-xs text-muted-foreground">No one in your vault matches “{trimmedQ}”.</p>
                )}
                {showNotInVault && (
                  <>
                    <div className="h-px bg-border" />
                    <div className="px-3 pt-2 pb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Not in your vault</span>
                    </div>
                    <div className="px-2 pb-2 grid gap-1">
                      <button type="button" onClick={handleAddNewContact} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface-low transition text-left">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent/15 text-accent"><UserPlus className="w-4 h-4" /></span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-primary truncate">Add “{trimmedQ}” as a new contact</p>
                          <p className="text-[11px] text-muted-foreground">Save details to your vault — no invite needed.</p>
                        </div>
                      </button>
                      <button type="button" onClick={handleSendInvite} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface-low transition text-left">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary"><Send className="w-4 h-4" /></span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-primary truncate">Send invite link to “{trimmedQ}”</p>
                          <p className="text-[11px] text-muted-foreground">They join Availock and connect back to you.</p>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
        </div>

        {/* Filters disclosure */}
        <div ref={filtersWrapRef} className="relative">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            title="Filters"
            aria-label="Filters"
            aria-expanded={filtersOpen}
            className={cn(
              "inline-flex items-center gap-1.5 h-9 px-3 rounded-full ghost-border text-xs font-semibold transition shadow-sm",
              filtersOpen || filter !== "all"
                ? "bg-primary text-primary-foreground border-transparent"
                : "bg-surface-lowest text-primary hover:bg-surface-low",
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{filter === "all" ? "Filter" : filters.find((f) => f.id === filter)?.label}</span>
            <ChevronDown className={cn("w-3 h-3 transition", filtersOpen && "rotate-180")} />
          </button>
          {filtersOpen && (
            <div className="absolute right-0 z-30 mt-2 w-72 rounded-2xl bg-surface-lowest ghost-border shadow-elevated p-3 animate-in fade-in slide-in-from-top-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">Filter contacts</p>
              <div className="flex flex-wrap gap-1.5">
                {filters.map((f) => {
                  const Icon = f.icon;
                  const active = filter === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => { setFilter(f.id); setFiltersOpen(false); }}
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold ghost-border transition",
                        active ? "bg-primary text-primary-foreground border-transparent shadow-elevated" : "bg-surface-lowest text-primary hover:bg-surface-low",
                      )}
                    >
                      <Icon className="w-3 h-3" /> {f.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bird's-eye view density toggle */}
        <div className="inline-flex items-center gap-1.5 ml-auto">
          <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Eye className="w-3 h-3" /> Bird's-Eye
          </span>
          <div className="inline-flex p-0.5 rounded-full bg-surface-low ghost-border">
            {([8, 12, 16] as Density[]).map((d) => (
              <button
                key={d}
                onClick={() => setDensity(d)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[11px] font-semibold transition min-w-[2rem]",
                  density === d ? "bg-gradient-primary text-primary-foreground shadow-elevated" : "text-muted-foreground hover:text-primary",
                )}
                aria-label={`Show ${d} contacts`}
              >
                {d}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setFullscreen((v) => !v)}
            title={fullscreen ? "Exit fullscreen" : "Fullscreen directory"}
            aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen directory"}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-surface-lowest ghost-border text-primary hover:bg-surface-low transition shadow-sm"
          >
            {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon={Users} title="No contacts match" description="Try a different filter, name or tag — or add a new contact." />
          {trimmedQ && (
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <button
                onClick={handleAddNewContact}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-primary text-primary-foreground text-xs font-semibold shadow-elevated hover:opacity-95 transition"
              >
                <UserPlus className="w-3.5 h-3.5" /> Add “{trimmedQ}” to vault
              </button>
              <button
                onClick={handleSendInvite}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-lowest ghost-border text-primary text-xs font-semibold hover:bg-surface-low transition"
              >
                <Send className="w-3.5 h-3.5" /> Send invite link
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          className="mt-3 overflow-y-auto pr-1 rounded-2xl"
          style={{ height: containerHeight }}
        >
          <ul
            className={cn(
              "grid",
              density === 8 ? "gap-3" : density === 12 ? "gap-2" : "gap-1.5",
              densityCols[density],
            )}
            style={{ gridAutoRows: `${rowHeight}px` }}
          >
            {filtered.map((c) => {
              const isPinned = pinned.includes(c.id);
              const fav = favorites.includes(c.id) || (c.favorite && !favorites.includes(c.id));
              const roomy = density === 8;
              const mid = density === 12;
              const tight = density === 16;
              return (
                <li key={c.id} className="relative h-full">
                  {unseenForContact(c.id) > 0 && (
                    <Link
                      to={`/app/contact/${c.id}`}
                      onClick={(e) => { e.stopPropagation(); markSeen(c.id); markContactPostsViewed(c.id); }}
                      title={`${unseenForContact(c.id)} new spotlight ${unseenForContact(c.id) === 1 ? "post" : "posts"}`}
                      aria-label="New spotlight posts"
                      className="absolute -top-1.5 -left-1.5 z-10 grid place-items-center w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 text-white shadow-glass ring-2 ring-surface-lowest animate-pulse"
                    >
                      <Megaphone className="w-3 h-3" />
                      <span className="absolute -bottom-1 -right-1 grid place-items-center min-w-[14px] h-[14px] px-[3px] rounded-full bg-primary text-primary-foreground text-[8px] font-bold">
                        {unseenForContact(c.id)}
                      </span>
                    </Link>
                  )}
                  {tight ? (
                    <Link
                      to={`/app/contact/${c.id}`}
                      title={`${c.name} · ${c.org} — ${c.availabilityContext}`}
                      className={cn(
                        "group flex items-center gap-3 h-full w-full rounded-xl border border-border/60 bg-surface-lowest px-3 hover:border-border hover:shadow-elevated transition-all duration-200",
                        isPinned && "ring-1 ring-accent/40 bg-accent/5",
                      )}
                    >
                      <Avatar initials={c.initials} accent={c.accent} status={c.status} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-[12px] font-semibold text-primary truncate leading-tight">{c.name}</p>
                          {fav && <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />}
                          {isPinned && <Pin className="w-3 h-3 text-accent shrink-0" />}
                        </div>
                        <p className="text-[10.5px] text-muted-foreground truncate leading-snug mt-0.5">
                          <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle", statusDot[c.status])} />
                          {c.availabilityContext}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <AlertIcons alerts={c.alerts} size="xs" />
                        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                          <PingButton contact={c} size="sm" />
                        </div>
                      </div>
                    </Link>
                  ) : (
                  <Link
                    to={`/app/contact/${c.id}`}
                    title={`${c.name} · ${c.org} — ${c.availabilityContext}`}
                    className={cn(
                      "group flex flex-col h-full w-full rounded-2xl border border-border/60 bg-surface-lowest hover:border-border hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200",
                      roomy ? "p-4" : "p-3",
                      isPinned && "ring-1 ring-accent/40 bg-accent/5",
                    )}
                  >
                    {/* Header: avatar + top-right actions */}
                    <div className="flex items-start justify-between gap-2">
                      <Avatar initials={c.initials} accent={c.accent} status={c.status} size={roomy ? "lg" : "sm"} />
                      <div className={cn("flex items-center", roomy ? "gap-1.5" : "gap-1", "opacity-70 group-hover:opacity-100 transition")}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavorite(c.id);
                          }}
                          title={fav ? "Remove from favorites" : "Mark as favorite"}
                          aria-label={fav ? "Remove from favorites" : "Mark as favorite"}
                          className={cn(
                            "inline-flex items-center justify-center rounded-full transition shrink-0 w-6 h-6 hover:bg-surface-low",
                            fav ? "text-amber-500" : "text-muted-foreground hover:text-amber-500",
                          )}
                        >
                          <Star className={cn("w-3.5 h-3.5", fav && "fill-amber-500")} />
                        </button>
                        {(isPinned || canPin) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              togglePin(c.id);
                            }}
                            title={isPinned ? "Unpin contact" : "Pin contact"}
                            aria-label={isPinned ? "Unpin contact" : "Pin contact"}
                            className={cn(
                              "inline-flex items-center justify-center rounded-full transition shrink-0 w-6 h-6 hover:bg-surface-low",
                              isPinned ? "text-accent" : "text-muted-foreground hover:text-primary",
                            )}
                          >
                            {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <div className={cn("min-w-0", roomy ? "mt-3" : "mt-2")}>
                      <p className={cn("font-semibold text-primary truncate leading-tight", roomy ? "text-base" : "text-[12px]")}>
                        {c.name}
                      </p>
                      <div className={cn("flex items-center gap-1.5", roomy ? "mt-1.5" : "mt-1")}>
                        <span className={cn("inline-block rounded-full", statusDot[c.status], roomy ? "w-2 h-2" : "w-1.5 h-1.5")} />
                        <span className={cn("text-muted-foreground font-medium", roomy ? "text-xs" : "text-[9px]")}>
                          {statusLabel[c.status]}
                        </span>
                      </div>
                      <p className={cn("text-foreground/70 leading-snug", roomy ? "mt-2 text-[12px] line-clamp-2" : "mt-1.5 text-[10px] line-clamp-2")}>
                        {c.availabilityContext}
                      </p>
                    </div>

                    {/* Footer: quick actions */}
                    <div className={cn("flex items-center justify-between gap-2 mt-auto", roomy ? "pt-3 border-t border-border/40" : "pt-2 border-t border-border/40")}>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/app/contact/${c.id}/log`); }}
                          title="Connection Log"
                          aria-label="Connection Log"
                          className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-accent hover:bg-surface-low transition w-7 h-7"
                        >
                          <Activity className="w-3.5 h-3.5" />
                        </button>
                        <AlertIcons alerts={c.alerts} size={roomy ? "sm" : "xs"} />
                        {roomy && <AccessChip state={c.syncStatus} size="sm" className="ml-1" />}
                      </div>
                      <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                        <PingButton contact={c} size="sm" />
                      </div>
                    </div>
                  </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Legacy grid/list views retained but unused in bird's-eye-only mode */}
      {false && view === "grid" && (
        <ul className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const rel = relationshipMeta[c.relationship];
            return (
              <li key={c.id}>
                <Link
                  to={`/app/contact/${c.id}`}
                  className="group block h-full p-5 rounded-2xl ghost-border bg-surface-lowest hover:shadow-ambient hover:-translate-y-0.5 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Avatar initials={c.initials} accent={c.accent} status={c.status} size="lg" />
                    <div className="flex flex-col items-end gap-1.5">
                      <StatusPill tone={c.status} />
                      <div className="flex items-center gap-1">
                        {c.favorite && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                        <AlertIcons alerts={c.alerts} size="sm" />
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 font-headline font-bold text-primary truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                    <Building2 className="w-3 h-3 shrink-0" /> {c.org}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{c.title}</p>

                  <div className="mt-3 flex items-start gap-1.5 text-[11px] text-foreground/80">
                    <Clock className="w-3 h-3 mt-0.5 shrink-0 text-accent" />
                    <span className="line-clamp-2">{c.availabilityContext}</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", rel.cls)}>{rel.label}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {false && view === "list" && (
        <ul className="mt-6 grid md:grid-cols-2 gap-3">
          {filtered.map((c) => {
            const rel = relationshipMeta[c.relationship];
            return (
              <li key={c.id}>
                <Link
                  to={`/app/contact/${c.id}`}
                  className="group flex items-center gap-4 p-4 rounded-2xl ghost-border bg-surface-lowest hover:shadow-ambient hover:-translate-y-0.5 transition"
                >
                  <Avatar initials={c.initials} accent={c.accent} status={c.status} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-headline font-bold text-primary truncate">{c.name}</p>
                      {c.favorite && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                      <StatusPill tone={c.status} />
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", rel.cls)}>{rel.label}</span>
                      <AlertIcons alerts={c.alerts} size="sm" />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{c.title} · {c.org}</p>
                    <p className="mt-1 text-[11px] text-foreground/80 flex items-center gap-1 truncate">
                      <Clock className="w-3 h-3 text-accent shrink-0" /> {c.availabilityContext}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition shrink-0" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
};

export default Contacts;