import { Link, useNavigate } from "react-router-dom";
import { CreditCard, LogOut, Pencil, ShieldCheck, ArrowRight, Crown } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import Avatar from "@/components/app/Avatar";
import BypassSettingsPanel from "@/components/app/BypassSettingsPanel";
import { me, transactions } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";

const AccountSettings = () => {
  const navigate = useNavigate();

  return (
    <AppShell subtitle="Account" title="Settings">
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Profile */}
          <div className="rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient flex items-center gap-4">
            <Avatar initials={me.initials} size="xl" />
            <div className="flex-1 min-w-0">
              <p className="font-headline font-bold text-primary">{me.name}</p>
              <p className="text-xs text-muted-foreground truncate">Availock Technologies</p>
              <p className="text-xs text-muted-foreground">Director of Strategic Operations</p>
            </div>
            <Link to="/app/settings/edit" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full ghost-border bg-surface-low text-sm font-semibold text-primary hover:bg-surface transition">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Link>
          </div>


          {/* Priority Bypass settings */}
          <BypassSettingsPanel />

          {/* Payment */}
          <div className="rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-bold text-primary">Payment method</h3>
              <Link to="/app/upgrade" className="text-xs font-semibold text-accent hover:underline">Manage</Link>
            </div>
            <div className="mt-4 flex items-center gap-3 p-4 rounded-2xl ghost-border bg-surface-low">
              <span className="grid place-items-center w-10 h-10 rounded-xl bg-primary/10 text-primary"><CreditCard className="w-4 h-4" /></span>
              <div>
                <p className="text-sm font-semibold text-primary">Visa · ending 4242</p>
                <p className="text-xs text-muted-foreground">Expires 08/29</p>
              </div>
            </div>
          </div>

          {/* Transactions */}
          <div className="rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient">
            <h3 className="font-headline font-bold text-primary">Transaction history</h3>
            <ul className="mt-4 divide-y divide-border/50 text-sm">
              {transactions.map((t) => (
                <li key={t.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-primary">{t.description}</p>
                    <p className="text-xs text-muted-foreground">{t.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">{t.amount}</p>
                    <p className="text-xs text-emerald-700">{t.status}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="space-y-4">
          <Link to="/app/upgrade" className="block rounded-3xl bg-gradient-vault text-primary-foreground p-6 shadow-elevated hover:opacity-95 transition">
            <Crown className="w-5 h-5 text-gold" />
            <p className="mt-2 font-headline font-bold">Upgrade your vault</p>
            <p className="mt-1 text-sm text-primary-foreground/80">Smart Filter, analytics, Power Calls.</p>
            <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gold">View plans <ArrowRight className="w-3.5 h-3.5" /></span>
          </Link>
          <div className="rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <p className="mt-2 font-headline font-bold text-primary">Security</p>
            <p className="mt-1 text-sm text-muted-foreground">2FA enabled · Last login from Dubai, today.</p>
          </div>
          <button
            onClick={() => { toast({ title: "Logged out" }); navigate("/"); }}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full ghost-border bg-surface-lowest text-sm font-semibold text-destructive hover:bg-destructive/5 transition"
          >
            <LogOut className="w-4 h-4" /> Log out
          </button>
        </aside>
      </div>
    </AppShell>
  );
};

export default AccountSettings;

function OpsRow({
  icon: Icon, label, value, sub, visibility,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  visibility: "public" | "approved" | "hidden";
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-2xl ghost-border bg-surface-low">
      <span className="grid place-items-center w-8 h-8 rounded-lg bg-primary/10 text-primary shrink-0">
        <Icon className="w-3.5 h-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-primary truncate">{value || <span className="text-muted-foreground italic font-normal">Not set</span>}</p>
        {sub && <p className="text-[11px] text-muted-foreground truncate">{sub}</p>}
        <p className="mt-0.5 text-[10px] text-muted-foreground capitalize">Visible to {visibility}</p>
      </div>
    </div>
  );
}