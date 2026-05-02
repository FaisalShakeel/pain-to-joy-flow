import { MessageCircle, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

// TODO: Replace with your real WhatsApp business number in international format (no +, no spaces)
const WHATSAPP_NUMBER = "971585958373";
const DEFAULT_MESSAGE = "Hi, I want to know more about Availock!";

const WhatsAppChat = () => {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

  return (
    <div
      className={`fixed z-50 bottom-5 right-5 md:bottom-7 md:right-7 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
      aria-live="polite"
    >
      {open && (
        <div className="mb-3 w-80 glass ghost-border shadow-elevated rounded-2xl p-4 animate-fade">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-accent">
                  AI Assistant · 24/7
                </p>
              </div>
              <p className="font-headline font-extrabold text-primary text-base leading-tight mt-1.5">
                Ask anything about Availock
              </p>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Chat with our AI on WhatsApp — it explains the protocol, pricing,
                Kickstarter perks, and how the Vault works. Instant answers, any time.
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat prompt"
              className="text-muted-foreground hover:text-primary transition shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[hsl(142_70%_42%)] text-white font-semibold text-sm shadow-glass hover:opacity-95 active:scale-[0.98] transition"
          >
            <MessageCircle className="w-4 h-4" />
            Open WhatsApp chat
          </a>
          <p className="mt-2 text-[10px] text-muted-foreground text-center">
            Powered by AI · Human team reviews complex queries
          </p>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Ask the Availock AI on WhatsApp"
        className="group relative flex items-center gap-2 pl-4 pr-5 py-3 rounded-full bg-[hsl(142_70%_42%)] text-white font-semibold shadow-elevated hover:shadow-glass active:scale-[0.97] transition-all"
      >
        <span className="absolute inset-0 rounded-full bg-[hsl(142_70%_42%)] animate-ping opacity-30" />
        <MessageCircle className="w-5 h-5 relative" strokeWidth={2.5} />
        <span className="relative text-sm hidden sm:inline">Ask AI on WhatsApp</span>
      </button>
    </div>
  );
};

export default WhatsAppChat;