import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { requests as initial, type AccessRequest } from "@/lib/mockData";
import { feedback } from "@/lib/feedback";

type ActState = "approved" | "denied" | "scheduled";

interface RequestsContextValue {
  list: AccessRequest[];
  setList: React.Dispatch<React.SetStateAction<AccessRequest[]>>;
  pendingIncomingCount: number;
  act: (id: string, state: ActState) => void;
}

const RequestsContext = createContext<RequestsContextValue | undefined>(undefined);

export const RequestsProvider = ({ children }: { children: ReactNode }) => {
  const [list, setList] = useState<AccessRequest[]>(initial);

  const act = useCallback((id: string, state: ActState) => {
    setList((prev) => prev.map((r) => (r.id === id ? { ...r, state } : r)));
    if (state === "approved") feedback("request.approved");
    else if (state === "denied") feedback("request.denied");
    else if (state === "scheduled") feedback("booking.confirmed");
  }, []);

  const value = useMemo<RequestsContextValue>(
    () => ({
      list,
      setList,
      pendingIncomingCount: list.filter((r) => r.direction === "incoming" && r.state === "pending").length,
      act,
    }),
    [list, act],
  );

  return <RequestsContext.Provider value={value}>{children}</RequestsContext.Provider>;
};

export const useRequests = () => {
  const ctx = useContext(RequestsContext);
  if (!ctx) throw new Error("useRequests must be used within RequestsProvider");
  return ctx;
};