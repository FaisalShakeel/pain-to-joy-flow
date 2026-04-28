import { Star, Gift, Crown, Clock, ListOrdered, Tag } from "lucide-react";

const rewards = [
  {
    label: "Free User Referred",
    value: "+2 months",
    desc: "Earn 2 months additional access when your referral completes a verified signup and profile setup.",
  },
  {
    label: "Paid User Referred",
    value: "+6 months",
    desc: "Earn 6 months additional access when your referral activates a qualifying paid plan.",
  },
];

const perks = [
  { icon: Crown, label: "Founding Member Badge" },
  { icon: Gift, label: "Extra Reward Months" },
  { icon: ListOrdered, label: "Queue Priority" },
  { icon: Tag, label: "Locked Early Pricing" },
];

const TimeProtectors = () => (
  <section id="protectors" className="py-24 md:py-32 bg-surface-low relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-mist pointer-events-none opacity-60" />
    <div className="relative mx-auto max-w-6xl px-6 md:px-10">
      <div className="max-w-2xl">
        <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-accent mb-4 inline-flex items-center gap-2">
          <Clock className="w-4 h-4" /> Time Protectors Program
        </p>
        <h2 className="font-headline font-extrabold text-primary text-4xl md:text-6xl leading-[1.05] text-balance">
          Refer people who
          <br />
          <span className="italic font-medium text-outline-variant">value time and attention.</span>
        </h2>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
          Help build a better communication culture. Invite the right people, earn rewards,
          and grow a network that respects your space.
        </p>
      </div>

      <div className="mt-14 grid md:grid-cols-2 gap-6">
        {rewards.map((r) => (
          <div
            key={r.label}
            className="group rounded-3xl bg-surface-lowest ghost-border p-8 shadow-ambient hover:shadow-elevated transition"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
              Referral Reward
            </p>
            <div className="mt-3 flex items-baseline justify-between gap-4">
              <h3 className="font-headline font-bold text-primary text-2xl">{r.label}</h3>
              <span className="font-headline font-extrabold text-primary text-3xl md:text-4xl">
                {r.value}
              </span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-3xl bg-gradient-vault text-primary-foreground p-8 md:p-12 shadow-elevated relative overflow-hidden">
        <div className="grain absolute inset-0" />
        <div className="relative">
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-accent-soft mb-3 inline-flex items-center gap-2">
            <Star className="w-4 h-4" /> Additional Early Supporter Rewards
          </p>
          <h3 className="font-headline font-extrabold text-2xl md:text-4xl leading-tight max-w-xl">
            Eligible participants may also receive:
          </h3>

          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {perks.map((p) => (
              <div
                key={p.label}
                className="rounded-2xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/15 p-5 flex items-center gap-3"
              >
                <span className="grid place-items-center w-10 h-10 rounded-xl bg-primary-foreground/15">
                  <p.icon className="w-5 h-5" />
                </span>
                <span className="font-semibold text-sm">{p.label}</span>
              </div>
            ))}
          </div>

          <p className="mt-10 font-headline italic text-lg md:text-xl text-primary-foreground/90 max-w-2xl">
            "Invite the right people. Grow the right culture. Earn rewards."
          </p>
          <p className="mt-2 text-[11px] font-bold tracking-[0.2em] uppercase text-accent-soft">
            — Community Motto
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default TimeProtectors;