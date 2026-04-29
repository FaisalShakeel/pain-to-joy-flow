import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { CreditCard, LogOut, Pencil, ShieldCheck, ArrowRight, Crown, Radio, Clock, CalendarDays, Globe2, MapPin, Building2 } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import Avatar from "@/components/app/Avatar";
import { me, transactions, myOwnerProfile } from "@/lib/mockData";
import { useRole, setRole } from "@/lib/role";
import { toast } from "@/hooks/use-toast";

const availabilityPresets = [
  "Available now",
  "Available after 2:00 PM",
  "In a meeting — leave a message",
  "Deep focus — async only",
  "Office hours Tue & Thu, 2–4 PM",
  "Travelling — limited windows",
  "Free after 5:00 PM today",
  "Out of office — back Monday",
];

const AccountSettings = () => {
  const [role] = useRole();
  const navigate = useNavigate();
  // Local mirror of the live status so the dropdown updates instantly.
  const [status, setStatus] = useState<string>(myOwnerProfile.availabilityContext);

  const updateStatus = (v: string) => {
    const next = v.slice(0, 80);
    setStatus(next);
    // Persist to the mock profile so other views (contacts, view profile) reflect it.
    myOwnerProfile.availabilityContext = next;
  };

  const isPreset = availabilityPresets.includes(status);

  return (
    <AppShell subtitle="Account" title="Settings">
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Profile */}
          <div className="rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient flex items-center gap-4">
            <Avatar initials={me.initials} size="xl" />
            <div className="flex-1 min-w-0">
              <p className="font-headline font-bold text-primary">{me.name}</p>
              <p className="text-xs text-muted-foreground truncate">{me.email}</p>
              <p className="text-xs text-muted-foreground">{me.phone}</p>
            </div>
            <Link to="/app/settings/edit" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full ghost-border bg-surface-low text-sm font-semibold text-primary hover:bg-surface transition">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Link>
          </div>

          {/* Current availability context */}
          <div className="rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent inline-flex items-center gap-1.5">
                  <Radio className="w-3 h-3" /> Availability context
                </p>
                <p className="mt-2 font-headline font-semibold text-primary leading-snug">
                  {status || <span className="text-muted-foreground italic">No status set</span>}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Visible to {myOwnerProfile.visibility.availabilityContext} · Typical reply {myOwnerProfile.responseTime}
                </p>
              </div>
            </div>

            {/* Quick status — preset dropdown + custom line, right under the status */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
              <input
                value={status}
                onChange={(e) => updateStatus(e.target.value)}
                placeholder="Write a custom line… e.g. Free after 6 PM"
                maxLength={80}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-low ghost-border outline-none text-sm focus:ring-2 focus:ring-primary/20"
              />
              <select
                value={isPreset ? status : ""}
                onChange={(e) => e.target.value && updateStatus(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-surface-low ghost-border outline-none text-sm focus:ring-2 focus:ring-primary/20"
                aria-label="Choose preset status"
              >
                <option value="">Pick preset…</option>
                {availabilityPresets.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">
                Updates instantly on your profile and contact card.
              </p>
              <p className="text-[10px] text-muted-foreground">{status.length}/80</p>
            </div>
          </div>

          {/* Operations Center */}
          <div className="rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Operations Center</p>
                <p className="text-xs text-muted-foreground mt-1">Working schedule, time zone and base — shown on your profile.</p>
              </div>
              <Link
                to="/app/settings/edit"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ghost-border bg-surface-low text-xs font-semibold text-primary hover:bg-surface transition shrink-0"
              >
                <Pencil className="w-3 h-3" /> Update
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              <OpsRow icon={Clock} label="Office hours" value={myOwnerProfile.operationHours} visibility={myOwnerProfile.visibility.operationHours} />
              <OpsRow icon={Globe2} label="Time zone" value={myOwnerProfile.timeZone} visibility={myOwnerProfile.visibility.timeZone} />
              <OpsRow icon={CalendarDays} label="Working days" value={myOwnerProfile.operationDays} sub={myOwnerProfile.operationDaysSub} visibility={myOwnerProfile.visibility.operationDays} />
              <OpsRow icon={MapPin} label="Office location" value={myOwnerProfile.location} visibility={myOwnerProfile.visibility.location} />
              <OpsRow icon={Building2} label="Headquarters" value={myOwnerProfile.headquarters} sub={myOwnerProfile.headquartersSub} visibility={myOwnerProfile.visibility.headquarters} />
            </div>
          </div>

          {/* Role switch */}
          <div className="rounded-3xl bg-surface-lowest ghost-border p-6 shadow-ambient">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Mode</p>
            <h3 className="mt-1 font-headline font-bold text-primary">Use Availock as a {role === "provider" ? "Provider" : "Seeker"}</h3>
            <div className="mt-4 inline-flex p-1 rounded-full bg-surface-low">
              <button
                onClick={() => { setRole("seeker"); toast({ title: "Switched to Seeker" }); }}
                className={`px-4 py-1.5 text-xs font-semibold rounded-full ${role === "seeker" ? "bg-primary text-primary-foreground shadow-glass" : "text-muted-foreground"}`}
              >Seeker</button>
              <button
                onClick={() => { setRole("provider"); toast({ title: "Switched to Provider" }); }}
                className={`px-4 py-1.5 text-xs font-semibold rounded-full ${role === "provider" ? "bg-primary text-primary-foreground shadow-glass" : "text-muted-foreground"}`}
              >Provider</button>
            </div>
          </div>

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