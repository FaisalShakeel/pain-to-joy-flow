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
        title: "You're on the vault list",
        description: "We'll send your encrypted invite within 24 hours.",
      });
    }, 700);
  };

  return (
    <section id="claim" className="py-24 md:py-32 bg-surface-lowest">
      <div className="mx-auto max-w-3xl px-6 md:px-10 text-center">
        <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-accent mb-5">Early Access</p>
        <h2 className="font-headline font-extrabold text-primary text-4xl md:text-6xl leading-[1.05] text-balance">
          Secure your spot in the vault.
        </h2>
        <p className="mt-6 text-lg text-muted-foreground">
          We're inviting holders in batches. Reserve your Availock ID before
          public release — it stays yours, forever.
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
          No spam. No sale of data. Your address stays inside the vault.
        </p>
      </div>
    </section>
  );
};

export default Claim;
