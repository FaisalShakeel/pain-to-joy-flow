import { Link2, Share2, Copy } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import Avatar from "@/components/app/Avatar";
import { me } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";

const link = "availock.com/v/alistair-finch";

const ShareProfile = () => {
  const copy = () => {
    navigator.clipboard?.writeText(`https://${link}`);
    toast({ title: "Link copied", description: "Share it anywhere." });
  };
  return (
    <AppShell subtitle="Vault sharing" title="Share your vault">
      <div className="grid lg:grid-cols-[360px_1fr] gap-5 items-start">
        <div className="rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient text-center">
          <Avatar initials={me.initials} size="xl" className="mx-auto" />
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
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Shareable link</p>
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