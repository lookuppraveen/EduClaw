"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  MessageSquare,
  ClipboardList,
  Calendar,
  Notebook,
  Target,
  Lock,
  Settings,
  HelpCircle,
  BookOpen,
  Users,
  ShieldCheck,
  Activity,
  Compass,
  type LucideIcon,
} from "lucide-react";
import { useRoleFlags } from "@/lib/mock/RoleProvider";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon };

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  student: [
    { href: "/student/dashboard", label: "Companion home", icon: Home },
    { href: "/student/courses", label: "My courses", icon: BookOpen },
    { href: "/student/conversation", label: "Conversation", icon: MessageSquare },
    { href: "/student/study-plan", label: "Study plan", icon: ClipboardList },
    { href: "/student/journal", label: "Reflection journal", icon: Notebook },
    { href: "/student/mastery", label: "Mastery map", icon: Target },
    { href: "/student/calendar", label: "Calendar", icon: Calendar },
    { href: "/student/privacy", label: "Privacy Center", icon: Lock },
    { href: "/student/settings", label: "Settings", icon: Settings },
    { href: "/student/help", label: "Help", icon: HelpCircle },
  ],
  faculty: [
    { href: "/faculty/dashboard", label: "Co-pilot home", icon: Home },
    { href: "/faculty/courses", label: "My courses", icon: BookOpen },
    { href: "/faculty/policy", label: "Validation policy", icon: ShieldCheck },
    { href: "/faculty/review", label: "Review queue", icon: Activity },
    { href: "/faculty/roster", label: "Roster", icon: Users },
    { href: "/faculty/settings", label: "Settings", icon: Settings },
  ],
  advisor: [
    { href: "/advisor/dashboard", label: "Caseload", icon: Home },
    { href: "/advisor/cases", label: "Students", icon: Users },
    { href: "/advisor/schedule", label: "Schedule", icon: Calendar },
    { href: "/advisor/outcomes", label: "Outcomes", icon: Target },
    { href: "/advisor/settings", label: "Settings", icon: Settings },
  ],
  admin: [
    { href: "/admin/dashboard", label: "Overview", icon: Home },
    { href: "/admin/integrations", label: "Integrations", icon: Activity },
    { href: "/admin/kpi", label: "KPIs", icon: Target },
    { href: "/admin/users", label: "Users & roles", icon: Users },
    { href: "/admin/audit", label: "Audit logs", icon: ShieldCheck },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ],
  auditor: [
    { href: "/auditor/dashboard", label: "Trace explorer", icon: Compass },
    { href: "/auditor/ferpa-log", label: "FERPA scope log", icon: ShieldCheck },
  ],
};

export function Sidebar() {
  const { role } = useRoleFlags();
  const pathname = usePathname();
  const items = NAV_BY_ROLE[role] ?? [];

  return (
    <aside
      className="hidden w-60 shrink-0 border-r bg-card md:flex md:flex-col"
      aria-label="Primary navigation"
    >
      <nav className="flex flex-col gap-1 p-3">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto p-3 text-xs text-muted-foreground">
        <Link href="/demo" className="underline-offset-2 hover:underline">
          ← Back to screen index
        </Link>
      </div>
    </aside>
  );
}
