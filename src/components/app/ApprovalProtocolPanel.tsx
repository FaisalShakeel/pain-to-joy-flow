import { useState } from "react";
import { Mic, MessageSquare, CalendarDays, ShieldCheck, Ban, Undo2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Channel = "voice" | "message" | "schedule";
type Lane = "urgent" | "priority" | "regular";
type Duration = "days" | "week" | "month" | "forever";

interface Props {
  contactName?: string;
  onAuthorize?: () => void;
  onDecline?: () => void;
}

const ApprovalProtocolPanel = ({ contactName, onAuthorize, onDecline }: Props) => {
  const [channel, setChannel] = useState<Channel>("voice");
  const [lane, setLane] = useState<Lane>("urgent");
  const [duration, setDuration] = useState<Duration>("week");

  const channels: { id: Channel; icon: typeof Mic; label: string }[] = [
    { id: "voice", icon: Mic, label: "Voice" },
    { id: "message", icon: MessageSquare, label: "Message" },
    { id: "schedule", icon: CalendarDays, label: "Schedule" },
  ];

  return (
    <aside className="rounded-3xl bg-surface-lowest ghost-border p-5 md:p-6 shadow-ambient">
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">
          Lumina Vault System
        </p>
        <h3 className="mt-1 font-headline font-extrabold text-primary text-2xl leading-tight">
          Approval Protocol
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Configure secure access parameters{contactName ? ` for ${contactName}` : " for the current request"}.
        </p>
      </div>

      {/* Connection channels */}
      <Section label="Connection channels">
        <div className="grid grid-cols-3 gap-2">
          {channels.map((c) => {
            const Icon = c.icon;
            const active = channel === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setChannel(c.id)}
                className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl border text-xs font-semibold transition ${
                  active
                    ? "bg-primary/5 border-primary text-primary shadow-glass"
                    : "ghost-border bg-surface-low text-muted-foreground hover:text-primary hover:bg-surface"
                }`}
              >
                <Icon className="w-4 h-4" />
                {c.label}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Protocol lane */}
      <Section label="Protocol lane">
        <div className="grid grid-cols-3 gap-2">
          {(["urgent", "priority", "regular"] as Lane[]).map((l) => {
            const active = lane === l;
            return (
              <button
                key={l}
                onClick={() => setLane(l)}
                className={`px-3 py-2 rounded-full text-xs font-bold capitalize transition ${
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
        <div className="grid grid-cols-2 gap-2">
          {(["days", "week", "month", "forever"] as Duration[]).map((d) => {
            const active = duration === d;
            return (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`px-3 py-2.5 rounded-2xl text-xs font-bold capitalize transition ${
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
            description: `${channel} · ${lane} · ${duration}`,
          });
          onAuthorize?.();
        }}
        className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-primary text-primary-foreground text-sm font-bold shadow-elevated hover:opacity-95 transition"
      >
        <ShieldCheck className="w-4 h-4" /> Authorize Request
      </button>

      <div className="mt-2 grid grid-cols-3 gap-2">
        <button
          onClick={() => {
            toast({ title: "Declined" });
            onDecline?.();
          }}
          className="px-3 py-2 rounded-2xl ghost-border bg-surface-lowest text-xs font-bold text-rose-600 hover:bg-rose-500/5 transition"
        >
          Decline
        </button>
        <button
          onClick={() => toast({ title: "Access revoked" })}
          className="px-3 py-2 rounded-2xl ghost-border bg-surface-lowest text-xs font-bold text-primary hover:bg-surface-low transition inline-flex items-center justify-center gap-1"
        >
          <Undo2 className="w-3.5 h-3.5" /> Revoke
        </button>
        <button
          onClick={() => toast({ title: "Sender blocked" })}
          className="px-3 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition inline-flex items-center justify-center gap-1"
        >
          <Ban className="w-3.5 h-3.5" /> Block
        </button>
      </div>
    </aside>
  );
};

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mt-5">
    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-2">
      {label}
    </p>
    {children}
  </div>
);

export default ApprovalProtocolPanel;