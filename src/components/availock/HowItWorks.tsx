import { KeyRound, SlidersHorizontal, DoorOpen, Lock } from "lucide-react";

const steps = [
  {
    n: "01",
    icon: KeyRound,
    title: "Mint your Vault ID",
    body: "Replace your number with a single, encrypted identity. Your real contact data stays sealed inside the Vault — forever.",
  },
  {
    n: "02",
    icon: SlidersHorizontal,
    title: "Set your protocols",
    body: "Define who can reach you, when, and through which channel. Time windows, intent filters, audience tiers — your rules.",
  },
  {
    n: "03",
    icon: DoorOpen,
    title: "Share an entry point",
    body: "Hand out a Vault link instead of a phone number. Recipients see a clean handshake, never your raw digits.",
  },
  {
    n: "04",
    icon: Lock,
    title: "Doors re-lock themselves",
    body: "Every access has an expiry. When the window closes, the protocol revokes itself. No leftovers, no leaks, no regrets.",
  },
];

const HowItWorks = () => (
  <section id="how" className="py-24 md:py-32 bg-surface-lowest relative overflow-hidden">
    <div className="absolute -top-32 right-0 w-[28rem] h-[28rem] rounded-full bg-primary-fixed/30 blur-3xl pointer-events-none" />
    <div className="absolute bottom-0 -left-32 w-[24rem] h-[24rem] rounded-full bg-accent-soft/30 blur-3xl pointer-events-none" />

    <div className="relative mx-auto max-w-7xl px-6 md:px-10">
      <div className="max-w-2xl mb-16">
        <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-accent mb-4">
          How it works
        </p>
        <h2 className="font-headline font-extrabold text-primary text-4xl md:text-6xl leading-[1.05] text-balance">
          Four moves.
          <br />
          <span className="italic font-medium text-outline-variant">Total quiet.</span>
        </h2>
        <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
          A protocol, not an app. Availock slips between you and the noise — so
          intention becomes the only currency that gets through.
        </p>
      </div>

      <ol className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
        {steps.map(({ n, icon: Icon, title, body }, i) => (
          <li
            key={n}
            className="group relative p-7 rounded-3xl bg-surface-low ghost-border hover:bg-surface-high hover:-translate-y-1 transition-all duration-500"
          >
            <div className="flex items-center justify-between mb-6">
              <span className="font-headline font-extrabold text-5xl text-primary/15 group-hover:text-primary/25 transition">
                {n}
              </span>
              <div className="w-11 h-11 rounded-xl bg-surface-lowest shadow-ambient grid place-items-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
            </div>
            <h3 className="font-headline font-bold text-primary text-xl mb-3 leading-tight">
              {title}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-gradient-to-r from-primary/30 to-transparent"
              />
            )}
          </li>
        ))}
      </ol>
    </div>
  </section>
);

export default HowItWorks;
