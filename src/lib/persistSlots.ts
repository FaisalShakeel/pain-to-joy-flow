/** Tiny localStorage helper for persisting builder slot lists across navigations. */
export const loadPersisted = <T,>(key: string, fallback: T): T => {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed as T;
  } catch {
    return fallback;
  }
};

export const savePersisted = <T,>(key: string, value: T) => {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    /* ignore quota / serialization errors */
  }
};