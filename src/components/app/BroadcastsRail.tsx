import { useMemo, useState } from "react";
import { Megaphone, X, Send, Filter, ChevronDown, ChevronUp, ArrowRight, Clock, Sparkles, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import Avatar from "./Avatar";
import { useSpotlight, type Tone } from "./SpotlightContext";
import { contacts, type Relationship } from "@/lib/mockData";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

type AudienceFilter = "all" | "colleague" | "friend" | "client" | "other";

const audienceFilters: { id: AudienceFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "colleague", label: "Office colleagues" },
  { id: "friend", label: "Friends" },
  { id: "client", label: "Clients" },
  { id: "other", label: "Other" },
];

const matchesAudience = (rel: Relationship | undefined, f: AudienceFilter) => {
  if (f === "all") return true;
  if (!rel) return f === "other";
  if (f === "colleague") return rel === "colleague";
  if (f === "client") return rel === "client";
  if (f === "friend") return rel === "friend" || rel === "family" || rel === "mentor";
  if (f === "other") return rel === "investor";
  return false;
};

const toneMeta: Record<Tone, { icon: React.ComponentType<{ className?: string }>; dot: string }> = {
  info: { icon: Info, dot: "bg-primary" },
  warn: { icon: AlertTriangle, dot: "bg-amber-500" },
  offer: { icon: Sparkles, dot: "bg-emerald-500" },
};

interface Props {
  onReply?: (contactId: string, quotedTitle: string) => void;
}

const BroadcastsRail = ({ onReply }: Props) => {
  const { posts, dismissedPosts, dismissPost } = useSpotlight();
  const [collapsed, setCollapsed] = useState(false);
  const [audience, setAudience] = useState<AudienceFilter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState("");

  const contactRel = useMemo(() => {
    const m: Record<string, Relationship> = {};
    contacts.forEach((c) => { m[c.id] = c.relationship; });
    return m;
  }, []);

  const items = useMemo(() => {
    const seen = new Set<string>();
    return posts
      .filter((p) => p.authorId && p.authorId !== "me" && p.visibility !== "private" && !dismissedPosts.has(p.id))
      .sort((a, b) => b.createdAt - a.createdAt)
      .filter((p) => {
        if (seen.has(p.authorId!)) return false;
        seen.add(p.authorId!);
        return true;
      })
      .filter((p) => matchesAudience(contactRel[p.authorId!], audience));
  }, [posts, dismissedPosts, audience, contactRel]);

  const sendReply = (contactId: string, title: string) => {
    if (!reply.trim()) return;
    onReply?.(contactId, title);
    toast.success("Reply sent", { description: `Re: ${title}` });
    setReply("");
    setOpenId(null);
  };

  return (
    <div className="rounded-2xl bg-surface-low/40 ghost-border p-3">
      <div className="flex items-center justify-between gap-2 px-1">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-primary"
        >
          <span className="grid place-items-center w-6 h-6 rounded-lg bg-gold/15 text-gold">
            <Megaphone className="w-3 h-3" />
          </span>
          Broadcasts
          {items.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {items.length}
            </span>
          )}
          {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-border bg-surface-lowest text-[10px] font-semibold text-muted-foreground hover:text-primary transition"
              title="Filter"
            >
              <Filter className="w-3 h-3" />
              <span>{audienceFilters.find((f) => f.id === audience)?.label}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-44 p-1.5">
            <div className="flex flex-col gap-1">
              {audienceFilters.map((f) => {
                const active = audience === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setAudience(f.id)}
                    className={cn(
                      "text-left px-2 py-1 rounded-md text-[11px] font-semibold border transition",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-transparent text-muted-foreground hover:bg-surface-low hover:text-primary",
                    )}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {!collapsed && (
        <div className="mt-2 space-y-1.5">
          {items.length === 0 ? (
            <p className="px-2 py-3 text-[11px] text-center text-muted-foreground">
              No broadcasts in this view.
            </p>
          ) : (
            items.map((p) => {
              const c = contacts.find((x) => x.id === p.authorId);
              if (!c) return null;
              const Tn = toneMeta[p.tone];
              const isOpen = openId === p.id;
              return (
                <div key={p.id} className="rounded-xl bg-surface-lowest ghost-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : p.id)}
                    className="w-full flex items-center gap-2.5 p-2 text-left hover:bg-surface-low/60 transition"
                  >
                    <Avatar initials={c.initials} accent={c.accent} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("w-1.5 h-1.5 rounded-full", Tn.dot)} />
                        <p className="text-xs font-semibold text-primary truncate">{c.name}</p>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{p.title}</p>
                    </div>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissPost(p.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          dismissPost(p.id);
                        }
                      }}
                      className="p-1 rounded-full text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 transition"
                      aria-label="Mark seen"
                      title="Mark seen"
                    >
                      <X className="w-3 h-3" />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-3 pb-3 pt-1 border-t border-border/40 bg-surface-low/30">
                      <p className="text-xs text-primary leading-relaxed">{p.body}</p>
                      <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                        {p.expiresIn ? (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {p.expiresIn}
                          </span>
                        ) : <span />}
                        {p.cta && (
                          <a href={p.cta.href} className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:text-accent">
                            {p.cta.label} <ArrowRight className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <form
                        onSubmit={(e) => { e.preventDefault(); sendReply(c.id, p.title); }}
                        className="mt-2 flex items-center gap-1.5"
                      >
                        <input
                          value={isOpen ? reply : ""}
                          onChange={(e) => setReply(e.target.value)}
                          placeholder={`Reply to ${c.name.split(" ")[0]}…`}
                          className="flex-1 px-3 py-1.5 rounded-full bg-surface-lowest ghost-border outline-none text-xs placeholder:text-muted-foreground"
                        />
                        <button
                          type="submit"
                          disabled={!reply.trim()}
                          className="grid place-items-center w-7 h-7 rounded-full bg-primary text-primary-foreground hover:opacity-95 disabled:opacity-40 transition"
                          aria-label="Send reply"
                        >
                          <Send className="w-3 h-3" />
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default BroadcastsRail;