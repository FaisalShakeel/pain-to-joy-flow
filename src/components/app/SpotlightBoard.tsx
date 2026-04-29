import { useState } from "react";
import {
  Megaphone, Pin, Globe, Users as UsersIcon, Lock, Clock, ArrowRight, Plus, X,
  Pencil, Trash2, Sparkles, AlertTriangle, Info, Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSpotlight, SPOTLIGHT_LIMITS, type SpotlightPost, type Visibility, type Tone } from "./SpotlightContext";
import { toast } from "sonner";
import { contacts, type Relationship } from "@/lib/mockData";

// Maximum number of simultaneously-published spotlight posts the
// logged-in user is allowed to keep live at once.
const MAX_ACTIVE_BY_ME = 1;

// In the "From others" feed, only the most recent post per author is shown
// — keeps the surface light (one window per contact).
const MAX_PER_OTHER_AUTHOR = 1;

const visMeta: Record<Visibility, { label: string; icon: React.ComponentType<{ className?: string }>; cls: string }> = {
  public:   { label: "Public",        icon: Globe,    cls: "bg-emerald-500/10 text-emerald-700" },
  contacts: { label: "Contacts only", icon: UsersIcon, cls: "bg-sky-500/10 text-sky-700" },
  private:  { label: "Private",       icon: Lock,     cls: "bg-muted text-muted-foreground" },
};

const toneMeta: Record<Tone, { label: string; icon: React.ComponentType<{ className?: string }>; bg: string }> = {
  info:  { label: "Info",  icon: Info,           bg: "from-primary/10 to-accent/10 border-primary/20" },
  warn:  { label: "Heads-up", icon: AlertTriangle, bg: "from-amber-500/15 to-rose-500/10 border-amber-400/30" },
  offer: { label: "Offer", icon: Sparkles,       bg: "from-emerald-500/10 to-teal-500/10 border-emerald-400/30" },
};

const expiryOptions = [
  { id: "none",   label: "No expiry",   value: undefined as string | undefined },
  { id: "3h",     label: "3 hours",     value: "expires in 3h" },
  { id: "24h",    label: "Tomorrow",    value: "expires tomorrow" },
  { id: "7d",     label: "7 days",      value: "expires in 7 days" },
];

// Audience filter buckets for the "From others" feed.
// "client" / "colleague" map straight to Relationship; "friend" includes
// friend + family + mentor; "other" catches anything that doesn't fit.
type AudienceFilter = "all" | "colleague" | "friend" | "client" | "other";

const audienceFilters: { id: AudienceFilter; label: string }[] = [
  { id: "all",       label: "All" },
  { id: "colleague", label: "Office colleagues" },
  { id: "friend",    label: "Friends" },
  { id: "client",    label: "Clients" },
  { id: "other",     label: "Other" },
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

type Draft = {
  id?: string;
  title: string;
  body: string;
  visibility: Visibility;
  tone: Tone;
  pinned: boolean;
  expiresIn?: string;
  ctaLabel: string;
  ctaHref: string;
};

const emptyDraft: Draft = {
  title: "",
  body: "",
  visibility: "contacts",
  tone: "info",
  pinned: false,
  expiresIn: undefined,
  ctaLabel: "",
  ctaHref: "",
};

const SpotlightBoard = () => {
  const { posts, create, update, remove, dismissedPosts, dismissPost } = useSpotlight();
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [audience, setAudience] = useState<AudienceFilter>("all");

  const myActive = posts.filter((p) => !p.authorId || p.authorId === "me");
  const atLimit = myActive.length >= MAX_ACTIVE_BY_ME;

  const openNew = () => {
    if (atLimit) {
      toast.error(`Limit reached — ${MAX_ACTIVE_BY_ME} active posts max`, {
        description: "Delete or edit one of your live spotlight posts to publish a new one.",
      });
      return;
    }
    setDraft(emptyDraft);
    setEditorOpen(true);
  };
  const openEdit = (p: SpotlightPost) => {
    setDraft({
      id: p.id, title: p.title, body: p.body, visibility: p.visibility, tone: p.tone,
      pinned: !!p.pinned, expiresIn: p.expiresIn,
      ctaLabel: p.cta?.label ?? "", ctaHref: p.cta?.href ?? "",
    });
    setEditorOpen(true);
  };

  const saveDraft = () => {
    const title = draft.title.trim().slice(0, SPOTLIGHT_LIMITS.title);
    const body = draft.body.trim().slice(0, SPOTLIGHT_LIMITS.body);
    if (!title || !body) return;
    // Hard cap: only allow MAX_ACTIVE_BY_ME live posts authored by "me".
    // Editing existing posts is always allowed.
    if (!draft.id && atLimit) {
      toast.error(`Limit reached — ${MAX_ACTIVE_BY_ME} active posts max`, {
        description: "Delete or edit one of your live spotlight posts first.",
      });
      return;
    }
    const cta = draft.ctaLabel.trim() && draft.ctaHref.trim()
      ? { label: draft.ctaLabel.trim().slice(0, SPOTLIGHT_LIMITS.ctaLabel), href: draft.ctaHref.trim() }
      : undefined;
    const payload = {
      title, body, visibility: draft.visibility, tone: draft.tone,
      pinned: draft.pinned, expiresIn: draft.expiresIn, cta,
    };
    if (draft.id) update(draft.id, payload);
    else create(payload);
    setEditorOpen(false);
  };

  const titleLeft = SPOTLIGHT_LIMITS.title - draft.title.length;
  const bodyLeft = SPOTLIGHT_LIMITS.body - draft.body.length;
  const valid = draft.title.trim().length > 0 && draft.body.trim().length > 0
    && titleLeft >= 0 && bodyLeft >= 0;

  // ── My posts (cap = 2) ────────────────────────────────────────────
  const mine = posts.filter((p) => !p.authorId || p.authorId === "me");
  const orderedMine = [...mine].sort((a, b) => {
    if (!!b.pinned !== !!a.pinned) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
    return b.createdAt - a.createdAt;
  });

  // ── From others ───────────────────────────────────────────────────
  // Build a quick lookup of contact -> relationship.
  const contactRel: Record<string, Relationship> = {};
  contacts.forEach((c) => { contactRel[c.id] = c.relationship; });
  const contactName: Record<string, string> = {};
  contacts.forEach((c) => { contactName[c.id] = c.name; });

  const others = posts
    .filter(
      (p) =>
        p.authorId &&
        p.authorId !== "me" &&
        p.visibility !== "private" &&
        !dismissedPosts.has(p.id),
    )
    .sort((a, b) => b.createdAt - a.createdAt);

  // Cap to 1 post per author (most recent wins)
  const seenAuthors = new Set<string>();
  const cappedOthers = others.filter((p) => {
    if (!p.authorId) return false;
    if (seenAuthors.has(p.authorId)) return false;
    seenAuthors.add(p.authorId);
    return true;
  });

  const filteredOthers = cappedOthers.filter((p) =>
    matchesAudience(contactRel[p.authorId!], audience),
  );

  const unreadOthers = filteredOthers.length;

  return (
    <div className="rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-gold/15 text-gold">
            <Megaphone className="w-4 h-4" />
          </span>
          <div>
            <h3 className="font-headline font-bold text-primary leading-tight">Spotlight</h3>
            <p className="text-[11px] text-muted-foreground">
              One live post from you · {unreadOthers} unread from your network
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {myActive.length}/{MAX_ACTIVE_BY_ME} windows
          </span>
          <button
            onClick={openNew}
            disabled={atLimit}
            title={atLimit ? `Limit reached — only ${MAX_ACTIVE_BY_ME} active spotlight post at a time. Delete it to publish another.` : "New post"}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition",
              atLimit
                ? "bg-surface-low text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:opacity-95",
            )}
          >
            <Plus className="w-3.5 h-3.5" /> New post
          </button>
        </div>
      </div>

      {/* ── Two-window layout: [my single post] | [others feed] ── */}
      <div className="mt-5 grid lg:grid-cols-2 gap-4">
        {/* Window 1 — My post (cap = 1) */}
        <div className="rounded-2xl ghost-border bg-surface-low/30 p-3">
          <div className="flex items-center justify-between mb-2 px-1">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              My post · {orderedMine.length}/{MAX_ACTIVE_BY_ME}
            </h4>
          </div>
          {orderedMine.length === 0 ? (
            <div className="p-5 rounded-2xl ghost-border bg-surface-low/50 text-center text-xs text-muted-foreground">
              No spotlight post yet — share an update to light up your contacts.
            </div>
          ) : (
            <ul className="space-y-3">
              {orderedMine.slice(0, MAX_ACTIVE_BY_ME).map((p) => {
              const Vis = visMeta[p.visibility];
              const Tn = toneMeta[p.tone];
              return (
                <li key={p.id} className={cn("relative p-4 rounded-2xl bg-gradient-to-br border", Tn.bg)}>
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <button
                      onClick={() => openEdit(p)}
                      className="p-1 rounded-full text-muted-foreground hover:bg-surface-low/70 hover:text-primary transition"
                      aria-label="Edit"
                      title="Edit"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(p.id)}
                      className="p-1 rounded-full text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 transition"
                      aria-label="Delete"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap pr-14">
                    {p.pinned && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
                        <Pin className="w-2.5 h-2.5" /> Pinned
                      </span>
                    )}
                    <span className={cn("inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full", Vis.cls)}>
                      <Vis.icon className="w-2.5 h-2.5" /> {Vis.label}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-surface-low text-muted-foreground">
                      <Tn.icon className="w-2.5 h-2.5" /> {Tn.label}
                    </span>
                  </div>
                  <h4 className="mt-2 font-headline font-bold text-primary text-sm leading-tight">{p.title}</h4>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-3">{p.body}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    {p.expiresIn ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="w-3 h-3" /> {p.expiresIn}
                      </span>
                    ) : <span />}
                    {p.cta && (
                      <a href={p.cta.href} className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:text-accent">
                        {p.cta.label} <ArrowRight className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </li>
              );
              })}
            </ul>
          )}
        </div>

        {/* Window 2 — From others (with filter + unread badge + dismiss) */}
        <div className="rounded-2xl ghost-border bg-surface-low/30 p-3">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3 px-1">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground inline-flex items-center gap-2">
              From others
              {unreadOthers > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {unreadOthers}
                </span>
              )}
            </h4>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-3 h-3 text-muted-foreground" />
            {audienceFilters.map((f) => {
              const active = audience === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setAudience(f.id)}
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10px] font-semibold border transition",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface-lowest text-muted-foreground hover:text-primary",
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
        {filteredOthers.length === 0 ? (
          <div className="p-5 rounded-2xl ghost-border bg-surface-low/50 text-center text-xs text-muted-foreground">
            All caught up — no new spotlight posts from this group.
          </div>
        ) : (
          <ul className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {filteredOthers.map((p) => {
              const Vis = visMeta[p.visibility];
              const Tn = toneMeta[p.tone];
              const author = contactName[p.authorId!] ?? "Contact";
              const rel = contactRel[p.authorId!];
              return (
                <li key={p.id} className={cn("relative p-4 rounded-2xl bg-gradient-to-br border", Tn.bg)}>
                  <button
                    onClick={() => dismissPost(p.id)}
                    className="absolute top-2 right-2 p-1 rounded-full text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 transition"
                    aria-label="Mark seen and dismiss"
                    title="Mark seen and dismiss"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="flex items-center gap-1.5 flex-wrap pr-7">
                    <span className={cn("inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full", Vis.cls)}>
                      <Vis.icon className="w-2.5 h-2.5" /> {Vis.label}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-surface-low text-muted-foreground">
                      <Tn.icon className="w-2.5 h-2.5" /> {Tn.label}
                    </span>
                    {rel && (
                      <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-accent/10 text-accent">
                        {rel}
                      </span>
                    )}
                  </div>
                  <h4 className="mt-2 font-headline font-bold text-primary text-sm leading-tight">{p.title}</h4>
                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {author}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-3">{p.body}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    {p.expiresIn ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="w-3 h-3" /> {p.expiresIn}
                      </span>
                    ) : <span />}
                    {p.cta && (
                      <a href={p.cta.href} className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:text-accent">
                        {p.cta.label} <ArrowRight className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        </div>
      </div>

      {/* Editor dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Edit spotlight post" : "New spotlight post"}</DialogTitle>
            <DialogDescription>
              Short, sharp updates. Pinned posts stay on top. New posts light a torch on your contacts.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sp-title">Title</Label>
                <span className={cn("text-[10px]", titleLeft < 0 ? "text-destructive" : "text-muted-foreground")}>
                  {titleLeft} left
                </span>
              </div>
              <Input
                id="sp-title"
                value={draft.title}
                maxLength={SPOTLIGHT_LIMITS.title + 10}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="In meetings until 4 PM"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sp-body">Message</Label>
                <span className={cn("text-[10px]", bodyLeft < 0 ? "text-destructive" : "text-muted-foreground")}>
                  {bodyLeft} / {SPOTLIGHT_LIMITS.body}
                </span>
              </div>
              <Textarea
                id="sp-body"
                rows={3}
                value={draft.body}
                maxLength={SPOTLIGHT_LIMITS.body + 50}
                onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
                placeholder="What should people know right now?"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block">Visibility</Label>
                <div className="flex flex-col gap-1">
                  {(Object.keys(visMeta) as Visibility[]).map((v) => {
                    const M = visMeta[v];
                    const active = draft.visibility === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setDraft((d) => ({ ...d, visibility: v }))}
                        className={cn(
                          "inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition",
                          active ? "border-primary bg-primary/5 text-primary" : "border-border bg-surface-lowest text-muted-foreground hover:text-primary",
                        )}
                      >
                        <M.icon className="w-3.5 h-3.5" /> {M.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label className="mb-1.5 block">Tone</Label>
                <div className="flex flex-col gap-1">
                  {(Object.keys(toneMeta) as Tone[]).map((t) => {
                    const M = toneMeta[t];
                    const active = draft.tone === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setDraft((d) => ({ ...d, tone: t }))}
                        className={cn(
                          "inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition",
                          active ? "border-primary bg-primary/5 text-primary" : "border-border bg-surface-lowest text-muted-foreground hover:text-primary",
                        )}
                      >
                        <M.icon className="w-3.5 h-3.5" /> {M.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">Expiry</Label>
              <div className="flex flex-wrap gap-1.5">
                {expiryOptions.map((o) => {
                  const active = (draft.expiresIn ?? undefined) === o.value;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, expiresIn: o.value }))}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-[11px] font-semibold border transition",
                        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface-lowest text-muted-foreground hover:text-primary",
                      )}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sp-cta-label">CTA label (optional)</Label>
                <Input
                  id="sp-cta-label"
                  value={draft.ctaLabel}
                  maxLength={SPOTLIGHT_LIMITS.ctaLabel}
                  onChange={(e) => setDraft((d) => ({ ...d, ctaLabel: e.target.value }))}
                  placeholder="Book a slot"
                />
              </div>
              <div>
                <Label htmlFor="sp-cta-href">CTA link</Label>
                <Input
                  id="sp-cta-href"
                  value={draft.ctaHref}
                  onChange={(e) => setDraft((d) => ({ ...d, ctaHref: e.target.value }))}
                  placeholder="/app/availability"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl ghost-border bg-surface-low/40">
              <div className="flex items-center gap-2">
                <Pin className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-xs font-semibold text-primary">Pin to top</p>
                  <p className="text-[10px] text-muted-foreground">Keeps this post above others.</p>
                </div>
              </div>
              <Switch checked={draft.pinned} onCheckedChange={(v) => setDraft((d) => ({ ...d, pinned: v }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button onClick={saveDraft} disabled={!valid}>
              {draft.id ? "Save changes" : "Publish post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the spotlight post for everyone who could see it. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (confirmDelete) remove(confirmDelete); setConfirmDelete(null); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hidden helper to silence unused import warnings if any */}
      <span className="hidden"><X /></span>
    </div>
  );
};

export default SpotlightBoard;