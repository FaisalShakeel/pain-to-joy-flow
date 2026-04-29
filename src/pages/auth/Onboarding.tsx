import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Search, ArrowRight } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { setRole, type Role } from "@/lib/role";
import { toast } from "@/hooks/use-toast";

const Onboarding = () => {
  const navigate = useNavigate();
  const [pick, setPick] = useState<Role | null>(null);

  const submit = () => {
    if (!pick) return;
    setRole(pick);
    toast({
      title: pick === "provider" ? "Welcome, Provider" : "Welcome, Seeker",
      description: pick === "provider"
        ? "Your control center is ready."
        : "Let's find the people you want to reach.",
    });
    navigate("/app");
  };

  return (
    <AuthShell eyebrow="Set up your vault">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="font-headline font-extrabold text-primary text-4xl md:text-5xl leading-[1.05] text-balance">
          How do you want to use Availock?
        </h1>
        <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
          You can switch any time from settings.
        </p>

        <div className="mt-10 grid md:grid-cols-2 gap-4">
          <Card
            id="provider"
            picked={pick === "provider"}
            onPick={() => setPick("provider")}
            icon={<ShieldCheck className="w-5 h-5" />}
            title="I'm a Provider"
            blurb="People reach out to me. I want to control who, when, and how."
            bullets={["Set availability windows", "Approve or auto-route requests", "Track time saved"]}
          />
          <Card
            id="seeker"
            picked={pick === "seeker"}
            onPick={() => setPick("seeker")}
            icon={<Search className="w-5 h-5" />}
            title="I'm a Seeker"
            blurb="I want to reach the right people at the right moment, respectfully."
            bullets={["See live availability", "Send context-rich requests", "Schedule when it suits both"]}
          />
        </div>

        <button
          onClick={submit}
          disabled={!pick}
          className="mt-10 inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-gradient-primary text-primary-foreground font-semibold shadow-elevated hover:opacity-95 active:scale-[0.98] transition disabled:opacity-50"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </AuthShell>
  );
};

function Card({
  id, picked, onPick, icon, title, blurb, bullets,
}: {
  id: string; picked: boolean; onPick: () => void;
  icon: React.ReactNode; title: string; blurb: string; bullets: string[];
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={picked}
      data-id={id}
      className={`text-left rounded-3xl p-6 md:p-8 ghost-border bg-surface-lowest transition-all ${
        picked ? "ring-2 ring-primary shadow-elevated -translate-y-0.5" : "hover:bg-surface-low"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="grid place-items-center w-10 h-10 rounded-xl bg-primary/10 text-primary">{icon}</span>
        <h3 className="font-headline font-bold text-primary text-xl">{title}</h3>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{blurb}</p>
      <ul className="mt-5 space-y-1.5 text-sm text-foreground/80">
        {bullets.map((b) => (
          <li key={b} className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" /> {b}
          </li>
        ))}
      </ul>
    </button>
  );
}

export default Onboarding;