import { useState } from "react";
import { Bell, Check, Inbox, MessageSquare, CalendarDays, Sparkles } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import EmptyState from "@/components/app/EmptyState";
import { notifications as initial } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";

const iconFor = {
  request: Inbox,
  message: MessageSquare,
  schedule: CalendarDays,
  system: Sparkles,
};

const Notifications = () => {
  const [list, setList] = useState(initial);

  const markAll = () => {
    setList((p) => p.map((n) => ({ ...n, unread: false })));
    toast({ title: "All caught up" });
  };

  return (
    <AppShell
      subtitle="Updates"
      title="Notifications"
      actions={
        <button
          onClick={markAll}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full ghost-border bg-surface-lowest text-sm font-semibold text-primary hover:bg-surface-low transition"
        >
          <Check className="w-4 h-4" /> Mark all read
        </button>
      }
    >
      {list.length === 0 ? (
        <EmptyState icon={Bell} title="No new updates" description="You're fully caught up." />
      ) : (
        <ul className="space-y-2">
          {list.map((n) => {
            const Icon = iconFor[n.kind];
            return (
              <li
                key={n.id}
                className={`flex items-start gap-4 p-4 rounded-2xl ghost-border ${n.unread ? "bg-primary/5" : "bg-surface-lowest"}`}
              >
                <span className="grid place-items-center w-10 h-10 rounded-xl bg-primary/10 text-primary shrink-0">
                  <Icon className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-primary text-sm">{n.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{n.at}</p>
                </div>
                {n.unread && <span className="w-2 h-2 rounded-full bg-accent mt-2" />}
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
};

export default Notifications;