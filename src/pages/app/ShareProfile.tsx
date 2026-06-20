import { useEffect, useMemo, useRef, useState } from "react";
import {
  Copy,
  Share2,
  Wallet,
  Wifi,
  ShieldCheck,
  Lock,
  Pin,
  Maximize2,
  X,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Link } from "react-router-dom";
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

const MODES: { id: AccessMode; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "normal", label: "Normal" },
  { id: "vip", label: "VIP" },
];

const MODE_COPY: Record<AccessMode, string> = {
  open: "Open Access Link",
  normal: "Normal Access Link",
  vip: "VIP Access Link",
};

const PremiumQR = ({ seed }: { seed: string }) => {
  const cells = useMemo(() => {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    if (h === 0) h = 1;
    const arr: boolean[] = [];
    for (let i = 0; i < 25 * 25; i++) {
      h = (h * 1103515245 + 12345) >>> 0;
      arr.push(((h >>> 8) & 1) === 1);
    }
    return arr;
  }, [seed]);

  const inFinder = (r: number, c: number) => {
    const inBox = (r0: number, c0: number) =>
      r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7;
    return inBox(0, 0) || inBox(0, 18) || inBox(18, 0);
  };
  const finderDraw = (r: number, c: number) => {
    const norm = (r0: number, c0: number) => {
      const lr = r - r0, lc = c - c0;
      if (lr < 0 || lr > 6 || lc < 0 || lc > 6) return null;
      if (lr === 0 || lr === 6 || lc === 0 || lc === 6) return true;
      if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) return true;
      return false;
    };
    return norm(0, 0) ?? norm(0, 18) ?? norm(18, 0) ?? false;
  };

  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: "repeat(25, 1fr)",
        gap: "2px",
        width: "100%",
        aspectRatio: "1 / 1",
      }}
    >
      {cells.map((on, i) => {
        const r = Math.floor(i / 25);
        const c = i % 25;
        const draw = inFinder(r, c) ? finderDraw(r, c) : on;
        return (
          <span
            key={i}
            className={cn(
              "rounded-[2px] transition-colors duration-500",
              draw ? "bg-[hsl(237_67%_22%)]" : "bg-transparent",
            )}
          />
        );
      })}
    </div>
  );
};

const ShareProfile = () => {
  const [mode, setMode] = useState<AccessMode>("normal");
  const [defaultMode, setDefaultMode] = useState<AccessMode>("normal");
  const [pendingVip, setPendingVip] = useState(false);
  const [tokenKey, setTokenKey] = useState(0);
  const [showDefaults, setShowDefaults] = useState(false);
  const [presentMode, setPresentMode] = useState(false);

  const segRef = useRef<HTMLDivElement | null>(null);
  const [indicator, setIndicator] = useState<{ x: number; w: number }>({ x: 0, w: 0 });

  // Demo profile — sharing leads here so the recipient experiences the flow.
  const demoPath = "/v/elena-vance";
  const link = `availock.com${demoPath}`;
  const shareUrl = `https://${link}`;
  const activeIndex = MODES.findIndex((m) => m.id === mode);

  const modeRing: Record<AccessMode, string> = {
    open: "ring-[hsl(150_55%_45%/0.55)] shadow-[0_30px_70px_-30px_hsl(150_55%_40%/0.35)]",
    normal: "ring-[hsl(220_16%_85%)] shadow-[0_30px_70px_-30px_hsl(237_30%_20%/0.22)]",
    vip: "ring-[hsl(252_70%_60%/0.55)] shadow-[0_30px_70px_-30px_hsl(252_70%_50%/0.35)]",
  };
  const modeDot: Record<AccessMode, string> = {
    open: "bg-[hsl(150_55%_45%)]",
    normal: "bg-[hsl(40_90%_55%)]",
    vip: "bg-[hsl(252_70%_60%)]",
  };
  const modeStatus: Record<AccessMode, string> = {
    open: "Open · Available now",
    normal: "In Focus Mode",
    vip: "VIP priority only",
  };

  useEffect(() => {
    const seg = segRef.current;
    if (!seg) return;
    const btn = seg.querySelectorAll<HTMLButtonElement>("[data-mode]")[activeIndex];
    if (btn) {
      const segRect = seg.getBoundingClientRect();
      const r = btn.getBoundingClientRect();
      setIndicator({ x: r.left - segRect.left, w: r.width });
    }
  }, [activeIndex]);

  const switchMode = (next: AccessMode) => {
    if (next === mode) return;
    if (next === "vip") return setPendingVip(true);
    commit(next);
  };

  const commit = (next: AccessMode) => {
    setMode(next);
    setTokenKey((k) => k + 1);
    if (window.navigator?.vibrate) window.navigator.vibrate(6);
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(shareUrl);
    toast({ title: "Link copied", description: shareUrl });
  };

  const sysShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Availock", text: "Reach me through Availock", url: shareUrl });
      } catch {}
    } else copyLink();
  };

  return (
    <AppShell subtitle="Communication access" title="Share Availability">
      <div className="share-stage -mx-4 md:-mx-10 -my-9 px-4 md:px-10 py-10 md:py-14 min-h-[calc(100vh-4rem)] flex items-start justify-center">
        <div className="relative w-full max-w-[440px]">
          {/* Section eyebrow — hidden in present mode */}
          {!presentMode && (
          <header className="mb-6 text-center">
            <p className="text-[10.5px] font-bold tracking-[0.22em] uppercase text-accent">
              Availock — Live Availability Access
            </p>
          </header>
          )}

          <div
            className={cn(
              "share-card relative overflow-hidden px-7 sm:px-9 pt-7 pb-6 ring-1 transition-all duration-500",
              modeRing[mode],
            )}
          >
            {/* Card header — name + org, plus an access badge */}
            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="font-headline font-bold text-[1.8rem] sm:text-[2rem] leading-[0.98] tracking-[-0.02em] text-foreground">
                  {me.name}
                </h1>
                <p className="mt-2 text-[10px] font-bold tracking-[0.22em] uppercase text-muted-foreground">
                  {me.title} <span className="text-accent">·</span> {me.org}
                </p>
              </div>
              <button
                onClick={() => setPresentMode((p) => !p)}
                className="access-badge shrink-0"
                aria-label={presentMode ? "Exit present mode" : "Enter present mode"}
                title={presentMode ? "Exit present mode" : "Present — hide controls"}
              >
                {presentMode ? (
                  <X className="w-4 h-4" strokeWidth={2.2} />
                ) : (
                  <ShieldCheck className="w-4 h-4" strokeWidth={2.2} />
                )}
              </button>
            </div>

            {/* QR frame */}
            <div className="relative mt-6 qr-frame p-6 sm:p-7 grid place-items-center">
              <div className="qr-tile w-[68%] aspect-square p-4 sm:p-5 grid place-items-center" key={tokenKey}>
                <PremiumQR seed={`${mode}-${tokenKey}`} />
              </div>
              <Link
                to={demoPath}
                className="mt-3 text-[9px] font-bold tracking-[0.22em] uppercase text-muted-foreground hover:text-foreground transition-colors"
              >
                {link}
              </Link>
            </div>

            {/* Caption */}
            <div className="relative mt-5 text-center">
              <p className="text-[11.5px] font-bold tracking-[0.22em] uppercase text-accent">
                Vault Access Link
              </p>
              <p className="mt-1.5 text-[12.5px] text-muted-foreground">
                Scan to view availability &amp; request access
              </p>
            </div>

            {/* Mode segmented switch — hidden in present mode */}
            {!presentMode && (
            <div className="relative mt-6">
              <p className="text-[9px] font-bold tracking-[0.22em] uppercase text-muted-foreground text-center mb-2">
                Extend Connection As
              </p>
              <div ref={segRef} className="mode-segment grid grid-cols-3">
                <span
                  className="mode-indicator"
                  style={{ transform: `translateX(${indicator.x - 4}px)`, width: indicator.w }}
                  aria-hidden
                />
                {MODES.map((m) => {
                  const active = m.id === mode;
                  return (
                    <button
                      key={m.id}
                      data-mode={m.id}
                      onClick={() => switchMode(m.id)}
                      className={cn(
                        "relative z-10 py-2 text-[11px] font-bold tracking-[0.18em] uppercase transition-colors",
                        active ? "text-foreground" : "text-muted-foreground hover:text-foreground/80",
                      )}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPresentMode(true)}
                className="mt-3 w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-full bg-foreground text-background text-[10.5px] font-bold tracking-[0.2em] uppercase hover:opacity-95 transition"
              >
                <Maximize2 className="w-3 h-3" /> Present QR Only
              </button>
            </div>
            )}

            {/* Bottom action row */}
            <div className="relative mt-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={sysShare} className="icon-button" aria-label="Share">
                  <Share2 className="w-4 h-4" strokeWidth={1.8} />
                </button>
                <button onClick={copyLink} className="icon-button" aria-label="Copy link">
                  <Copy className="w-4 h-4" strokeWidth={1.8} />
                </button>
                {!presentMode && (
                <>
                <button
                  onClick={() => toast({ title: "Looking for nearby devices…" })}
                  className="icon-button"
                  aria-label="Nearby"
                >
                  <Wifi className="w-4 h-4" strokeWidth={1.8} />
                </button>
                <button
                  onClick={() => toast({ title: "Saved to Wallet" })}
                  className="icon-button"
                  aria-label="Save to Wallet"
                >
                  <Wallet className="w-4 h-4" strokeWidth={1.8} />
                </button>
                </>
                )}
              </div>
              {presentMode ? (
                <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">
                  v.04 / 2026
                </span>
              ) : (
                <button
                  onClick={() => setShowDefaults((s) => !s)}
                  className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <Pin className="w-3 h-3" /> Default · {MODES.find((m) => m.id === defaultMode)?.label}
                </button>
              )}
            </div>

            {/* Default mode pinner (subtle) */}
            {showDefaults && !presentMode && (
              <div className="relative mt-4 rounded-2xl bg-[hsl(220_16%_96%)] p-3 animate-fade">
                <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-muted-foreground px-1">
                  Pin default access mode
                </p>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
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
                          "py-2 rounded-full text-[10.5px] font-bold tracking-[0.18em] uppercase transition",
                          sel
                            ? "bg-foreground text-background shadow-[0_6px_16px_-8px_hsl(237_30%_20%/0.35)]"
                            : "bg-white text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {!presentMode && (
            <p className="mt-5 text-center text-[10px] tracking-[0.28em] uppercase text-muted-foreground/70">
              v.04 / 2026 · People access you through your rules
            </p>
          )}
        </div>
      </div>

      {/* VIP confirmation */}
      <Dialog open={pendingVip} onOpenChange={setPendingVip}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <div className="mx-auto w-11 h-11 rounded-2xl bg-[hsl(252_100%_95%)] grid place-items-center">
              <Lock className="w-4 h-4 text-accent" strokeWidth={2.2} />
            </div>
            <DialogTitle className="text-center mt-2">Activate VIP Access</DialogTitle>
            <DialogDescription className="text-center">
              VIP grants priority communication privileges to pre-approved contacts. Continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-2">
            <button
              onClick={() => setPendingVip(false)}
              className="px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setPendingVip(false);
                commit("vip");
              }}
              className="px-4 py-2 rounded-full bg-foreground text-background text-sm font-semibold"
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