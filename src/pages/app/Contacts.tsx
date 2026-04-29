import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Users, ArrowRight } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import Avatar from "@/components/app/Avatar";
import StatusPill from "@/components/app/StatusPill";
import EmptyState from "@/components/app/EmptyState";
import { contacts } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";

const Contacts = () => {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return contacts;
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        c.title.toLowerCase().includes(s) ||
        c.org.toLowerCase().includes(s) ||
        c.tags.some((t) => t.toLowerCase().includes(s)),
    );
  }, [q]);

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
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface-lowest ghost-border max-w-xl">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, role, organization or tag…"
          className="flex-1 bg-transparent outline-none text-sm text-primary placeholder:text-muted-foreground"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Users}
            title="No contacts match"
            description="Try a different name, role or tag — or add a new contact."
          />
        </div>
      ) : (
        <ul className="mt-6 grid md:grid-cols-2 gap-3">
          {filtered.map((c) => (
            <li key={c.id}>
              <Link
                to={`/app/contact/${c.id}`}
                className="group flex items-center gap-4 p-4 rounded-2xl ghost-border bg-surface-lowest hover:shadow-ambient hover:-translate-y-0.5 transition"
              >
                <Avatar initials={c.initials} accent={c.accent} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-headline font-bold text-primary truncate">{c.name}</p>
                    <StatusPill tone={c.status} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{c.title} · {c.org}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {c.tags.slice(0, 2).map((t) => (
                      <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/5 text-primary">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
};

export default Contacts;