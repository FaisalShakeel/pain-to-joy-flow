import { useState } from "react";
import { Megaphone, Pin, Globe, Users as UsersIcon, Lock, Clock, ArrowRight, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Visibility = "public" | "contacts" | "private";

interface SpotlightPost {
  id: string;
  title: string;
  body: string;
  visibility: Visibility;
  pinned?: boolean;
  expiresIn?: string;
  cta?: { label: string; href: string };
  tone: "info" | "warn" | "offer";
}

const visMeta: Record<Visibility, { label: string; icon: React.ComponentType<{ className?: string }>; cls: string }> = {
  public:   { label: "Public",        icon: Globe,    cls: "bg-emerald-500/10 text-emerald-700" },
  contacts: { label: "Contacts only", icon: UsersIcon, cls: "bg-sky-500/10 text-sky-700" },
  private:  { label: "Private",       icon: Lock,     cls: "bg-muted text-muted-foreground" },
};

const initialPosts: SpotlightPost[] = [
  {
    id: "s1",
    title: "In meetings until 4 PM",
    body: "Please message first — I'll respond between blocks. Urgent? Mark request as urgent.",
    visibility: "contacts",
    pinned: true,
    expiresIn: "expires in 3h",
    tone: "warn",
  },
  {
    id: "s2",
    title: "Slots open tomorrow · Quick Sync",
    body: "Six 5-minute windows from 10:00 — first come, first booked.",
    visibility: "public",
    expiresIn: "expires tomorrow",
    cta: { label: "Book a slot", href: "/app/availability" },
    tone: "offer",
  },
  {
    id: "s3",
    title: "New: Power Calls add-on launched",
    body: "Approved contacts can ring you on demand without seeing your number.",
    visibility: "public",
    cta: { label: "Learn more", href: "/app/upgrade" },
    tone: "info",
  },
];

const toneStyles: Record<SpotlightPost["tone"], string> = {
  info:  "from-primary/10 to-accent/10 border-primary/20",
  warn:  "from-amber-500/15 to-rose-500/10 border-amber-400/30",
  offer: "from-emerald-500/10 to-teal-500/10 border-emerald-400/30",
};

const SpotlightBoard = () => {
  const [posts, setPosts] = useState(initialPosts);
  const dismiss = (id: string) => setPosts((p) => p.filter((x) => x.id !== id));

  return (
    <div className="rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-gold/15 text-gold">
            <Megaphone className="w-4 h-4" />
          </span>
          <div>
            <h3 className="font-headline font-bold text-primary leading-tight">Spotlight</h3>
            <p className="text-[11px] text-muted-foreground">Announcements, invites, updates and notes</p>
          </div>
        </div>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:opacity-95 transition">
          <Plus className="w-3.5 h-3.5" /> New post
        </button>
      </div>

      <ul className="mt-4 grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {posts.map((p) => {
          const Vis = visMeta[p.visibility];
          return (
            <li
              key={p.id}
              className={cn(
                "relative p-4 rounded-2xl bg-gradient-to-br border",
                toneStyles[p.tone],
              )}
            >
              <button
                onClick={() => dismiss(p.id)}
                className="absolute top-2 right-2 p-1 rounded-full text-muted-foreground hover:bg-surface-low/70 hover:text-primary transition"
                aria-label="Dismiss"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="flex items-center gap-1.5 flex-wrap">
                {p.pinned && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
                    <Pin className="w-2.5 h-2.5" /> Pinned
                  </span>
                )}
                <span className={cn("inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full", Vis.cls)}>
                  <Vis.icon className="w-2.5 h-2.5" /> {Vis.label}
                </span>
              </div>
              <h4 className="mt-2 font-headline font-bold text-primary text-sm leading-tight">{p.title}</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{p.body}</p>
              <div className="mt-3 flex items-center justify-between gap-2">
                {p.expiresIn ? (
                  <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="w-3 h-3" /> {p.expiresIn}
                  </span>
                ) : <span />}
                {p.cta && (
                  <a
                    href={p.cta.href}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:text-accent"
                  >
                    {p.cta.label} <ArrowRight className="w-3 h-3" />
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default SpotlightBoard;