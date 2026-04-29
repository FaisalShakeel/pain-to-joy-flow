import { Bell, Check, Inbox, MessageSquare, CalendarDays, Sparkles } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import EmptyState from "@/components/app/EmptyState";
import { useNotifications } from "@/components/app/NotificationsContext";
import { toast } from "@/hooks/use-toast";

const iconFor = {
  request: Inbox,
  message: MessageSquare,
  schedule: CalendarDays,
  system: Sparkles,
};

const Notifications = () => {
  const { list, markRead, markAllRead, unreadCount } = useNotifications();

  const markAll = () => {
    markAllRead();
    toast({ title: "All caught up" });
  };

  return (
    <AppShell
      subtitle="Updates"
      title="Notifications"
      actions={
        unreadCount > 0 ? (
          <button
            onClick={markAll}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full ghost-border bg-surface-lowest text-sm font-semibold text-primary hover:bg-surface-low transition"
          >
            <Check className="w-4 h-4" /> Mark all read
          </button>
        ) : null
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
                {n.unread ? (
                  <button
                    onClick={() => markRead(n.id)}
                    title="Mark as read"
                    aria-label="Mark as read"
                    className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ghost-border bg-surface-lowest text-[11px] font-semibold text-primary hover:bg-surface-low transition"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    Mark read
                  </button>
                ) : (
                  <span className="shrink-0 text-[11px] text-muted-foreground">Read</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
};

export default Notifications;