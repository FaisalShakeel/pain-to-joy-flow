import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { toast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    toast({ title: "Password updated", description: "You can sign in with your new password." });
    setTimeout(() => navigate("/login"), 700);
  };

  return (
    <AuthShell eyebrow="New password">
      <div className="max-w-md mx-auto">
        <div className="glass shadow-elevated ghost-border rounded-3xl p-7 md:p-9">
          <h1 className="font-headline font-extrabold text-primary text-3xl text-center">Set a new password</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Your old password will stop working immediately.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-3">
            <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-lowest ghost-border focus-within:ring-2 focus-within:ring-primary/20">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                className="flex-1 bg-transparent outline-none text-sm text-primary placeholder:text-muted-foreground"
              />
              <button type="button" onClick={() => setShow((s) => !s)} className="text-muted-foreground hover:text-primary">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </label>
            <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-lowest ghost-border focus-within:ring-2 focus-within:ring-primary/20">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <input
                type={show ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm new password"
                className="flex-1 bg-transparent outline-none text-sm text-primary placeholder:text-muted-foreground"
              />
            </label>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-gradient-primary text-primary-foreground font-semibold shadow-elevated hover:opacity-95 active:scale-[0.98] transition"
            >
              Update password <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </AuthShell>
  );
};

export default ResetPassword;