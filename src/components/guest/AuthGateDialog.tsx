import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Mail, Lock, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const GUEST_AUTH_KEY = "availock_guest_authed";

export const isGuestAuthed = () =>
  typeof window !== "undefined" && localStorage.getItem(GUEST_AUTH_KEY) === "1";

export const setGuestAuthed = () => localStorage.setItem(GUEST_AUTH_KEY, "1");

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What action triggered this gate — used for context in the dialog */
  actionLabel?: string;
  /** Called after successful auth so the host can resume the original action */
  onAuthenticated: () => void;
}

const AuthGateDialog = ({ open, onOpenChange, actionLabel, onAuthenticated }: Props) => {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || (mode === "signup" && !name.trim())) {
      toast({ title: "Missing details", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    // Mock auth — pretend we hit an API
    await new Promise((r) => setTimeout(r, 600));
    setGuestAuthed();
    setSubmitting(false);
    toast({
      title: mode === "signup" ? "Account created" : "Welcome back",
      description: actionLabel ? `Continuing: ${actionLabel}` : "You're signed in.",
    });
    onOpenChange(false);
    // Defer so the dialog has time to close before resuming the action
    setTimeout(() => onAuthenticated(), 120);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader className="text-left">
          <div className="inline-flex items-center gap-1.5 self-start mb-1 px-2.5 py-1 rounded-full bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-[0.18em]">
            <ShieldCheck className="w-3 h-3" />
            Sign in to continue
          </div>
          <DialogTitle className="text-xl font-headline">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </DialogTitle>
          <DialogDescription>
            {actionLabel
              ? `${actionLabel} requires a quick sign-${mode === "signup" ? "up" : "in"}. We'll bring you right back.`
              : `You can browse the profile freely — sign ${mode === "signup" ? "up" : "in"} to interact.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="gate-name">Full name</Label>
              <div className="relative">
                <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="gate-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" className="pl-9" />
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="gate-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="gate-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="pl-9" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gate-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="gate-password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-9" />
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="w-full rounded-full">
            {submitting ? "Please wait…" : mode === "signup" ? "Create account & continue" : "Sign in & continue"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            {mode === "signup" ? "Already have an account?" : "New to Availock?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "login" : "signup")}
              className="font-semibold text-primary hover:underline"
            >
              {mode === "signup" ? "Sign in" : "Create one"}
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AuthGateDialog;