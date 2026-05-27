import { useMemo, useState } from "react";
import {
  Search,
  BadgeCheck,
  MapPin,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SlidersHorizontal, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import AccessRequestComposer from "@/components/app/AccessRequestComposer";
import type { Contact } from "@/lib/mockData";

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
  status: "available" | "busy" | "focus" | "offline" | "driving" | "unavailable";
};

const PEOPLE: Person[] = [
  { id: "p1", name: "Ahmed Khan", initials: "AK", title: "iOS Engineer", company: "Apple", city: "Cupertino", industry: "Developers", mutual: 12, verified: true, accent: "from-sky-500 to-indigo-600", tags: ["Swift", "Mobile"], status: "available" },
  { id: "p2", name: "Sara Malik", initials: "SM", title: "Product Designer", company: "Google", city: "London", industry: "Designers", mutual: 8, verified: true, accent: "from-pink-500 to-rose-600", tags: ["UX", "Figma"], status: "focus" },
  { id: "p3", name: "Ali Raza", initials: "AR", title: "Founder", company: "Finlock", city: "Karachi", industry: "Founders", mutual: 5, verified: false, accent: "from-amber-500 to-orange-600", tags: ["Fintech"], status: "busy" },
  { id: "p4", name: "Maya Chen", initials: "MC", title: "Senior Recruiter", company: "Stripe", city: "Dubai", industry: "Recruiters", mutual: 3, verified: true, accent: "from-emerald-500 to-teal-600", tags: ["Hiring"], status: "available" },
  { id: "p5", name: "Daniel Park", initials: "DP", title: "Partner", company: "Sequoia", city: "Singapore", industry: "Investors", mutual: 21, verified: true, accent: "from-violet-500 to-fuchsia-600", tags: ["Seed", "Series A"], status: "driving" },
  { id: "p6", name: "Lena Voss", initials: "LV", title: "Content Creator", company: "Independent", city: "Berlin", industry: "Creators", mutual: 2, verified: false, accent: "from-rose-500 to-red-600", tags: ["Video"], status: "offline" },
  { id: "p7", name: "Hassan Iqbal", initials: "HI", title: "Full-stack Engineer", company: "Vercel", city: "Karachi", industry: "Developers", mutual: 6, verified: true, accent: "from-cyan-500 to-blue-600", tags: ["React"], status: "focus" },
  { id: "p8", name: "Ivy Okafor", initials: "IO", title: "Brand Designer", company: "Linear", city: "Lagos", industry: "Designers", mutual: 4, verified: true, accent: "from-lime-500 to-emerald-600", tags: ["Brand"], status: "available" },
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
  const [qrOpen, setQrOpen] = useState(false);
  const [density, setDensity] = useState<8 | 12>(8);
  const [composerFor, setComposerFor] = useState<Person | null>(null);

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

  const personToContact = (p: Person): Contact => ({
    id: p.id,
    name: p.name,
    title: p.title,
    org: p.company,
    initials: p.initials,
    accent: p.accent,
    status: p.status === "driving" || p.status === "unavailable" ? "busy" : p.status,
    syncStatus: "locked",
    bio: "",
    responseTime: "",
    tags: p.tags,
    availabilityContext: `${p.title} @ ${p.company}${p.city ? ` · ${p.city}` : ""}`,
    relationship: "colleague",
  });

  const openComposer = (p: Person) => setComposerFor(p);

  const densityCols: Record<8 | 12, string> = {
    8: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
    12: "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6",
  };

  const statusDot: Record<string, string> = {
    available: "bg-emerald-500",
    busy: "bg-amber-500",
    focus: "bg-sky-500",
    offline: "bg-muted-foreground",
    driving: "bg-amber-500",
    unavailable: "bg-muted-foreground",
  };
  const statusLabel: Record<string, string> = {
    available: "Available",
    busy: "Busy",
    focus: "In focus",
    offline: "Offline",
    driving: "Driving",
    unavailable: "Unavailable",
  };

  const PersonTile = ({ p }: { p: Person }) => {
    const roomy = density === 8;
    const isConnected = !!connected[p.id];
    return (
      <li className="relative h-full">
        <Link
          to={`/app/contact/${p.id}`}
          title={`${p.name} · ${p.company}`}
          className="group flex flex-col h-full w-full rounded-2xl border border-border/60 bg-surface-lowest hover:border-border hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200 p-2.5"
        >
          <div className="flex items-start justify-between gap-1.5">
            <Avatar initials={p.initials} accent={p.accent} status={p.status} size="sm" />
            {p.verified && <BadgeCheck className="w-3.5 h-3.5 text-sky-500 shrink-0" />}
          </div>
          <div className="min-w-0 mt-1.5">
            <p className={cn("font-semibold text-primary truncate leading-tight", roomy ? "text-[12px]" : "text-[11px]")}>
              {p.name}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={cn("inline-block rounded-full w-1.5 h-1.5", statusDot[p.status])} />
              <span className={cn("text-muted-foreground font-medium", roomy ? "text-[9.5px]" : "text-[9px]")}>
                {statusLabel[p.status]}
              </span>
            </div>
            <p className={cn("text-foreground/70 leading-snug mt-1 line-clamp-2", roomy ? "text-[10.5px]" : "text-[10px]")}>
              {p.title} @ {p.company}
            </p>
          </div>
          <div className="flex items-center justify-between gap-1.5 mt-auto pt-1.5 border-t border-border/40">
            {p.mutual ? (
              <span className="text-[9.5px] text-muted-foreground inline-flex items-center gap-0.5">
                <Users className="w-2.5 h-2.5" /> {p.mutual}
              </span>
            ) : <span />}
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); openComposer(p); }}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold transition",
                isConnected
                  ? "bg-surface-low text-muted-foreground ghost-border"
                  : "bg-primary text-primary-foreground hover:opacity-90",
              )}
            >
              <UserPlus className="w-3 h-3" />
              {isConnected ? "Requested" : "Connect"}
            </button>
          </div>
        </Link>
      </li>
    );
  };

  return (
    <AppShell title="Explore" subtitle="Discover Your Network through the Lens of Consent" hideBell>
      {/* Search with filter dropdown */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people, companies, industries…"
          className="pl-9 pr-28 h-11 rounded-2xl bg-surface-lowest border-border/60"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-surface border border-border/60 text-xs font-semibold text-primary hover:bg-surface-low transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {chip}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
              Filter by
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {CHIPS.map((c) => (
              <DropdownMenuItem
                key={c}
                onSelect={() => setChip(c)}
                className="text-xs font-medium flex items-center justify-between"
              >
                {c}
                {chip === c && <Check className="w-3.5 h-3.5 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>



      {/* Featured carousel */}
      <section className="mb-8">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-accent">For you</p>
            <h2 className="font-headline font-extrabold text-primary text-lg">People you may know</h2>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <div className="inline-flex p-0.5 rounded-full bg-surface-low ghost-border">
              {([8, 12] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDensity(d)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-semibold transition min-w-[2rem]",
                    density === d ? "bg-gradient-primary text-primary-foreground shadow-elevated" : "text-muted-foreground hover:text-primary",
                  )}
                  aria-label={`Show ${d} per row`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6">No matches. Try another filter.</div>
        ) : (
          <ul
            className={cn("grid", density === 8 ? "gap-3" : "gap-2", densityCols[density])}
            style={{ gridAutoRows: `${density === 8 ? 188 : 200}px` }}
          >
            {filtered.map((p) => <PersonTile key={p.id} p={p} />)}
          </ul>
        )}
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
            return (
              <article key={post.id} className="rounded-2xl bg-surface-lowest border border-border/60 p-4 shadow-sm">
                <header className="flex items-center gap-3">
                  <Avatar initials={a.initials} accent={a.accent} status={a.status} />
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
                    onClick={() => openComposer(a)}
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
              <Avatar initials={p.initials} accent={p.accent} status={p.status} />
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
                onClick={() => openComposer(p)}
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
                <Avatar initials={p.initials} accent={p.accent} status={p.status} size="lg" />
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
                  onClick={() => openComposer(p)}
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
                <Avatar initials={p.initials} accent={p.accent} status={p.status} size="xl" className="mx-auto" />
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

      {composerFor && (
        <AccessRequestComposer
          open={!!composerFor}
          onOpenChange={(v) => { if (!v) setComposerFor(null); }}
          contact={personToContact(composerFor)}
          onSubmitted={() => {
            setConnected((c) => ({ ...c, [composerFor.id]: true }));
          }}
        />
      )}
    </AppShell>
  );
};

export default Explore;