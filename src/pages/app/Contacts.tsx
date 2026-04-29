import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Users, ArrowRight, LayoutGrid, List, Star, Clock, Briefcase, Heart, UserCheck, TrendingUp, Building2, Eye, PhoneCall, MessageSquare, CalendarClock, Pin, PinOff } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import Avatar from "@/components/app/Avatar";
import StatusPill from "@/components/app/StatusPill";
import EmptyState from "@/components/app/EmptyState";
import { contacts, type Relationship, type AlertKind } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type View = "grid" | "list";
type Filter = "all" | "favorites" | "frequent" | Relationship;
type Density = 6 | 10 | 16;

const PINNED_KEY = "availock.pinnedContacts";

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
  const [q, setQ] = useState("");
  const [view, setView] = useState<View>("grid");
  const [filter, setFilter] = useState<Filter>("all");
  const [density, setDensity] = useState<Density>(6);
  const birdsEye = true;
  const [pinned, setPinned] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(PINNED_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(PINNED_KEY, JSON.stringify(pinned));
    } catch {
      /* ignore */
    }
  }, [pinned]);

  const togglePin = (id: string) => {
    setPinned((prev) => {
      const has = prev.includes(id);
      if (has) {
        toast({ title: "Unpinned", description: "Contact removed from pinned." });
        return prev.filter((x) => x !== id);
      }
      toast({ title: "Pinned", description: "Contact pinned to the top." });
      return [id, ...prev];
    });
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = contacts.filter((c) => {
      if (filter === "favorites" && !c.favorite) return false;
      if (filter === "frequent" && !c.frequent) return false;
      if (filter !== "all" && filter !== "favorites" && filter !== "frequent" && c.relationship !== filter) return false;
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
  }, [q, filter, pinned]);

  const densityCols: Record<Density, string> = {
    6:  "grid-cols-2 sm:grid-cols-3 lg:grid-cols-3",
    10: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
    16: "grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4",
  };

  // Approximate per-tile heights (px) used to compute the visible window height.
  // Keeps exactly `density` tiles in view; the rest scrolls within the panel.
  const densityRowHeight: Record<Density, number> = { 6: 96, 10: 92, 16: 88 };
  const densityColCount: Record<Density, number> = { 6: 3, 10: 5, 16: 4 };
  const visibleRows: Record<Density, number> = { 6: 2, 10: 2, 16: 4 };
  const scrollMaxHeight = visibleRows[density] * densityRowHeight[density] + (visibleRows[density] - 1) * 8 + 16;

  const statusDot: Record<string, string> = {
    available: "bg-emerald-500",
    busy: "bg-amber-500",
    focus: "bg-violet-500",
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
      subtitle="Vault directory"
      title="Your contacts"
      actions={
        birdsEye ? null : (
          <button
            onClick={() => toast({ title: "Add contact", description: "Invite link copied — share it with anyone." })}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-elevated hover:opacity-95 transition"
          >
            <Plus className="w-4 h-4" /> Add contact
          </button>
        )
      }
    >
      {/* Search bar (kept visible in bird's-eye too) */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface-lowest ghost-border max-w-xl">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, company, role or tag…"
          className="flex-1 bg-transparent outline-none text-sm text-primary placeholder:text-muted-foreground"
        />
      </div>

      {/* Quick filters + bird's-eye density (always visible) */}
      <div className={cn("flex flex-wrap items-center gap-2", birdsEye ? "mt-0" : "mt-4")}>
        {filters.map((f) => {
          const Icon = f.icon;
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ghost-border transition",
                active
                  ? "bg-primary text-primary-foreground border-transparent shadow-elevated"
                  : "bg-surface-lowest text-primary hover:bg-surface-low",
              )}
            >
              <Icon className="w-3.5 h-3.5" /> {f.label}
            </button>
          );
        })}

        <div className="ml-auto inline-flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Eye className="w-3.5 h-3.5" /> Bird&apos;s-eye
          </span>
          <div className="inline-flex p-1 rounded-full bg-surface-low ghost-border">
            {([6, 10, 16] as Density[]).map((d) => (
              <button
                key={d}
                onClick={() => setDensity(d)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold transition min-w-[2.25rem]",
                  density === d
                    ? "bg-gradient-primary text-primary-foreground shadow-elevated"
                    : "text-muted-foreground hover:text-primary",
                )}
                aria-label={`Show ${d} contacts`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon={Users} title="No contacts match" description="Try a different filter, name or tag — or add a new contact." />
        </div>
      ) : (
        <div
          className="mt-4 overflow-y-auto pr-1 rounded-2xl"
          style={{ maxHeight: scrollMaxHeight }}
        >
          <ul className={cn("grid gap-2", densityCols[density])}>
            {filtered.map((c) => {
              const isPinned = pinned.includes(c.id);
              const compact = density === 16;
              return (
                <li key={c.id} className="relative">
                  <Link
                    to={`/app/contact/${c.id}`}
                    title={`${c.name} · ${c.org} — ${c.availabilityContext}`}
                    className={cn(
                      "group flex items-start gap-2 rounded-xl ghost-border bg-surface-lowest hover:shadow-ambient hover:-translate-y-0.5 transition",
                      compact ? "p-2" : "p-2.5",
                      isPinned && "ring-1 ring-accent/40 bg-accent/5",
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar initials={c.initials} accent={c.accent} size={compact ? "sm" : "md"} />
                      <span
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-surface-lowest",
                          statusDot[c.status],
                        )}
                      />
                    </div>
                    <div className="min-w-0 flex-1 pr-5">
                      <p className={cn("font-semibold text-primary truncate leading-tight", compact ? "text-[11px]" : "text-xs")}>
                        {c.name}
                      </p>
                      <div className="flex items-center justify-between gap-1">
                        <p className={cn("flex items-center gap-1 text-muted-foreground truncate", compact ? "text-[9px]" : "text-[10px]")}>
                          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusDot[c.status])} />
                          {statusLabel[c.status]}
                        </p>
                        <AlertIcons alerts={c.alerts} size="xs" />
                      </div>
                      <p className={cn("mt-0.5 text-foreground/80 leading-tight", compact ? "text-[9px] line-clamp-2" : "text-[10px] line-clamp-2")}>
                        {c.availabilityContext}
                      </p>
                    </div>
                  </Link>
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
                      "absolute top-1.5 right-1.5 inline-flex items-center justify-center w-6 h-6 rounded-full transition",
                      isPinned
                        ? "bg-accent text-accent-foreground shadow-elevated"
                        : "bg-surface-low text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100",
                    )}
                  >
                    {isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                  </button>
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
                    <Avatar initials={c.initials} accent={c.accent} size="lg" />
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
                  <Avatar initials={c.initials} accent={c.accent} size="lg" />
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