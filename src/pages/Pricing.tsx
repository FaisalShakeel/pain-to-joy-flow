import { Link } from "react-router-dom";
import { Check, Crown, ArrowRight } from "lucide-react";
import Nav from "@/components/availock/Nav";
import Footer from "@/components/availock/Footer";

const tiers = [
  { id: "basic", name: "Basic", price: "$0", per: "forever", blurb: "Get the access layer.", perks: ["Live availability status", "5 access requests/mo", "1 vault link"], cta: "Start free", to: "/signup", best: false },
  { id: "personal", name: "Personal", price: "$9", per: "per month", blurb: "For respectful operators.", perks: ["Unlimited requests", "Smart Filter rules", "100 Power Calls"], cta: "Choose Personal", to: "/app/upgrade", best: false },
  { id: "professional", name: "Professional", price: "$24", per: "per month", blurb: "For full-time builders.", perks: ["Everything in Personal", "Analytics dashboard", "Priority queues"], cta: "Choose Pro", to: "/app/upgrade", best: true },
  { id: "org", name: "Organization", price: "$79", per: "per month", blurb: "Teams of up to 25.", perks: ["Everything in Pro", "Team vaults", "Shared queues", "Audit log"], cta: "Choose Org", to: "/app/upgrade", best: false },
  { id: "ent", name: "Enterprise", price: "Custom", per: "talk to us", blurb: "Compliance-grade security.", perks: ["SSO + SCIM", "Dedicated regions", "Custom DPA", "24/7 support"], cta: "Contact sales", to: "/contact", best: false },
];

const Pricing = () => (
  <div className="min-h-screen bg-background text-foreground">
    <Nav />
    <main className="pt-32 pb-20">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-accent">Pricing</p>
          <h1 className="mt-3 font-headline font-extrabold text-primary text-4xl md:text-6xl leading-[1.05] text-balance">
            Pay for the time you protect.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Free forever for the access layer. Pay when you want filters, analytics and Power Calls.
          </p>
        </div>

        <div className="mt-14 grid lg:grid-cols-5 md:grid-cols-2 gap-4">
          {tiers.map((t) => (
            <div
              key={t.id}
              className={`relative rounded-3xl p-6 ghost-border transition ${
                t.best ? "bg-gradient-vault text-primary-foreground shadow-elevated -translate-y-2" : "bg-surface-lowest shadow-ambient hover:-translate-y-1"
              }`}
            >
              {t.best && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gold text-primary">Most popular</span>}
              <div className="flex items-center gap-2">
                <Crown className={`w-4 h-4 ${t.best ? "text-gold" : "text-primary"}`} />
                <p className="font-headline font-bold">{t.name}</p>
              </div>
              <p className={`mt-3 font-headline font-extrabold text-3xl ${t.best ? "" : "text-primary"}`}>{t.price}</p>
              <p className={`text-xs ${t.best ? "text-primary-foreground/75" : "text-muted-foreground"}`}>{t.per}</p>
              <p className={`mt-3 text-sm ${t.best ? "text-primary-foreground/85" : "text-foreground/80"}`}>{t.blurb}</p>
              <ul className="mt-4 space-y-1.5 text-sm">
                {t.perks.map((p) => (
                  <li key={p} className="flex items-center gap-2"><Check className={`w-3.5 h-3.5 ${t.best ? "text-gold" : "text-accent"}`} /> {p}</li>
                ))}
              </ul>
              <Link
                to={t.to}
                className={`mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition ${
                  t.best ? "bg-gold text-primary hover:bg-gold/90" : "bg-primary text-primary-foreground hover:opacity-95"
                }`}
              >
                {t.cta} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Enterprise grade security</p>
          <h2 className="mt-2 font-headline font-extrabold text-primary text-2xl md:text-3xl">Trust is earned.</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
            Encrypted, revocable access. Region-pinned data. SOC 2 Type II in progress.
          </p>
          <Link to="/contact" className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-full ghost-border bg-surface-lowest text-sm font-semibold text-primary hover:bg-surface-low transition">
            Compare detailed features <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default Pricing;