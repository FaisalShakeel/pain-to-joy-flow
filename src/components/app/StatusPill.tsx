import { cn } from "@/lib/utils";

type Tone = "available" | "busy" | "focus" | "offline" | "locked" | "pending" | "approved" | "denied" | "scheduled";

const tones: Record<Tone, { label: string; cls: string; dot: string }> = {
  available: { label: "Available", cls: "bg-emerald-500/10 text-emerald-700", dot: "bg-emerald-500" },
  busy: { label: "Busy", cls: "bg-amber-500/10 text-amber-700", dot: "bg-amber-500" },
  focus: { label: "Deep focus", cls: "bg-primary/10 text-primary", dot: "bg-primary" },
  offline: { label: "Offline", cls: "bg-muted text-muted-foreground", dot: "bg-muted-foreground/50" },
  locked: { label: "Locked", cls: "bg-muted text-muted-foreground", dot: "bg-muted-foreground/60" },
  pending: { label: "Pending", cls: "bg-amber-500/10 text-amber-700", dot: "bg-amber-500" },
  approved: { label: "Approved", cls: "bg-emerald-500/10 text-emerald-700", dot: "bg-emerald-500" },
  denied: { label: "Denied", cls: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
  scheduled: { label: "Scheduled", cls: "bg-accent/10 text-accent", dot: "bg-accent" },
};

interface Props {
  tone: Tone;
  label?: string;
  className?: string;
}

export const StatusPill = ({ tone, label, className }: Props) => {
  const t = tones[tone];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold", t.cls, className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", t.dot)} />
      {label ?? t.label}
    </span>
  );
};

export default StatusPill;