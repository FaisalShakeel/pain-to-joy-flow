import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CalendarDays, Phone, Video, Check } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import Avatar from "@/components/app/Avatar";
import { findContact } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";

const slots = ["09:30", "10:00", "10:30", "11:00", "13:30", "14:00", "14:30", "15:00", "16:00"];
const days = ["Mon 12", "Tue 13", "Wed 14", "Thu 15", "Fri 16"];

const ScheduleCall = () => {
  const { id = "" } = useParams();
  const contact = useMemo(() => findContact(id), [id]);
  const navigate = useNavigate();

  const [mode, setMode] = useState<"call" | "video">("video");
  const [day, setDay] = useState(days[2]);
  const [slot, setSlot] = useState(slots[3]);

  if (!contact) {
    return (
      <AppShell title="Contact not found">
        <Link to="/app/contacts" className="text-accent hover:underline">← Back to contacts</Link>
      </AppShell>
    );
  }

  const confirm = () => {
    toast({ title: "Booked", description: `${day} · ${slot} with ${contact.name}.` });
    navigate("/app");
  };

  return (
    <AppShell subtitle="Hybrid scheduling" title={`Schedule with ${contact.name.split(" ")[0]}`}>
      <Link to={`/app/contact/${contact.id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to profile
      </Link>

      <div className="grid lg:grid-cols-[1fr_340px] gap-5">
        <div className="space-y-5">
          {/* Mode */}
          <div className="rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Booking mode</p>
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              <ModeBtn picked={mode === "video"} onClick={() => setMode("video")} icon={<Video className="w-5 h-5" />} title="Video meeting" sub="Secure link generated" />
              <ModeBtn picked={mode === "call"} onClick={() => setMode("call")} icon={<Phone className="w-5 h-5" />} title="Voice call" sub="Power Call window" />
            </div>
          </div>

          {/* Calendar */}
          <div className="rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient">
            <div className="flex items-center justify-between">
              <p className="font-headline font-bold text-primary">October 2026</p>
              <span className="text-xs text-muted-foreground">All times shown in your timezone</span>
            </div>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {days.map((d) => (
                <button
                  key={d}
                  onClick={() => setDay(d)}
                  className={`p-3 rounded-2xl text-sm font-semibold transition ${
                    day === d ? "bg-primary text-primary-foreground shadow-glass" : "bg-surface-low ghost-border text-primary hover:bg-surface"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Available slots — {day}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {slots.map((s) => (
                <button
                  key={s}
                  onClick={() => setSlot(s)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                    slot === s ? "bg-accent text-accent-foreground shadow-glass" : "ghost-border bg-surface-low text-primary hover:bg-surface"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <aside className="rounded-3xl bg-gradient-vault text-primary-foreground p-6 shadow-elevated h-fit lg:sticky lg:top-24">
          <div className="flex items-center gap-3">
            <Avatar initials={contact.initials} accent={contact.accent} />
            <div>
              <p className="font-headline font-bold">{contact.name}</p>
              <p className="text-xs text-primary-foreground/80">{contact.title}</p>
            </div>
          </div>

          <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.2em] text-gold">Booking summary</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-gold" /> {day} · {slot}</li>
            <li className="flex items-center gap-2">{mode === "video" ? <Video className="w-4 h-4 text-gold" /> : <Phone className="w-4 h-4 text-gold" />} {mode === "video" ? "Video" : "Voice"} call</li>
            <li className="text-xs text-primary-foreground/75">Both calendars will be updated. Reschedule any time.</li>
          </ul>

          <button
            onClick={confirm}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-gold text-primary font-bold hover:bg-gold/90 transition"
          >
            <Check className="w-4 h-4" /> Confirm booking
          </button>
          <Link to={`/app/contact/${contact.id}/call`} className="mt-3 block text-center text-xs font-semibold text-gold hover:underline">
            Or try Live Call now <ArrowRight className="w-3 h-3 inline" />
          </Link>
        </aside>
      </div>
    </AppShell>
  );
};

function ModeBtn({ picked, onClick, icon, title, sub }: { picked: boolean; onClick: () => void; icon: React.ReactNode; title: string; sub: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-start gap-3 p-4 rounded-2xl text-left transition ${
        picked ? "bg-primary text-primary-foreground shadow-elevated" : "bg-surface-low ghost-border text-primary hover:bg-surface"
      }`}
    >
      <span className={`grid place-items-center w-10 h-10 rounded-xl ${picked ? "bg-white/15" : "bg-primary/10 text-primary"}`}>{icon}</span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className={`text-xs ${picked ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{sub}</p>
      </div>
    </button>
  );
}

export default ScheduleCall;