import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Lock, ArrowLeft } from "lucide-react";
import Footer from "@/components/availock/Footer";
import logoMark from "@/assets/availock-mark.png";

interface Props {
  eyebrow: string;
  title: string;
  lastUpdated?: string;
  children: ReactNode;
}

const LegalLayout = ({ eyebrow, title, lastUpdated, children }: Props) => (
  <div className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border/40 bg-surface-lowest/80 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto max-w-5xl px-6 md:px-10 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <img
            src={logoMark}
            alt="Availock logo"
            width={36}
            height={36}
            className="w-9 h-9 object-contain"
          />
          <span className="font-headline font-extrabold text-xl tracking-tight text-primary">
            Availock
          </span>
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back home
        </Link>
      </div>
    </header>

    <main className="relative">
      <div className="absolute inset-x-0 top-0 h-[420px] bg-gradient-mist pointer-events-none" />
      <div className="relative mx-auto max-w-3xl px-6 md:px-10 pt-16 md:pt-24 pb-16">
        <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-accent mb-4">
          {eyebrow}
        </p>
        <h1 className="font-headline font-extrabold text-primary text-4xl md:text-6xl leading-[1.05] text-balance">
          {title}
        </h1>
        {lastUpdated && (
          <p className="mt-4 text-sm text-muted-foreground">Last Updated: {lastUpdated}</p>
        )}

        <article className="prose-availock mt-12 space-y-5 text-[15px] leading-relaxed text-foreground/90">
          {children}
        </article>
      </div>
    </main>

    <Footer />
  </div>
);

export default LegalLayout;
