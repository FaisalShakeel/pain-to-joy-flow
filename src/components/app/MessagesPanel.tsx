import { Link } from "react-router-dom";
import { MessageSquare, ArrowRight, Inbox, Zap } from "lucide-react";
import Avatar from "./Avatar";
import { contacts } from "@/lib/mockData";
import { useMessages } from "./MessagesContext";
import { cn } from "@/lib/utils";

const MessagesPanel = () => {
  const { threads, unreadCount: totalUnread } = useMessages();

  return (
    <div className="dashboard-module p-6 md:p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="module-eyebrow inline-flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3 text-accent/80" /> Inbox · Active threads
          </p>
          <h3 className="module-title mt-1.5">Messages</h3>
          <p className="module-meta mt-1 num-tabular">{totalUnread} unread across priority contacts.</p>
        </div>
        <Link to="/app/messages" className="text-[11px] font-semibold text-accent hover:underline inline-flex items-center gap-1 uppercase tracking-wide shrink-0 mt-1">
          Open <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="module-divider mt-5" />

      {/* Threads */}
      <ul className="mt-4 space-y-2">
        {threads.slice(0, 3).map((t) => {
          const c = contacts.find((x) => x.id === t.contactId)!;
          const priority = t.unread >= 2;
          return (
            <li key={t.id}>
              <Link
                to="/app/messages"
                className="group flex items-center gap-3 p-3 rounded-2xl nested-surface transition-all ease-premium"
              >
                <div className="relative">
                  <Avatar initials={c.initials} accent={c.accent} status={c.status} />
                  {t.unread > 0 && (
                    <span className="absolute -top-1 -right-1 grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                      {t.unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-primary truncate">{c.name}</p>
                    {priority && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700">
                        <Zap className="w-2.5 h-2.5" /> Priority
                      </span>
                    )}
                  </div>
                  <p className={cn("text-xs truncate", t.unread > 0 ? "text-primary/80 font-medium" : "text-muted-foreground")}>
                    {t.preview}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{t.lastAt}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Quick reply */}
      <Link
        to="/app/messages"
        className="mt-3 flex items-center justify-center gap-2 px-3 py-2.5 rounded-full bg-primary/5 hover:bg-primary/10 text-xs font-semibold text-primary transition-all ease-premium shadow-soft"
      >
        <Inbox className="w-3.5 h-3.5" /> Quick reply to a conversation
      </Link>
    </div>
  );
};

export default MessagesPanel;