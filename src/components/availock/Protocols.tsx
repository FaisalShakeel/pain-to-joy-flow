import { Ghost, Zap, Clock3 } from "lucide-react";

const items = [
  {
    icon: Ghost,
    title: "Ghost Protocols",
    body: "Your real number stays sealed inside the vault. Recipients see a one-time identity, never your raw contact.",
  },
  {
    icon: Zap,
    title: "Dynamic Entry",
    body: "Access changes based on context: who they are, why they're reaching, and what you've allowed today.",
    featured: true,
  },
  {
    icon: Clock3,
    title: "Timed Access",
    body: "Every connection has an expiry. When the window closes, the door re-locks itself. No leftovers.",
  },
];

const Protocols = () => (
  <section id="vault" className="py-24 md:py-32 bg-surface-lowest">
    <div className="mx-auto max-w-7xl px-6 md:px-10">
      <div className="max-w-2xl mb-16">
        <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-accent mb-4">The Vault</p>
        <h2 className="font-headline font-extrabold text-primary text-4xl md:text-6xl leading-[1.05] text-balance">
          Three protocols.
          <br />
          One quiet architecture.
        </h2>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {items.map(({ icon: Icon, title, body, featured }) => (
          <div
            key={title}
            className={`relative p-8 rounded-3xl transition-all duration-500 hover:-translate-y-1 ${
              featured
                ? "bg-gradient-vault text-primary-foreground shadow-elevated"
                : "bg-surface-low ghost-border hover:bg-surface-high"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-xl grid place-items-center mb-6 ${
                featured ? "bg-primary-foreground/15" : "bg-surface-lowest shadow-ambient"
              }`}
            >
              <Icon className={`w-5 h-5 ${featured ? "text-primary-foreground" : "text-primary"}`} />
            </div>
            <h3 className={`font-headline font-bold text-2xl mb-3 ${featured ? "text-primary-foreground" : "text-primary"}`}>
              {title}
            </h3>
            <p className={`leading-relaxed ${featured ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
              {body}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Protocols;
