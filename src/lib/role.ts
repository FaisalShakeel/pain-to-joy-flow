import { useEffect, useState } from "react";

export type Role = "provider" | "seeker";
const KEY = "availock_role";

export const getRole = (): Role => {
  if (typeof window === "undefined") return "seeker";
  return (localStorage.getItem(KEY) as Role) || "seeker";
};

export const setRole = (r: Role) => {
  localStorage.setItem(KEY, r);
  window.dispatchEvent(new Event("availock:role"));
};

export const useRole = (): [Role, (r: Role) => void] => {
  const [role, setRoleState] = useState<Role>(getRole);
  useEffect(() => {
    const handler = () => setRoleState(getRole());
    window.addEventListener("availock:role", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("availock:role", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return [role, setRole];
};