import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Maximize2, X, Star, TrendingUp, Clock, Hourglass, MoonStar, ArrowRight, Users as UsersIcon } from "lucide-react";
import Avatar from "./Avatar";
import StatusPill from "./StatusPill";
import { contacts, type AvailabilityStatus } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import PingButton from "./PingButton";

type QuickFilter = "available" | "priority" | "favorites" | "recent" | "pending" | "offline" | "all";

const quickFilters: { id: QuickFilter; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "all",       label: "All",           icon: UsersIcon },
  { id: "available", label: "Available now", icon: TrendingUp },
  { id: "priority",  label: "Priority",      icon: Star },
  { id: "favorites", label: "Favorites",     icon: Star },
  { id: "recent",    label: "Recent",        icon: Clock },
  { id: "pending",   label: "Pending",       icon: Hourglass },
  { id: "offline",   label: "Offline",       icon: MoonStar },
];

const statusTone = (s: AvailabilityStatus) => (s === "available" ? "available" : s === "busy" ? "busy" : s === "focus" ? "focus" : "offline");

const ContactTile = ({ id, compact = false }: { id: string; compact?: boolean }) => {
  const c = contacts.find((x) => x.id === id);
  if (!c) return null;
  return (
    <div className="group relative p-3 rounded-2xl ghost-border bg-surface-low/50 hover:bg-surface-low transition">
      <div className="flex items-start gap-3">
        <Link to={`/app/contact/${c.id}`} className="shrink-0">
          <Avatar initials={c.initials} accent={c.accent} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Link to={`/app/contact/${c.id}`} className="text-sm font-semibold text-primary truncate hover:text-accent">
              {c.name}
            </Link>
            {c.favorite && <Star className="w-3 h-3 text-gold fill-gold" />}
          </div>
          {!compact && <p className="text-[11px] text-muted-foreground truncate">{c.org}</p>}
          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            <StatusPill tone={statusTone(c.status)} className="text-[10px] px-2 py-0.5" />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1">{c.availabilityContext}</p>
        </div>
        <PingButton contact={c} />
      </div>
    </div>
  );
};

const FrequentContactsWidget = () => {
  const [expanded, setExpanded] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<QuickFilter>("all");

  const frequentEight = useMemo(() => {
    const freq = contacts.filter((c) => c.frequent);
    const rest = contacts.filter((c) => !c.frequent);
    return [...freq, ...rest].slice(0, 8);
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return contacts.filter((c) => {
      if (filter === "available" && c.status !== "available") return false;
      if (filter === "favorites" && !c.favorite) return false;
      if (filter === "priority" && !(c.favorite || c.frequent)) return false;
      if (filter === "recent" && !c.frequent) return false;
      if (filter === "pending" && c.syncStatus !== "pending") return false;
      if (filter === "offline" && c.status !== "offline") return false;
      if (!s) return true;
      return (
        c.name.toLowerCase().includes(s) ||
        c.org.toLowerCase().includes(s) ||
        c.title.toLowerCase().includes(s) ||
        c.tags.some((t) => t.toLowerCase().includes(s)) ||
        c.status.toLowerCase().includes(s)
      );
    });
  }, [q, filter]);

  return (
    <>
      <div className="rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary/10 text-primary">
              <UsersIcon className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-headline font-bold text-primary leading-tight">Frequent contacts</h3>
              <p className="text-[11px] text-muted-foreground">Live availability snapshot · {frequentEight.length} of {contacts.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpanded(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 hover:bg-primary/10 text-xs font-semibold text-primary transition"
            >
              <Maximize2 className="w-3.5 h-3.5" /> Expand
            </button>
            <Link to="/app/contacts" className="text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="mt-4 grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {frequentEight.map((c) => (
            <ContactTile key={c.id} id={c.id} compact />
          ))}
        </div>
      </div>

      {/* Full-screen contacts manager */}
      {expanded && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="max-w-7xl mx-auto p-5 md:p-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-accent">Contacts manager</p>
                <h2 className="font-headline font-extrabold text-primary text-2xl md:text-3xl">All contacts</h2>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-surface-low hover:bg-surface-lowest ghost-border text-xs font-semibold text-primary transition"
              >
                <X className="w-4 h-4" /> Collapse
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, tag, company, availability…"
                className="w-full pl-11 pr-4 py-3 rounded-2xl ghost-border bg-surface-lowest text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>

            {/* Filter chips */}
            <div className="flex items-center gap-2 flex-wrap mb-5">
              {quickFilters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition",
                    filter === f.id
                      ? "bg-primary text-primary-foreground shadow-glass"
                      : "bg-surface-low text-muted-foreground hover:text-primary",
                  )}
                >
                  <f.icon className="w-3.5 h-3.5" /> {f.label}
                </button>
              ))}
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
              <div className="rounded-3xl ghost-border bg-surface-lowest p-12 text-center text-sm text-muted-foreground">
                No contacts match this filter.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filtered.map((c) => (
                  <ContactTile key={c.id} id={c.id} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FrequentContactsWidget;