import { ReactNode } from "react";

export const H2 = ({ children }: { children: ReactNode }) => (
  <h2 className="font-headline font-bold text-primary text-2xl md:text-3xl mt-12 mb-4 leading-tight">
    {children}
  </h2>
);

export const H3 = ({ children }: { children: ReactNode }) => (
  <h3 className="font-headline font-semibold text-primary text-lg md:text-xl mt-8 mb-3">
    {children}
  </h3>
);

export const P = ({ children }: { children: ReactNode }) => (
  <p className="text-muted-foreground leading-relaxed">{children}</p>
);

export const UL = ({ children }: { children: ReactNode }) => (
  <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground marker:text-accent">
    {children}
  </ul>
);

export const Callout = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="mt-10 p-6 rounded-2xl bg-surface-low ghost-border">
    <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-accent mb-2">{title}</p>
    <p className="text-primary font-headline font-semibold text-lg leading-snug">{children}</p>
  </div>
);
