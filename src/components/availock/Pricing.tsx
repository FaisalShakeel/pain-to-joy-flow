import { Check, X, Sparkles } from "lucide-react";

type Plan = {
  name: string;
  tagline: string;
  sectionLabel: string;
  price: string;
  priceSuffix?: string;
  features: string[];
  excluded?: string[];
  closingNote?: string;
  cta: string;
  ctaStyle: "soft" | "outline" | "primary";
  featured?: boolean;
};

const plans: Plan[] = [
  {
    name: "Basic",
    tagline: "For casual users",
    sectionLabel: "Show availability",
    price: "Free",
    features: [
      "Public profile",
      "Live status (Available / Busy / Focus / Driving)",
      "Shareable QR / link",
      "Basic calendar sync",
      "Limited inbound requests",
      "Basic contact methods",
    ],
    excluded: ["Permission controls", "Automation", "Monetization", "Analytics"],
    closingNote: "Be visible.",
    cta: "Start with Basic",
    ctaStyle: "soft",
  },
  {
    name: "Personal",
    tagline: "For professionals / individuals who value time.",
    sectionLabel: "Control access",
    price: "$120",
    priceSuffix: "/year",
    features: [
      "Everything in Basic",
      "Permission-based contact access",
      "Priority contacts",
      "Smart routing",
      "Auto status sync",
      "Quiet hours",
      "Focus modes",
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
    tagline: "For consultants / experts / service providers. Monetize access.",
    sectionLabel: "",
    price: "$179",
    priceSuffix: "/year",
    features: [
      "Everything in Personal +",
      "Paid sessions / bookings",
      "Time-bound permissions",
      "Priority channels",
      "Charge for direct access",
      "VIP bypass rules",
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
    tagline: "For teams / clinics / agencies / companies. Team communication efficiency.",
    sectionLabel: "Enterprise scalability",
    price: "$239",
    priceSuffix: "/year",
    features: [
      "Everything in Professional +",
      "Multi-user admin dashboard",
      "Team-wide availability map",
      "Shared routing rules",
      "Department / role directories",
      "Admin permissions",
      "SLA / response policies",
      "Internal + external access controls",
      "Usage analytics & reporting",
      "SSO / enterprise security",
    ],
    closingNote: "Control access across your workforce.",
    cta: "Contact Sales",
    ctaStyle: "outline",
  },
];

const Pricing = () => (
  <section id="pricing" className="relative py-24 md:py-32 bg-surface-low overflow-hidden">
    <div className="absolute inset-0 bg-gradient-mist opacity-60 pointer-events-none" />
    <div className="relative mx-auto max-w-7xl px-6 md:px-10">
      {/* Early backer banner */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 ghost-border text-[11px] font-bold tracking-[0.18em] uppercase text-accent">
          <Sparkles className="w-3.5 h-3.5" />
          Kickstarter early backers lock in advantage pricing
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
          Choose the level of privacy and control that matches your professional
          workflow. From individuals to global enterprises.
        </p>
        <p className="mt-4 text-xs md:text-sm text-muted-foreground italic max-w-xl mx-auto">
          These are the regular post-launch prices. Early backers on Kickstarter
          receive permanent advantage pricing on every tier.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-14 items-stretch">
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
              <h3
                className={`font-headline font-extrabold text-xl ${
                  plan.featured ? "text-primary-foreground" : "text-primary"
                }`}
              >
                {plan.name}
              </h3>
              <p
                className={`text-xs mt-1 leading-snug ${
                  plan.featured ? "text-primary-foreground/75" : "text-muted-foreground"
                }`}
              >
                {plan.tagline}
              </p>
            </div>

            {plan.sectionLabel && (
              <p
                className={`text-[10px] font-bold tracking-[0.18em] uppercase mb-3 ${
                  plan.featured ? "text-primary-foreground/60" : "text-muted-foreground"
                }`}
              >
                {plan.sectionLabel}
              </p>
            )}

            <div className="mb-6 flex items-baseline gap-1">
              <span
                className={`font-headline font-extrabold text-4xl md:text-5xl ${
                  plan.featured ? "text-primary-foreground" : "text-primary"
                }`}
              >
                {plan.price}
              </span>
              {plan.priceSuffix && (
                <span
                  className={`text-sm ${
                    plan.featured ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  {plan.priceSuffix}
                </span>
              )}
            </div>

            <ul className="space-y-2.5 mb-6">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <Check
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      plan.featured ? "text-accent-soft" : "text-accent"
                    }`}
                    strokeWidth={2.5}
                  />
                  <span
                    className={
                      plan.featured ? "text-primary-foreground/90" : "text-foreground/85"
                    }
                  >
                    {f}
                  </span>
                </li>
              ))}
            </ul>

            {plan.excluded && plan.excluded.length > 0 && (
              <div
                className={`pt-5 mt-auto border-t ${
                  plan.featured ? "border-primary-foreground/15" : "border-border/40"
                }`}
              >
                <p
                  className={`text-[10px] font-bold tracking-[0.18em] uppercase mb-3 ${
                    plan.featured ? "text-primary-foreground/50" : "text-muted-foreground"
                  }`}
                >
                  No
                </p>
                <ul className="space-y-2">
                  {plan.excluded.map((e) => (
                    <li
                      key={e}
                      className="flex items-start gap-2.5 text-sm line-through text-muted-foreground/70"
                    >
                      <X className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-60" />
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {plan.closingNote && (
              <p
                className={`mt-5 text-sm italic font-medium text-center ${
                  plan.featured ? "text-primary-foreground" : "text-primary"
                }`}
              >
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

export default Pricing;