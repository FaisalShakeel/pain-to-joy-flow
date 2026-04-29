import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { threads as initial, type MessageThread } from "@/lib/mockData";

interface MessagesContextValue {
  threads: MessageThread[];
  setThreads: React.Dispatch<React.SetStateAction<MessageThread[]>>;
  unreadCount: number;
  markRead: (threadId: string) => void;
}

const MessagesContext = createContext<MessagesContextValue | undefined>(undefined);

export const MessagesProvider = ({ children }: { children: ReactNode }) => {
  const [threads, setThreads] = useState<MessageThread[]>(initial);

  const markRead = useCallback((threadId: string) => {
    setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, unread: 0 } : t)));
  }, []);

  const value = useMemo<MessagesContextValue>(
    () => ({
      threads,
      setThreads,
      unreadCount: threads.reduce((n, t) => n + t.unread, 0),
      markRead,
    }),
    [threads, markRead],
  );

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
};

export const useMessages = () => {
  const ctx = useContext(MessagesContext);
  if (!ctx) throw new Error("useMessages must be used within MessagesProvider");
  return ctx;
};