import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, Check, CreditCard, ArrowRight } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { toast } from "@/hooks/use-toast";

const tiers = [
  { id: "personal", name: "Personal", price: "$9/mo", best: false, perks: ["Smart Filter", "100 Power Calls/mo", "Email support"] },
  { id: "pro", name: "Professional", price: "$24/mo", best: true, perks: ["Everything in Personal", "Analytics dashboard", "Priority queues"] },
  { id: "org", name: "Organization", price: "$79/mo", best: false, perks: ["Everything in Pro", "Team vaults", "Audit log"] },
];

const Upgrade = () => {
  const navigate = useNavigate();
  const [pick, setPick] = useState("pro");
  const [card, setCard] = useState({ number: "", name: "", exp: "", cvc: "" });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Upgrade complete", description: `Welcome to the ${tiers.find((t) => t.id === pick)!.name} tier.` });
    setTimeout(() => navigate("/app"), 600);
  };

  return (
    <AppShell subtitle="Membership" title="Upgrade your vault">
      <div className="grid lg:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="grid sm:grid-cols-3 gap-3">
          {tiers.map((t) => (
            <button
              key={t.id}
              onClick={() => setPick(t.id)}
              className={`text-left p-5 rounded-3xl ghost-border transition ${
                pick === t.id ? "bg-primary text-primary-foreground shadow-elevated" : "bg-surface-lowest hover:bg-surface-low"
              } ${t.best ? "ring-2 ring-accent" : ""}`}
            >
              {t.best && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gold text-primary">Most popular</span>}
              <div className="mt-2 flex items-center gap-2">
                <Crown className={`w-4 h-4 ${pick === t.id ? "text-gold" : "text-primary"}`} />
                <p className="font-headline font-bold">{t.name}</p>
              </div>
              <p className={`mt-1 font-headline font-extrabold text-2xl ${pick === t.id ? "" : "text-primary"}`}>{t.price}</p>
              <ul className="mt-3 space-y-1 text-xs">
                {t.perks.map((p) => (
                  <li key={p} className="flex items-center gap-1.5"><Check className="w-3 h-3" /> {p}</li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            <p className="font-headline font-bold text-primary">Payment</p>
          </div>
          <input value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} placeholder="Card number" className="w-full px-4 py-2.5 rounded-xl bg-surface-low ghost-border outline-none text-sm" />
          <input value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} placeholder="Cardholder name" className="w-full px-4 py-2.5 rounded-xl bg-surface-low ghost-border outline-none text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <input value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value })} placeholder="MM/YY" className="px-4 py-2.5 rounded-xl bg-surface-low ghost-border outline-none text-sm" />
            <input value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value })} placeholder="CVC" className="px-4 py-2.5 rounded-xl bg-surface-low ghost-border outline-none text-sm" />
          </div>
          <button type="submit" className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-gradient-primary text-primary-foreground font-semibold shadow-elevated hover:opacity-95 transition">
            Confirm upgrade <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-[11px] text-muted-foreground text-center">Secured by Lovable Cloud · cancel any time.</p>
        </form>
      </div>
    </AppShell>
  );
};

export default Upgrade;