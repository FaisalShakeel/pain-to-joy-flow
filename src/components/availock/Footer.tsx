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
      {/* A-Vault description block */}
      <div className="mb-12 pb-12 border-b border-border/30 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-3">
            About A-Vault
          </p>
          <h3 className="font-headline text-2xl font-extrabold text-foreground leading-tight">
            Your digital valuables deserve a vault.
          </h3>
        </div>
        <div className="md:col-span-2 space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            A-Vault is a secure digital vault designed to protect, organize, and control access to your most important information, files, and personal assets. It gives users one trusted place to store sensitive data while deciding exactly who can access it, when, and under what conditions.
          </p>
          <p className="text-foreground/80">
            <span className="font-semibold text-primary">Core Purpose — </span>
            Turn scattered sensitive information into one protected, permission-based vault.
          </p>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">What it can hold</p>
              <ul className="space-y-1 text-xs">
                <li>· Passwords and credentials</li>
                <li>· IDs and important documents</li>
                <li>· Contracts and records</li>
                <li>· Financial details</li>
                <li>· Emergency information</li>
                <li>· Personal notes and media</li>
                <li>· Business files</li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Key features</p>
              <ul className="space-y-1 text-xs">
                <li>· Secure encrypted storage</li>
                <li>· Permission-based sharing</li>
                <li>· Time-limited access links</li>
                <li>· Emergency access controls</li>
                <li>· Activity logs and alerts</li>
                <li>· Cloud sync across devices</li>
                <li>· Recovery and backup options</li>
              </ul>
            </div>
          </div>
          <p className="text-xs italic">
            Most people keep valuable data scattered across emails, phones, drives, and paper files. A-Vault centralizes and protects it.
          </p>
        </div>
      </div>

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

      {/* Patent Pending Notice */}
      <div className="pt-8 pb-8 border-b border-border/30">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              <Lock className="w-3 h-3" strokeWidth={2.5} />
              Patent Pending
            </span>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-3">
            Patent Pending Notice
          </p>
          <div className="space-y-3 text-xs text-muted-foreground leading-relaxed max-w-4xl">
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
        </div>
      </div>

      <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Availock. The Architects of Absence.</p>
        <p className="tracking-[0.2em] uppercase">Encrypted · Revocable · Yours</p>
      </div>
    </div>
  </footer>
);

export default Footer;
