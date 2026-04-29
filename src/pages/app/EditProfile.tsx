import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, ShieldCheck } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import Avatar from "@/components/app/Avatar";
import { me } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";

const EditProfile = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: me.name, email: me.email, phone: me.phone, title: me.title, org: me.org });
  const [twoFa, setTwoFa] = useState(true);
  const [discoverable, setDiscoverable] = useState(false);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Profile saved" });
    navigate("/app/settings");
  };

  return (
    <AppShell subtitle="Account" title="Edit profile">
      <Link to="/app/settings" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to settings
      </Link>
      <form onSubmit={save} className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Avatar</p>
            <div className="mt-3 flex items-center gap-4">
              <Avatar initials={me.initials} size="xl" />
              <input type="file" accept="image/*" className="text-sm text-muted-foreground" />
            </div>
          </div>

          <div className="rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Account details</p>
            {([
              ["name", "Full name"],
              ["email", "Email"],
              ["phone", "Phone"],
              ["title", "Title"],
              ["org", "Organization"],
            ] as const).map(([k, label]) => (
              <label key={k} className="block">
                <span className="text-xs font-semibold text-muted-foreground">{label}</span>
                <input
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl bg-surface-low ghost-border outline-none text-sm focus:ring-2 focus:ring-primary/20"
                />
              </label>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <p className="mt-2 font-headline font-bold text-primary">Security access</p>
            <Toggle on={twoFa} onChange={setTwoFa} label="Two-factor authentication" />
            <Toggle on={discoverable} onChange={setDiscoverable} label="Discoverable in search" />
          </div>
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-gradient-primary text-primary-foreground font-semibold shadow-elevated hover:opacity-95 transition"
          >
            <Save className="w-4 h-4" /> Save changes
          </button>
        </aside>
      </form>
    </AppShell>
  );
};

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="mt-3 flex items-center justify-between gap-3">
      <span className="text-sm text-foreground/80">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!on)}
        className={`w-10 h-6 rounded-full transition ${on ? "bg-primary" : "bg-surface-high"}`}
        aria-pressed={on}
      >
        <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}

export default EditProfile;