import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { notifications as initialNotifications } from "@/lib/mockData";

type Notification = (typeof initialNotifications)[number];

interface NotificationsContextValue {
  list: Notification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const [list, setList] = useState<Notification[]>(initialNotifications);

  const markRead = useCallback((id: string) => {
    setList((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setList((prev) => prev.map((n) => ({ ...n, unread: false })));
  }, []);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      list,
      unreadCount: list.filter((n) => n.unread).length,
      markRead,
      markAllRead,
    }),
    [list, markRead, markAllRead],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
};