import { User, Briefcase, Building2 } from "lucide-react";
import keyImg from "@/assets/key-velvet.jpg";

const segments = [
  {
    icon: User,
    title: "Individuals",
    body: "Protect your private number. Open windows only for the people who matter — and close them when you log off.",
  },
  {
    icon: Briefcase,
    title: "Professionals",
    body: "Replace the business card. Give clients a vault link instead of a digit, and bill your time the moment a window opens.",
  },
  {
    icon: Building2,
    title: "Companies",
    body: "Issue revocable, audited vault IDs to every employee. Onboard, offboard, and govern access in seconds.",
  },
];

const Audience = () => (
  <section id="audience" className="py-24 md:py-32 bg-surface-lowest relative overflow-hidden">
    <div className="absolute right-0 top-0 w-1/2 h-full hidden lg:block">
      <img src={keyImg} alt="" aria-hidden className="w-full h-full object-cover opacity-20 mix-blend-multiply" loading="lazy" width={1024} height={768}/>
      <div className="absolute inset-0 bg-gradient-to-r from-surface-lowest via-surface-lowest/60 to-transparent" />
    </div>

    <div className="relative mx-auto max-w-7xl px-6 md:px-10">
      <div className="max-w-2xl mb-16">
        <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-accent mb-4">The Luxury of Invisibility</p>
        <h2 className="font-headline font-extrabold text-primary text-4xl md:text-6xl leading-[1.05] text-balance">
          Designed for{" "}
          <span className="italic font-medium text-outline-variant">control.</span>
        </h2>
        <p className="mt-6 text-lg text-muted-foreground max-w-xl">
          Availability is the new status symbol. Whether you're one person or ten thousand, the vault adapts.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {segments.map(({ icon: Icon, title, body }) => (
          <div key={title} className="group p-8 rounded-3xl bg-surface-low ghost-border hover:bg-surface-lowest hover:shadow-glass transition-all duration-500">
            <Icon className="w-7 h-7 text-primary mb-6" strokeWidth={1.5} />
            <h3 className="font-headline font-bold text-2xl text-primary mb-3">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">{body}</p>
            <div className="mt-6 text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all">
              Learn more →
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Audience;
