import { useState } from "react";
import { ShieldCheck, Handshake, Users, MessageSquareQuote, Clock3, BadgeCheck, ChevronDown, Send } from "lucide-react";
import Avatar from "@/components/app/Avatar";
import { contacts, type AccessRequest } from "@/lib/mockData";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface Props {
  request: AccessRequest;
  variant?: "incoming" | "outgoing";
  onSend?: () => void;
}

const PRIORITY_OPTIONS = [
  "Standard", "Important", "Urgent",
  "Collaboration", "Follow-Up", "Informational",
  "Decision Required", "Escalation", "Critical Issue",
  "Opportunity", "Support Needed",
] as const;

type Priority = typeof PRIORITY_OPTIONS[number];

const PURPOSE_OPTIONS = [
  "Business", "Sales", "Partnership", "Investor Relations",
  "Customer Support", "Media / Press", "Networking", "Collaboration",
  "Advisory / Consultation", "Personal / Social", "Family",
  "Marketing / Promotion", "Vendor / Service Request",
  "Technical Support", "Event / Speaking Request",
  "Community / Membership", "Legal / Compliance",
] as const;

type Purpose = typeof PURPOSE_OPTIONS[number];

const RELATION_OPTIONS = [
  "Unknown / First-Time Contact", "Family", "Friend", "Colleague",
  "Employee / Team Member", "Client", "Customer", "Vendor / Supplier",
  "Investor", "Founder", "Recruiter", "Candidate", "Partner",
  "Advisor / Mentor", "Student", "Teacher / Professor",
  "Doctor / Patient", "Service Provider", "Community Member",
  "Existing Contact", "Mutual Connection",
] as const;

type Relation = typeof RELATION_OPTIONS[number];

const priorityTone = (p: Priority) => {
  if (p === "Urgent" || p === "Critical Issue" || p === "Escalation")
    return "bg-rose-500/10 text-rose-700 ring-1 ring-rose-500/20";
  if (p === "Important" || p === "Decision Required" || p === "Support Needed")
    return "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20";
  if (p === "Opportunity" || p === "Collaboration")
    return "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20";
  return "bg-muted text-muted-foreground ring-1 ring-border";
};

const AccessRequestDetailsPanel = ({ request, variant = "incoming", onSend }: Props) => {
  const c = contacts.find((x) => x.id === request.contactId)!;

  const initialPriority: Priority =
    request.urgency === "high" ? "Urgent" :
    request.urgency === "medium" ? "Important" : "Standard";
  const [priority, setPriority] = useState<Priority>(initialPriority);

  const initialPurpose: Purpose =
    (request.purpose && PURPOSE_OPTIONS.includes(request.purpose as Purpose))
      ? (request.purpose as Purpose)
      : "Business";
  const [purpose, setPurpose] = useState<Purpose>(initialPurpose);

  const initialRelation: Relation =
    (request.relation && RELATION_OPTIONS.includes(request.relation as Relation))
      ? (request.relation as Relation)
      : (request.senderType === "guest" ? "Unknown / First-Time Contact" : "Existing Contact");
  const [relation, setRelation] = useState<Relation>(initialRelation);

  return (
    <aside className="rounded-3xl bg-surface-lowest ghost-border p-4 md:p-5 shadow-ambient">
      {/* Header */}
      <div className="text-center">
        <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-accent">
          <ShieldCheck className="w-3 h-3" /> Security Protocol
        </p>
        <h3 className="mt-0.5 font-headline font-extrabold text-primary text-xl leading-tight">
          {variant === "outgoing" ? "Outgoing Access Request" : "Access Request Details"}
        </h3>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {variant === "outgoing"
            ? "Review and dispatch your permissioned request."
            : "Review the seeker's intent before authorizing connection."}
        </p>
        <div className="mt-2 flex items-center justify-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Priority</span>
          {variant === "outgoing" ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition hover:opacity-90 ${priorityTone(priority)}`}>
                {priority} <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider">Priority window</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {PRIORITY_OPTIONS.map((p) => (
                <DropdownMenuItem key={p} onSelect={() => setPriority(p)} className="text-xs">
                  {p}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          ) : (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${priorityTone(priority)}`}>
              {priority}
            </span>
          )}
        </div>
      </div>

      {/* Identity card */}
      <div className="mt-3 flex items-center gap-2.5 rounded-2xl ghost-border bg-surface-low p-2.5">
        <Avatar initials={c.initials} accent={c.accent} status={c.status} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="font-headline font-bold text-primary text-sm leading-tight truncate">{c.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">{c.title} · {c.org}</p>
        </div>
      </div>

      {/* Connection purpose */}
      <Section label="Connection purpose">
        {variant === "outgoing" ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl ghost-border bg-surface-low text-left hover:bg-surface-low/80 transition">
              <Handshake className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-[12px] font-semibold text-primary truncate">
                {purpose}
              </span>
              <ChevronDown className="w-3 h-3 text-muted-foreground ml-auto shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider">Purpose</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {PURPOSE_OPTIONS.map((p) => (
              <DropdownMenuItem key={p} onSelect={() => setPurpose(p)} className="text-xs">
                {p}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        ) : (
          <div className="w-full flex items-center gap-2 px-3 py-2 rounded-xl ghost-border bg-surface-low">
            <Handshake className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-[12px] font-semibold text-primary truncate">{purpose}</span>
          </div>
        )}
      </Section>

      {/* Contact relation */}
      <Section label="Contact relation">
        {variant === "outgoing" ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl ghost-border bg-surface-low text-left hover:bg-surface-low/80 transition">
              <Users className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-[12px] font-semibold text-primary truncate">
                {relation}
              </span>
              <ChevronDown className="w-3 h-3 text-muted-foreground ml-auto shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider">Relation</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {RELATION_OPTIONS.map((r) => (
              <DropdownMenuItem key={r} onSelect={() => setRelation(r)} className="text-xs">
                {r}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        ) : (
          <div className="w-full flex items-center gap-2 px-3 py-2 rounded-xl ghost-border bg-surface-low">
            <Users className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-[12px] font-semibold text-primary truncate">{relation}</span>
          </div>
        )}
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

      {variant === "outgoing" && (
        <button
          onClick={onSend}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-primary text-primary-foreground text-sm font-bold shadow-elevated hover:opacity-95 transition"
        >
          <Send className="w-4 h-4" /> Send Request
        </button>
      )}
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