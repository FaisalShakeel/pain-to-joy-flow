import { MessageSquareHeart, Send, Lightbulb, Sparkles } from "lucide-react";

const Feedback = () => {
  return (
    <section id="feedback" className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-mist pointer-events-none" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] rounded-full bg-accent-soft/15 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-4xl px-6 md:px-10 text-center">
        <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-accent mb-4 inline-flex items-center gap-2 justify-center">
          <Sparkles className="w-4 h-4" /> Community
        </p>
        <h2 className="font-headline font-extrabold text-primary text-4xl md:text-6xl leading-[1.05] text-balance">
          Be part of the
          <br />
          <span className="italic font-medium text-outline-variant">Availock journey.</span>
        </h2>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          We're building a better way to communicate—and your feedback matters.
          Share your ideas, suggestions, or improvements and help shape Availock.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <a
            href="mailto:hello@availock.com?subject=Availock%20Feedback"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-elevated hover:opacity-95 transition"
          >
            <MessageSquareHeart className="w-4 h-4" /> Share Feedback
          </a>
          <a
            href="mailto:hello@availock.com?subject=Availock%20Suggestion"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full ghost-border bg-surface-lowest text-primary text-sm font-bold hover:bg-surface-low transition"
          >
            <Lightbulb className="w-4 h-4" /> Send Suggestion
          </a>
        </div>

        <p className="mt-6 text-xs text-muted-foreground inline-flex items-center gap-1.5 justify-center">
          <Send className="w-3 h-3" /> Every voice helps shape what we build next.
        </p>
      </div>
    </section>
  );
};

export default Feedback;