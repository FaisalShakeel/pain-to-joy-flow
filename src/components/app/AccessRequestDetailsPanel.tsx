import { ShieldCheck, Handshake, Users, MessageSquareQuote, Clock3, BadgeCheck, AlertCircle, Zap, Briefcase } from "lucide-react";
import Avatar from "@/components/app/Avatar";
import { contacts, type AccessRequest } from "@/lib/mockData";

interface Props {
  request: AccessRequest;
}

const AccessRequestDetailsPanel = ({ request }: Props) => {
  const c = contacts.find((x) => x.id === request.contactId)!;

  const urgency = request.urgency ?? "low";
  const urgencyMeta =
    urgency === "high"
      ? { label: "Important", icon: AlertCircle, tone: "bg-rose-500/10 text-rose-700 ring-1 ring-rose-500/20" }
      : urgency === "medium"
      ? { label: "Priority", icon: Zap, tone: "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20" }
      : { label: "Routine", icon: BadgeCheck, tone: "bg-muted text-muted-foreground ring-1 ring-border" };
  const UrgencyIcon = urgencyMeta.icon;

  return (
    <aside className="rounded-3xl bg-surface-lowest ghost-border p-4 md:p-5 shadow-ambient">
      {/* Header */}
      <div className="text-center">
        <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-accent">
          <ShieldCheck className="w-3 h-3" /> Security Protocol
        </p>
        <h3 className="mt-0.5 font-headline font-extrabold text-primary text-xl leading-tight">
          Access Request Details
        </h3>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Review the seeker's intent before authorizing connection.
        </p>
      </div>

      {/* Identity card */}
      <div className="mt-3 flex items-center gap-2.5 rounded-2xl ghost-border bg-surface-low p-2.5">
        <Avatar initials={c.initials} accent={c.accent} status={c.status} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="font-headline font-bold text-primary text-sm leading-tight truncate">{c.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">{c.title} · {c.org}</p>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${urgencyMeta.tone}`}>
          <UrgencyIcon className="w-3 h-3" /> {urgencyMeta.label}
        </span>
      </div>

      {/* Connection purpose */}
      <Section label="Connection purpose">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl ghost-border bg-surface-low">
          <Handshake className="w-3.5 h-3.5 text-primary" />
          <span className="text-[12px] font-semibold text-primary truncate">
            {request.purpose ?? "Strategic Review"}
          </span>
        </div>
      </Section>

      {/* Contact relation */}
      <Section label="Contact relation">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl ghost-border bg-surface-low">
          <Users className="w-3.5 h-3.5 text-primary" />
          <span className="text-[12px] font-semibold text-primary truncate">
            {request.relation ?? (request.senderType === "guest" ? "Unknown / First-Time Contact" : "Existing Contact")}
          </span>
        </div>
      </Section>

      {/* Incoming message */}
      <Section label="Incoming message">
        <blockquote className="rounded-xl bg-surface-low ghost-border px-3 py-2 italic text-[12px] text-foreground/80 leading-relaxed border-l-2 border-l-accent">
          <MessageSquareQuote className="inline-block w-3 h-3 mr-1 -mt-0.5 text-accent" />
          "{request.reason ?? "No message provided."}"
        </blockquote>
      </Section>

      {/* Footer meta */}
      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <Clock3 className="w-3 h-3" /> {request.receivedAt}
        </span>
        <span className="inline-flex items-center gap-1 text-emerald-700">
          <BadgeCheck className="w-3 h-3" /> Verified Identity
        </span>
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

export default AccessRequestDetailsPanel;