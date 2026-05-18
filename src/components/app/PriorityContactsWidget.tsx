import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, Maximize2, X, Star, Pin, PinOff,
  Users as UsersIcon, ArrowRight, Car, Megaphone, Activity,
} from "lucide-react";
import Avatar from "./Avatar";
import StatusPill from "./StatusPill";
import PingButton from "./PingButton";
import { contacts, type AvailabilityStatus } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { useSpotlight } from "./SpotlightContext";
import { usePins } from "@/lib/pinsStore";
import { toast } from "@/hooks/use-toast";

type Filter = "all" | "available" | "busy" | "focus" | "driving" | "offline" | "pinned";

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pinned", label: "Pinned" },
  { id: "available", label: "Available" },
  { id: "busy", label: "Busy" },
  { id: "focus", label: "Focus" },
  { id: "driving", label: "Driving" },
  { id: "offline", label: "Offline" },
];

// Mock "driving" overlay for visual variety — one contact appears as driving.
const drivingOverride: Record<string, true> = { "mark-thompson": true };

const statusTone = (s: AvailabilityStatus | "driving") =>
  s === "available" ? "available"
  : s === "busy" ? "busy"
  : s === "focus" ? "focus"
  : "offline";

const ContactRow = ({
  id, pinned, onToggle, compact = false, showPin = true,
}: { id: string; pinned: boolean; onToggle: (id: string) => void; compact?: boolean; showPin?: boolean }) => {
  const c = contacts.find((x) => x.id === id);
  if (!c) return null;
  const driving = drivingOverride[c.id];
  const effective: AvailabilityStatus | "driving" = driving ? "driving" : c.status;
  const { unseenForContact, markSeen, markContactPostsViewed } = useSpotlight();
  const unseen = unseenForContact(c.id);

  return (
    <div className="group relative p-3 rounded-2xl nested-surface hover:shadow-soft transition-all ease-premium">
      {unseen > 0 && (
        <Link
          to={`/app/contact/${c.id}`}
          onClick={() => { markSeen(c.id); markContactPostsViewed(c.id); }}
          title={`${unseen} new spotlight ${unseen === 1 ? "post" : "posts"} — open profile`}
          className="absolute -top-1.5 -left-1.5 z-10 grid place-items-center w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 text-white shadow-glass ring-2 ring-surface-lowest animate-pulse"
        >
          <Megaphone className="w-3 h-3" />
          <span className="absolute -bottom-1 -right-1 grid place-items-center min-w-[14px] h-[14px] px-[3px] rounded-full bg-primary text-primary-foreground text-[8px] font-bold">
            {unseen}
          </span>
        </Link>
      )}
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <Link to={`/app/contact/${c.id}`}>
            <Avatar initials={c.initials} accent={c.accent} status={c.status} />
          </Link>
          <Link
            to={`/app/contact/${c.id}/log`}
            title="Open Connection Log"
            className="grid place-items-center w-7 h-7 rounded-full bg-surface-lowest text-muted-foreground hover:text-accent transition"
          >
            <Activity className="w-3 h-3" />
          </Link>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Link to={`/app/contact/${c.id}`} className="text-sm font-semibold text-primary truncate hover:text-accent">
              {c.name}
            </Link>
            {c.favorite && <Star className="w-3 h-3 text-gold fill-gold" />}
          </div>
          {!compact && <p className="text-[11px] text-muted-foreground truncate">{c.org}</p>}
          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            {driving ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/15 text-orange-700">
                <Car className="w-2.5 h-2.5" /> Driving
              </span>
            ) : (
              <StatusPill tone={statusTone(effective)} className="text-[10px] px-2 py-0.5" />
            )}
          </div>
          {c.availabilityContext && (
            <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1" title={c.availabilityContext}>
              {c.availabilityContext}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {showPin && (
            <button
              onClick={() => onToggle(c.id)}
              title={pinned ? "Unpin" : "Pin"}
              className={cn(
                "grid place-items-center w-7 h-7 rounded-full transition",
                pinned ? "bg-gold/20 text-gold" : "bg-surface-lowest text-muted-foreground hover:text-primary",
              )}
            >
              {pinned ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
            </button>
          )}
          <PingButton contact={c} drivingOverride={driving} />
        </div>
      </div>
    </div>
  );
};

const PriorityContactsWidget = () => {
  const { pins, isPinned, canPin, togglePin: storeToggle, max } = usePins();
  const [expanded, setExpanded] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const togglePin = (id: string) => {
    const result = storeToggle(id);
    if (result === "limit") {
      toast({ title: `Pin limit reached`, description: `You can pin up to ${max} contacts.` });
    }
  };

  // Always 6 cards: pinned first, then auto-fill with most frequent contacts.
  const priority = useMemo(() => {
    const pinSet = new Set(pins);
    const pinnedList = pins
      .map((id) => contacts.find((c) => c.id === id))
      .filter(Boolean) as typeof contacts;
    const fillers = contacts
      .filter((c) => !pinSet.has(c.id))
      .sort((a, b) => Number(!!b.frequent) - Number(!!a.frequent));
    return [...pinnedList, ...fillers].slice(0, 6);
  }, [pins]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return contacts.filter((c) => {
      const driving = !!drivingOverride[c.id];
      if (filter === "pinned" && !pins.includes(c.id)) return false;
      if (filter === "driving" && !driving) return false;
      if (
        (filter === "available" || filter === "busy" || filter === "focus" || filter === "offline") &&
        c.status !== filter
      ) return false;
      if (!s) return true;
      return (
        c.name.toLowerCase().includes(s) ||
        c.org.toLowerCase().includes(s) ||
        c.title.toLowerCase().includes(s)
      );
    });
  }, [q, filter, pins]);

  return (
    <>
      <div className="dashboard-module p-5 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary/10 text-primary">
              <UsersIcon className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-headline font-bold text-primary leading-tight">The Vault</h3>
              <p className="text-[11px] text-muted-foreground">
                Priority Contacts · {priority.length} of 6 · live status
              </p>
            </div>
          </div>
          <Link
            to="/app/contacts"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 hover:bg-primary/10 text-xs font-semibold text-primary transition-all ease-premium shadow-soft"
          >
            <Maximize2 className="w-3.5 h-3.5" /> Open Vault
          </Link>
        </div>

        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {priority.map((c) => (
            <ContactRow
              key={c.id}
              id={c.id}
              pinned={isPinned(c.id)}
              onToggle={togglePin}
              compact
              showPin={isPinned(c.id) || canPin}
            />
          ))}
        </div>
      </div>

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
                <X className="w-4 h-4" /> Close
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, company, role…"
                className="w-full pl-11 pr-4 py-3 rounded-2xl ghost-border bg-surface-lowest text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap mb-5">
              {filters.map((f) => (
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
                  {f.label}
                </button>
              ))}
              <Link
                to="/app/contacts"
                className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
              >
                Open contacts page <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-3xl ghost-border bg-surface-lowest p-12 text-center text-sm text-muted-foreground">
                No contacts match this filter.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filtered.map((c) => (
                  <ContactRow
                    key={c.id}
                    id={c.id}
                    pinned={isPinned(c.id)}
                    onToggle={togglePin}
                    showPin={isPinned(c.id) || canPin}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default PriorityContactsWidget;