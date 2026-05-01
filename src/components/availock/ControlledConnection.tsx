import { CalendarClock, Layers, MapPin, Globe2, Phone, Sparkles } from "lucide-react";

const ControlledConnection = () => {
  return (
    <section
      id="controlled-connection"
      className="relative py-24 md:py-32 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-mist pointer-events-none" />
      <div className="absolute top-20 -right-32 w-[28rem] h-[28rem] rounded-full bg-accent-soft/20 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-6 md:px-10">
        {/* Header */}
        <div className="max-w-2xl mb-14 md:mb-20">
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-accent mb-4 inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Controlled connection
          </p>
          <h2 className="font-headline font-extrabold text-primary text-4xl md:text-6xl leading-[1.05] text-balance">
            Control how people
            <br />
            <span className="italic font-medium text-outline-variant">connect with you.</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
            Not every conversation needs 30 minutes. Not every interruption is welcome.
          </p>
        </div>

        {/* Two-column feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Hybrid Slot */}
          <FeatureCard
            eyebrow="Hybrid Slot"
            icon={Layers}
            headline="One slot. Two ways to connect."
            description="Offer both online and onsite options in the same time window."
            visual={<HybridSlotVisual />}
            benefits={[
              "No duplicate scheduling",
              "More ways for people to reach you",
              "One setup, complete flexibility",
            ]}
          />

          {/* Quick Sync */}
          <FeatureCard
            eyebrow="Quick Sync"
            icon={CalendarClock}
            headline="Batch short calls without interruptions."
            description="Reserve a 30-minute window for structured 3-minute calls."
            visual={<QuickSyncVisual />}
            benefits={[
              "Handle multiple requests efficiently",
              "No random calls during your day",
              "Fast, focused conversations",
            ]}
          />
        </div>

        {/* Real-life example */}
        <div className="mt-14 md:mt-20 max-w-3xl mx-auto text-center">
          <p className="font-headline text-2xl md:text-3xl text-primary text-balance leading-snug">
            Instead of <span className="italic text-outline-variant">10 random calls</span> throughout your day,
            handle them in one focused <span className="text-accent">30-minute window.</span>
          </p>
        </div>
      </div>
    </section>
  );
};

/* ---------- Subcomponents ---------- */

function FeatureCard({
  eyebrow,
  icon: Icon,
  headline,
  description,
  visual,
  benefits,
}: {
  eyebrow: string;
  icon: React.ComponentType<{ className?: string }>;
  headline: string;
  description: string;
  visual: React.ReactNode;
  benefits: string[];
}) {
  return (
    <article className="group relative rounded-3xl bg-surface-lowest ghost-border p-6 md:p-8 shadow-ambient hover:shadow-elevated hover:-translate-y-1 transition-all duration-300">
      {/* Visual */}
      <div className="rounded-2xl bg-gradient-mist ghost-border p-5 md:p-6 mb-6">
        {visual}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="grid place-items-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
          <Icon className="w-4 h-4" />
        </span>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
      </div>

      <h3 className="font-headline font-extrabold text-primary text-2xl md:text-3xl leading-tight text-balance">
        {headline}
      </h3>
      <p className="mt-3 text-muted-foreground leading-relaxed">{description}</p>

      <ul className="mt-6 space-y-2.5">
        {benefits.map((b) => (
          <li key={b} className="flex items-start gap-2.5 text-sm text-foreground/80">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function HybridSlotVisual() {
  return (
    <div className="rounded-xl bg-surface-lowest ghost-border p-4 md:p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Today</p>
          <p className="font-headline font-extrabold text-primary text-2xl md:text-3xl">3:00 PM</p>
          <p className="text-xs text-muted-foreground">30 min · Hybrid window</p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px] font-bold uppercase tracking-wider">
          Open
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <div className="rounded-lg bg-surface-low ghost-border p-3">
          <div className="flex items-center gap-1.5 text-primary">
            <Globe2 className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">Online</span>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">Video call · auto link</p>
        </div>
        <div className="rounded-lg bg-surface-low ghost-border p-3">
          <div className="flex items-center gap-1.5 text-primary">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">Onsite</span>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">Office · 5th floor</p>
        </div>
      </div>
    </div>
  );
}

function QuickSyncVisual() {
  // 10 × 3-min slots inside one 30-min window
  return (
    <div className="rounded-xl bg-surface-lowest ghost-border p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Quick Sync</p>
          <p className="font-headline font-extrabold text-primary text-2xl md:text-3xl">30 min</p>
          <p className="text-xs text-muted-foreground">10 × 3-min calls</p>
        </div>
        <span className="grid place-items-center w-9 h-9 rounded-full bg-accent/10 text-accent">
          <Phone className="w-4 h-4" />
        </span>
      </div>

      <div className="grid grid-cols-10 gap-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`h-8 rounded-md ${
              i < 6 ? "bg-primary/80" : i < 8 ? "bg-primary/40" : "bg-surface-high"
            }`}
            title={`Slot ${i + 1} · 3 min`}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>0 min</span>
        <span>15</span>
        <span>30 min</span>
      </div>
    </div>
  );
}

export default ControlledConnection;