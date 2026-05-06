"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { RoleSwitcher } from "./RoleSwitcher";
import { useRoleFlags } from "@/lib/mock/RoleProvider";
import { useMockData } from "@/lib/mock/MockDataProvider";

export function TopNav() {
  const { role } = useRoleFlags();
  const { users } = useMockData();
  const user = users[role];

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-6">
      <div className="flex items-center gap-2">
        <Link href="/demo" className="flex items-center gap-2 font-semibold tracking-tight">
          <Sparkles className="h-5 w-5 text-accent" aria-hidden="true" />
          <span>EduClaw</span>
        </Link>
        <span className="hidden text-xs text-muted-foreground sm:inline">Phase 1 prototype</span>
      </div>

      <div className="flex items-center gap-4">
        <RoleSwitcher />
        <div className="hidden items-center gap-2 md:flex" aria-label="Signed in as">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {user.avatarInitials}
          </div>
          <div className="text-xs leading-tight">
            <div className="font-medium">{user.name}</div>
            <div className="text-muted-foreground capitalize">{role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
