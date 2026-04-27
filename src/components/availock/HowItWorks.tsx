import { Share2, SlidersHorizontal, Sparkles } from "lucide-react";

const steps = [
  {
    n: "01",
    icon: Share2,
    title: "Share your link or QR",
    body: "Hand out your Availock link or QR instead of your number. Your real digits stay sealed — access is earned, not exposed.",
  },
  {
    n: "02",
    icon: SlidersHorizontal,
    title: "Define your availability",
    body: "Set the rules once. Choose when, how, and to whom you can be reached — and Availock holds the door for you.",
  },
  {
    n: "03",
    icon: Sparkles,
    title: "Let others connect, the right way",
    body: 'No "Are you free?" No guessing. Contacts see exactly when you\'re open and reach you on your terms.',
  },
];

const HowItWorks = () => (
  <section id="how" className="py-24 md:py-32 bg-surface-low/40 relative overflow-hidden">
    <div className="absolute -top-32 right-1/3 w-[28rem] h-[28rem] rounded-full bg-accent-soft/20 blur-3xl pointer-events-none" />
    <div className="relative mx-auto max-w-7xl px-6 md:px-10">
      <div className="max-w-2xl mb-16">
        <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-accent mb-4">
          What happens instead
        </p>
        <h2 className="font-headline font-extrabold text-primary text-4xl md:text-6xl leading-[1.05] text-balance">
          Three steps.
          <br />
          <span className="italic font-medium text-outline-variant">Zero interruptions.</span>
        </h2>
        <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
          You define your availability once. Availock handles the rest — quietly,
          continuously, on your behalf.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 relative">
        {/* connecting line */}
        <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        {steps.map(({ n, icon: Icon, title, body }) => (
          <div
            key={n}
            className="relative p-8 rounded-3xl bg-surface-lowest ghost-border shadow-ambient hover:-translate-y-1 transition-all duration-500"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-primary grid place-items-center shadow-glass">
                <Icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-headline font-extrabold text-5xl text-primary/10 leading-none">
                {n}
              </span>
            </div>
            <h3 className="font-headline font-bold text-primary text-xl md:text-2xl mb-3 leading-tight">
              {title}
            </h3>
            <p className="text-muted-foreground leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      <p className="mt-12 text-center text-sm text-muted-foreground italic max-w-xl mx-auto">
        * You define your availability once — Availock handles the rest.
      </p>
    </div>
  </section>
);

export default HowItWorks;