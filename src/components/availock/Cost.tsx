const rows = [
  { label: "Burnt Time", old: "~2 hrs / week lost to mistimed calls & 'quick chats'.", new: "Reclaimed. Multi-window handshakes & meetings." },
  { label: "Cognitive Load", old: "Every contact is a possible interruption.", new: "Silence is default. Attention happens by appointment." },
  { label: "Identity Cost", old: "Number leaks. Forever.", new: "Revocable identity. Encrypted at every entry." },
];

const Cost = () => (
  <section className="py-24 md:py-32 bg-surface-low">
    <div className="mx-auto max-w-6xl px-6 md:px-10">
      <h2 className="font-headline font-extrabold text-primary text-4xl md:text-5xl text-center mb-16 text-balance">
        The Cost of Default Access
      </h2>
      <div className="bg-surface-lowest rounded-3xl shadow-ambient overflow-hidden">
        <div className="grid grid-cols-3 px-6 md:px-10 py-5 border-b border-border/30 text-[10px] md:text-xs font-bold tracking-[0.18em] uppercase text-muted-foreground">
          <div></div>
          <div>Today's reality</div>
          <div>With Availock</div>
        </div>
        {rows.map((r, i) => (
          <div
            key={r.label}
            className={`grid grid-cols-3 px-6 md:px-10 py-7 gap-4 items-start ${
              i !== rows.length - 1 ? "border-b border-border/20" : ""
            }`}
          >
            <div className="font-headline font-bold text-primary text-base md:text-lg">{r.label}</div>
            <div className="text-muted-foreground text-sm md:text-base italic">{r.old}</div>
            <div className="text-primary text-sm md:text-base font-medium">{r.new}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Cost;
