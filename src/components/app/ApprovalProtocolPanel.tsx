import { useState } from "react";
import { Mic, MessageSquare, CalendarDays, ShieldCheck, Ban, Undo2, Contact, Share2, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Channel = "voice" | "message" | "schedule" | "contact" | "social";
type Lane = "urgent" | "priority" | "standard";
type Duration = "days" | "week" | "month" | "forever";

interface Props {
  contactName?: string;
  onAuthorize?: () => void;
  onDecline?: () => void;
}

const ApprovalProtocolPanel = ({ contactName, onAuthorize, onDecline }: Props) => {
  const [channels, setChannels] = useState<Set<Channel>>(
    new Set(["voice", "message", "schedule", "social"]),
  );
  const [lane, setLane] = useState<Lane>("standard");
  const [duration, setDuration] = useState<Duration>("forever");

  const toggleChannel = (id: Channel) => {
    setChannels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const channelList: { id: Channel; icon: typeof Mic; label: string }[] = [
    { id: "voice", icon: Mic, label: "Voice" },
    { id: "message", icon: MessageSquare, label: "Message" },
    { id: "schedule", icon: CalendarDays, label: "Schedule" },
    { id: "contact", icon: Contact, label: "Contact" },
    { id: "social", icon: Share2, label: "Social" },
  ];

  return (
    <aside className="rounded-3xl bg-surface-lowest ghost-border p-4 md:p-5 shadow-ambient">
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">
          Lumina Vault System
        </p>
        <h3 className="mt-0.5 font-headline font-extrabold text-primary text-xl leading-tight">
          Approval Protocol
        </h3>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Configure secure access parameters{contactName ? ` for ${contactName}` : " for the current request"}.
        </p>
      </div>

      {/* Connection channels */}
      <Section label="Connection channels">
        <div className="grid grid-cols-5 gap-1.5">
          {channelList.map((c) => {
            const Icon = c.icon;
            const active = channels.has(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggleChannel(c.id)}
                className={`relative flex flex-col items-center justify-center gap-1 py-2 rounded-xl border text-[10px] font-semibold transition ${
                  active
                    ? "bg-primary/5 border-primary text-primary shadow-glass"
                    : "ghost-border bg-surface-low text-muted-foreground hover:text-primary hover:bg-surface"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {c.label}
                {!active && (
                  <Lock className="absolute top-1 right-1 w-2.5 h-2.5 text-muted-foreground" />
                )}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Protocol lane */}
      <Section label="Protocol lane">
        <div className="grid grid-cols-3 gap-2">
          {(["urgent", "priority", "standard"] as Lane[]).map((l) => {
            const active = lane === l;
            return (
              <button
                key={l}
                onClick={() => setLane(l)}
                className={`px-2 py-1.5 rounded-full text-[11px] font-bold capitalize transition ${
                  active
                    ? "bg-primary text-primary-foreground shadow-elevated"
                    : "ghost-border bg-surface-lowest text-primary hover:bg-surface-low"
                }`}
              >
                {l === "urgent" && <span className="mr-1">•</span>}
                {l}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Access duration */}
      <Section label="Access duration">
        <div className="grid grid-cols-4 gap-1.5">
          {(["days", "week", "month", "forever"] as Duration[]).map((d) => {
            const active = duration === d;
            return (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`px-2 py-1.5 rounded-xl text-[11px] font-bold capitalize transition ${
                  active
                    ? "bg-primary text-primary-foreground shadow-elevated"
                    : "ghost-border bg-surface-lowest text-primary hover:bg-surface-low"
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Authorize */}
      <button
        onClick={() => {
          toast({
            title: "Request authorized",
            description: `${Array.from(channels).join(", ")} · ${lane} · ${duration}`,
          });
          onAuthorize?.();
        }}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-primary text-primary-foreground text-sm font-bold shadow-elevated hover:opacity-95 transition"
      >
        <ShieldCheck className="w-4 h-4" /> Authorize Request
      </button>

      <div className="mt-2 grid grid-cols-3 gap-2">
        <button
          onClick={() => {
            toast({ title: "Declined" });
            onDecline?.();
          }}
          className="px-2 py-1.5 rounded-xl ghost-border bg-surface-lowest text-[11px] font-bold text-rose-600 hover:bg-rose-500/5 transition"
        >
          Decline
        </button>
        <button
          onClick={() => toast({ title: "Access revoked" })}
          className="px-2 py-1.5 rounded-xl ghost-border bg-surface-lowest text-[11px] font-bold text-primary hover:bg-surface-low transition inline-flex items-center justify-center gap-1"
        >
          <Undo2 className="w-3.5 h-3.5" /> Revoke
        </button>
        <button
          onClick={() => toast({ title: "Sender blocked" })}
          className="px-2 py-1.5 rounded-xl bg-primary text-primary-foreground text-[11px] font-bold hover:opacity-90 transition inline-flex items-center justify-center gap-1"
        >
          <Ban className="w-3.5 h-3.5" /> Block
        </button>
      </div>
    </aside>
  );
};

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mt-3">
    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
      {label}
    </p>
    {children}
  </div>
);

export default ApprovalProtocolPanel;