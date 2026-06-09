import { useState } from "react";
import { Check, X, Sparkles } from "lucide-react";

type BillingMode = "monthly" | "annual" | "kickstarter";

type Prices = { monthly: number | null; annual: number | null; kickstarter: number | null };

type Plan = {
  name: string;
  tagline: string;
  sectionLabel: string;
  prices: Prices;
  freeLabel?: string;
  features: string[];
  excluded?: string[];
  closingNote?: string;
  cta: string;
  ctaStyle: "soft" | "outline" | "primary";
  featured?: boolean;
};

const plans: Plan[] = [
  {
    name: "Standard - Visibility",
    tagline: "Let people know when I'm reachable.",
    sectionLabel: "Show availability",
    prices: { monthly: null, annual: null, kickstarter: null },
    freeLabel: "Free",
    features: [
      "Public profile & live status",
      "Shareable QR / link",
      "Basic calendar sync",
      "Quick Sync access",
      "Messaging access",
      "Limited inbound requests",
    ],
    excluded: ["Direct Call Sync", "Ping feature", "Priority access controls", "Analytics"],
    closingNote: "Be visible. Stay protected.",
    cta: "Start with Basic",
    ctaStyle: "soft",
  },
  {
    name: "Personal - Protection",
    tagline: "Control who gets access to me.",
    sectionLabel: "Control access",
    prices: { monthly: 12, annual: 130, kickstarter: 91 },
    features: [
      "Everything in Basic",
      "Direct Call Sync",
      "Ping feature",
      "Permission-based contact access",
      "Priority contacts & smart routing",
      "Quiet hours & focus modes",
      "Custom profile branding",
      "Unlimited requests",
    ],
    excluded: ["Paid bookings", "Revenue tools", "Team controls"],
    closingNote: "Protect your attention.",
    cta: "Upgrade to Personal",
    ctaStyle: "soft",
  },
  {
    name: "Professional",
    tagline: "For consultants and experts who monetize access.",
    sectionLabel: "",
    prices: { monthly: 20, annual: 199, kickstarter: 139 },
    features: [
      "Everything in Personal",
      "Paid sessions / bookings",
      "Time-bound permissions",
      "Priority channels & VIP bypass",
      "Advanced scheduling",
      "Revenue analytics",
      "CRM integrations",
      "Custom intake forms",
    ],
    closingNote: "Turn availability into income.",
    cta: "Upgrade to Pro",
    ctaStyle: "primary",
    featured: true,
  },
  {
    name: "Organization",
    tagline: "For teams, clinics, agencies — coordinated communication.",
    sectionLabel: "Team coordination",
    prices: { monthly: 28, annual: 276, kickstarter: 193 },
    features: [
      "Everything in Professional",
      "Multi-user admin dashboard",
      "Team-wide availability map",
      "Shared routing rules",
      "Department directories",
      "SLA / response policies",
      "Usage analytics & reporting",
      "SSO / enterprise security",
    ],
    closingNote: "Control access across your workforce.",
    cta: "Contact Sales",
    ctaStyle: "outline",
  },
];

const suffixFor = (mode: BillingMode) =>
  mode === "monthly" ? "/mo" : "/yr";

const Pricing = () => {
  const [mode, setMode] = useState<BillingMode>("annual");

  const renderPrice = (plan: Plan) => {
    if (plan.prices.monthly === null) {
      return (
        <div className="mb-6 flex items-baseline gap-1">
          <span className={`font-headline font-extrabold text-4xl md:text-5xl ${plan.featured ? "text-primary-foreground" : "text-primary"}`}>
            {plan.freeLabel}
          </span>
        </div>
      );
    }
    const value =
      mode === "monthly" ? plan.prices.monthly :
      mode === "annual" ? plan.prices.annual :
      plan.prices.kickstarter;
    const standard = plan.prices.annual;
    return (
      <div className="mb-6">
        <div className="flex items-baseline gap-1.5">
          <span className={`font-headline font-extrabold text-4xl md:text-5xl ${plan.featured ? "text-primary-foreground" : "text-primary"}`}>
            ${value}
          </span>
          <span className={`text-sm ${plan.featured ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            {suffixFor(mode)}
          </span>
          {mode === "kickstarter" && standard !== null && (
            <span className={`ml-2 text-xs line-through ${plan.featured ? "text-primary-foreground/55" : "text-muted-foreground/70"}`}>
              ${standard}/yr
            </span>
          )}
        </div>
        {mode === "kickstarter" && (
          <p className={`mt-1.5 text-[11px] font-semibold tracking-wide uppercase ${plan.featured ? "text-accent-soft" : "text-accent"}`}>
            Save 30% as Early Supporter
          </p>
        )}
        {mode === "annual" && (
          <p className={`mt-1.5 text-[11px] font-medium ${plan.featured ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            Billed yearly · save vs monthly
          </p>
        )}
        {mode === "monthly" && (
          <p className={`mt-1.5 text-[11px] font-medium ${plan.featured ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            Flexible monthly billing
          </p>
        )}
      </div>
    );
  };

  return (
    <section id="pricing" className="relative py-24 md:py-32 bg-surface-low overflow-hidden">
      <div className="absolute inset-0 bg-gradient-mist opacity-60 pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-6 md:px-10">
        {/* Early backer banner */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 ghost-border text-[11px] font-bold tracking-[0.18em] uppercase text-accent text-center">
            <Sparkles className="w-3.5 h-3.5" />
            30% Kickstarter Early Supporter Offer
          </div>
        </div>

        <div className="text-center mb-6">
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-accent mb-5">Pricing Architecture</p>
          <h2 className="font-headline font-extrabold text-primary text-4xl md:text-6xl leading-[1.05] text-balance">
            Secure your time,
            <br />
            <span className="text-accent">on your terms.</span>
          </h2>
          <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free with structured access. Upgrade for priority interruption
            and full communication control.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="mt-10 flex justify-center">
          <div role="tablist" aria-label="Billing cycle" className="inline-flex p-1 rounded-full bg-surface-lowest ghost-border shadow-ambient">
            {([
              { id: "monthly", label: "Monthly", sub: "Flexibility" },
              { id: "annual", label: "Annual", sub: "Recommended" },
              { id: "kickstarter", label: "Kickstarter", sub: "Founder access" },
            ] as { id: BillingMode; label: string; sub: string }[]).map((opt) => {
              const active = mode === opt.id;
              return (
                <button
                  key={opt.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setMode(opt.id)}
                  className={`relative px-4 md:px-5 py-2 rounded-full text-[12px] font-semibold transition ${
                    active
                      ? opt.id === "kickstarter"
                        ? "bg-gradient-vault text-primary-foreground shadow-elevated"
                        : opt.id === "annual"
                        ? "bg-primary text-primary-foreground shadow-elevated"
                        : "bg-surface-high text-primary"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {opt.id === "kickstarter" && <Sparkles className="w-3 h-3" />}
                    {opt.label}
                  </span>
                  {opt.id === "annual" && !active && (
                    <span className="absolute -top-2 right-1 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-accent/15 text-accent">
                      Save
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        {mode === "kickstarter" && (
          <p className="mt-4 text-center text-xs text-accent font-semibold tracking-wide">
            Founder Access Pricing · Limited to early supporters
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-10 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-3xl p-7 transition-all duration-500 hover:-translate-y-1 ${
                plan.featured
                  ? "bg-gradient-vault text-primary-foreground shadow-elevated lg:-mt-6 lg:mb-0"
                  : "bg-surface-lowest ghost-border shadow-ambient"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold tracking-[0.18em] uppercase shadow-glass">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-5">
                <h3 className={`font-headline font-extrabold text-xl ${plan.featured ? "text-primary-foreground" : "text-primary"}`}>
                  {plan.name}
                </h3>
                <p className={`text-xs mt-1 leading-snug ${plan.featured ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
                  {plan.tagline}
                </p>
              </div>

              {plan.sectionLabel && (
                <p className={`text-[10px] font-bold tracking-[0.18em] uppercase mb-3 ${plan.featured ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {plan.sectionLabel}
                </p>
              )}

              {renderPrice(plan)}

              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.featured ? "text-accent-soft" : "text-accent"}`} strokeWidth={2.5} />
                    <span className={plan.featured ? "text-primary-foreground/90" : "text-foreground/85"}>{f}</span>
                  </li>
                ))}
              </ul>

              {plan.excluded && plan.excluded.length > 0 && (
                <div className={`pt-5 mt-auto border-t ${plan.featured ? "border-primary-foreground/15" : "border-border/40"}`}>
                  <p className={`text-[10px] font-bold tracking-[0.18em] uppercase mb-3 ${plan.featured ? "text-primary-foreground/50" : "text-muted-foreground"}`}>
                    Reserved for paid plans
                  </p>
                  <ul className="space-y-2">
                    {plan.excluded.map((e) => (
                      <li key={e} className="flex items-start gap-2.5 text-sm text-muted-foreground/80">
                        <X className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-60" />
                        <span>{e}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {plan.closingNote && (
                <p className={`mt-5 text-sm italic font-medium text-center ${plan.featured ? "text-primary-foreground" : "text-primary"}`}>
                  {plan.closingNote}
                </p>
              )}

              <button
                type="button"
                className={`mt-5 w-full py-3 rounded-xl text-sm font-semibold transition active:scale-[0.98] ${
                  plan.ctaStyle === "primary"
                    ? "bg-surface-lowest text-primary hover:opacity-95"
                    : plan.ctaStyle === "outline"
                    ? "border border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    : "bg-surface-high text-primary hover:bg-surface-highest"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-xs text-muted-foreground">
          All plans encrypted by default · Cancel anytime · Prices in USD
        </p>
      </div>
    </section>
  );
};

export default Pricing;
