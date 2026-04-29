import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Fingerprint } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Enter your credentials", variant: "destructive" });
      return;
    }
    toast({ title: "Welcome back", description: "Vault unlocked." });
    navigate("/app");
  };

  return (
    <AuthShell eyebrow="Welcome back">
      <div className="max-w-md mx-auto">
        <div className="glass shadow-elevated ghost-border rounded-3xl p-7 md:p-9">
          <h1 className="font-headline font-extrabold text-primary text-3xl text-center">
            Welcome back
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Step back into your vault.
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
            <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-lowest ghost-border focus-within:ring-2 focus-within:ring-primary/20">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="flex-1 bg-transparent outline-none text-sm text-primary placeholder:text-muted-foreground"
              />
              <button type="button" onClick={() => setShow((s) => !s)} className="text-muted-foreground hover:text-primary">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </label>

            <div className="flex items-center justify-between text-xs">
              <label className="inline-flex items-center gap-2 text-muted-foreground">
                <input type="checkbox" className="accent-primary" /> Remember device
              </label>
              <Link to="/forgot-password" className="font-semibold text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-gradient-primary text-primary-foreground font-semibold shadow-elevated hover:opacity-95 active:scale-[0.98] transition"
            >
              Unlock vault <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <span className="flex-1 h-px bg-border" /> or continue with <span className="flex-1 h-px bg-border" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <SocialButton onClick={() => toast({ title: "Coming soon", description: "Google sign-in is rolling out next." })}>
              <GoogleIcon /> Google
            </SocialButton>
            <SocialButton onClick={() => toast({ title: "Coming soon", description: "Biometric unlock coming with mobile app." })}>
              <Fingerprint className="w-4 h-4" /> Biometrics
            </SocialButton>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            New to Availock?{" "}
            <Link to="/signup" className="font-semibold text-primary hover:underline">Create now</Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
};

function SocialButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl ghost-border bg-surface-lowest text-sm text-primary font-medium hover:bg-surface-low transition"
    >
      {children}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="w-4 h-4" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.5 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C41.7 35.4 44 30 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}

export default Login;