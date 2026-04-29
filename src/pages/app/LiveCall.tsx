import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Phone, PhoneOff, Mic, Video, Clock, ArrowRight, Bell } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import Avatar from "@/components/app/Avatar";
import StatusPill from "@/components/app/StatusPill";
import { findContact } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";

const LiveCall = () => {
  const { id = "" } = useParams();
  const contact = useMemo(() => findContact(id), [id]);
  const [available, setAvailable] = useState(contact?.status === "available");

  if (!contact) {
    return (
      <AppShell title="Contact not found">
        <Link to="/app/contacts" className="text-accent hover:underline">← Back to contacts</Link>
      </AppShell>
    );
  }

  return (
    <AppShell subtitle="Live call request" title={contact.name}>
      <div className="grid lg:grid-cols-[1fr_360px] gap-5">
        <div className="rounded-3xl bg-gradient-vault text-primary-foreground p-8 shadow-elevated relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-accent-soft/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-4">
              <Avatar initials={contact.initials} accent={contact.accent} size="xl" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">Status</p>
                <h2 className="font-headline font-extrabold text-3xl mt-1">
                  {available ? "Available — call now" : "Busy — request callback"}
                </h2>
                <p className="mt-1.5 text-sm text-primary-foreground/80">
                  {available
                    ? `${contact.name.split(" ")[0]} is in an open Power Call window.`
                    : `${contact.name.split(" ")[0]} is in deep focus. Request a callback and we'll ping them when free.`}
                </p>
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap gap-2.5">
              {available ? (
                <>
                  <button
                    onClick={() => toast({ title: "Connecting…", description: "Opening secure Power Call." })}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500 text-white font-semibold shadow-elevated hover:bg-emerald-500/90 transition"
                  >
                    <Phone className="w-4 h-4" /> Call now
                  </button>
                  <button className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/10 hover:bg-white/15 text-sm font-semibold transition">
                    <Video className="w-4 h-4" /> Video
                  </button>
                  <button className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/10 hover:bg-white/15 text-sm font-semibold transition">
                    <Mic className="w-4 h-4" /> Audio only
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => toast({ title: "Callback queued", description: `${contact.name.split(" ")[0]} will see your request when free.` })}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gold text-primary font-semibold shadow-elevated hover:bg-gold/90 transition"
                  >
                    <Bell className="w-4 h-4" /> Request callback
                  </button>
                  <button
                    disabled
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/5 text-primary-foreground/50 text-sm font-semibold cursor-not-allowed"
                  >
                    <PhoneOff className="w-4 h-4" /> Call now (unavailable)
                  </button>
                </>
              )}
            </div>

            <div className="mt-8 inline-flex p-1 rounded-full bg-white/10">
              <button onClick={() => setAvailable(true)} className={`px-3 py-1.5 text-xs font-semibold rounded-full ${available ? "bg-white text-primary" : "text-primary-foreground/80"}`}>
                Demo: Available
              </button>
              <button onClick={() => setAvailable(false)} className={`px-3 py-1.5 text-xs font-semibold rounded-full ${!available ? "bg-white text-primary" : "text-primary-foreground/80"}`}>
                Demo: Busy
              </button>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Window details</p>
            <ul className="mt-3 space-y-2 text-sm text-foreground/80">
              <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Today · 14:00 – 16:00 GST</li>
              <li className="flex items-center gap-2"><StatusPill tone={available ? "available" : "busy"} /></li>
              <li className="flex items-center gap-2 text-muted-foreground text-xs">Power Calls remaining this month: 4</li>
            </ul>
          </div>

          <Link
            to={`/app/schedule/${contact.id}`}
            className="flex items-center justify-between p-5 rounded-3xl ghost-border bg-surface-lowest hover:bg-surface-low transition"
          >
            <div>
              <p className="font-semibold text-primary text-sm">Prefer to schedule?</p>
              <p className="text-xs text-muted-foreground">Pick a slot inside their windows.</p>
            </div>
            <ArrowRight className="w-4 h-4 text-primary" />
          </Link>
        </aside>
      </div>
    </AppShell>
  );
};

export default LiveCall;