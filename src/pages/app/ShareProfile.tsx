import { Link2, Share2, Copy, CalendarClock, Zap, Send, Download, Mail, Linkedin, Instagram, Facebook, MessageCircle } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import Avatar from "@/components/app/Avatar";
import { me } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const link = "availock.com/v/alistair-finch";
const SYNC_WINDOWS: { start: string; end: string }[] = [
  { start: "10:00", end: "11:00" },
  { start: "14:00", end: "15:00" },
];

const ShareProfile = () => {
  const copy = () => {
    navigator.clipboard?.writeText(`https://${link}`);
    toast({ title: "Link copied", description: "Share it anywhere." });
  };
  const shareUrl = `https://${link}`;
  const shareText = `Reach me through my Availock vault: ${shareUrl}`;
  const openWindow = (u: string) => window.open(u, "_blank", "noopener,noreferrer");
  const shareOptions = [
    { label: "Copy link", icon: Copy, run: copy },
    { label: "WhatsApp", icon: MessageCircle, run: () => openWindow(`https://wa.me/?text=${encodeURIComponent(shareText)}`) },
    { label: "LinkedIn", icon: Linkedin, run: () => openWindow(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`) },
    { label: "Instagram", icon: Instagram, run: () => { copy(); toast({ title: "Link copied for Instagram", description: "Paste it into your bio or DM." }); } },
    { label: "Facebook", icon: Facebook, run: () => openWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`) },
    { label: "Download QR", icon: Download, run: () => toast({ title: "QR downloaded", description: "Saved to your device." }) },
    { label: "Add to email signature", icon: Mail, run: () => { navigator.clipboard?.writeText(`My Availock vault: ${shareUrl}`); toast({ title: "Signature snippet copied", description: "Paste into your email signature." }); } },
  ];
  return (
    <AppShell subtitle="Vault sharing" title="Share your vault">
      <div className="grid lg:grid-cols-[360px_1fr] gap-5 items-start">
        <div className="rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient text-center">
          <div className="relative inline-block mx-auto">
            <Avatar initials={me.initials} size="xl" />
            {SYNC_WINDOWS.length > 0 && (
              <HoverCard openDelay={120} closeDelay={80}>
                <HoverCardTrigger asChild>
                  <button
                    type="button"
                    aria-label="Quick Sync availability"
                    className="absolute -bottom-2 -right-3 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary text-primary-foreground shadow-elevated ring-2 ring-surface-lowest hover:scale-[1.04] active:scale-[0.97] transition-transform"
                  >
                    <Zap className="w-3 h-3 text-gold" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.14em]">Quick Sync</span>
                    <span className="text-[10px] font-semibold tabular-nums">
                      {SYNC_WINDOWS.slice(0, 2).map((w) => `${w.start}–${w.end}`).join(" | ")}
                    </span>
                  </button>
                </HoverCardTrigger>
                <HoverCardContent align="start" className="w-64 rounded-xl ghost-border bg-surface-lowest/95 backdrop-blur shadow-elevated p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <CalendarClock className="w-3.5 h-3.5 text-accent" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Quick Sync today</p>
                  </div>
                  <ul className="space-y-1">
                    {SYNC_WINDOWS.map((w) => (
                      <li key={`${w.start}-${w.end}`} className="text-xs text-primary tabular-nums font-semibold">
                        {w.start} – {w.end}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => toast({ title: "Quick Sync requested" })}
                    className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold hover:opacity-95"
                  >
                    <Zap className="w-3 h-3 text-gold" /> Book Quick Sync
                  </button>
                </HoverCardContent>
              </HoverCard>
            )}
          </div>
          <p className="mt-3 font-headline font-bold text-primary">{me.name}</p>
          <p className="text-xs text-muted-foreground">{me.title}</p>
          <div className="mt-5 mx-auto w-44 h-44 rounded-2xl bg-primary text-primary-foreground grid place-items-center">
            {/* simple QR placeholder */}
            <div className="grid grid-cols-8 gap-px p-3 bg-primary-foreground/10 rounded-xl">
              {Array.from({ length: 64 }).map((_, i) => (
                <span key={i} className={`w-3 h-3 ${[0, 7, 56, 63].includes(i) || (i * 7) % 5 === 0 ? "bg-primary-foreground" : "bg-transparent"}`} />
              ))}
            </div>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">Scan to view this vault</p>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Shareable link</p>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-vault text-primary-foreground text-xs font-semibold shadow-ambient hover:opacity-95 transition">
                    <Send className="w-3.5 h-3.5 text-gold" /> Share Everywhere
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-60 rounded-2xl ghost-border bg-surface-lowest/95 backdrop-blur shadow-elevated p-2">
                  <p className="px-2 pt-1 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">One tap to share</p>
                  <ul className="space-y-0.5">
                    {shareOptions.map((o) => (
                      <li key={o.label}>
                        <button
                          onClick={o.run}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs font-semibold text-primary hover:bg-surface-low transition"
                        >
                          <span className="w-7 h-7 rounded-md bg-surface-low grid place-items-center">
                            <o.icon className="w-3.5 h-3.5 text-primary" />
                          </span>
                          {o.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </PopoverContent>
              </Popover>
            </div>
            <div className="mt-3 flex items-center gap-2 px-4 py-3 rounded-xl bg-surface-low ghost-border">
              <Link2 className="w-4 h-4 text-muted-foreground" />
              <span className="flex-1 text-sm font-mono text-primary truncate">{link}</span>
              <button
                onClick={copy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:opacity-95 transition"
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Visitors land on a page that shows your status and lets them request access — they never see your private contact details.</p>
          </div>
          <div className="rounded-3xl bg-gradient-vault text-primary-foreground p-6 shadow-elevated">
            <Share2 className="w-5 h-5 text-gold" />
            <p className="mt-2 font-headline font-bold">Share to social</p>
            <p className="mt-1 text-sm text-primary-foreground/85">Pin your vault to your bio so people reach you the right way.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["LinkedIn", "X", "WhatsApp", "Email"].map((s) => (
                <button
                  key={s}
                  onClick={() => toast({ title: `Shared to ${s}` })}
                  className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-semibold transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default ShareProfile;