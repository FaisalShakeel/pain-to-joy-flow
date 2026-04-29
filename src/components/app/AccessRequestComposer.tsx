import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck, Check, ArrowRight, X, UserPlus, AlertTriangle, Clock3, Sparkles,
  MessageSquare, Phone, CalendarDays, Mic, User, Mail, Building2, AtSign,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import Avatar from "./Avatar";
import type { Contact } from "@/lib/mockData";

type Relation = "client" | "colleague" | "investor" | "mentor" | "friend" | "family" | "press" | "other";
type Purpose = "intro" | "strategic" | "advice" | "deal" | "support" | "social" | "press" | "other";
type Channel = "voice" | "message" | "calendar";
type Urgency = "routine" | "urgent";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contact: Contact;
  onSubmitted?: () => void;
}

const RELATIONS: { id: Relation; label: string }[] = [
  { id: "client", label: "Client" },
  { id: "colleague", label: "Colleague" },
  { id: "investor", label: "Investor" },
  { id: "mentor", label: "Mentor" },
  { id: "friend", label: "Friend" },
  { id: "family", label: "Family" },
  { id: "press", label: "Press" },
  { id: "other", label: "Other" },
];

const PURPOSES: { id: Purpose; label: string }[] = [
  { id: "intro", label: "Intro" },
  { id: "strategic", label: "Strategic discussion" },
  { id: "advice", label: "Advice / mentoring" },
  { id: "deal", label: "Deal / partnership" },
  { id: "support", label: "Support request" },
  { id: "social", label: "Social / catch-up" },
  { id: "press", label: "Press / interview" },
  { id: "other", label: "Other" },
];

const CHANNELS: { id: Channel; label: string; icon: typeof Mic }[] = [
  { id: "voice", label: "Voice sync", icon: Mic },
  { id: "message", label: "Messaging", icon: MessageSquare },
  { id: "calendar", label: "Schedule time", icon: CalendarDays },
];

const AccessRequestComposer = ({ open, onOpenChange, contact, onSubmitted }: Props) => {
  // mock auth — replace with real auth state when wired
  const [isGuest, setIsGuest] = useState(false);
  const [sent, setSent] = useState(false);

  // identity (only when guest)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");

  const [relation, setRelation] = useState<Relation>("client");
  const [purpose, setPurpose] = useState<Purpose>("strategic");
  const [message, setMessage] = useState("");
  const [referredBy, setReferredBy] = useState("");
  const [referredEnabled, setReferredEnabled] = useState(false);
  const [urgency, setUrgency] = useState<Urgency>("routine");
  const [channel, setChannel] = useState<Channel>("voice");

  const reset = () => {
    setSent(false);
    setName(""); setEmail(""); setOrg("");
    setRelation("client"); setPurpose("strategic");
    setMessage(""); setReferredBy(""); setReferredEnabled(false);
    setUrgency("routine"); setChannel("voice");
  };

  const close = (v: boolean) => {
    onOpenChange(v);
    if (!v) setTimeout(reset, 200);
  };

  const submit = () => {
    if (isGuest && (!name.trim() || !email.trim())) {
      toast({ title: "Add your details", description: "Name and email are needed before sending." });
      return;
    }
    setSent(true);
    onSubmitted?.();
  };

  const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
        active
          ? "bg-primary text-primary-foreground shadow-glass"
          : "bg-surface-low text-primary/80 hover:bg-surface ghost-border"
      }`}
    >
      {children}
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-surface-lowest border-0 shadow-elevated p-0">
        {sent ? (
          <div className="p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/10 grid place-items-center mb-5">
              <Check className="w-7 h-7 text-emerald-600" strokeWidth={3} />
            </div>
            <h2 className="font-headline font-extrabold text-primary text-2xl">Request sent</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {contact.name} will see your request marked{" "}
              <span className="font-semibold text-primary">{urgency === "urgent" ? "URGENT" : "ROUTINE"}</span>.
              You'll be notified the moment they respond.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
              <Link
                to="/app/requests"
                onClick={() => close(false)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-elevated hover:opacity-95 transition"
              >
                Track request <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => close(false)}
                className="flex-1 inline-flex items-center justify-center px-5 py-3 rounded-full ghost-border bg-surface-low text-primary text-sm font-semibold hover:bg-surface transition"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="px-7 pt-7 pb-5">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-primary/70">
                <ShieldCheck className="w-3.5 h-3.5" /> Security protocol
              </div>
              <div className="flex items-start justify-between gap-4 mt-2">
                <div>
                  <h2 className="font-headline font-extrabold text-primary text-3xl leading-tight">Access Request</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Compose a permissioned request to <span className="text-primary font-semibold">{contact.name}</span>.
                  </p>
                </div>
                <button onClick={() => close(false)} className="p-2 rounded-full hover:bg-surface-low transition">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Recipient card */}
              <div className="mt-5 flex items-center gap-3 p-3 rounded-2xl bg-surface-low">
                <Avatar initials={contact.initials} accent={contact.accent} size="md" />
                <div className="min-w-0">
                  <p className="font-semibold text-primary text-sm truncate">{contact.name}</p>
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> {contact.title} · {contact.org}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-7 pb-7 space-y-6">
              {/* Sender identity */}
              <section>
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary/70">Sender</h3>
                  <button
                    type="button"
                    onClick={() => setIsGuest((g) => !g)}
                    className="text-[11px] font-semibold text-accent hover:underline"
                  >
                    {isGuest ? "I have an Availock account" : "Continue as guest"}
                  </button>
                </div>

                {isGuest ? (
                  <div className="mt-3 space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5"><User className="w-3 h-3" /> Full name</span>
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          className="mt-1 w-full rounded-xl bg-surface-lowest ghost-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5"><Mail className="w-3 h-3" /> Email</span>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@company.com"
                          className="mt-1 w-full rounded-xl bg-surface-lowest ghost-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </label>
                    </div>
                    <label className="block">
                      <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5"><Building2 className="w-3 h-3" /> Organization (optional)</span>
                      <input
                        value={org}
                        onChange={(e) => setOrg(e.target.value)}
                        placeholder="Where you work"
                        className="mt-1 w-full rounded-xl bg-surface-lowest ghost-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </label>

                    <Link
                      to="/auth/sign-up"
                      className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/15 hover:to-accent/15 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground">
                          <UserPlus className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-primary">Create a free Availock account</p>
                          <p className="text-[11px] text-muted-foreground">Track responses, build trust score, get faster approvals.</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-primary" />
                    </Link>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-3 p-3 rounded-2xl bg-surface-low">
                    <Avatar initials="AF" accent="from-indigo-500 to-violet-600" size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-primary text-sm">Alistair Finch</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                        <AtSign className="w-3 h-3" /> alistair@availock.com · Northwind Holdings
                      </p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-700">Verified</span>
                  </div>
                )}
              </section>

              {/* Relation */}
              <section>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary/70">Relation</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {RELATIONS.map((r) => (
                    <Chip key={r.id} active={relation === r.id} onClick={() => setRelation(r.id)}>{r.label}</Chip>
                  ))}
                </div>
              </section>

              {/* Purpose */}
              <section>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary/70">Purpose</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {PURPOSES.map((p) => (
                    <Chip key={p.id} active={purpose === p.id} onClick={() => setPurpose(p.id)}>{p.label}</Chip>
                  ))}
                </div>
              </section>

              {/* Context message */}
              <section>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary/70">Context message</h3>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Briefly state what you'd like to discuss with ${contact.name.split(" ")[0]}…`}
                  className="mt-3 w-full rounded-2xl bg-surface-lowest ghost-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
                <p className="text-[11px] text-muted-foreground mt-1.5">{message.length}/500 — clearer context = faster approval</p>
              </section>

              {/* Referred by */}
              <section className="rounded-2xl bg-surface-low p-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span className="text-sm font-semibold text-primary">Mark as referred</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={referredEnabled}
                    onChange={(e) => setReferredEnabled(e.target.checked)}
                    className="w-4 h-4 accent-primary"
                  />
                </label>
                {referredEnabled && (
                  <input
                    value={referredBy}
                    onChange={(e) => setReferredBy(e.target.value)}
                    placeholder="Referred by (name or contact)"
                    className="mt-3 w-full rounded-xl bg-surface-lowest ghost-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                )}
              </section>

              {/* Urgency */}
              <section>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary/70">Priority</h3>
                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setUrgency("routine")}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl transition ${
                      urgency === "routine" ? "bg-primary/10 ring-2 ring-primary text-primary" : "bg-surface-low text-primary/70 ghost-border"
                    }`}
                  >
                    <Clock3 className="w-4 h-4" />
                    <div className="text-left">
                      <p className="text-sm font-semibold">Routine</p>
                      <p className="text-[10px] opacity-70">Reply within their normal window</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrgency("urgent")}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl transition ${
                      urgency === "urgent" ? "bg-rose-500/10 ring-2 ring-rose-500 text-rose-700" : "bg-surface-low text-primary/70 ghost-border"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <div className="text-left">
                      <p className="text-sm font-semibold">Urgent</p>
                      <p className="text-[10px] opacity-70">Surfaces in their priority queue</p>
                    </div>
                  </button>
                </div>
              </section>

              {/* Channel */}
              <section>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary/70">Preferred channel</h3>
                <div className="mt-3 grid grid-cols-3 gap-2.5">
                  {CHANNELS.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setChannel(id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition ${
                        channel === id ? "bg-primary/5 ring-2 ring-primary text-primary" : "bg-surface-low text-primary/70 ghost-border"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-semibold">{label}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Actions */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={submit}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-elevated hover:opacity-95 transition"
                >
                  <ShieldCheck className="w-4 h-4" /> Send request
                </button>
                <button
                  onClick={() => close(false)}
                  className="sm:w-auto inline-flex items-center justify-center px-5 py-3 rounded-full ghost-border bg-surface-low text-primary text-sm font-semibold hover:bg-surface transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AccessRequestComposer;
