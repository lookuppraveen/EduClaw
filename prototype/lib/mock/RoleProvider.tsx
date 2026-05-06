"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Role } from "./types";

type RoleContextValue = {
  role: Role;
  setRole: (r: Role) => void;
};

const STORAGE_KEY = "educlaw.devRole";

const RoleContext = createContext<RoleContextValue>({
  role: "student",
  setRole: () => {},
});

export function RoleProvider({
  children,
  initialRole = "student",
}: {
  children: ReactNode;
  initialRole?: Role;
}) {
  const [role, setRoleState] = useState<Role>(initialRole);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (stored && isRole(stored)) setRoleState(stored);
  }, []);

  const setRole = (r: Role) => {
    setRoleState(r);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, r);
  };

  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>;
}

export function useRole() {
  return useContext(RoleContext);
}

export function useRoleFlags() {
  const { role } = useRole();
  return {
    role,
    isStudent: role === "student",
    isFaculty: role === "faculty",
    isAdvisor: role === "advisor",
    isAdmin: role === "admin",
    isAuditor: role === "auditor",
  };
}

function isRole(value: string): value is Role {
  return ["student", "faculty", "advisor", "admin", "auditor"].includes(value);
}
