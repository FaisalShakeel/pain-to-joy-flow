import heroCard from "@/assets/hero-card.jpg";
import { ArrowRight, ShieldCheck } from "lucide-react";

const Hero = () => {
  return (
    <section
      id="top"
      className="relative pt-40 md:pt-48 pb-24 md:pb-32 overflow-hidden"
    >
      {/* atmospheric backdrop */}
      <div className="absolute inset-0 bg-gradient-mist pointer-events-none" />
      <div className="absolute -top-40 -right-32 w-[36rem] h-[36rem] rounded-full bg-accent-soft/30 blur-3xl pointer-events-none" />
      <div className="absolute top-60 -left-40 w-[30rem] h-[30rem] rounded-full bg-primary-fixed/40 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-16 items-center">
        <div className="lg:col-span-7 animate-rise">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-bold tracking-[0.18em] uppercase">
            <ShieldCheck className="w-3.5 h-3.5" />
            A new protocol for presence
          </span>
          <h1 className="mt-8 font-headline font-extrabold text-primary text-balance text-5xl md:text-7xl xl:text-[5.5rem] leading-[0.95]">
            Contact was never meant to be{" "}
            <span className="italic font-medium text-outline-variant">
              permission.
            </span>
          </h1>
          <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-xl font-light leading-relaxed">
            Stop getting awkward calls at the wrong time. Availock re-architects
            communication by putting{" "}
            <span className="text-primary font-medium">intention before interruption</span>.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <a
              href="#claim"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-primary text-primary-foreground font-semibold shadow-elevated hover:shadow-glass transition-all active:scale-[0.98]"
            >
              Claim your Vault ID
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#manifesto"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-surface-lowest ghost-border text-primary font-semibold hover:bg-surface-low transition"
            >
              Read the Manifesto
            </a>
          </div>
          <div className="mt-10 flex items-center gap-6 text-xs text-muted-foreground">
            <div className="flex -space-x-2">
              {["#9b8cff", "#c4baff", "#3a2d6b"].map((c) => (
                <div key={c} className="w-7 h-7 rounded-full ring-2 ring-surface-lowest" style={{ background: c }} />
              ))}
            </div>
            <p>
              <span className="text-primary font-semibold">3,200+</span> early
              vault holders already protected
            </p>
          </div>
        </div>

        <div className="lg:col-span-5 relative animate-fade">
          <div className="relative aspect-square rounded-3xl overflow-hidden shadow-elevated">
            <img
              src={heroCard}
              alt="Traditional business card stamped 'Open door to interruptions' — the old way of sharing contact"
              className="w-full h-full object-cover"
              width={1024}
              height={1024}
            />
            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-primary/90 to-transparent">
              <p className="text-primary-foreground text-xs font-medium tracking-wide uppercase opacity-80">
                The old protocol
              </p>
              <p className="text-primary-foreground font-headline font-bold text-lg leading-tight mt-1">
                A business card is an open door.
              </p>
            </div>
          </div>
          {/* floating credential card */}
          <div className="hidden md:block absolute -bottom-8 -left-10 w-64 glass shadow-glass rounded-2xl p-5 ghost-border animate-float">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md bg-gradient-primary grid place-items-center">
                <ShieldCheck className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="font-headline font-bold text-primary text-sm tracking-tight">AVAILOCK</span>
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Vault Holder</p>
            <p className="font-headline font-extrabold text-primary text-lg">Julian Thorne</p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-on-primary-fixed animate-pulse" />
              Open · 2 windows today
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
