import { useEffect, useState } from "react";
import { Loader2, CalendarDays, Plus } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { toast } from "@/hooks/use-toast";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const hours = ["09", "10", "11", "12", "13", "14", "15", "16", "17"];

// Static booked map for the prototype.
const booked = new Set(["10-Mon", "13-Tue", "11-Wed", "14-Wed", "10-Thu", "16-Fri"]);
const focus = new Set(["09-Mon", "09-Tue", "09-Wed", "09-Thu", "09-Fri", "12-Mon", "12-Tue", "12-Wed", "12-Thu", "12-Fri"]);

const Availability = () => {
  const [connecting, setConnecting] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setConnecting(false), 800);
    return () => clearTimeout(t);
  }, []);

  if (connecting) {
    return (
      <AppShell title="Availability">
        <div className="grid place-items-center h-[60vh] text-center">
          <div>
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
            <p className="mt-4 font-headline font-bold text-primary">Connecting…</p>
            <p className="text-sm text-muted-foreground">Syncing your calendars and request queue.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      subtitle="This week"
      title="Your availability"
      actions={
        <button
          onClick={() => toast({ title: "Window added", description: "A new open slot is now visible to approved contacts." })}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-elevated hover:opacity-95 transition"
        >
          <Plus className="w-4 h-4" /> Add window
        </button>
      }
    >
      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        <div className="rounded-3xl bg-surface-lowest ghost-border p-5 md:p-7 shadow-ambient overflow-x-auto">
          <div className="grid grid-cols-[60px_repeat(5,1fr)] gap-1.5 min-w-[640px]">
            <div />
            {days.map((d) => (
              <div key={d} className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {d}
              </div>
            ))}
            {hours.map((h) => (
              <div key={`row-${h}`} className="contents">
                <div className="text-[11px] text-muted-foreground text-right pr-2 pt-2">{h}:00</div>
                {days.map((d) => {
                  const k = `${h}-${d}`;
                  const isBooked = booked.has(k);
                  const isFocus = focus.has(k);
                  return (
                    <button
                      key={k}
                      onClick={() => toast({ title: `${d} ${h}:00`, description: isBooked ? "Booked slot" : isFocus ? "Focus block" : "Open — share with approved contacts" })}
                      className={`h-10 rounded-lg text-[10px] font-semibold transition ${
                        isBooked
                          ? "bg-accent/15 text-accent border border-accent/30"
                          : isFocus
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 hover:bg-emerald-500/20"
                      }`}
                    >
                      {isBooked ? "Booked" : isFocus ? "Focus" : "Open"}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-3">
          <div className="rounded-3xl bg-surface-lowest ghost-border p-5">
            <h3 className="font-headline font-bold text-primary">Legend</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-emerald-500/40" /> Open window</li>
              <li className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-accent/40" /> Booked</li>
              <li className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-primary/30" /> Focus block</li>
            </ul>
          </div>
          <div className="rounded-3xl bg-gradient-vault text-primary-foreground p-5 shadow-elevated">
            <CalendarDays className="w-5 h-5 text-gold" />
            <p className="mt-2 font-headline font-bold">Smart auto-windows</p>
            <p className="mt-1 text-xs text-primary-foreground/80">
              Let Availock open suggested windows when your calendar has gaps and demand is high.
            </p>
            <button
              onClick={() => toast({ title: "Smart windows on", description: "We'll suggest 2–3 windows daily." })}
              className="mt-3 text-xs font-bold uppercase tracking-wider text-gold hover:text-gold/80"
            >
              Enable →
            </button>
          </div>
        </aside>
      </div>
    </AppShell>
  );
};

export default Availability;