import { Sparkles, DollarSign, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

export type Currency = "USD" | "EUR" | "GBP" | "AED" | "PKR" | "INR";

export interface Pricing {
  mode: "free" | "paid";
  amount?: number;
  currency?: Currency;
  note?: string;
}

export const defaultPricing: Pricing = { mode: "free" };

export const currencySymbol = (c?: Currency) => {
  switch (c) {
    case "EUR": return "€";
    case "GBP": return "£";
    case "AED": return "AED";
    case "PKR": return "Rs";
    case "INR": return "₹";
    case "USD":
    default: return "$";
  }
};

export const formatPrice = (p?: Pricing) => {
  if (!p || p.mode === "free") return "Free";
  const sym = currencySymbol(p.currency);
  const amt = p.amount ?? 0;
  return `${sym}${amt}`;
};

interface Props {
  value: Pricing;
  onChange: (p: Pricing) => void;
  className?: string;
  /** Compact mode reduces vertical padding for use inside dense editors */
  compact?: boolean;
}

/**
 * Pricing toggle (Free default / Paid).
 * - Default: Free (no extra fields).
 * - Paid: amount + currency, optional short note.
 */
const PricingField = ({ value, onChange, className, compact }: Props) => {
  const set = (next: Partial<Pricing>) => onChange({ ...value, ...next });

  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => onChange({ mode: "free" })}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-xl text-[11px] font-bold transition",
            compact ? "py-2" : "py-2.5",
            value.mode === "free"
              ? "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/40"
              : "bg-surface-low text-muted-foreground hover:text-primary",
          )}
          aria-pressed={value.mode === "free"}
        >
          <Tag className="w-3.5 h-3.5" /> Free
          <span className="text-[9px] font-bold opacity-60 ml-0.5">(default)</span>
        </button>
        <button
          type="button"
          onClick={() =>
            set({
              mode: "paid",
              amount: value.amount ?? 10,
              currency: value.currency ?? "USD",
            })
          }
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-xl text-[11px] font-bold transition",
            compact ? "py-2" : "py-2.5",
            value.mode === "paid"
              ? "bg-violet-500/15 text-violet-700 ring-1 ring-violet-500/40"
              : "bg-surface-low text-muted-foreground hover:text-primary",
          )}
          aria-pressed={value.mode === "paid"}
        >
          <Sparkles className="w-3.5 h-3.5" /> Paid
        </button>
      </div>

      {value.mode === "paid" && (
        <div className="rounded-xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 p-3 ghost-border space-y-2">
          <div className="grid grid-cols-[1fr_110px] gap-2">
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Price
              </span>
              <div className="mt-1 relative">
                <DollarSign className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={value.amount ?? 0}
                  onChange={(e) => set({ amount: Math.max(0, +e.target.value) })}
                  className="w-full pl-7 pr-2 py-1.5 rounded-lg bg-background ghost-border text-sm font-bold text-primary outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Currency
              </span>
              <select
                value={value.currency ?? "USD"}
                onChange={(e) => set({ currency: e.target.value as Currency })}
                className="mt-1 w-full px-2 py-1.5 rounded-lg bg-background ghost-border text-sm font-bold text-primary outline-none"
              >
                {(["USD", "EUR", "GBP", "AED", "PKR", "INR"] as Currency[]).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Short note (optional)
            </span>
            <input
              type="text"
              maxLength={80}
              placeholder="e.g. Includes consultation & recording"
              value={value.note ?? ""}
              onChange={(e) => set({ note: e.target.value })}
              className="mt-1 w-full px-2 py-1.5 rounded-lg bg-background ghost-border text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>
          <p className="text-[10px] text-muted-foreground/80 leading-snug">
            Price is shown clearly to seekers before they confirm. No hidden fees.
          </p>
        </div>
      )}
    </div>
  );
};

/** Visual price tag for cards / lists. */
export const PriceTag = ({
  pricing,
  className,
}: {
  pricing?: Pricing;
  className?: string;
}) => {
  const isFree = !pricing || pricing.mode === "free";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold",
        isFree
          ? "bg-emerald-500/15 text-emerald-700"
          : "bg-violet-500/15 text-violet-700 ring-1 ring-violet-500/30",
        className,
      )}
      title={pricing?.note}
    >
      {isFree ? <Tag className="w-2.5 h-2.5" /> : <Sparkles className="w-2.5 h-2.5" />}
      {formatPrice(pricing)}
    </span>
  );
};

export default PricingField;