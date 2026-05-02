import { useState } from "react";
import { CreditCard, Lock, Check, Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatPrice, type Pricing } from "@/components/app/PricingField";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pricing: Pricing;
  title?: string;
  description?: string;
  onSuccess: () => void;
}

type Method = "card" | "stripe";

/**
 * Mock payment dialog for paid sessions.
 * Offers two demo methods: a mock card form and a "Pay with Stripe" redirect-style flow.
 * No real charges are made.
 */
const MockPaymentDialog = ({ open, onOpenChange, pricing, title, description, onSuccess }: Props) => {
  const [method, setMethod] = useState<Method>("card");
  const [card, setCard] = useState({ number: "", name: "", exp: "", cvc: "" });
  const [loading, setLoading] = useState(false);

  const pay = (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Payment successful (demo)",
        description: `${formatPrice(pricing)} charged via ${method === "card" ? "card" : "Stripe"}. No real money moved.`,
      });
      onOpenChange(false);
      onSuccess();
    }, 900);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-600" />
            {title || "Confirm payment"}
          </DialogTitle>
          <DialogDescription>
            {description || "This is a demo — no real charge will be made."}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 ring-1 ring-violet-500/20 p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total</p>
            <p className="font-headline font-extrabold text-2xl text-primary">{formatPrice(pricing)}</p>
            {pricing.note && <p className="text-[11px] text-muted-foreground mt-0.5">{pricing.note}</p>}
          </div>
          <Lock className="w-5 h-5 text-violet-600" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMethod("card")}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition ${
              method === "card"
                ? "bg-primary text-primary-foreground shadow-elevated"
                : "bg-surface-low ghost-border text-muted-foreground hover:text-primary"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" /> Mock card
          </button>
          <button
            type="button"
            onClick={() => setMethod("stripe")}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition ${
              method === "stripe"
                ? "bg-[#635BFF] text-white shadow-elevated"
                : "bg-surface-low ghost-border text-muted-foreground hover:text-primary"
            }`}
          >
            <span className="font-extrabold tracking-tight">stripe</span>
          </button>
        </div>

        {method === "card" ? (
          <form onSubmit={pay} className="space-y-2.5">
            <input
              required
              value={card.number}
              onChange={(e) => setCard({ ...card, number: e.target.value })}
              placeholder="4242 4242 4242 4242"
              maxLength={19}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-low ghost-border outline-none text-sm focus:ring-2 focus:ring-primary/30"
            />
            <input
              required
              value={card.name}
              onChange={(e) => setCard({ ...card, name: e.target.value })}
              placeholder="Cardholder name"
              className="w-full px-3 py-2.5 rounded-xl bg-surface-low ghost-border outline-none text-sm focus:ring-2 focus:ring-primary/30"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                required
                value={card.exp}
                onChange={(e) => setCard({ ...card, exp: e.target.value })}
                placeholder="MM/YY"
                maxLength={5}
                className="px-3 py-2.5 rounded-xl bg-surface-low ghost-border outline-none text-sm focus:ring-2 focus:ring-primary/30"
              />
              <input
                required
                value={card.cvc}
                onChange={(e) => setCard({ ...card, cvc: e.target.value })}
                placeholder="CVC"
                maxLength={4}
                className="px-3 py-2.5 rounded-xl bg-surface-low ghost-border outline-none text-sm focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground font-bold shadow-elevated hover:opacity-95 transition disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {loading ? "Processing…" : `Pay ${formatPrice(pricing)}`}
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl bg-surface-low ghost-border p-4 text-xs text-muted-foreground">
              You'll be redirected to Stripe Checkout to complete this payment securely.
              <span className="block mt-1 text-[10px] uppercase tracking-wider text-violet-600 font-bold">Demo mode</span>
            </div>
            <button
              type="button"
              onClick={() => pay()}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#635BFF] text-white font-bold shadow-elevated hover:opacity-95 transition disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {loading ? "Redirecting…" : `Pay ${formatPrice(pricing)} with Stripe`}
            </button>
          </div>
        )}

        <p className="text-[10px] text-center text-muted-foreground">
          Secured · PCI-compliant flow · Cancel anytime before confirming.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default MockPaymentDialog;