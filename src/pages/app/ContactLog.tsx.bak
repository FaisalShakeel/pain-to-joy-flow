import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Phone, MessageSquare, Inbox, CalendarDays } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import Avatar from "@/components/app/Avatar";
import { findContact, log } from "@/lib/mockData";

const iconMap = { call: Phone, message: MessageSquare, request: Inbox, schedule: CalendarDays };

const ContactLog = () => {
  const { id = "" } = useParams();
  const contact = useMemo(() => findContact(id), [id]);
  if (!contact) {
    return (
      <AppShell title="Contact not found">
        <Link to="/app/contacts" className="text-accent hover:underline">← Back to contacts</Link>
      </AppShell>
    );
  }
  const items = log.filter((l) => l.contactId === contact.id);

  return (
    <AppShell subtitle="Connection history" title={`${contact.name} · log`}>
      <Link to={`/app/contact/${contact.id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to profile
      </Link>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        <ol className="space-y-3">
          {items.length === 0 && (
            <li className="text-sm text-muted-foreground">No history yet.</li>
          )}
          {items.map((l) => {
            const Icon = iconMap[l.kind];
            return (
              <li key={l.id} className="flex items-start gap-4 p-4 rounded-2xl ghost-border bg-surface-lowest">
                <span className="grid place-items-center w-10 h-10 rounded-xl bg-primary/10 text-primary shrink-0">
                  <Icon className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-primary text-sm">{l.summary}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{l.at}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <aside className="rounded-3xl bg-gradient-vault text-primary-foreground p-6 shadow-elevated h-fit">
          <Avatar initials={contact.initials} accent={contact.accent} />
          <p className="mt-4 font-headline font-bold text-lg">Ready for a new connection?</p>
          <p className="mt-1 text-sm text-primary-foreground/85">
            Pick a slot inside {contact.name.split(" ")[0]}'s next available window.
          </p>
          <Link
            to={`/app/schedule/${contact.id}`}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gold text-primary text-sm font-bold hover:bg-gold/90 transition"
          >
            Schedule call <ArrowRight className="w-4 h-4" />
          </Link>
        </aside>
      </div>
    </AppShell>
  );
};

export default ContactLog;