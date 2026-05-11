import { Link } from "react-router-dom";
import { MessageSquare, ArrowRight, Inbox, Zap } from "lucide-react";
import Avatar from "./Avatar";
import { contacts } from "@/lib/mockData";
import { useMessages } from "./MessagesContext";
import { cn } from "@/lib/utils";

const MessagesPanel = () => {
  const { threads, unreadCount: totalUnread } = useMessages();

  return (
    <div className="dashboard-module p-5 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-accent/10 text-accent">
            <MessageSquare className="w-4 h-4" />
          </span>
          <div>
            <h3 className="font-headline font-bold text-primary leading-tight">Messages</h3>
            <p className="text-[11px] text-muted-foreground">
              {totalUnread} unread
            </p>
          </div>
        </div>
        <Link to="/app/messages" className="text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1">
          Open <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

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
                  <Avatar initials={c.initials} accent={c.accent} />
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