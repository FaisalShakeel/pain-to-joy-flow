import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Lock, ShieldCheck, Phone, CalendarDays, MessageSquare, ArrowRight, ListChecks, Building2, Clock,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import Avatar from "@/components/app/Avatar";
import StatusPill from "@/components/app/StatusPill";
import RequestSentDialog from "@/components/app/RequestSentDialog";
import { findContact } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";

const ContactProfile = () => {
  const { id = "" } = useParams();
  const baseContact = useMemo(() => findContact(id), [id]);
  const [contact, setContact] = useState(baseContact);
  const [openSent, setOpenSent] = useState(false);
  const [reason, setReason] = useState("");

  if (!contact) {
    return (
      <AppShell title="Contact not found">
        <Link to="/app/contacts" className="text-accent hover:underline">← Back to contacts</Link>
      </AppShell>
    );
  }

  const sendRequest = () => {
    setContact({ ...contact, syncStatus: "pending" });
    setOpenSent(true);
  };

  const isLocked = contact.syncStatus === "locked";
  const isPending = contact.syncStatus === "pending";
  const isApproved = contact.syncStatus === "approved";

  return (
    <AppShell subtitle="Contact profile" title={contact.name}>
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Hero */}
        <div className="lg:col-span-2 rounded-3xl overflow-hidden ghost-border bg-surface-lowest shadow-ambient">
          <div className="relative h-32 bg-gradient-vault">
            <div className="absolute inset-0 bg-gradient-mist opacity-60" />
          </div>
          <div className="px-6 md:px-8 pb-6 -mt-10">
            <div className="flex items-end justify-between flex-wrap gap-4">
              <Avatar initials={contact.initials} accent={contact.accent} size="xl" className="ring-4 ring-surface-lowest" />
              <StatusPill tone={contact.status} />
            </div>
            <h2 className="mt-4 font-headline font-extrabold text-primary text-2xl md:text-3xl">{contact.name}</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> {contact.title} · {contact.org}
            </p>
            <p className="mt-4 text-sm text-foreground/80 max-w-2xl">{contact.bio}</p>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              {contact.tags.map((t) => (
                <span key={t} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary/5 text-primary">
                  {t}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="mt-7 flex flex-wrap gap-2.5">
              {isLocked && (
                <button
                  onClick={sendRequest}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-elevated hover:opacity-95 transition"
                >
                  <ShieldCheck className="w-4 h-4" /> Request access
                </button>
              )}
              {isPending && (
                <span className="inline-flex items-center gap-2 px-5 py-3 rounded-full ghost-border bg-surface-low text-sm font-semibold text-amber-700">
                  <Clock className="w-4 h-4" /> Request pending
                </span>
              )}
              {isApproved && (
                <>
                  <Link
                    to={`/app/schedule/${contact.id}`}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-elevated hover:opacity-95 transition"
                  >
                    <CalendarDays className="w-4 h-4" /> Schedule call
                  </Link>
                  <Link
                    to={`/app/contact/${contact.id}/call`}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-full ghost-border bg-surface-low text-sm font-semibold text-primary hover:bg-surface transition"
                  >
                    <Phone className="w-4 h-4" /> Live call
                  </Link>
                  <Link
                    to="/app/messages"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-full ghost-border bg-surface-low text-sm font-semibold text-primary hover:bg-surface transition"
                  >
                    <MessageSquare className="w-4 h-4" /> Message
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Side info */}
        <div className="space-y-4">
          <div className="rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Sync status</p>
            <h3 className="mt-1.5 font-headline font-bold text-primary text-lg">
              {isLocked ? "Locked" : isPending ? "Pending approval" : "Approved"}
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {isLocked && "You haven't been granted access. Send a request to start a permissioned sync."}
              {isPending && `${contact.name.split(" ")[0]} typically reviews within ${contact.responseTime}.`}
              {isApproved && "You can schedule, message, or call within their published windows."}
            </p>

            {isLocked && (
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly: why now? (optional)"
                rows={3}
                className="mt-4 w-full text-sm bg-surface-low ghost-border rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
              />
            )}
          </div>

          <Link
            to={`/app/contact/${contact.id}/log`}
            className="flex items-center justify-between p-5 rounded-3xl bg-surface-lowest ghost-border hover:bg-surface-low transition"
          >
            <div className="flex items-center gap-3">
              <span className="grid place-items-center w-10 h-10 rounded-xl bg-accent/10 text-accent">
                <ListChecks className="w-5 h-5" />
              </span>
              <div>
                <p className="font-semibold text-primary text-sm">Connection history</p>
                <p className="text-xs text-muted-foreground">Calls, messages and approvals</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-primary" />
          </Link>

          {isLocked && (
            <div className="rounded-3xl bg-primary/5 ghost-border p-5 text-sm text-foreground/80">
              <Lock className="w-4 h-4 text-primary mb-2" />
              Calendar, contact details and live call windows unlock once your request is approved.
            </div>
          )}
        </div>
      </div>

      <RequestSentDialog
        open={openSent}
        onOpenChange={(v) => {
          setOpenSent(v);
          if (!v) toast({ title: "Request queued", description: "We'll ping you the moment they respond." });
        }}
        contactName={contact.name}
      />
    </AppShell>
  );
};

export default ContactProfile;