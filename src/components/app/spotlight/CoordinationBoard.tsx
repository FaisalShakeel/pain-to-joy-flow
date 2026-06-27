import { useMemo, useState } from "react";
import {
  CalendarDays, Bell, Megaphone, PartyPopper, HelpCircle, Zap, FileText,
  CheckCircle2, Home, Heart, Briefcase, Gem, Star, Users as UsersIcon,
  Layers, Plus, ChevronDown, Paperclip, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

/* ------------------------------------------------------------------ */
/* Coordination Relay Board — Structured group coordination           */
/* (Not a messaging platform. No chat, no threads, no reactions.)     */
/* ------------------------------------------------------------------ */

type GroupId = "family" | "friends" | "office" | "clients" | "projects" | "vip";
type CoordType =
  | "meeting" | "event" | "reminder" | "announcement"
  | "file-share" | "quick-sync" | "availability-request" | "decision-request";
type EngagementMode = "announcement" | "acknowledge" | "response" | "decision";
type CoordUrgency = "red" | "amber" | "orange" | "green";

const GROUPS: { id: GroupId; label: string; icon: typeof Home }[] = [
  { id: "family",   label: "Family",   icon: Home },
  { id: "friends",  label: "Friends",  icon: Heart },
  { id: "office",   label: "Office",   icon: Briefcase },
  { id: "clients",  label: "Clients",  icon: Gem },
  { id: "projects", label: "Projects", icon: UsersIcon },
  { id: "vip",      label: "VIP",      icon: Star },
];

const TYPE_META: Record<CoordType, { label: string; icon: typeof CalendarDays; tone: string }> = {
  "meeting":              { label: "Meeting",         icon: CalendarDays, tone: "bg-primary/10 text-primary" },
  "event":                { label: "Event",           icon: PartyPopper,  tone: "bg-pink-500/15 text-pink-700" },
  "reminder":             { label: "Reminder",        icon: Bell,         tone: "bg-amber-500/15 text-amber-700" },
  "announcement":         { label: "Announcement",    icon: Megaphone,    tone: "bg-sky-500/15 text-sky-700" },
  "file-share":           { label: "File Share",      icon: FileText,     tone: "bg-slate-500/15 text-slate-700" },
  "quick-sync":           { label: "Quick Sync",      icon: Zap,          tone: "bg-amber-500/15 text-amber-700" },
  "availability-request": { label: "Availability",    icon: HelpCircle,   tone: "bg-violet-500/15 text-violet-700" },
  "decision-request":     { label: "Decision",        icon: CheckCircle2, tone: "bg-emerald-500/15 text-emerald-700" },
};

const URGENCY_DOT: Record<CoordUrgency, string> = {
  red:    "bg-rose-500",
  amber:  "bg-amber-500",
  orange: "bg-orange-500",
  green:  "bg-emerald-500",
};

interface CoordItem {
  id: string;
  group: GroupId;
  type: CoordType;
  subject: string;
  when: string;
  status: string;          // e.g. "Joining 8" or "Awaiting Approval"
  pending?: number;        // numeric pending response count for strip
  urgency: CoordUrgency;
  mode: EngagementMode;
}

const SEED: CoordItem[] = [
  { id: "c1", group: "office",   type: "meeting",          subject: "Weekly Team Meeting", when: "Today 5:00 PM",     status: "Joining 8 · Pending 3", pending: 3, urgency: "red",    mode: "response" },
  { id: "c2", group: "family",   type: "event",            subject: "Family Gathering",    when: "Saturday 6:00 PM",  status: "Joining 6 · Pending 1", pending: 1, urgency: "amber",  mode: "response" },
  { id: "c3", group: "clients",  type: "decision-request", subject: "Client ABC – File Review", when: "Tomorrow",     status: "Awaiting Approval",     pending: 1, urgency: "orange", mode: "decision" },
  { id: "c4", group: "projects", type: "reminder",         subject: "Submit weekly recap", when: "Friday EOD",        status: "Acknowledged 4/5",      pending: 1, urgency: "amber",  mode: "acknowledge" },
  { id: "c5", group: "vip",      type: "announcement",     subject: "Q3 office hours open", when: "Next week",        status: "Seen 12",               urgency: "green",  mode: "announcement" },
  { id: "c6", group: "friends",  type: "quick-sync",       subject: "Coffee — anyone in?", when: "Today 3:00 PM",     status: "Joining 2 · Pending 4", pending: 4, urgency: "red",    mode: "response" },
];

const MODE_OPTIONS: { id: EngagementMode; label: string }[] = [
  { id: "announcement", label: "Announcement Only" },
  { id: "acknowledge",  label: "Acknowledgement Required" },
  { id: "response",     label: "Response Required" },
  { id: "decision",     label: "Decision Required" },
];

const TYPE_OPTIONS: { id: CoordType; label: string }[] = [
  { id: "meeting", label: "Meeting" },
  { id: "event", label: "Event" },
  { id: "reminder", label: "Reminder" },
  { id: "announcement", label: "Announcement" },
  { id: "file-share", label: "File Share" },
  { id: "quick-sync", label: "Quick Sync Invite" },
  { id: "decision-request", label: "Decision Request" },
];

const CoordinationBoard = () => {
  const [scope, setScope] = useState<GroupId | "all">("all");
  const [items, setItems] = useState<CoordItem[]>(SEED);
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(
    () => items.filter((i) => scope === "all" || i.group === scope),
    [items, scope],
  );

  // Coordination strip — per group pending summary
  const stripSummary = useMemo(() => {
    return GROUPS.map((g) => {
      const pending = items
        .filter((i) => i.group === g.id)
        .reduce((sum, i) => sum + (i.pending ?? 0), 0);
      const awaiting = items.some((i) => i.group === g.id && i.mode === "decision" && (i.pending ?? 0) > 0);
      const urgency: CoordUrgency =
        pending >= 3 ? "red" : awaiting ? "orange" : pending > 0 ? "amber" : "green";
      return { group: g, pending, awaiting, urgency };
    });
  }, [items]);

  const activeGroup = scope === "all" ? null : GROUPS.find((g) => g.id === scope)!;
  const ActiveIcon = activeGroup?.icon ?? Layers;

  return (
    <div className="p-3 bg-[#F8FAFC] space-y-3">
      {/* Top bar: Group selector (right) + New coordination */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-500">
            Coordination Board
          </p>
          <span className="text-[10px] text-slate-400">· Action required</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md bg-slate-900 text-white text-[11px] font-semibold hover:bg-slate-800"
              >
                <Plus className="w-3 h-3" /> New
              </button>
            </DialogTrigger>
            <CreateCoordinationDialog
              onClose={() => setCreateOpen(false)}
              onCreate={(item) => {
                setItems((xs) => [item, ...xs]);
                setCreateOpen(false);
              }}
              initialGroup={scope === "all" ? "office" : scope}
            />
          </Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-[12px] font-semibold text-slate-700"
              >
                <ActiveIcon className="w-3.5 h-3.5" />
                <span className="truncate max-w-[120px]">
                  {activeGroup?.label ?? "All Groups"}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-slate-500">
                Group Scope
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setScope("all")}>
                <Layers className="w-3.5 h-3.5 mr-2" /> All Groups
              </DropdownMenuItem>
              {GROUPS.map((g) => {
                const I = g.icon;
                return (
                  <DropdownMenuItem key={g.id} onClick={() => setScope(g.id)}>
                    <I className="w-3.5 h-3.5 mr-2" /> {g.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main board + right-side coordination strip */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_180px] gap-3">
        {/* Board */}
        <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[80px_1fr_120px_140px] gap-2 px-3 py-2 border-b border-slate-100 text-[10px] font-bold tracking-[0.1em] uppercase text-slate-500">
            <span className="hidden sm:block">Group</span>
            <span>Subject · Type</span>
            <span className="hidden sm:block">Date / Time</span>
            <span className="text-right sm:text-left">Status</span>
          </div>
          {filtered.length === 0 ? (
            <p className="text-center text-[12px] text-slate-500 py-8">
              No coordination items in this group.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((i) => {
                const meta = TYPE_META[i.type];
                const g = GROUPS.find((x) => x.id === i.group)!;
                const GI = g.icon;
                const TI = meta.icon;
                return (
                  <li key={i.id} className="grid grid-cols-[1fr_auto] sm:grid-cols-[80px_1fr_120px_140px] gap-2 px-3 py-2.5 items-center hover:bg-slate-50">
                    <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                      <GI className="w-3 h-3 text-slate-500" /> {g.label}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider", meta.tone)}>
                          <TI className="w-2.5 h-2.5" /> {meta.label}
                        </span>
                        <span className="sm:hidden inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                          · <GI className="w-2.5 h-2.5" /> {g.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[13px] font-semibold text-slate-900 leading-tight truncate">
                        {i.subject}
                      </p>
                      <p className="sm:hidden text-[11px] text-slate-500 leading-tight">{i.when}</p>
                    </div>
                    <p className="hidden sm:block text-[11.5px] text-slate-600">{i.when}</p>
                    <div className="flex items-center gap-1.5 justify-end sm:justify-start">
                      <span className={cn("w-2 h-2 rounded-full", URGENCY_DOT[i.urgency])} />
                      <span className="text-[11px] font-semibold text-slate-700 whitespace-nowrap">{i.status}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Coordination strip */}
        <aside className="rounded-xl bg-white border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden h-fit">
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-500">Relay</p>
          </div>
          <ul className="divide-y divide-slate-100">
            {stripSummary.map(({ group, pending, awaiting, urgency }) => {
              const I = group.icon;
              const label =
                pending > 0 ? `${pending} Pending` :
                awaiting ? "Awaiting Approval" : "Clear";
              return (
                <li key={group.id}>
                  <button
                    type="button"
                    onClick={() => setScope(group.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left"
                  >
                    <span className={cn("w-2 h-2 rounded-full shrink-0", URGENCY_DOT[urgency])} />
                    <I className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="flex-1 text-[11.5px] font-semibold text-slate-800 truncate">{group.label}</span>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">{label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>

      {/* Structured-not-social footer note */}
      <p className="text-[10px] text-slate-400 italic text-center px-2">
        Structured coordination — no chat, no threads, no reactions. Action-oriented only.
      </p>
    </div>
  );
};

/* -------- Create Coordination Dialog -------- */

interface CreateProps {
  onClose: () => void;
  onCreate: (item: CoordItem) => void;
  initialGroup: GroupId;
}

const CreateCoordinationDialog = ({ onClose, onCreate, initialGroup }: CreateProps) => {
  const [group, setGroup] = useState<GroupId>(initialGroup);
  const [type, setType] = useState<CoordType>("meeting");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [when, setWhen] = useState("");
  const [mode, setMode] = useState<EngagementMode>("response");
  const [recipients, setRecipients] = useState<"all" | "selected" | "custom">("all");

  const submit = () => {
    if (!subject.trim()) return;
    onCreate({
      id: `c_${Date.now()}`,
      group,
      type,
      subject: subject.trim(),
      when: when.trim() || "Unscheduled",
      status: mode === "decision" ? "Awaiting Approval" : "Pending responses",
      pending: mode === "announcement" ? 0 : 1,
      urgency: mode === "decision" ? "orange" : "amber",
      mode,
    });
  };

  return (
    <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-[14px] font-bold tracking-[0.04em]">
          New Coordination
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        {/* Group + Type */}
        <div className="grid grid-cols-2 gap-2">
          <Field label="Group">
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value as GroupId)}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-[12px]"
            >
              {GROUPS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
          </Field>
          <Field label="Type">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CoordType)}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-[12px]"
            >
              {TYPE_OPTIONS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </Field>
        </div>

        {/* Recipients */}
        <Field label="Recipients">
          <div className="flex flex-wrap gap-1.5">
            {([
              { id: "all",      label: "All Group Members" },
              { id: "selected", label: "Selected Members" },
              { id: "custom",   label: "Custom Selection" },
            ] as const).map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRecipients(r.id)}
                className={cn(
                  "px-2.5 h-7 rounded-md border text-[11px] font-semibold transition",
                  recipients === r.id
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </Field>

        {/* Subject */}
        <Field label="Subject">
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What's this about?" className="h-9" />
        </Field>

        {/* Message */}
        <Field label="Message">
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Short context — not a chat thread." className="min-h-[72px] text-[12px]" />
        </Field>

        {/* Date/time + attachment */}
        <div className="grid grid-cols-2 gap-2">
          <Field label="Date & Time">
            <Input value={when} onChange={(e) => setWhen(e.target.value)} placeholder="e.g. Today 5:00 PM" className="h-9" />
          </Field>
          <Field label="Attachment">
            <button
              type="button"
              className="h-9 w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-dashed border-slate-300 bg-slate-50 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
            >
              <Paperclip className="w-3 h-3" /> Optional file
            </button>
          </Field>
        </div>

        {/* Engagement mode */}
        <Field label="Engagement Mode">
          <div className="grid grid-cols-2 gap-1.5">
            {MODE_OPTIONS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={cn(
                  "px-2.5 h-8 rounded-md border text-[11px] font-semibold text-left transition",
                  mode === m.id
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </Field>

        {/* Allowed responses preview */}
        <div className="rounded-md bg-slate-50 border border-slate-200 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            {mode === "decision" ? "Decision Options" : "Allowed Responses"}
          </p>
          <div className="flex flex-wrap gap-1">
            {(mode === "decision"
              ? ["Approve", "Reject", "Need Changes", "Custom"]
              : mode === "announcement"
              ? ["Seen"]
              : mode === "acknowledge"
              ? ["👍 Got It"]
              : ["✓ Joining", "📞 Call Me", "✅ Yes", "❌ No", "⏳ Not Available", "Need More Time"]
            ).map((r) => (
              <span key={r} className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-semibold text-slate-700">
                {r}
              </span>
            ))}
          </div>
        </div>
      </div>
      <DialogFooter>
        <button
          type="button"
          onClick={onClose}
          className="px-3 h-9 rounded-md border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!subject.trim()}
          className="px-4 h-9 rounded-md bg-slate-900 text-white text-[12px] font-semibold hover:bg-slate-800 disabled:opacity-50"
        >
          Send Coordination
        </button>
      </DialogFooter>
    </DialogContent>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</Label>
    {children}
  </div>
);

export default CoordinationBoard;