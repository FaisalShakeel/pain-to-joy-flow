import { ShieldAlert, ShieldCheck, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const AccessControl = () => (
  <section id="protocol" className="py-24 md:py-32 bg-surface-low/40 relative overflow-hidden">
    <div className="mx-auto max-w-7xl px-6 md:px-10 grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
      {/* Editorial */}
      <div>
        <span className="inline-block px-4 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-bold tracking-wide">
          PROTOCOL 01 · ACCESS CONTROL
        </span>
        <h2 className="mt-6 font-headline font-extrabold text-primary text-4xl md:text-6xl leading-[1.05] tracking-tight text-balance">
          Stop giving out your number.
        </h2>
        <p className="mt-6 text-lg text-muted-foreground max-w-lg leading-relaxed">
          <span className="text-primary font-semibold">Share your availability instead.</span>{" "}
          With Availock, you aren't handing over a static digit — you're offering a
          dynamic, intentional entry point to your time.
        </p>

        <div className="mt-10 space-y-6">
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-surface-high grid place-items-center">
              <ShieldAlert className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-primary">Exposed Access</h3>
              <p className="text-muted-foreground italic">
                Cards and numbers leave your data vulnerable to cold calls,
                leaks, and unwanted intrusions.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-primary-fixed grid place-items-center">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-primary">Intentional Connection</h3>
              <p className="text-muted-foreground">
                Your Vault generates encrypted entry points that you control.
                Only the chosen get through, precisely when you're open.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Visual exchange */}
      <div className="relative h-[520px] flex items-center justify-center">
        <div className="absolute inset-8 bg-gradient-to-tr from-surface-low to-transparent rounded-[3rem] rotate-3" />
        <div className="absolute inset-12 bg-primary/5 rounded-[3rem] -rotate-3 blur-2xl" />

        {/* Old card */}
        <div className="absolute top-12 left-4 md:left-12 w-72 h-44 bg-surface-lowest ghost-border rounded-xl p-5 -rotate-[10deg] opacity-70 grayscale shadow-ambient">
          <div className="border-b border-border/40 pb-3 mb-3">
            <div className="h-3 w-24 bg-surface-high rounded mb-2" />
            <div className="h-2 w-16 bg-surface-low rounded" />
          </div>
          <div className="space-y-2 text-[10px] text-muted-foreground font-mono">
            <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> +1 (555) 0192-384</div>
            <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> j.thorne@mail.com</div>
          </div>
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[9px] font-bold tracking-wider">EXPOSED</div>
        </div>

        {/* Availock card — scannable QR linking to Julian's vault */}
        <Link
          to="/v/julian-vane"
          aria-label="Open Julian Thorne's vault"
          className="relative w-80 md:w-96 h-56 glass rounded-2xl p-6 rotate-[5deg] shadow-elevated ghost-border overflow-hidden flex items-center gap-5 hover:shadow-glass hover:-translate-y-0.5 transition-all"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-fixed/40 via-transparent to-accent-soft/30" />
          <div className="relative w-32 h-32 rounded-xl bg-primary text-primary-foreground grid place-items-center flex-shrink-0 ring-1 ring-primary/20">
            <div className="grid grid-cols-10 gap-px p-2 bg-primary-foreground/10 rounded-md">
              {Array.from({ length: 100 }).map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 ${
                    [0, 9, 90, 99].includes(i) || (i * 13) % 7 < 3
                      ? "bg-primary-foreground"
                      : "bg-transparent"
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="relative min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Vault Holder</span>
            </div>
            <div className="text-xl font-headline font-extrabold text-primary leading-tight">Julian Thorne</div>
            <div className="mt-1 text-[10px] text-on-primary-fixed bg-primary-fixed inline-block px-2 py-0.5 rounded-full font-bold tracking-[0.18em]">VAULT · 2048</div>
            <p className="mt-2 text-[10px] text-muted-foreground font-medium">Tap or scan to open vault</p>
          </div>
        </Link>
      </div>
    </div>
  </section>
);

export default AccessControl;
