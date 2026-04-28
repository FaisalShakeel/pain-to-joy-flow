import { Lock } from "lucide-react";
import { Link } from "react-router-dom";

type FooterLink = { label: string; href: string; external?: boolean };

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "The Vault", href: "/#vault" },
      { label: "Protocols", href: "/#protocol" },
      { label: "How it works", href: "/#how" },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Manifesto", href: "/#manifesto" },
      { label: "Contact", href: "/contact" },
      { label: "Explainer video", href: "/#video" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Use", href: "/terms" },
      { label: "Encryption & Security", href: "/encryption" },
    ],
  },
];

const Footer = () => (
  <footer className="bg-surface-low pt-16 pb-10">
    <div className="mx-auto max-w-7xl px-6 md:px-10">
      <div className="grid md:grid-cols-4 gap-10 pb-12 border-b border-border/30">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-primary text-primary-foreground">
              <Lock className="w-4 h-4" strokeWidth={2.5} />
            </span>
            <span className="font-headline font-extrabold text-xl text-primary">Availock</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            The encrypted identity vault. Share availability, not access.
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            Operated by ANGILL TECHNOLOGIESS FZE LLC · UAE
          </p>
        </div>
        {columns.map((c) => (
          <div key={c.title}>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-4">{c.title}</p>
            <ul className="space-y-2.5 text-sm">
              {c.links.map((l) =>
                l.href.startsWith("/#") || l.external ? (
                  <li key={l.label}>
                    <a href={l.href} className="text-muted-foreground hover:text-primary transition-colors">
                      {l.label}
                    </a>
                  </li>
                ) : (
                  <li key={l.label}>
                    <Link to={l.href} className="text-muted-foreground hover:text-primary transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>
        ))}
      </div>
      <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Availock. The Architects of Absence.</p>
        <p className="tracking-[0.2em] uppercase">Encrypted · Revocable · Yours</p>
      </div>
    </div>
  </footer>
);

export default Footer;
