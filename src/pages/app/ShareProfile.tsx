import { useMemo, useState } from "react";
import {
  Copy,
  Share2,
  Wallet,
  Wifi,
  Link2,
  ShieldCheck,
  Zap,
  Lock,
  Crown,
  Check,
  Sparkles,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { me } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type AccessMode = "open" | "normal" | "vip";

const MODES: {
  id: AccessMode;
  label: string;
  subtitle: string;
  description: string;
  capabilities: string[];
  blocked?: string[];
  icon: typeof Zap;
  tone: string;
}[] = [
  {
    id: "open",
    label: "Open",
    subtitle: "Direct communication allowed",
    description: "People can contact you immediately without approval.",
    capabilities: ["Direct calls", "Direct messages", "Book available slots"],
    icon: Zap,
    tone: "from-emerald-300/30 to-emerald-500/0",
  },
  {
    id: "normal",
    label: "Normal",
    subtitle: "Approval required",
    description:
      "People can view availability but must request communication permission first.",
    capabilities: ["Request access", "Request callback", "Booking requests", "Notify when available"],
    blocked: ["Direct calls", "Direct messages"],
    icon: ShieldCheck,
    tone: "from-violet-300/40 to-indigo-500/0",
  },
  {
    id: "vip",
    label: "VIP",
    subtitle: "Trusted priority access",
    description: "Pre-approved people bypass the normal permission flow.",
    capabilities: ["Direct priority reach", "Bypass rights", "Extended availability visibility"],
    icon: Crown,
    tone: "from-amber-300/40 to-amber-500/0",
  },
];

const PremiumQR = ({ seed }: { seed: string }) => {
  // Deterministic pseudo-QR pattern
  const cells = useMemo(() => {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    if (h === 0) h = 1;
    const arr: boolean[] = [];
    for (let i = 0; i < 21 * 21; i++) {
      h = (h * 1103515245 + 12345) >>> 0;
      arr.push(((h >>> 8) & 1) === 1);
    }
    return arr;
  }, [seed]);

  const inFinderArea = (r: number, c: number) => {
    const inBox = (r0: number, c0: number) =>
      r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7;
    return inBox(0, 0) || inBox(0, 14) || inBox(14, 0);
  };
  const finderDraw = (r: number, c: number) => {
    const norm = (r0: number, c0: number) => {
      const lr = r - r0, lc = c - c0;
      if (lr < 0 || lr > 6 || lc < 0 || lc > 6) return null;
      // outer ring
      if (lr === 0 || lr === 6 || lc === 0 || lc === 6) return true;
      // inner 3x3 square
      if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) return true;
      return false;
    };
    return norm(0, 0) ?? norm(0, 14) ?? norm(14, 0) ?? false;
  };

  return (
    <div className="relative">
      <div className="absolute -inset-8 qr-aura" aria-hidden />
      <div
        className="relative grid gap-[2px] p-4 rounded-2xl bg-white/95 shadow-[0_30px_80px_-20px_hsl(45_90%_50%/0.35)]"
        style={{ gridTemplateColumns: "repeat(21, 10px)" }}
      >
        {cells.map((on, i) => {
          const r = Math.floor(i / 21);
          const c = i % 21;
          const draw = inFinderArea(r, c) ? finderDraw(r, c) : on;
          return (
            <span
              key={i}
              className={cn(
                "aspect-square rounded-[2px] transition-colors duration-500",
                draw ? "bg-[hsl(237_70%_10%)]" : "bg-transparent",
              )}
            />
          );
        })}
        {/* center logo badge */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(45_90%_55%)] to-[hsl(35_90%_50%)] grid place-items-center ring-4 ring-white shadow-md">
            <Lock className="w-4 h-4 text-[hsl(237_80%_12%)]" strokeWidth={2.6} />
          </div>
        </div>
      </div>
    </div>
  );
};

const ShareProfile = () => {
  const [mode, setMode] = useState<AccessMode>("normal");
  const [defaultMode, setDefaultMode] = useState<AccessMode>("normal");
  const [pendingVip, setPendingVip] = useState(false);
  const [tokenKey, setTokenKey] = useState(0);

  const link = "availock.com/v/alistair-finch";
  const shareUrl = `https://${link}`;

  const activeIndex = MODES.findIndex((m) => m.id === mode);
  const active = MODES[activeIndex];

  const switchMode = (next: AccessMode) => {
    if (next === mode) return;
    if (next === "vip") {
      setPendingVip(true);
      return;
    }
    commit(next);
  };

  const commit = (next: AccessMode) => {
    setMode(next);
    setTokenKey((k) => k + 1);
    if (window.navigator?.vibrate) window.navigator.vibrate(8);
    toast({
      title: `Access mode: ${next.toUpperCase()}`,
      description: "Secure access token regenerated.",
    });
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(shareUrl);
    toast({ title: "Link copied", description: shareUrl });
  };

  const sysShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Availock", text: `Reach me through my Availock vault`, url: shareUrl });
      } catch {}
    } else {
      copyLink();
    }
  };

  return (
    <AppShell subtitle="Communication access" title="Share Availability">
      <div className="mx-auto w-full max-w-[440px] md:max-w-[480px]">
        <div className="share-stage relative rounded-[2rem] p-5 sm:p-6 overflow-hidden">
          {/* Header micro-eyebrow */}
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.24em] text-white/55">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-300" /> Availock · Access
            </span>
            <span className="flex items-center gap-1.5">
              <span className="live-dot" />
              Token live
            </span>
          </div>

          {/* Live status card */}
          <div className="relative mt-4 share-glass share-glow-border rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/50">Live status</p>
                <h2 className="mt-1 font-headline text-[1.35rem] leading-tight text-white">
                  {me.name.toUpperCase()}
                </h2>
                <div className="mt-2 flex items-center gap-2">
                  <span className="live-dot amber" />
                  <span className="text-sm font-semibold text-white/90">In Focus Mode</span>
                </div>
                <p className="mt-1 text-xs text-white/60 num-tabular">Available after 4:30 PM</p>
              </div>
              <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-white/15 to-white/5 ring-1 ring-white/15 grid place-items-center">
                <span className="font-headline font-bold text-white text-sm">{me.initials}</span>
              </div>
            </div>
            <p className="mt-4 text-[12.5px] text-white/65">Choose how people can access you.</p>
          </div>

          {/* Access mode switcher */}
          <div className="relative mt-5 share-glass rounded-2xl p-1.5">
            <div className="relative grid grid-cols-3 gap-1">
              <div
                className="mode-indicator"
                style={{
                  width: `calc((100% - 0.5rem) / 3)`,
                  transform: `translateX(calc(${activeIndex} * (100% + 0.25rem)))`,
                }}
                aria-hidden
              />
              {MODES.map((m) => {
                const isActive = m.id === mode;
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => switchMode(m.id)}
                    data-active={isActive}
                    className={cn(
                      "mode-pill relative z-10 flex flex-col items-center justify-center gap-1 py-2.5 rounded-[0.85rem] text-[11px] font-bold tracking-[0.14em] uppercase",
                      isActive ? "text-[hsl(237_80%_12%)]" : "text-white/65 hover:text-white/85",
                    )}
                  >
                    <Icon className={cn("w-3.5 h-3.5", isActive ? "text-[hsl(237_80%_12%)]" : "text-white/70")} />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active mode description */}
          <div className="mt-4 share-glass rounded-2xl p-4 animate-fade">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-300/90">{active.subtitle}</p>
                <p className="mt-1 text-sm text-white/85">{active.description}</p>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
                {mode === "vip" ? "Trusted" : mode === "open" ? "Friendly" : "Protected"}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-1.5">
              {active.capabilities.map((c) => (
                <div key={c} className="flex items-center gap-2 text-[12.5px] text-white/80">
                  <Check className="w-3.5 h-3.5 text-emerald-300" /> {c}
                </div>
              ))}
              {active.blocked?.map((c) => (
                <div key={c} className="flex items-center gap-2 text-[12.5px] text-white/45 line-through">
                  <Lock className="w-3.5 h-3.5" /> {c}
                </div>
              ))}
            </div>
          </div>

          {/* QR */}
          <div className="relative mt-6 share-glass share-glow-border rounded-[1.6rem] p-5">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.24em] text-white/55">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-emerald-300" /> Encrypted token
              </span>
              <span className="flex items-center gap-1.5 num-tabular">
                <RefreshCw className="w-3 h-3" /> #{(1024 + tokenKey).toString(16).toUpperCase()}
              </span>
            </div>
            <div className="mt-4 grid place-items-center" key={tokenKey}>
              <div className="animate-scale-in">
                <PremiumQR seed={`${mode}-${tokenKey}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-white/65">
              <span className="live-dot" />
              Secure access token active · {mode.toUpperCase()}
            </div>

            <div className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10">
              <Link2 className="w-3.5 h-3.5 text-white/55" />
              <span className="flex-1 text-[12px] font-mono text-white/85 truncate">{link}</span>
              <button
                onClick={copyLink}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] font-semibold text-white transition"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2">
              {[
                { label: "Share", icon: Share2, run: sysShare },
                { label: "Nearby", icon: Wifi, run: () => toast({ title: "Looking for nearby devices…" }) },
                { label: "Copy", icon: Copy, run: copyLink },
                { label: "Wallet", icon: Wallet, run: () => toast({ title: "Saved to Wallet", description: "Availability pass added." }) },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={a.run}
                  className="group flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] active:scale-[0.97] transition"
                >
                  <a.icon className="w-4 h-4 text-white/85 group-hover:text-amber-300 transition-colors" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Default mode setting */}
          <div className="mt-5 share-glass rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/55">Default share mode</p>
                <p className="mt-1 text-[12.5px] text-white/70">Auto-loads when you open Share Availability.</p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/40" />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {MODES.map((m) => {
                const sel = defaultMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setDefaultMode(m.id);
                      toast({ title: `Default set to ${m.label}` });
                    }}
                    className={cn(
                      "py-2 rounded-lg text-[11px] font-bold tracking-[0.14em] uppercase transition",
                      sel
                        ? "bg-white text-[hsl(237_80%_12%)] shadow-[0_8px_24px_-8px_hsl(45_90%_50%/0.5)]"
                        : "bg-white/[0.05] text-white/65 border border-white/10 hover:bg-white/10",
                    )}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="mt-5 text-center text-[10.5px] text-white/40 tracking-[0.18em] uppercase">
            People access you through your rules
          </p>
        </div>
      </div>

      {/* VIP confirmation */}
      <Dialog open={pendingVip} onOpenChange={setPendingVip}>
        <DialogContent className="max-w-sm rounded-2xl border-white/10 bg-[hsl(237_45%_8%)] text-white">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 grid place-items-center">
              <Crown className="w-5 h-5 text-[hsl(237_80%_12%)]" />
            </div>
            <DialogTitle className="text-center mt-2">Activate VIP Access</DialogTitle>
            <DialogDescription className="text-center text-white/70">
              VIP Access grants priority communication privileges to pre-approved contacts. Continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-2">
            <button
              onClick={() => setPendingVip(false)}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setPendingVip(false);
                commit("vip");
              }}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 text-[hsl(237_80%_12%)] text-sm font-bold"
            >
              Activate VIP
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default ShareProfile;