import { Quote } from "lucide-react";

const WhatChanged = () => (
  <section className="py-24 md:py-32 bg-surface-lowest relative">
    <div className="mx-auto max-w-7xl px-6 md:px-10 grid lg:grid-cols-12 gap-12 items-center">
      <div className="lg:col-span-7">
        <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-accent mb-5">
          What just changed
        </p>
        <h2 className="font-headline font-extrabold text-4xl md:text-6xl text-primary leading-[1.05] mb-6 text-balance">
          We left the era of connection.
          <br />
          <span className="italic font-medium text-outline-variant">We entered the era of noise.</span>
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
          The digital landscape is flooded. Every channel is open by default,
          every notification a small invasion. Availock is the filter — a quiet
          architecture that returns ownership of your time.
        </p>
      </div>
      <div className="lg:col-span-5">
        <div className="relative p-8 md:p-10 bg-surface-low rounded-3xl ghost-border overflow-hidden">
          <Quote className="absolute -top-2 -right-2 w-32 h-32 text-primary/5" strokeWidth={1} />
          <blockquote className="relative font-headline italic text-primary text-xl md:text-2xl leading-snug mb-8">
            "The modern alternative to <em>'Are you free?'</em> is a protocol
            that already knows the answer."
          </blockquote>
          <div className="flex items-center gap-3 relative">
            <div className="w-10 h-10 rounded-full bg-gradient-primary grid place-items-center text-primary-foreground text-xs font-bold">AV</div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Security Standard</p>
              <p className="text-xs text-muted-foreground">Encrypted Identity Vault</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default WhatChanged;
