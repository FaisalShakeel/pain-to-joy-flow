import { PlayCircle } from "lucide-react";

const ExplainerVideo = () => (
  <section id="video" className="py-24 md:py-32 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-mist pointer-events-none" />
    <div className="relative mx-auto max-w-6xl px-6 md:px-10">
      <div className="max-w-2xl mb-12">
        <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-accent mb-4 inline-flex items-center gap-2">
          <PlayCircle className="w-4 h-4" /> Watch the explainer
        </p>
        <h2 className="font-headline font-extrabold text-primary text-4xl md:text-6xl leading-[1.05] text-balance">
          See the Vault
          <br />
          <span className="italic font-medium text-outline-variant">in 90 seconds.</span>
        </h2>
        <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
          A short walkthrough of how Availock replaces phone numbers with an encrypted,
          revocable protocol for presence.
        </p>
      </div>

      <div className="relative rounded-3xl overflow-hidden shadow-elevated ghost-border bg-surface-lowest">
        <div className="aspect-video">
          <iframe
            className="w-full h-full"
            src="https://www.youtube.com/embed/8WOYDy9OBJI?start=8"
            title="Availock — Explainer"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  </section>
);

export default ExplainerVideo;
