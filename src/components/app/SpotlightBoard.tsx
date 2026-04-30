import { useEffect, useMemo, useRef, useState } from "react";
import {
  Megaphone, Pin, Globe, Users as UsersIcon, Lock, Clock, ArrowRight, Plus, X,
  Pencil, Trash2, Sparkles, AlertTriangle, Info, ChevronLeft, ChevronRight, Radio,
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
import {
  useSpotlight, SPOTLIGHT_LIMITS, AUDIENCE_TAGS,
  type SpotlightPost, type Visibility, type Tone, type AudienceTag,
} from "./SpotlightContext";
import { toast } from "sonner";
import { contacts, type Relationship } from "@/lib/mockData";

const visMeta: Record<Visibility, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  public:   { label: "Public",        icon: Globe    },
  contacts: { label: "Contacts only", icon: UsersIcon },
  private:  { label: "Private",       icon: Lock     },
};

const toneMeta: Record<Tone, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  info:  { label: "Info",     icon: Info },
  warn:  { label: "Heads-up", icon: AlertTriangle },
  offer: { label: "Offer",    icon: Sparkles },
};

const expiryOptions = [
  { id: "none",   label: "No expiry",   value: undefined as string | undefined },
  { id: "3h",     label: "3 hours",     value: "expires in 3h" },
  { id: "24h",    label: "Tomorrow",    value: "expires tomorrow" },
  { id: "7d",     label: "7 days",      value: "expires in 7 days" },
];

// Maps a contact relationship to one of the 5 audience filter buckets.
const relToTag = (rel: Relationship | undefined): AudienceTag => {
  if (!rel) return "other";
  if (rel === "colleague") return "colleague";
  if (rel === "client") return "client";
  if (rel === "family") return "family";
  if (rel === "friend" || rel === "mentor") return "friend";
  return "other"; // investor & anything else
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
  audienceTag: AudienceTag;
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
  audienceTag: "colleague",
};

const SpotlightBoard = () => {
  const { posts, create, update, remove, dismissedPosts, dismissPost, markSeen, markPostViewed, viewedPosts } = useSpotlight();
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  // Per-side selected audience filter
  const [spotlightAud, setSpotlightAud] = useState<AudienceTag>("colleague");
  const [signalAud, setSignalAud] = useState<AudienceTag>("colleague");

  // Contact lookups
  const contactRel = useMemo(() => {
    const m: Record<string, Relationship> = {};
    contacts.forEach((c) => { m[c.id] = c.relationship; });
    return m;
  }, []);
  const contactName = useMemo(() => {
    const m: Record<string, string> = {};
    contacts.forEach((c) => { m[c.id] = c.name; });
    return m;
  }, []);

  // ── Spotlight (mine) — grouped by audienceTag ────────────────────
  const mineByAud = useMemo(() => {
    const grp: Record<AudienceTag, SpotlightPost[]> = {
      colleague: [], friend: [], client: [], family: [], other: [],
    };
    posts
      .filter((p) => !p.authorId || p.authorId === "me")
      .forEach((p) => {
        const tag = (p.audienceTag ?? "other") as AudienceTag;
        grp[tag].push(p);
      });
    (Object.keys(grp) as AudienceTag[]).forEach((k) => {
      grp[k].sort((a, b) => {
        if (!!b.pinned !== !!a.pinned) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
        return b.createdAt - a.createdAt;
      });
      // Landing display rule: max 2 visible spotlight items per audience.
      grp[k] = grp[k].slice(0, 2);
    });
    return grp;
  }, [posts]);

  // ── Signal (others) — grouped by audienceTag (derived from relationship) ──
  const othersByAud = useMemo(() => {
    const grp: Record<AudienceTag, SpotlightPost[]> = {
      colleague: [], friend: [], client: [], family: [], other: [],
    };
    const sorted = posts
      .filter((p) => p.authorId && p.authorId !== "me" && p.visibility !== "private" && !dismissedPosts.has(p.id))
      .sort((a, b) => b.createdAt - a.createdAt);
    sorted.forEach((p) => {
      const tag = relToTag(contactRel[p.authorId!]);
      grp[tag].push(p);
    });
    return grp;
  }, [posts, dismissedPosts, contactRel]);

  // Unread per audience for Signal side
  const unreadByAud = useMemo(() => {
    const out: Record<AudienceTag, number> = { colleague: 0, friend: 0, client: 0, family: 0, other: 0 };
    (Object.keys(othersByAud) as AudienceTag[]).forEach((k) => {
      out[k] = othersByAud[k].filter((p) => !viewedPosts.has(p.id)).length;
    });
    return out;
  }, [othersByAud, viewedPosts]);

  const totalMine = useMemo(() => Object.values(mineByAud).reduce((n, a) => n + a.length, 0), [mineByAud]);
  const totalUnread = useMemo(() => Object.values(unreadByAud).reduce((n, x) => n + x, 0), [unreadByAud]);

  // Editor
  const openNew = (preTag?: AudienceTag) => {
    setDraft({ ...emptyDraft, audienceTag: preTag ?? spotlightAud });
    setEditorOpen(true);
  };
  const openEdit = (p: SpotlightPost) => {
    setDraft({
      id: p.id, title: p.title, body: p.body, visibility: p.visibility, tone: p.tone,
      pinned: !!p.pinned, expiresIn: p.expiresIn,
      ctaLabel: p.cta?.label ?? "", ctaHref: p.cta?.href ?? "",
      audienceTag: (p.audienceTag ?? "other") as AudienceTag,
    });
    setEditorOpen(true);
  };

  const saveDraft = () => {
    const title = draft.title.trim().slice(0, SPOTLIGHT_LIMITS.title);
    const body = draft.body.trim().slice(0, SPOTLIGHT_LIMITS.body);
    if (!title || !body) return;
    const cta = draft.ctaLabel.trim() && draft.ctaHref.trim()
      ? { label: draft.ctaLabel.trim().slice(0, SPOTLIGHT_LIMITS.ctaLabel), href: draft.ctaHref.trim() }
      : undefined;
    const payload = {
      title, body, visibility: draft.visibility, tone: draft.tone,
      pinned: draft.pinned, expiresIn: draft.expiresIn, cta,
      audienceTag: draft.audienceTag,
    };
    if (draft.id) update(draft.id, payload);
    else create(payload);
    setEditorOpen(false);
    toast.success(draft.id ? "Spotlight updated" : "Spotlight published");
  };

  const titleLeft = SPOTLIGHT_LIMITS.title - draft.title.length;
  const bodyLeft = SPOTLIGHT_LIMITS.body - draft.body.length;
  const valid = draft.title.trim().length > 0 && draft.body.trim().length > 0
    && titleLeft >= 0 && bodyLeft >= 0;

  return (
    <div className="">
      {/* ── Two aligned panes ── */}
      <div className="grid md:grid-cols-2 gap-3">
        {/* SPOTLIGHT (mine) */}
        <SidePane
          kind="spotlight"
          title="Spotlight"
          subtitle="What you publish"
          icon={Megaphone}
          accentClass="from-primary/15 to-primary/5 border-primary/30"
          chipActiveClass="bg-primary text-primary-foreground"
          selectedAud={spotlightAud}
          onSelectAud={setSpotlightAud}
          countByAud={Object.fromEntries(
            (Object.keys(mineByAud) as AudienceTag[]).map((k) => [k, mineByAud[k].length]),
          ) as Record<AudienceTag, number>}
          showCounts
          headerAction={
            <button
              onClick={() => openNew()}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-primary text-primary-foreground hover:opacity-95 transition"
            >
              <Plus className="w-3 h-3" /> New Spotlight
            </button>
          }
        >
          <Carousel
            items={mineByAud[spotlightAud]}
            empty={
              <EmptyTile
                label={`No Spotlight for ${AUDIENCE_TAGS.find((a) => a.id === spotlightAud)?.label}`}
                cta="Publish one"
                onCta={() => openNew(spotlightAud)}
              />
            }
            renderItem={(p) => (
              <MineCard
                post={p}
                onEdit={() => openEdit(p)}
                onDelete={() => setConfirmDelete(p.id)}
              />
            )}
          />
        </SidePane>

        {/* SIGNAL (others) */}
        <SidePane
          kind="signal"
          title="Signal"
          subtitle="Received from your network"
          icon={Radio}
          accentClass="from-gold/15 to-gold/5 border-gold/30"
          chipActiveClass="bg-gold text-background"
          selectedAud={signalAud}
          onSelectAud={setSignalAud}
          countByAud={unreadByAud}
          showCounts
          showUnread
        >
          <Carousel
            items={othersByAud[signalAud]}
            onView={(p) => {
              if (p.authorId) markSeen(p.authorId);
              markPostViewed(p.id);
            }}
            empty={
              <EmptyTile
                label={`No Signal from ${AUDIENCE_TAGS.find((a) => a.id === signalAud)?.label}`}
              />
            }
            renderItem={(p) => (
              <OtherCard
                post={p}
                authorName={contactName[p.authorId!] ?? "Contact"}
                isUnseen={!viewedPosts.has(p.id)}
                onDismiss={() => dismissPost(p.id)}
              />
            )}
          />
        </SidePane>
      </div>

      {/* Editor */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Edit Spotlight" : "New Spotlight"}</DialogTitle>
            <DialogDescription>
              Tag the audience so it lands in the right filter — one Spotlight per audience.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Audience filter</Label>
              <div className="flex flex-wrap gap-1.5">
                {AUDIENCE_TAGS.map((a) => {
                  const active = draft.audienceTag === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, audienceTag: a.id }))}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-[11px] font-semibold border transition",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-surface-lowest text-muted-foreground hover:text-primary",
                      )}
                    >
                      {a.emoji} {a.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sp-title">Title</Label>
                <span className={cn("text-[10px]", titleLeft < 0 ? "text-destructive" : "text-muted-foreground")}>{titleLeft} left</span>
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
                <span className={cn("text-[10px]", bodyLeft < 0 ? "text-destructive" : "text-muted-foreground")}>{bodyLeft} / {SPOTLIGHT_LIMITS.body}</span>
              </div>
              <Textarea
                id="sp-body"
                rows={3}
                value={draft.body}
                maxLength={SPOTLIGHT_LIMITS.body + 50}
                onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
                placeholder="What should they know right now?"
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
                <Input id="sp-cta-label" value={draft.ctaLabel} maxLength={SPOTLIGHT_LIMITS.ctaLabel} onChange={(e) => setDraft((d) => ({ ...d, ctaLabel: e.target.value }))} placeholder="Book a slot" />
              </div>
              <div>
                <Label htmlFor="sp-cta-href">CTA link</Label>
                <Input id="sp-cta-href" value={draft.ctaHref} onChange={(e) => setDraft((d) => ({ ...d, ctaHref: e.target.value }))} placeholder="/app/availability" />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl ghost-border bg-surface-low/40">
              <div className="flex items-center gap-2">
                <Pin className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-xs font-semibold text-primary">Pin to top</p>
                  <p className="text-[10px] text-muted-foreground">Keeps this post above others in its audience.</p>
                </div>
              </div>
              <Switch checked={draft.pinned} onCheckedChange={(v) => setDraft((d) => ({ ...d, pinned: v }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button onClick={saveDraft} disabled={!valid}>{draft.id ? "Save changes" : "Publish"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this Spotlight?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the post for everyone who could see it. This can't be undone.
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
    </div>
  );
};

/* ── Side pane wrapper with audience filter chips ───────────────── */
function SidePane({
  kind, title, subtitle, icon: Icon, accentClass, chipActiveClass,
  selectedAud, onSelectAud, countByAud, showCounts, showUnread, children, headerAction,
}: {
  kind: "spotlight" | "signal";
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
  chipActiveClass: string;
  selectedAud: AudienceTag;
  onSelectAud: (a: AudienceTag) => void;
  countByAud: Record<AudienceTag, number>;
  showCounts?: boolean;
  showUnread?: boolean;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl bg-gradient-to-br ghost-border p-2.5 flex flex-col h-[235px]", accentClass)}>
      <div className="flex items-center justify-between gap-2 mb-1.5 px-1">
        <div className="flex items-center gap-1.5">
          <Icon className={cn("w-3.5 h-3.5", kind === "spotlight" ? "text-primary" : "text-gold")} />
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-primary">{title}</h4>
          <span className="text-[10px] text-muted-foreground">· {subtitle}</span>
        </div>
        {headerAction}
      </div>
      {/* Audience chips */}
      <div className="flex items-center gap-1 mb-2 px-1 overflow-x-auto no-scrollbar">
        {AUDIENCE_TAGS.map((a) => {
          const active = selectedAud === a.id;
          const count = countByAud[a.id] ?? 0;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onSelectAud(a.id)}
              className={cn(
                "shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold border transition",
                active
                  ? cn("border-transparent", chipActiveClass)
                  : "border-border bg-surface-lowest text-muted-foreground hover:text-primary",
              )}
            >
              <span>{a.emoji}</span>
              <span>{a.label}</span>
              {showCounts && count > 0 && (
                <span className={cn(
                  "ml-0.5 inline-flex items-center justify-center min-w-[14px] h-[14px] px-1 rounded-full text-[9px] font-bold",
                  active
                    ? "bg-background/20 text-current"
                    : showUnread
                    ? "bg-gold text-background"
                    : "bg-primary/15 text-primary",
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

/* ── Horizontal carousel with snap + arrows ─────────────────────── */
function Carousel<T extends { id: string }>({
  items, renderItem, empty, onView,
}: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  empty: React.ReactNode;
  onView?: (item: T) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);

  // Notify view when index changes
  useEffect(() => {
    if (items[idx] && onView) onView(items[idx]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, items.length]);

  // Reset to 0 when item set changes
  useEffect(() => { setIdx(0); }, [items.map((i) => i.id).join("|")]);

  const scrollTo = (next: number) => {
    const clamped = Math.max(0, Math.min(items.length - 1, next));
    setIdx(clamped);
    const el = ref.current;
    if (!el) return;
    const child = el.children[clamped] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  };

  if (items.length === 0) {
    return <div className="h-full">{empty}</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div
        ref={ref}
        className="flex-1 flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar"
        onScroll={(e) => {
          const el = e.currentTarget;
          const w = el.clientWidth;
          const i = Math.round(el.scrollLeft / w);
          if (i !== idx) setIdx(i);
        }}
      >
        {items.map((it) => (
          <div key={it.id} className="snap-start shrink-0 w-full h-full">
            {renderItem(it)}
          </div>
        ))}
      </div>
      {items.length > 1 && (
        <div className="mt-2 flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => scrollTo(idx - 1)}
            disabled={idx === 0}
            className="grid place-items-center w-6 h-6 rounded-full bg-surface-lowest ghost-border text-primary disabled:opacity-40 hover:bg-surface-low transition"
            aria-label="Previous"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1">
            {items.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === idx ? "w-4 bg-primary" : "w-1.5 bg-border",
                )}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => scrollTo(idx + 1)}
            disabled={idx === items.length - 1}
            className="grid place-items-center w-6 h-6 rounded-full bg-surface-lowest ghost-border text-primary disabled:opacity-40 hover:bg-surface-low transition"
            aria-label="Next"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Spotlight (mine) card ──────────────────────────────────────── */
function MineCard({ post, onEdit, onDelete }: { post: SpotlightPost; onEdit: () => void; onDelete: () => void }) {
  const Vis = visMeta[post.visibility];
  const Tn = toneMeta[post.tone];
  const aud = AUDIENCE_TAGS.find((a) => a.id === (post.audienceTag ?? "other"));
  return (
    <div className="relative h-full p-4 rounded-2xl bg-primary text-primary-foreground border border-primary flex flex-col">
      <div className="absolute top-2 right-2 flex items-center gap-1">
        <button onClick={onEdit} className="p-1 rounded-full text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground transition" aria-label="Edit"><Pencil className="w-3 h-3" /></button>
        <button onClick={onDelete} className="p-1 rounded-full text-primary-foreground/70 hover:bg-rose-500/20 hover:text-rose-200 transition" aria-label="Delete"><Trash2 className="w-3 h-3" /></button>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap pr-14">
        {aud && (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-gold text-background">
            {aud.emoji} {aud.label}
          </span>
        )}
        {post.pinned && (
          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary-foreground/15 text-primary-foreground">
            <Pin className="w-2.5 h-2.5" /> Pinned
          </span>
        )}
        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary-foreground/15 text-primary-foreground">
          <Vis.icon className="w-2.5 h-2.5" /> {Vis.label}
        </span>
        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary-foreground/15 text-primary-foreground">
          <Tn.icon className="w-2.5 h-2.5" /> {Tn.label}
        </span>
      </div>
      <h4 className="mt-2 font-headline font-bold text-primary-foreground text-sm leading-tight">{post.title}</h4>
      <p className="mt-1 text-xs text-primary-foreground/80 leading-relaxed line-clamp-4 flex-1">{post.body}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        {post.expiresIn ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-primary-foreground/70">
            <Clock className="w-3 h-3" /> {post.expiresIn}
          </span>
        ) : <span />}
        {post.cta && (
          <a href={post.cta.href} className="inline-flex items-center gap-1 text-[11px] font-bold text-gold hover:text-primary-foreground">
            {post.cta.label} <ArrowRight className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}

/* ── Signal (others) card — visually distinct (gold-trim, lighter) ── */
function OtherCard({
  post, authorName, isUnseen, onDismiss,
}: {
  post: SpotlightPost;
  authorName: string;
  isUnseen: boolean;
  onDismiss: () => void;
}) {
  const Vis = visMeta[post.visibility];
  const Tn = toneMeta[post.tone];
  return (
    <div className={cn(
      "relative h-full p-4 rounded-2xl border-2 flex flex-col bg-surface-lowest",
      isUnseen ? "border-gold shadow-[0_0_0_3px_hsl(var(--brand-gold)/0.12)]" : "border-border opacity-90",
    )}>
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 p-1 rounded-full text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 transition"
        aria-label="Mark seen and dismiss"
      >
        <X className="w-3 h-3" />
      </button>
      <div className="flex items-center gap-1.5 flex-wrap pr-7">
        {isUnseen && (
          <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-gold text-background">
            New Signal
          </span>
        )}
        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-surface-low text-muted-foreground">
          <Vis.icon className="w-2.5 h-2.5" /> {Vis.label}
        </span>
        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-surface-low text-muted-foreground">
          <Tn.icon className="w-2.5 h-2.5" /> {Tn.label}
        </span>
      </div>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-gold">{authorName}</p>
      <h4 className="mt-0.5 font-headline font-bold text-primary text-sm leading-tight">{post.title}</h4>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-4 flex-1">{post.body}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        {post.expiresIn ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3" /> {post.expiresIn}
          </span>
        ) : <span />}
        {post.cta && (
          <a href={post.cta.href} className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:text-accent">
            {post.cta.label} <ArrowRight className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}

function EmptyTile({ label, cta, onCta }: { label: string; cta?: string; onCta?: () => void }) {
  return (
    <div className="h-full grid place-items-center rounded-2xl ghost-border bg-surface-lowest/60 p-5 text-center">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {cta && onCta && (
          <button
            onClick={onCta}
            className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-primary text-primary-foreground hover:opacity-95 transition"
          >
            <Plus className="w-3 h-3" /> {cta}
          </button>
        )}
      </div>
    </div>
  );
}

export default SpotlightBoard;