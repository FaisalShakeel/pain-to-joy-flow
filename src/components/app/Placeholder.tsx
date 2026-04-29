import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import AppShell from "./AppShell";

interface Props {
  title: string;
  subtitle?: string;
  description: string;
  ctaTo?: string;
  ctaLabel?: string;
}

const Placeholder = ({ title, subtitle, description, ctaTo = "/app", ctaLabel = "Back to dashboard" }: Props) => (
  <AppShell title={title} subtitle={subtitle}>
    <div className="rounded-3xl ghost-border bg-surface-lowest p-10 text-center max-w-2xl mx-auto shadow-ambient">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 grid place-items-center mb-4">
        <Sparkles className="w-6 h-6 text-primary" />
      </div>
      <h2 className="font-headline font-extrabold text-primary text-2xl">Coming together</h2>
      <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">{description}</p>
      <Link
        to={ctaTo}
        className="mt-6 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-elevated hover:opacity-95 transition"
      >
        {ctaLabel}
      </Link>
    </div>
  </AppShell>
);

export default Placeholder;