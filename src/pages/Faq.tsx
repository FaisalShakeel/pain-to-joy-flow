import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ArrowRight } from "lucide-react";
import Nav from "@/components/availock/Nav";
import Footer from "@/components/availock/Footer";

const categories = ["All", "Availability", "Privacy", "Power Calls", "Billing"];

const items = [
  { cat: "Availability", q: "How does real-time availability work?", a: "Your status is what every Seeker sees first. We update it from your calendar, focus rules, and manual overrides — no other party can see your raw schedule." },
  { cat: "Privacy", q: "Is my contact information exposed?", a: "No. Approved contacts can reach you through Availock without ever seeing your phone number, email or calendar." },
  { cat: "Power Calls", q: "What are 'Power Calls'?", a: "Time-boxed call windows where approved contacts can ring you on demand without exchanging numbers." },
  { cat: "Availability", q: "How do I request access to a partner?", a: "Open their vault, write a short reason, send. The request enters their queue and you're notified the moment they respond." },
  { cat: "Billing", q: "Can I cancel any time?", a: "Yes — cancel from Settings → Payment. Your tier downgrades at the end of the current period." },
  { cat: "Privacy", q: "Where is my data stored?", a: "Region-pinned by default. Enterprise customers can request specific jurisdictions." },
];

const Faq = () => {
  const [cat, setCat] = useState("All");
  const [open, setOpen] = useState<number | null>(0);
  const filtered = items.filter((i) => cat === "All" || i.cat === cat);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="pt-32 pb-20">
        <div className="mx-auto max-w-5xl px-6 md:px-10">
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-accent text-center">FAQ</p>
          <h1 className="mt-3 text-center font-headline font-extrabold text-primary text-4xl md:text-5xl leading-[1.05] text-balance">
            Stay ahead of the vault.
          </h1>

          <div className="mt-10 grid lg:grid-cols-[220px_1fr] gap-8">
            <aside>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">Categories</p>
              <ul className="space-y-1">
                {categories.map((c) => (
                  <li key={c}>
                    <button
                      onClick={() => setCat(c)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition ${
                        cat === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface-low hover:text-primary"
                      }`}
                    >{c}</button>
                  </li>
                ))}
              </ul>
            </aside>

            <div className="space-y-2">
              {filtered.map((it, i) => (
                <details
                  key={it.q}
                  open={open === i}
                  onToggle={(e) => (e.currentTarget as HTMLDetailsElement).open && setOpen(i)}
                  className="group rounded-2xl ghost-border bg-surface-lowest [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex items-center justify-between gap-4 cursor-pointer list-none p-5">
                    <span className="font-headline font-semibold text-primary">{it.q}</span>
                    <ChevronDown className="w-4 h-4 text-primary transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="px-5 pb-5 text-sm text-muted-foreground">{it.a}</p>
                </details>
              ))}
            </div>
          </div>

          <div className="mt-14 rounded-3xl bg-gradient-vault text-primary-foreground p-8 md:p-10 shadow-elevated text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">Still curious?</p>
            <h2 className="mt-2 font-headline font-extrabold text-2xl md:text-3xl">Talk to a human about your setup.</h2>
            <Link to="/contact" className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gold text-primary text-sm font-bold hover:bg-gold/90 transition">
              Contact us <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Faq;