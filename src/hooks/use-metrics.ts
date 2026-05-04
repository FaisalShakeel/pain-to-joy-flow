import { useEffect, useState } from "react";
import {
  computeMetrics, subscribeMetrics, subscribeWaiting,
  getWaitingList, type MetricsSummary, type WaitingEntry,
} from "@/lib/metrics";

export const useMetrics = (range: "today" | "week" | "all" = "week"): MetricsSummary => {
  const [s, setS] = useState<MetricsSummary>(() => computeMetrics(range));
  useEffect(() => {
    setS(computeMetrics(range));
    return subscribeMetrics(() => setS(computeMetrics(range)));
  }, [range]);
  return s;
};

export const useWaitingList = (): WaitingEntry[] => {
  const [list, setList] = useState<WaitingEntry[]>(() => getWaitingList());
  useEffect(() => {
    setList(getWaitingList());
    const unsub = subscribeWaiting(() => setList(getWaitingList()));
    const tick = setInterval(() => setList(getWaitingList()), 30_000);
    return () => { unsub(); clearInterval(tick); };
  }, []);
  return list;
};
