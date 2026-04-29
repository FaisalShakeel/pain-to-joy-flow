import { Lock, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import logoIcon from "@/assets/availock-icon.png";

type FooterLink = { label: string; href: string; external?: boolean };

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "The Vault", href: "/#vault" },
      { label: "Protocols", href: "/#protocol" },
      { label: "How it works", href: "/#how" },
      { label: "Pricing", href: "/pricing" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Manifesto", href: "/#manifesto" },
      { label: "Contact", href: "/contact" },
      { label: "Explainer video", href: "/#video" },
      { label: "Log in", href: "/login" },
      { label: "Sign up", href: "/signup" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Use", href: "/terms" },
      { label: "Encryption & Security", href: "/encryption" },
      { label: "Patent Pending", href: "/patent-pending" },
    ],
  },
];

const Footer = () => (
  <footer className="bg-surface-low pt-16 pb-10">
    <div className="mx-auto max-w-7xl px-6 md:px-10">
      <div className="grid md:grid-cols-4 gap-10 pb-12 border-b border-border/30">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <img
              src={logoIcon}
              alt="Availock logo"
              loading="lazy"
              className="h-14 w-auto object-contain"
            />
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

      {/* Patent Pending Notice — collapsible */}
      <div className="pt-8 pb-8 border-b border-border/30">
        <details className="group rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex items-center justify-between gap-4 cursor-pointer list-none">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                <Lock className="w-3 h-3" strokeWidth={2.5} />
                Patent Pending
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                Patent Pending Notice
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-primary transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-5 space-y-3 text-xs text-muted-foreground leading-relaxed max-w-4xl">
            <p>
              Certain products, systems, methods, features, designs, and technologies related to Availock may be protected by one or more pending patent applications in applicable jurisdictions.
            </p>
            <p>
              This website and the Availock platform may contain inventions, processes, user flows, communication-control methods, availability-access systems, software implementations, and related intellectual property that are the subject of pending patent filings.
            </p>
            <p>
              Unauthorized copying, imitation, reverse engineering, commercial exploitation, or misappropriation of proprietary concepts, methods, or technology may violate intellectual property laws and other applicable rights.
            </p>
            <p className="text-foreground/80 pt-2">
              <span className="font-semibold text-primary">Patent Pending</span> — Owned and/or operated by{" "}
              <span className="font-semibold">ANGILL TECHNOLOGIESS FZE LLC</span>, registered in the United Arab Emirates.
            </p>
            <p>
              For licensing, partnership, or intellectual property inquiries, please contact:{" "}
              <a href="mailto:info@angill.com" className="text-primary font-semibold hover:underline">
                info@angill.com
              </a>
            </p>
          </div>
        </details>
      </div>

      <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Availock. The Architects of Absence.</p>
        <p className="tracking-[0.2em] uppercase">Encrypted · Revocable · Yours</p>
      </div>
    </div>
  </footer>
);

export default Footer;
