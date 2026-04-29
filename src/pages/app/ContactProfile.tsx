import { useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Lock, ShieldCheck, Phone, CalendarDays, MessageSquare, ArrowRight, ListChecks, Building2, Clock, BellRing, BellOff, PhoneCall, ArrowLeft,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import Avatar from "@/components/app/Avatar";
import StatusPill from "@/components/app/StatusPill";
import AccessRequestComposer from "@/components/app/AccessRequestComposer";
import PingButton from "@/components/app/PingButton";
import { findContact } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";

const ContactProfile = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/app/contacts");
  };
  const baseContact = useMemo(() => findContact(id), [id]);
  const [contact, setContact] = useState(baseContact);
  const [openSent, setOpenSent] = useState(false);
  const [reason, setReason] = useState("");
  const [alerts, setAlerts] = useState<{ callback: boolean; message: boolean; calendar: boolean }>({
    callback: false,
    message: false,
    calendar: false,
  });

  if (!contact) {
    return (
      <AppShell title="Contact not found">
        <Link to="/app/contacts" className="text-accent hover:underline">← Back to contacts</Link>
      </AppShell>
    );
  }

  const sendRequest = () => setOpenSent(true);

  const isLocked = contact.syncStatus === "locked";
  const isPending = contact.syncStatus === "pending";
  const isApproved = contact.syncStatus === "approved";

  const firstName = contact.name.split(" ")[0];
  const anyAlert = alerts.callback || alerts.message || alerts.calendar;

  const toggleAlert = (k: "callback" | "message" | "calendar") => {
    const next = { ...alerts, [k]: !alerts[k] };
    setAlerts(next);
    const labelMap = {
      callback: "Callback alert",
      message: "Message alert",
      calendar: "Calendar alert",
    } as const;
    if (next[k]) {
      toast({
        title: `${labelMap[k]} on`,
        description: `We'll ping you the moment ${firstName} is reachable. Example: "${firstName} is available to contact now."`,
      });
    } else {
      toast({ title: `${labelMap[k]} off`, description: "You won't be notified about status changes." });
    }
  };

  return (
    <AppShell subtitle="Contact profile" title={contact.name}>
      <button
        onClick={goBack}
        className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full ghost-border bg-surface-lowest text-xs font-semibold text-primary hover:bg-surface-low transition"
        aria-label="Back to contacts"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to contacts
      </button>
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
              <div className="inline-flex items-center gap-2 px-2 py-1.5 rounded-full ghost-border bg-surface-low">
                <span className="pl-2 text-xs font-semibold text-primary">Quick Ping</span>
                <PingButton contact={contact} size="md" />
              </div>
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
          {/* Availability alerts */}
          <div className="rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Availability alerts</p>
                <h3 className="mt-1.5 font-headline font-bold text-primary text-lg">
                  Notify me when {firstName} is reachable
                </h3>
              </div>
              <span className={`grid place-items-center w-10 h-10 rounded-xl ${anyAlert ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                {anyAlert ? <BellRing className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              No alert set means no contact. Pick how you want to be pinged on status changes.
            </p>

            <div className="mt-4 space-y-2">
              {[
                { key: "callback" as const, icon: PhoneCall, label: "Callback alert", hint: `e.g. "${firstName} is available to contact now"` },
                { key: "message" as const, icon: MessageSquare, label: "Message alert", hint: "Ping me when async window opens" },
                { key: "calendar" as const, icon: CalendarDays, label: "Calendar alert", hint: "Notify before their next free slot" },
              ].map(({ key, icon: Icon, label, hint }) => {
                const on = alerts[key];
                return (
                  <button
                    key={key}
                    onClick={() => toggleAlert(key)}
                    className={`w-full flex items-center justify-between gap-3 p-3 rounded-2xl ghost-border text-left transition ${
                      on ? "bg-primary/5" : "bg-surface-low hover:bg-surface"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`grid place-items-center w-9 h-9 rounded-xl ${on ? "bg-primary text-primary-foreground" : "bg-surface text-primary"}`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-primary truncate">{label}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{hint}</p>
                      </div>
                    </div>
                    <span
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
                        on ? "bg-primary" : "bg-muted"
                      }`}
                      aria-hidden
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                          on ? "translate-x-4" : "translate-x-0.5"
                        }`}
                      />
                    </span>
                  </button>
                );
              })}
            </div>

            {!anyAlert && (
              <p className="mt-3 text-[11px] text-muted-foreground italic">
                No alert active — you won't be notified when {firstName}'s status changes.
              </p>
            )}
          </div>

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

      <AccessRequestComposer
        open={openSent}
        onOpenChange={setOpenSent}
        contact={contact}
        onSubmitted={() => setContact({ ...contact, syncStatus: "pending" })}
      />
    </AppShell>
  );
};

export default ContactProfile;