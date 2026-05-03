import heroCard from "@/assets/hero-card.jpg";
import { ArrowRight, PlayCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const Hero = () => {
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    <section
      id="top"
      className="relative pt-40 md:pt-48 pb-24 md:pb-32 overflow-hidden"
    >
      {/* Background video — desktop/tablet only, with poster fallback */}
      <video
        className="hidden md:block absolute inset-0 w-full h-full object-cover pointer-events-none"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={heroCard}
        aria-hidden="true"
      >
        <source
          src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
          type="video/mp4"
        />
      </video>

      {/* Readability overlay over the video */}
      <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/55 pointer-events-none" />
      <div className="hidden md:block absolute inset-0 bg-background/30 pointer-events-none" />

      {/* atmospheric backdrop (mobile fallback + extra depth on desktop) */}
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
            <button
              type="button"
              onClick={() => setVideoOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-surface-lowest ghost-border text-primary font-semibold hover:bg-surface-low transition"
            >
              <PlayCircle className="w-4 h-4" />
              Watch how it works
            </button>
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
          {/* floating credential card — scannable QR linking to Julian's vault */}
          <Link
            to="/v/julian-vane"
            aria-label="Open Julian Thorne's vault"
            className="hidden md:flex absolute -bottom-8 -left-10 w-72 items-center gap-4 glass shadow-glass rounded-2xl p-4 ghost-border animate-float hover:shadow-elevated hover:-translate-y-0.5 transition-all"
          >
            <div className="w-20 h-20 rounded-xl bg-primary text-primary-foreground grid place-items-center flex-shrink-0 ring-1 ring-primary/20">
              <div className="grid grid-cols-8 gap-px p-1.5 bg-primary-foreground/10 rounded-md">
                {Array.from({ length: 64 }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-1 h-1 ${
                      [0, 7, 56, 63].includes(i) || (i * 11) % 7 < 3
                        ? "bg-primary-foreground"
                        : "bg-transparent"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-3 h-3 text-accent" />
                <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Vault Holder</span>
              </div>
              <p className="font-headline font-extrabold text-primary text-lg leading-tight">Julian Thorne</p>
              <p className="mt-1 text-[10px] text-muted-foreground font-medium">Tap or scan to open vault</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Watch-how-it-works modal */}
      {videoOpen && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-foreground/70 backdrop-blur-sm p-4"
          onClick={() => setVideoOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/8WOYDy9OBJI?start=8&autoplay=1"
              title="Availock — How it works"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
            <button
              type="button"
              onClick={() => setVideoOpen(false)}
              className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-background/90 ghost-border text-xs font-semibold text-primary hover:bg-background transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default Hero;
