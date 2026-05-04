import { Check, X, MessageCircle, UserPlus, Clock3, Users } from "lucide-react";
import { useWaitingList } from "@/hooks/use-metrics";
import { updateWaitingStatus, trackMetric } from "@/lib/metrics";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const fmtAgo = (at: number) => {
  const s = Math.max(1, Math.floor((Date.now() - at) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
};

const fmtExpiry = (at: number) => {
  const s = Math.max(0, Math.floor((at - Date.now()) / 1000));
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m left` : "expiring";
};

const QuickSyncWaitingList = () => {
  const list = useWaitingList();
  const waiting = list.filter((w) => w.status === "waiting");

  return (
    <div className="rounded-2xl bg-surface-lowest ghost-border p-4 shadow-ambient">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center w-7 h-7 rounded-full bg-primary/10 text-primary">
            <Users className="w-3.5 h-3.5" />
          </span>
          <div>
            <h3 className="font-headline font-bold text-primary text-sm">Quick Sync waiting list</h3>
            <p className="text-[11px] text-muted-foreground">Manual control · expires in 30 min</p>
          </div>
        </div>
        <span className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold",
          waiting.length ? "bg-amber-500/15 text-amber-700" : "bg-surface-low text-muted-foreground",
        )}>
          {waiting.length} waiting
        </span>
      </div>

      {waiting.length === 0 ? (
        <p className="text-xs text-muted-foreground italic px-2 py-3">
          No one in the queue right now. When your slots fill up, seekers can join here.
        </p>
      ) : (
        <ul className="space-y-2">
          {waiting.map((w) => (
            <li key={w.id} className="flex items-center gap-2.5 p-2 rounded-xl ghost-border bg-surface-low/40">
              <span className="grid place-items-center w-9 h-9 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                {w.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-primary truncate">{w.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {w.note || "No note"} · <span className="inline-flex items-center gap-0.5"><Clock3 className="w-2.5 h-2.5" />{fmtAgo(w.joinedAt)} · {fmtExpiry(w.expiresAt)}</span>
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <ActionBtn
                  title="Approve — create extra slot"
                  tone="emerald"
                  onClick={() => {
                    updateWaitingStatus(w.id, "approved");
                    toast({ title: "Approved", description: `Extra Quick Sync slot offered to ${w.name}.` });
                  }}
                >
                  <Check className="w-3.5 h-3.5" />
                </ActionBtn>
                <ActionBtn
                  title="Invite to connect now"
                  tone="sky"
                  onClick={() => {
                    updateWaitingStatus(w.id, "approved");
                    trackMetric("ping_to_connect", { dedupeKey: `wait-invite:${w.id}` });
                    toast({ title: "Invitation sent", description: `${w.name} can join the call now.` });
                  }}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                </ActionBtn>
                <ActionBtn
                  title="Send message"
                  tone="muted"
                  onClick={() => toast({ title: "Message sent", description: `Reply delivered to ${w.name}.` })}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </ActionBtn>
                <ActionBtn
                  title="Cancel — remove from queue"
                  tone="rose"
                  onClick={() => {
                    updateWaitingStatus(w.id, "cancelled");
                    toast({ title: "Removed", description: `${w.name} removed from the waiting list.` });
                  }}
                >
                  <X className="w-3.5 h-3.5" />
                </ActionBtn>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

function ActionBtn({
  children, onClick, title, tone,
}: { children: React.ReactNode; onClick: () => void; title: string; tone: "emerald" | "sky" | "rose" | "muted" }) {
  const map = {
    emerald: "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25",
    sky:     "bg-sky-500/15 text-sky-700 hover:bg-sky-500/25",
    rose:    "bg-rose-500/15 text-rose-700 hover:bg-rose-500/25",
    muted:   "bg-surface-low text-muted-foreground hover:bg-surface-low/70 hover:text-primary",
  } as const;
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={cn("grid place-items-center w-7 h-7 rounded-full transition", map[tone])}
    >
      {children}
    </button>
  );
}

export default QuickSyncWaitingList;
