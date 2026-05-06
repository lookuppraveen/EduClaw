"use client";

import { useRouter } from "next/navigation";
import { GraduationCap, BookOpen, Compass, Settings, ShieldCheck } from "lucide-react";
import { useRole } from "@/lib/mock/RoleProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/mock/types";

const OPTIONS: Array<{ role: Role; label: string; icon: typeof GraduationCap; landingHref: string }> = [
  { role: "student", label: "Student", icon: GraduationCap, landingHref: "/student/dashboard" },
  { role: "faculty", label: "Faculty", icon: BookOpen, landingHref: "/faculty/dashboard" },
  { role: "advisor", label: "Advisor", icon: Compass, landingHref: "/advisor/dashboard" },
  { role: "admin", label: "Admin", icon: Settings, landingHref: "/admin/dashboard" },
  { role: "auditor", label: "Auditor", icon: ShieldCheck, landingHref: "/auditor/dashboard" },
];

export function RoleSwitcher() {
  const { role, setRole } = useRole();
  const router = useRouter();

  return (
    <div className="flex items-center gap-1 rounded-lg border bg-background p-1" role="group" aria-label="Switch role">
      {OPTIONS.map(({ role: r, label, icon: Icon, landingHref }) => {
        const active = r === role;
        return (
          <Button
            key={r}
            size="sm"
            variant={active ? "default" : "ghost"}
            onClick={() => {
              setRole(r);
              router.push(landingHref);
            }}
            aria-pressed={active}
            className={cn("gap-1.5 text-xs", active ? "" : "text-muted-foreground")}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {label}
          </Button>
        );
      })}
    </div>
  );
}
