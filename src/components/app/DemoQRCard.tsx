import { QrCode, Copy, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Props {
  /** Link to demo profile (e.g. /v/elena-vance) */
  to: string;
  /** Display label, defaults to short link */
  link?: string;
  variant?: "prominent" | "compact";
  className?: string;
}

const DemoQRCard = ({ to, link, variant = "prominent", className }: Props) => {
  const display = link ?? `availock.com${to}`;
  const copy = () => {
    navigator.clipboard?.writeText(`https://${display}`);
    toast({ title: "Demo link copied", description: "Share it to try a live profile." });
  };

  if (variant === "compact") {
    return (
      <div className={cn("rounded-2xl bg-surface-lowest ghost-border p-3 shadow-ambient flex items-center gap-3", className)}>
        <div className="w-12 h-12 rounded-lg bg-primary text-primary-foreground grid place-items-center flex-shrink-0">
          <QrCode className="w-6 h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">Demo</p>
          <p className="text-xs font-semibold text-primary truncate">Scan to try a live profile</p>
        </div>
        <Link to={to} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold">
          <ExternalLink className="w-3 h-3" /> Open
        </Link>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl bg-gradient-vault text-primary-foreground p-5 shadow-elevated", className)}>
      <div className="flex items-center gap-3">
        <div className="w-20 h-20 rounded-xl bg-primary-foreground/10 grid place-items-center flex-shrink-0 ring-1 ring-primary-foreground/20">
          {/* mock QR */}
          <div className="grid grid-cols-6 gap-px p-2 bg-primary-foreground/10 rounded-md">
            {Array.from({ length: 36 }).map((_, i) => (
              <span key={i} className={`w-1.5 h-1.5 ${[0, 5, 30, 35].includes(i) || (i * 7) % 5 === 0 ? "bg-primary-foreground" : "bg-transparent"}`} />
            ))}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">Try Availock instantly</p>
          <h3 className="mt-1 font-headline font-bold text-base leading-tight">Scan to try a live profile</h3>
          <p className="mt-1 text-[11px] text-primary-foreground/70 font-mono truncate">{display}</p>
          <div className="mt-2 flex items-center gap-1.5">
            <Link to={to} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-primary-foreground text-primary text-[11px] font-semibold hover:opacity-95">
              <ExternalLink className="w-3 h-3" /> Open demo
            </Link>
            <button onClick={copy} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-[11px] font-semibold transition">
              <Copy className="w-3 h-3" /> Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoQRCard;
