import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, User, Lock, Phone, ArrowRight, ShieldCheck } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { toast } from "@/hooks/use-toast";

const SignUp = () => {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({
    first: "", last: "", email: "", phone: "", password: "", confirm: "",
  });

  const onChange = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast({ title: "Missing details", description: "Email and password are required.", variant: "destructive" });
      return;
    }
    if (form.password !== form.confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    toast({ title: "Vault created", description: "Let's set up your access preferences." });
    navigate("/onboarding");
  };

  return (
    <AuthShell eyebrow="Create your vault">
      <div className="grid lg:grid-cols-2 gap-10 max-w-6xl mx-auto items-center">
        {/* Left: pitch */}
        <div className="hidden lg:block">
          <h1 className="font-headline font-extrabold text-primary text-5xl leading-[1.05] text-balance">
            See availability first. Connect the right way.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-md">
            Availock puts a respectful access layer in front of every conversation —
            so the right people reach you at the right moment.
          </p>
          <ul className="mt-8 space-y-4 text-sm">
            {[
              "Permissioned access to your time",
              "Encrypted, revocable contact sharing",
              "Smart filters on inbound requests",
            ].map((t) => (
              <li key={t} className="flex items-center gap-3 text-foreground/80">
                <span className="grid place-items-center w-7 h-7 rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Right: form */}
        <div className="glass shadow-elevated ghost-border rounded-3xl p-7 md:p-9">
          <h2 className="font-headline font-extrabold text-primary text-2xl">Create your vault</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Free forever for early supporters. No card required.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <Field icon={User} placeholder="First name" value={form.first} onChange={onChange("first")} />
              <Field icon={User} placeholder="Last name" value={form.last} onChange={onChange("last")} />
            </div>
            <Field icon={Mail} type="email" placeholder="you@email.com" value={form.email} onChange={onChange("email")} />
            <Field icon={Phone} placeholder="+971 50 123 4567" value={form.phone} onChange={onChange("phone")} />
            <Field
              icon={Lock}
              type={show ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={onChange("password")}
              right={
                <button type="button" onClick={() => setShow((s) => !s)} className="text-muted-foreground hover:text-primary">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
            <Field
              icon={Lock}
              type={show ? "text" : "password"}
              placeholder="Confirm password"
              value={form.confirm}
              onChange={onChange("confirm")}
            />

            <button
              type="submit"
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-gradient-primary text-primary-foreground font-semibold shadow-elevated hover:opacity-95 active:scale-[0.98] transition"
            >
              Create vault <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Already have a vault?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
};

import type { LucideIcon } from "lucide-react";
function Field({
  icon: Icon, right, ...props
}: {
  icon: LucideIcon; right?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-lowest ghost-border focus-within:ring-2 focus-within:ring-primary/20">
      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
      <input
        {...props}
        className="flex-1 bg-transparent outline-none text-sm text-primary placeholder:text-muted-foreground"
      />
      {right}
    </label>
  );
}

export default SignUp;