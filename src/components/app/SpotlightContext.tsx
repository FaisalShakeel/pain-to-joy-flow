import { createContext, useContext, useMemo, useState, ReactNode, useCallback } from "react";

export type Visibility = "public" | "contacts" | "private";
export type Tone = "info" | "warn" | "offer";

export interface SpotlightPost {
  id: string;
  title: string;
  body: string;
  visibility: Visibility;
  pinned?: boolean;
  expiresIn?: string;
  cta?: { label: string; href: string };
  tone: Tone;
  createdAt: number;
  audience?: string[]; // optional contact ids the post targets (for torch). empty = all contacts
  authorId?: string;   // who published the post. "me" = the logged-in user.
}

export const SPOTLIGHT_LIMITS = {
  title: 60,
  body: 240,
  ctaLabel: 24,
};

interface SpotlightCtx {
  posts: SpotlightPost[];
  create: (p: Omit<SpotlightPost, "id" | "createdAt">) => void;
  update: (id: string, patch: Partial<SpotlightPost>) => void;
  remove: (id: string) => void;
  // torch: per-contact unseen count
  unseenForContact: (contactId: string) => number;
  markSeen: (contactId: string) => void;
}

const Ctx = createContext<SpotlightCtx | null>(null);

const seed: SpotlightPost[] = [
  {
    id: "s1",
    title: "In meetings until 4 PM",
    body: "Please message first — I'll respond between blocks. Urgent? Mark request as urgent.",
    visibility: "contacts",
    pinned: true,
    expiresIn: "expires in 3h",
    tone: "warn",
    createdAt: Date.now() - 1000 * 60 * 30,
    authorId: "me",
  },
  {
    id: "s2",
    title: "Slots open tomorrow · Quick Sync",
    body: "Six 5-minute windows from 10:00 — first come, first booked.",
    visibility: "public",
    expiresIn: "expires tomorrow",
    cta: { label: "Book a slot", href: "/app/availability" },
    tone: "offer",
    createdAt: Date.now() - 1000 * 60 * 10,
    authorId: "me",
  },
  {
    id: "s3",
    title: "Back from Tokyo — open for intros",
    body: "Free Wed/Thu afternoons this week. Ping me if a quick sync helps.",
    visibility: "contacts",
    tone: "info",
    createdAt: Date.now() - 1000 * 60 * 5,
    authorId: "rashid-al-amir",
  },
  {
    id: "s4",
    title: "Heads-down on Q3 close",
    body: "Async only until Friday. Urgent? Mark as urgent and I'll surface it.",
    visibility: "contacts",
    tone: "warn",
    createdAt: Date.now() - 1000 * 60 * 2,
    authorId: "sarah-jenkins",
  },
];

export function SpotlightProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<SpotlightPost[]>(seed);
  // map contactId -> last seen timestamp
  const [lastSeen, setLastSeen] = useState<Record<string, number>>({});

  const create: SpotlightCtx["create"] = useCallback((p) => {
    const post: SpotlightPost = {
      authorId: "me",
      ...p,
      id: `s${Date.now()}`,
      createdAt: Date.now(),
    };
    setPosts((prev) => [post, ...prev]);
  }, []);

  const update: SpotlightCtx["update"] = useCallback((id, patch) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const remove: SpotlightCtx["remove"] = useCallback((id) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const unseenForContact = useCallback(
    (contactId: string) => {
      const last = lastSeen[contactId] ?? 0;
      return posts.filter((p) => {
        // Torch lights up on a contact row when THAT contact publishes
        // a new spotlight post — not when the logged-in user does.
        if (!p.authorId || p.authorId === "me") return false;
        if (p.authorId !== contactId) return false;
        if (p.visibility === "private") return false;
        return p.createdAt > last;
      }).length;
    },
    [posts, lastSeen],
  );

  const markSeen = useCallback((contactId: string) => {
    setLastSeen((s) => ({ ...s, [contactId]: Date.now() }));
  }, []);

  const value = useMemo(
    () => ({ posts, create, update, remove, unseenForContact, markSeen }),
    [posts, create, update, remove, unseenForContact, markSeen],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSpotlight() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSpotlight must be used within SpotlightProvider");
  return ctx;
}