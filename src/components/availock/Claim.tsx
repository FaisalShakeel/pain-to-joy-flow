import { useState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Claim = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast({ title: "Enter a valid email", description: "We need it to reserve your vault ID.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setEmail("");
      toast({
        title: "You're on the early supporter list",
        description: "We'll email you the moment we go live on Kickstarter — your 40% lifetime discount is reserved.",
      });
    }, 700);
  };

  return (
    <section id="claim" className="py-24 md:py-32 bg-surface-lowest">
      <div className="mx-auto max-w-3xl px-6 md:px-10 text-center">
        <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-accent mb-5">Early Supporter · 40% Off For Life</p>
        <h2 className="font-headline font-extrabold text-primary text-4xl md:text-6xl leading-[1.05] text-balance">
          Back us early. Pay 40% less, forever.
        </h2>
        <p className="mt-6 text-lg text-muted-foreground">
          Leave your email and we'll notify you the instant Availock goes live
          on Kickstarter. Your support helps us validate the mission — and
          locks in a permanent 40% discount on every tier.
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-10 flex flex-col sm:flex-row gap-3 p-2 sm:p-2 bg-surface-low rounded-2xl sm:rounded-full ghost-border max-w-xl mx-auto"
        >
          <div className="flex items-center gap-3 flex-1 px-5 py-3">
            <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="bg-transparent w-full outline-none text-primary placeholder:text-muted-foreground"
              aria-label="Email address"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-gradient-primary text-primary-foreground font-semibold shadow-elevated hover:opacity-95 active:scale-[0.98] transition disabled:opacity-60"
          >
            {loading ? "Reserving…" : "Request Invite"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
        <p className="mt-5 text-xs text-muted-foreground">
          One email when we launch on Kickstarter. No spam. No data sold. Ever.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Already have a vault?{" "}
          <a href="/login" className="font-semibold text-primary hover:underline">Log in</a>
        </p>
      </div>
    </section>
  );
};

export default Claim;
