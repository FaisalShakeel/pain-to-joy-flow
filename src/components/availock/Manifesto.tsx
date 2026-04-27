import vault from "@/assets/vault-abstract.jpg";

const Manifesto = () => (
  <section id="manifesto" className="relative py-28 md:py-40 overflow-hidden bg-gradient-vault text-primary-foreground">
    <img src={vault} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-screen" loading="lazy" width={1280} height={896}/>
    <div className="absolute inset-0 bg-gradient-to-b from-primary/40 via-transparent to-primary/80" />

    <div className="relative mx-auto max-w-4xl px-6 md:px-10 text-center">
      <p className="text-[11px] font-bold tracking-[0.25em] uppercase text-accent-soft mb-8">
        The Manifesto
      </p>
      <div className="space-y-8 font-headline italic font-medium text-2xl md:text-4xl leading-tight text-balance">
        <p>"We believe that <span className="not-italic font-extrabold">every interruption</span> is a tax on the soul."</p>
        <p>"We believe your time is a finite resource, guarded by poor protocols."</p>
        <p>"We believe the future of tech isn't more connection, but <span className="not-italic font-extrabold">higher quality filters</span>."</p>
      </div>
      <p className="mt-12 text-sm tracking-[0.25em] uppercase text-primary-foreground/70">
        — Availock, The Architects of Absence
      </p>
    </div>
  </section>
);

export default Manifesto;
