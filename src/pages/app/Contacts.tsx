import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Users, ArrowRight, LayoutGrid, List, Star, Clock, Briefcase, Heart, UserCheck, TrendingUp, Building2 } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import Avatar from "@/components/app/Avatar";
import StatusPill from "@/components/app/StatusPill";
import EmptyState from "@/components/app/EmptyState";
import { contacts, type Relationship } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type View = "grid" | "list";
type Filter = "all" | "favorites" | "frequent" | Relationship;

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

const Contacts = () => {
  const [q, setQ] = useState("");
  const [view, setView] = useState<View>("grid");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return contacts.filter((c) => {
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
  }, [q, filter]);

  return (
    <AppShell
      subtitle="Vault directory"
      title="Your contacts"
      actions={
        <button
          onClick={() => toast({ title: "Add contact", description: "Invite link copied — share it with anyone." })}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-elevated hover:opacity-95 transition"
        >
          <Plus className="w-4 h-4" /> Add contact
        </button>
      }
    >
      {/* Search + view toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface-lowest ghost-border flex-1 min-w-[220px] max-w-xl">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, company, role or tag…"
            className="flex-1 bg-transparent outline-none text-sm text-primary placeholder:text-muted-foreground"
          />
        </div>
        <div className="inline-flex p-1 rounded-full bg-surface-low ghost-border">
          <button
            onClick={() => setView("grid")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition",
              view === "grid" ? "bg-gradient-primary text-primary-foreground shadow-elevated" : "text-muted-foreground hover:text-primary",
            )}
            aria-label="Grid view"
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Grid
          </button>
          <button
            onClick={() => setView("list")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition",
              view === "list" ? "bg-gradient-primary text-primary-foreground shadow-elevated" : "text-muted-foreground hover:text-primary",
            )}
            aria-label="List view"
          >
            <List className="w-3.5 h-3.5" /> List
          </button>
        </div>
      </div>

      {/* Quick filters */}
      <div className="mt-4 flex flex-wrap gap-2">
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
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon={Users} title="No contacts match" description="Try a different filter, name or tag — or add a new contact." />
        </div>
      ) : view === "grid" ? (
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
                      {c.favorite && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
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
      ) : (
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