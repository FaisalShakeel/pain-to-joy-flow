import { useMemo, useState } from "react";
import {
  Search,
  BadgeCheck,
  MapPin,
  Heart,
  MessageCircle,
  Share2,
  UserPlus,
  QrCode,
  TrendingUp,
  Users,
  X,
  Sparkles,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import Avatar from "@/components/app/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

type Person = {
  id: string;
  name: string;
  initials: string;
  title: string;
  company: string;
  city?: string;
  industry: string;
  mutual?: number;
  verified?: boolean;
  accent: string;
  tags: string[];
};

const PEOPLE: Person[] = [
  { id: "p1", name: "Ahmed Khan", initials: "AK", title: "iOS Engineer", company: "Apple", city: "Cupertino", industry: "Developers", mutual: 12, verified: true, accent: "from-sky-500 to-indigo-600", tags: ["Swift", "Mobile"] },
  { id: "p2", name: "Sara Malik", initials: "SM", title: "Product Designer", company: "Google", city: "London", industry: "Designers", mutual: 8, verified: true, accent: "from-pink-500 to-rose-600", tags: ["UX", "Figma"] },
  { id: "p3", name: "Ali Raza", initials: "AR", title: "Founder", company: "Finlock", city: "Karachi", industry: "Founders", mutual: 5, verified: false, accent: "from-amber-500 to-orange-600", tags: ["Fintech"] },
  { id: "p4", name: "Maya Chen", initials: "MC", title: "Senior Recruiter", company: "Stripe", city: "Dubai", industry: "Recruiters", mutual: 3, verified: true, accent: "from-emerald-500 to-teal-600", tags: ["Hiring"] },
  { id: "p5", name: "Daniel Park", initials: "DP", title: "Partner", company: "Sequoia", city: "Singapore", industry: "Investors", mutual: 21, verified: true, accent: "from-violet-500 to-fuchsia-600", tags: ["Seed", "Series A"] },
  { id: "p6", name: "Lena Voss", initials: "LV", title: "Content Creator", company: "Independent", city: "Berlin", industry: "Creators", mutual: 2, verified: false, accent: "from-rose-500 to-red-600", tags: ["Video"] },
  { id: "p7", name: "Hassan Iqbal", initials: "HI", title: "Full-stack Engineer", company: "Vercel", city: "Karachi", industry: "Developers", mutual: 6, verified: true, accent: "from-cyan-500 to-blue-600", tags: ["React"] },
  { id: "p8", name: "Ivy Okafor", initials: "IO", title: "Brand Designer", company: "Linear", city: "Lagos", industry: "Designers", mutual: 4, verified: true, accent: "from-lime-500 to-emerald-600", tags: ["Brand"] },
];

type Post = {
  id: string;
  authorId: string;
  time: string;
  text: string;
  tag?: "Hiring" | "Launching" | "Partnership" | "Looking";
  likes: number;
  comments: number;
};

const POSTS: Post[] = [
  { id: "f1", authorId: "p3", time: "2h", text: "Launching my fintech startup next month — looking for two early design partners in MENA. DM if interested.", tag: "Launching", likes: 124, comments: 18 },
  { id: "f2", authorId: "p4", time: "4h", text: "Hiring UI/UX designers for Stripe's Dubai team. Remote-friendly, senior level. Referrals welcome.", tag: "Hiring", likes: 86, comments: 12 },
  { id: "f3", authorId: "p1", time: "6h", text: "Looking for mobile developers (Swift/Kotlin) to collaborate on a side project around focused work hours.", tag: "Looking", likes: 42, comments: 9 },
  { id: "f4", authorId: "p5", time: "1d", text: "Open to partnerships with founders building in vertical AI. Reply with one-liner + traction.", tag: "Partnership", likes: 210, comments: 31 },
];

const CHIPS = ["All", "Developers", "Founders", "Designers", "Recruiters", "Investors", "Creators", "Nearby", "Verified"] as const;
type Chip = (typeof CHIPS)[number];

const TAG_STYLES: Record<NonNullable<Post["tag"]>, string> = {
  Hiring: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Launching: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Partnership: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  Looking: "bg-sky-500/10 text-sky-600 border-sky-500/20",
};

const Explore = () => {
  const [chip, setChip] = useState<Chip>("All");
  const [query, setQuery] = useState("");
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [qrOpen, setQrOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PEOPLE.filter((p) => {
      if (chip === "Verified" && !p.verified) return false;
      if (chip === "Nearby" && p.city !== "Karachi") return false;
      if (chip !== "All" && chip !== "Verified" && chip !== "Nearby" && p.industry !== chip) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.company.toLowerCase().includes(q) ||
        p.industry.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [chip, query]);

  const featured = filtered.slice(0, 6);
  const trending = [...PEOPLE].sort((a, b) => (b.mutual ?? 0) - (a.mutual ?? 0)).slice(0, 4);
  const nearby = PEOPLE.filter((p) => p.city === "Karachi");

  const toggleConnect = (id: string, name: string) => {
    setConnected((c) => {
      const next = { ...c, [id]: !c[id] };
      toast({
        title: next[id] ? "Request sent" : "Request withdrawn",
        description: next[id] ? `Connection request sent to ${name}.` : `You withdrew your request to ${name}.`,
      });
      return next;
    });
  };

  const personById = (id: string) => PEOPLE.find((p) => p.id === id)!;

  return (
    <AppShell title="Explore" subtitle="Discover" hideBell>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people, companies, industries…"
          className="pl-9 h-11 rounded-2xl bg-surface-lowest border-border/60"
        />
      </div>

      {/* Chips */}
      <div className="-mx-4 md:-mx-8 px-4 md:px-8 mb-6">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {CHIPS.map((c) => (
            <button
              key={c}
              onClick={() => setChip(c)}
              className={cn(
                "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                chip === c
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-surface-lowest text-muted-foreground border-border/60 hover:text-primary hover:border-primary/40",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Featured carousel */}
      <section className="mb-8">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-accent">For you</p>
            <h2 className="font-headline font-extrabold text-primary text-lg">People you may know</h2>
          </div>
          <button className="text-xs font-semibold text-muted-foreground hover:text-primary">See all</button>
        </div>

        <div className="-mx-4 md:-mx-8 px-4 md:px-8">
          <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2">
            {featured.length === 0 && (
              <div className="text-sm text-muted-foreground py-6">No matches. Try another filter.</div>
            )}
            {featured.map((p) => (
              <article
                key={p.id}
                className="snap-start shrink-0 w-56 rounded-2xl bg-surface-lowest border border-border/60 p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex flex-col items-center text-center">
                  <Avatar initials={p.initials} accent={p.accent} size="lg" />
                  <div className="mt-2 flex items-center gap-1">
                    <p className="font-semibold text-primary text-sm truncate max-w-[10rem]">{p.name}</p>
                    {p.verified && <BadgeCheck className="w-4 h-4 text-sky-500" aria-label="Verified" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[12rem]">
                    {p.title} @ {p.company}
                  </p>
                  {p.mutual ? (
                    <p className="mt-1 text-[10px] text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" /> {p.mutual} mutual
                    </p>
                  ) : null}
                  <Button
                    size="sm"
                    variant={connected[p.id] ? "outline" : "default"}
                    className="mt-3 w-full h-8 rounded-full text-xs"
                    onClick={() => toggleConnect(p.id, p.name)}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    {connected[p.id] ? "Requested" : "Connect"}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Activity feed */}
      <section className="mb-8">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-accent">Live</p>
            <h2 className="font-headline font-extrabold text-primary text-lg">Activity feed</h2>
          </div>
        </div>

        <div className="space-y-3">
          {POSTS.map((post) => {
            const a = personById(post.authorId);
            const isLiked = !!liked[post.id];
            return (
              <article key={post.id} className="rounded-2xl bg-surface-lowest border border-border/60 p-4 shadow-sm">
                <header className="flex items-center gap-3">
                  <Avatar initials={a.initials} accent={a.accent} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p className="font-semibold text-primary text-sm truncate">{a.name}</p>
                      {a.verified && <BadgeCheck className="w-3.5 h-3.5 text-sky-500" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {a.title} @ {a.company} · {post.time}
                    </p>
                  </div>
                  {post.tag && (
                    <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-wider", TAG_STYLES[post.tag])}>
                      {post.tag}
                    </Badge>
                  )}
                </header>

                <p className="mt-3 text-sm text-foreground/90 leading-relaxed">{post.text}</p>

                <footer className="mt-3 flex items-center gap-1 text-muted-foreground">
                  <button
                    onClick={() => setLiked((l) => ({ ...l, [post.id]: !l[post.id] }))}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs hover:bg-surface-low transition",
                      isLiked && "text-rose-500",
                    )}
                  >
                    <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
                    {post.likes + (isLiked ? 1 : 0)}
                  </button>
                  <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs hover:bg-surface-low transition">
                    <MessageCircle className="w-4 h-4" />
                    {post.comments}
                  </button>
                  <button
                    onClick={() => toast({ title: "Share link copied" })}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs hover:bg-surface-low transition"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  <div className="flex-1" />
                  <Button
                    size="sm"
                    variant={connected[a.id] ? "outline" : "secondary"}
                    className="h-8 rounded-full text-xs"
                    onClick={() => toggleConnect(a.id, a.name)}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    {connected[a.id] ? "Requested" : "Connect"}
                  </Button>
                </footer>
              </article>
            );
          })}
        </div>
      </section>

      {/* Trending */}
      <section className="mb-8">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-accent flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Trending this week
            </p>
            <h2 className="font-headline font-extrabold text-primary text-lg">Trending professionals</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {trending.map((p, i) => (
            <div key={p.id} className="rounded-2xl bg-surface-lowest border border-border/60 p-3 flex items-center gap-3">
              <span className="text-xs font-bold text-muted-foreground w-5 text-center">#{i + 1}</span>
              <Avatar initials={p.initials} accent={p.accent} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="font-semibold text-primary text-sm truncate">{p.name}</p>
                  {p.verified && <BadgeCheck className="w-3.5 h-3.5 text-sky-500" />}
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  {p.title} @ {p.company}
                </p>
              </div>
              <Button
                size="sm"
                variant={connected[p.id] ? "outline" : "default"}
                className="h-8 rounded-full text-xs"
                onClick={() => toggleConnect(p.id, p.name)}
              >
                {connected[p.id] ? "Requested" : "Connect"}
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Nearby */}
      <section className="mb-12">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-accent flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Karachi
            </p>
            <h2 className="font-headline font-extrabold text-primary text-lg">Professionals near you</h2>
          </div>
        </div>
        {nearby.length === 0 ? (
          <div className="text-sm text-muted-foreground">No one nearby right now.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {nearby.map((p) => (
              <div key={p.id} className="rounded-2xl bg-surface-lowest border border-border/60 p-4 flex items-center gap-3">
                <Avatar initials={p.initials} accent={p.accent} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="font-semibold text-primary text-sm truncate">{p.name}</p>
                    {p.verified && <BadgeCheck className="w-3.5 h-3.5 text-sky-500" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {p.title} @ {p.company}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {p.city} · {p.industry}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={connected[p.id] ? "outline" : "secondary"}
                  className="h-8 rounded-full text-xs"
                  onClick={() => toggleConnect(p.id, p.name)}
                >
                  {connected[p.id] ? "Requested" : "Connect"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* QR FAB */}
      <button
        type="button"
        onClick={() => setQrOpen(true)}
        className="fixed bottom-24 md:bottom-8 right-5 z-40 grid place-items-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-elevated hover:scale-105 transition"
        aria-label="Scan QR to connect"
      >
        <QrCode className="w-6 h-6" />
      </button>

      {/* QR mock dialog */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" /> Demo profile preview
            </DialogTitle>
            <DialogDescription>
              This is what a guest sees after scanning a QR code at an event. Public info only — Connect requires login.
            </DialogDescription>
          </DialogHeader>

          {(() => {
            const p = PEOPLE[0];
            return (
              <div className="rounded-2xl bg-surface-lowest border border-border/60 p-5 text-center">
                <Avatar initials={p.initials} accent={p.accent} size="xl" className="mx-auto" />
                <div className="mt-3 flex items-center justify-center gap-1">
                  <p className="font-semibold text-primary">{p.name}</p>
                  {p.verified && <BadgeCheck className="w-4 h-4 text-sky-500" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  {p.title} @ {p.company}
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-1">
                  {p.tags.map((t) => (
                    <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                  ))}
                </div>
                <Button
                  className="mt-4 w-full rounded-full"
                  asChild
                >
                  <Link to="/v/julian-vane" onClick={() => setQrOpen(false)}>
                    <UserPlus className="w-4 h-4" /> Open guest profile
                  </Link>
                </Button>
                <button
                  onClick={() => setQrOpen(false)}
                  className="mt-2 text-[11px] text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Close
                </button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default Explore;