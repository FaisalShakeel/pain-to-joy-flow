import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import logoFull from "@/assets/availock-logo.svg";

interface Props {
  children: ReactNode;
  eyebrow?: string;
}

const AuthShell = ({ children, eyebrow }: Props) => (
  <div className="min-h-screen relative overflow-hidden bg-background text-foreground">
    {/* atmospheric orbs */}
    <div className="pointer-events-none absolute -top-40 -left-40 w-[420px] h-[420px] rounded-full bg-accent-soft/30 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full bg-primary/20 blur-3xl" />
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-mist" />

    <header className="relative z-10 px-6 md:px-10 py-6 flex items-center justify-between max-w-6xl mx-auto">
      <Link to="/" className="flex items-center" aria-label="Availock home">
        <img src={logoFull} alt="Availock" className="h-9 w-auto object-contain" />
      </Link>
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to site
      </Link>
    </header>

    <main className="relative z-10 px-6 md:px-10 pb-16">
      {eyebrow && (
        <p className="text-center text-[11px] font-bold tracking-[0.2em] uppercase text-accent mb-6">
          {eyebrow}
        </p>
      )}
      {children}
    </main>
  </div>
);

export default AuthShell;