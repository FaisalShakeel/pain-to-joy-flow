import { useMemo, useState } from "react";
import {
  Megaphone, Pin, Globe, Users as UsersIcon, Lock, Clock, ArrowRight, Send,
  Pencil, Trash2, Sparkles, AlertTriangle, Radio, Share2, Link2, Repeat2,
  MoreHorizontal, EyeOff, Zap, ChevronDown, X, Filter as FilterIcon,
  Heart, Home, Briefcase, UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useSpotlight, SPOTLIGHT_LIMITS, AUDIENCE_TAGS,
  type SpotlightPost, type Visibility, type Tone, type AudienceTag,
} from "./SpotlightContext";
import { toast } from "sonner";
import { contacts, type Relationship } from "@/lib/mockData";
import Avatar from "./Avatar";

type FilterId = "public" | "family" | "friends" | "groups" | "office" | "other";

const FILTERS: { id: FilterId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "public",  label: "Public",       icon: Globe },
  { id: "family",  label: "Family",       icon: Home },
  { id: "friends", label: "Friends",      icon: Heart },
  { id: "groups",  label: "Groups",       icon: UsersIcon },
  { id: "office",  label: "Office / Work", icon: Briefcase },
  { id: "other",   label: "Other",        icon: UserCheck },
];

const visMeta: Record<Visibility, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  public:   { label: "Public",   icon: Globe },
  contacts: { label: "Contacts", icon: UsersIcon },
  private:  { label: "Private",  icon: Lock },
};

const EXPIRY = [
  { id: "none", label: "No expiry", value: undefined as string | undefined },
  { id: "3h",   label: "3h",        value: "expires in 3h" },
  { id: "24h",  label: "Tomorrow",  value: "expires tomorrow" },
  { id: "7d",   label: "7d",        value: "expires in 7 days" },
];

const relToTag = (rel: Relationship | undefined): AudienceTag => {
  if (!rel) return "other";
  if (rel === "colleague") return "colleague";
  if (rel === "client") return "client";
  if (rel === "family") return "family";
  if (rel === "friend" || rel === "mentor") return "friend";
  return "other";
};

const AI_SUGGESTIONS = [
  "In meetings until 4 PM — async only",
  "Two Quick Sync slots open tomorrow",
  "Heads-down on Q3 close — urgent only",
];

const SpotlightWindow = () => {
  const { posts, create, update, remove } = useSpotlight();

  const [filter, setFilter] = useState<FilterId>("public");
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<AudienceTag>("colleague");
  const [visibility, setVisibility] = useState<Visibility>("contacts");
  const [urgent, setUrgent] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [expiresIn, setExpiresIn] = useState<string | undefined>("expires tomorrow");
  const [editingId, setEditingId] = useState<string | null>(null);

  const contactById = useMemo(() => {
    const m: Record<string, { name: string; initials: string; accent: string; rel: Relationship }> = {};
    contacts.forEach((c) => { m[c.id] = { name: c.name, initials: c.initials, accent: c.accent, rel: c.relationship }; });
    return m;
  }, []);

  const stream = useMemo(() => {
    const list = [...posts].sort((a, b) => {
      const ap = a.pinned || a.tone === "warn" ? 1 : 0;
      const bp = b.pinned || b.tone === "warn" ? 1 : 0;
      if (ap !== bp) return bp - ap;
      return b.createdAt - a.createdAt;
    });
    return list.filter((p) => {
      if (filter === "public")  return p.visibility === "public";
      if (filter === "family")  return p.audienceTag === "family";
      if (filter === "friends") return p.audienceTag === "friend";
      if (filter === "groups")  return p.audienceTag === "colleague";
      if (filter === "office")  return p.audienceTag === "colleague" || p.audienceTag === "client";
      if (filter === "other")   return p.audienceTag === "other";
      return true;
    });
  }, [posts, filter]);

  const VISIBLE_COUNT = 2;
  const visibleStream = showAll ? stream : stream.slice(0, VISIBLE_COUNT);
  const hiddenCount = Math.max(0, stream.length - VISIBLE_COUNT);

  const resetComposer = () => {
    setTitle(""); setBody(""); setAudience("colleague"); setVisibility("contacts");
    setUrgent(false); setPinned(false); setExpiresIn("expires tomorrow"); setEditingId(null);
  };

  const publish = () => {
    const t = title.trim().slice(0, SPOTLIGHT_LIMITS.title);
    const b = body.trim().slice(0, SPOTLIGHT_LIMITS.body);
    if (!t || !b) return;
    const payload = {
      title: t, body: b, visibility, tone: (urgent ? "warn" : "info") as Tone,
      pinned, expiresIn, audienceTag: audience,
    };
    if (editingId) { update(editingId, payload); toast.success("Spotlight updated"); }
    else { create(payload); toast.success("Spotlight published"); }
    resetComposer();
    setExpanded(false);
  };

  const startEdit = (p: SpotlightPost) => {
    setEditingId(p.id);
    setTitle(p.title); setBody(p.body); setAudience((p.audienceTag ?? "other") as AudienceTag);
    setVisibility(p.visibility); setUrgent(p.tone === "warn"); setPinned(!!p.pinned);
    setExpiresIn(p.expiresIn);
    setExpanded(true);
  };

  const repost = (p: SpotlightPost) => {
    create({
      title: p.title, body: p.body, visibility: p.visibility, tone: p.tone,
      pinned: false, expiresIn: p.expiresIn, audienceTag: (p.audienceTag ?? "other") as AudienceTag,
    });
    toast.success("Reposted to your stream");
  };

  const copyLink = (p: SpotlightPost) => {
    const url = `${window.location.origin}/spotlight/${p.id}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    toast.success("Spotlight link copied");
  };

  const titleLeft = SPOTLIGHT_LIMITS.title - title.length;
  const bodyLeft  = SPOTLIGHT_LIMITS.body  - body.length;
  const valid = title.trim().length > 0 && body.trim().length > 0 && titleLeft >= 0 && bodyLeft >= 0;

  return (
    <section className="w-full min-w-0 max-w-full rounded-[1.35rem] bg-gradient-to-br from-primary/[0.04] via-surface-lowest to-surface-low/40 ghost-border shadow-soft overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between gap-2 px-3 md:px-5 pt-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="relative grid place-items-center w-7 h-7 rounded-xl bg-primary/10 text-primary">
            <Megaphone className="w-3.5 h-3.5" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground leading-none">Spotlight · Live</p>
            <h3 className="font-headline font-extrabold text-primary text-sm md:text-base leading-tight truncate">
              Your operational visibility stream
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-border bg-surface-lowest text-primary hover:bg-surface-low transition">
                <FilterIcon className="w-3 h-3" />
                <span className="hidden sm:inline">Visibility:</span> {FILTERS.find((f) => f.id === filter)?.label}
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {FILTERS.map((f) => {
                const Icon = f.icon;
                return (
                  <DropdownMenuItem key={f.id} onClick={() => setFilter(f.id)}>
                    <Icon className="w-3.5 h-3.5 mr-2" /> {f.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className={cn(
              "grid place-items-center w-9 h-9 rounded-full bg-primary text-primary-foreground shadow-soft hover:opacity-95 transition shrink-0",
              expanded && "rotate-45",
            )}
            aria-label={expanded ? "Close composer" : "Publish a spotlight"}
            title={expanded ? "Close composer" : "Publish a spotlight"}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Inline composer */}
      {expanded && (
        <div className="px-4 md:px-5 pt-3">
          <div className="rounded-2xl ghost-border bg-surface-lowest p-3 shadow-soft">
            <div className="mb-3 rounded-xl bg-gold/10 ghost-border p-2.5 text-[11px] text-primary leading-relaxed">
              <p className="font-bold uppercase tracking-wider text-[9px] text-gold mb-0.5">Scheduling lives in Availability</p>
              Spotlight is for live announcements & relays. To open slots, create them in Availability and toggle <strong>Relay to Spotlight</strong>.
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <a href="/app/availability/focus-meetings" className="px-2 py-0.5 rounded-full bg-surface-lowest ghost-border text-[10px] font-bold text-primary hover:bg-surface-low">Hybrid</a>
                <a href="/app/availability/quick-sync" className="px-2 py-0.5 rounded-full bg-surface-lowest ghost-border text-[10px] font-bold text-primary hover:bg-surface-low">Quick Sync</a>
                <a href="/app/availability/webinars" className="px-2 py-0.5 rounded-full bg-surface-lowest ghost-border text-[10px] font-bold text-primary hover:bg-surface-low">Event Access</a>
              </div>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2">
                <span className="grid place-items-center w-8 h-8 rounded-full bg-primary text-primary-foreground shrink-0 mt-0.5">
                  <Megaphone className="w-3.5 h-3.5" />
                </span>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <Input
                    autoFocus
                    value={title}
                    maxLength={SPOTLIGHT_LIMITS.title + 10}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Headline (e.g. In meetings until 4 PM)"
                    className="h-8 text-sm font-semibold border-0 bg-transparent px-1 focus-visible:ring-0"
                  />
                  <Textarea
                    rows={2}
                    value={body}
                    maxLength={SPOTLIGHT_LIMITS.body + 50}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="What should they know right now?"
                    className="text-xs min-h-[52px] border-0 bg-transparent px-1 resize-none focus-visible:ring-0"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => { resetComposer(); setExpanded(false); }}
                  className="p-1 rounded-full text-muted-foreground hover:bg-surface-low transition"
                  aria-label="Close composer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* AI suggestions */}
              {!title && !body && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary/70">
                    <Sparkles className="w-3 h-3" /> AI
                  </span>
                  {AI_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { setTitle(s); }}
                      className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-dashed border-primary/30 text-primary hover:bg-primary/5 transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Controls row */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/60">
                {/* Audience */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold border border-border bg-surface-lowest text-primary hover:bg-surface-low transition">
                      <UsersIcon className="w-3 h-3" />
                      {AUDIENCE_TAGS.find((a) => a.id === audience)?.label ?? "Audience"}
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-40">
                    {AUDIENCE_TAGS.map((a) => (
                      <DropdownMenuItem key={a.id} onClick={() => setAudience(a.id)}>
                        <span className="mr-2">{a.emoji}</span>{a.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Visibility */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold border border-border bg-surface-lowest text-primary hover:bg-surface-low transition">
                      {(() => { const V = visMeta[visibility]; return <V.icon className="w-3 h-3" />; })()}
                      {visMeta[visibility].label}
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-36">
                    {(Object.keys(visMeta) as Visibility[]).map((v) => {
                      const V = visMeta[v];
                      return (
                        <DropdownMenuItem key={v} onClick={() => setVisibility(v)}>
                          <V.icon className="w-3.5 h-3.5 mr-2" /> {V.label}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Expiry */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold border border-border bg-surface-lowest text-primary hover:bg-surface-low transition">
                      <Clock className="w-3 h-3" />
                      {EXPIRY.find((e) => e.value === expiresIn)?.label ?? "No expiry"}
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-32">
                    {EXPIRY.map((e) => (
                      <DropdownMenuItem key={e.id} onClick={() => setExpiresIn(e.value)}>
                        {e.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Toggles */}
                <button
                  type="button"
                  onClick={() => setUrgent((u) => !u)}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition",
                    urgent
                      ? "bg-amber-500/15 text-amber-700 border-amber-500/40"
                      : "bg-surface-lowest text-muted-foreground border-border hover:text-primary",
                  )}
                >
                  <AlertTriangle className="w-3 h-3" /> Urgent
                </button>
                <button
                  type="button"
                  onClick={() => setPinned((p) => !p)}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition",
                    pinned
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-surface-lowest text-muted-foreground border-border hover:text-primary",
                  )}
                >
                  <Pin className="w-3 h-3" /> Pin
                </button>

                <div className="flex-1" />

                <div className="flex items-center gap-2">
                  <span className={cn("text-[10px]", bodyLeft < 0 ? "text-destructive" : "text-muted-foreground")}>
                    {bodyLeft}
                  </span>
                  <button
                    type="button"
                    onClick={publish}
                    disabled={!valid}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-wider disabled:opacity-40 hover:opacity-95 transition"
                  >
                    <Send className="w-3 h-3" /> {editingId ? "Update" : "Publish"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stream */}
      <div className="px-2 md:px-3 pb-3 pt-3 min-w-0">
        {filter === "ai" ? (
          <div className="m-2 p-5 rounded-2xl border border-dashed border-primary/30 bg-primary/[0.03] text-center">
            <Sparkles className="w-5 h-5 text-primary mx-auto" />
            <p className="mt-2 text-xs font-semibold text-primary">AI-suggested spotlights</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Tap a suggestion to publish it instantly.</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
              {AI_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    create({
                      title: s, body: "Auto-generated by Availock AI based on your calendar.",
                      visibility: "contacts", tone: "info", pinned: false,
                      expiresIn: "expires in 3h", audienceTag: "colleague",
                    });
                    toast.success("AI spotlight published");
                  }}
                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold border border-primary/30 text-primary hover:bg-primary/5"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : stream.length === 0 ? (
          <div className="m-2 p-6 rounded-2xl border border-dashed border-border text-center">
            <p className="text-xs text-muted-foreground">No spotlights match this filter.</p>
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
            >
              <Send className="w-3 h-3" /> Publish one
            </button>
          </div>
        ) : (
          <>
          <ul className="divide-y divide-border/40">
            {visibleStream.map((p) => {
              const mine = !p.authorId || p.authorId === "me";
              const author = !mine && p.authorId ? contactById[p.authorId] : undefined;
              const aud = AUDIENCE_TAGS.find((a) => a.id === (p.audienceTag ?? "other"));
              const Vis = visMeta[p.visibility];
              const isUrgent = p.tone === "warn";
              return (
                <li
                  key={p.id}
                  className={cn(
                    "group relative flex gap-2.5 px-2.5 md:px-3 py-3 rounded-xl transition hover:bg-surface-low/40 min-w-0",
                    isUrgent && "bg-amber-500/[0.04]",
                  )}
                >
                  {/* Live pulse rail */}
                  <span className={cn(
                    "absolute left-0 top-3 bottom-3 w-[2px] rounded-full",
                    isUrgent ? "bg-amber-500" : p.pinned ? "bg-primary" : mine ? "bg-primary/40" : "bg-gold/60",
                  )} />
                  {author ? (
                    <Avatar initials={author.initials} accent={author.accent} />
                  ) : (
                    <span className="grid place-items-center w-9 h-9 rounded-full bg-primary text-primary-foreground shrink-0 text-[11px] font-bold">
                      Me
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap max-w-full">
                      <span className="text-[12px] font-bold text-primary truncate">
                        {author?.name ?? "You"}
                      </span>
                      {isUrgent && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500 text-white">
                          <AlertTriangle className="w-2.5 h-2.5" /> Urgent
                        </span>
                      )}
                      {p.pinned && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                          <Pin className="w-2.5 h-2.5" /> Pinned
                        </span>
                      )}
                      {aud && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-surface-low text-muted-foreground">
                          <span>{aud.emoji}</span>
                          <span className="hidden sm:inline">{aud.label}</span>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-surface-low text-muted-foreground">
                        <Vis.icon className="w-2.5 h-2.5" />
                        <span className="hidden sm:inline">{Vis.label}</span>
                      </span>
                      {p.expiresIn && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground whitespace-nowrap">
                          <Clock className="w-2.5 h-2.5" />
                          <span className="hidden sm:inline">{p.expiresIn}</span>
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[13px] font-semibold text-primary leading-snug">{p.title}</p>
                    <p className="mt-0.5 text-[11.5px] text-muted-foreground leading-relaxed line-clamp-2">{p.body}</p>
                    {p.cta && (
                      <a href={p.cta.href} className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:text-accent">
                        {p.cta.label} <ArrowRight className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="self-start shrink-0 p-1 rounded-full text-muted-foreground hover:bg-surface-low hover:text-primary transition opacity-70 group-hover:opacity-100"
                        aria-label="Spotlight actions"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => copyLink(p)}>
                        <Link2 className="w-3.5 h-3.5 mr-2" /> Copy link
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        if (navigator.share) navigator.share({ title: p.title, text: p.body }).catch(() => {});
                        else copyLink(p);
                      }}>
                        <Share2 className="w-3.5 h-3.5 mr-2" /> Share
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => repost(p)}>
                        <Repeat2 className="w-3.5 h-3.5 mr-2" /> Repost
                      </DropdownMenuItem>
                      {mine && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => startEdit(p)}>
                            <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                          </DropdownMenuItem>
                          {p.visibility !== "private" && (
                            <DropdownMenuItem onClick={() => {
                              update(p.id, { visibility: "private" });
                              toast.success("Spotlight unpublished");
                            }}>
                              <EyeOff className="w-3.5 h-3.5 mr-2" /> Unpublish
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => { remove(p.id); toast.success("Spotlight deleted"); }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              );
            })}
          </ul>
          {hiddenCount > 0 && (
            <div className="px-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider border border-dashed border-primary/30 text-primary hover:bg-primary/5 transition"
              >
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showAll && "rotate-180")} />
                {showAll ? "Fold updates" : `Show ${hiddenCount} more update${hiddenCount === 1 ? "" : "s"}`}
              </button>
            </div>
          )}
          </>
        )}
      </div>
    </section>
  );
};

export default SpotlightWindow;