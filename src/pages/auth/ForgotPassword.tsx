import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowRight, ArrowLeft } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { toast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Check your email", description: "If that address has a vault, we sent a reset link." });
    setTimeout(() => navigate("/login"), 700);
  };

  return (
    <AuthShell eyebrow="Reset password">
      <div className="max-w-md mx-auto">
        <div className="glass shadow-elevated ghost-border rounded-3xl p-7 md:p-9">
          <h1 className="font-headline font-extrabold text-primary text-3xl text-center">Reset password</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Enter your email and we'll send a secure link to set a new password.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-3">
            <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-lowest ghost-border focus-within:ring-2 focus-within:ring-primary/20">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="flex-1 bg-transparent outline-none text-sm text-primary placeholder:text-muted-foreground"
              />
            </label>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-gradient-primary text-primary-foreground font-semibold shadow-elevated hover:opacity-95 active:scale-[0.98] transition"
            >
              Send reset link <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <Link to="/login" className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition">
            <ArrowLeft className="w-3 h-3" /> Back to login
          </Link>
        </div>
      </div>
    </AuthShell>
  );
};

export default ForgotPassword;