import type { Role } from "./types";

export type Surface = "web" | "lms-embed" | "mobile" | "chat" | "cross-cutting";

export type ScreenStatus = "ready" | "stub" | "planned";

export type ScreenEntry = {
  href: string | null; // null = not yet routed
  title: string;
  surface: Surface;
  role: Role | "all";
  weekTarget: number;
  status: ScreenStatus;
  notes?: string;
  hero?: boolean;
};

// Mirrors the screen inventory in docs/phase1-foundation.md §6.
export const screens: ScreenEntry[] = [
  // 6.1 Auth & onboarding
  { href: "/login", title: "Login (mock SSO chooser)", surface: "web", role: "all", weekTarget: 1, status: "ready" },
  { href: null, title: "SSO callback / role detection", surface: "web", role: "all", weekTarget: 1, status: "planned" },
  { href: null, title: "First-run consent setup", surface: "web", role: "student", weekTarget: 6, status: "planned" },
  { href: null, title: "Logout confirmation", surface: "web", role: "all", weekTarget: 12, status: "planned" },

  // 6.2 Student web portal
  { href: "/student/dashboard", title: "Companion home", surface: "web", role: "student", weekTarget: 5, status: "ready" },
  { href: "/student/courses", title: "Course list", surface: "web", role: "student", weekTarget: 5, status: "ready" },
  { href: "/student/courses/c_calc1", title: "Course detail w/ embedded companion", surface: "web", role: "student", weekTarget: 5, status: "ready" },
  { href: "/student/conversation", title: "Conversation surface (HERO)", surface: "web", role: "student", weekTarget: 3, status: "ready", hero: true },
  { href: null, title: "Conversation history list", surface: "web", role: "student", weekTarget: 5, status: "planned" },
  { href: null, title: "Single past conversation viewer", surface: "web", role: "student", weekTarget: 5, status: "planned" },
  { href: null, title: "Study plan", surface: "web", role: "student", weekTarget: 5, status: "planned" },
  { href: null, title: "Practice problems runner", surface: "web", role: "student", weekTarget: 5, status: "planned" },
  { href: null, title: "Reflection journal (list)", surface: "web", role: "student", weekTarget: 5, status: "planned" },
  { href: null, title: "Reflection entry view", surface: "web", role: "student", weekTarget: 5, status: "planned" },
  { href: null, title: "Portfolio", surface: "web", role: "student", weekTarget: 5, status: "planned" },
  { href: "/student/mastery", title: "Mastery map", surface: "web", role: "student", weekTarget: 6, status: "ready" },
  { href: null, title: "Calendar / schedule", surface: "web", role: "student", weekTarget: 6, status: "planned" },
  { href: null, title: "Notifications", surface: "web", role: "student", weekTarget: 6, status: "planned" },
  { href: "/student/privacy", title: "Privacy Center (HERO)", surface: "web", role: "student", weekTarget: 6, status: "ready", hero: true },
  { href: null, title: "Settings", surface: "web", role: "student", weekTarget: 6, status: "planned" },
  { href: null, title: "Help / Trust & Safety brief", surface: "web", role: "student", weekTarget: 6, status: "planned" },

  // 6.3 Faculty web portal
  { href: "/faculty/dashboard", title: "Faculty co-pilot dashboard", surface: "web", role: "faculty", weekTarget: 7, status: "ready" },
  { href: null, title: "Course list (taught)", surface: "web", role: "faculty", weekTarget: 7, status: "planned" },
  { href: null, title: "Course setup", surface: "web", role: "faculty", weekTarget: 7, status: "planned" },
  { href: "/faculty/policy", title: "Validation Policy authoring (HERO)", surface: "web", role: "faculty", weekTarget: 7, status: "ready", hero: true },
  { href: "/faculty/review", title: "Validation review queue", surface: "web", role: "faculty", weekTarget: 8, status: "ready" },
  { href: "/faculty/review/flag_1", title: "Single flagged turn — review console", surface: "web", role: "faculty", weekTarget: 8, status: "ready" },
  { href: null, title: "Class mastery map", surface: "web", role: "faculty", weekTarget: 8, status: "planned" },
  { href: null, title: "Student roster (consent-gated)", surface: "web", role: "faculty", weekTarget: 8, status: "planned" },
  { href: null, title: "Course materials ingestion review", surface: "web", role: "faculty", weekTarget: 8, status: "planned" },
  { href: null, title: "Discipline guardrails editor", surface: "web", role: "faculty", weekTarget: 8, status: "planned" },
  { href: null, title: "Co-design notes", surface: "web", role: "faculty", weekTarget: 8, status: "planned" },
  { href: null, title: "Activity simulator", surface: "web", role: "faculty", weekTarget: 7, status: "planned" },

  // 6.4 Advisor
  { href: "/advisor/dashboard", title: "Advisor dashboard", surface: "web", role: "advisor", weekTarget: 9, status: "stub" },
  { href: null, title: "Student case list", surface: "web", role: "advisor", weekTarget: 9, status: "planned" },
  { href: null, title: "Student profile (consent-gated)", surface: "web", role: "advisor", weekTarget: 9, status: "planned" },
  { href: null, title: "Advising conversation thread", surface: "web", role: "advisor", weekTarget: 9, status: "planned" },
  { href: null, title: "Schedule / appointments", surface: "web", role: "advisor", weekTarget: 9, status: "planned" },
  { href: null, title: "Intervention plans", surface: "web", role: "advisor", weekTarget: 9, status: "planned" },
  { href: null, title: "Notes / journal", surface: "web", role: "advisor", weekTarget: 9, status: "planned" },
  { href: null, title: "Outcomes dashboard", surface: "web", role: "advisor", weekTarget: 9, status: "planned" },

  // 6.5 Admin & Auditor
  { href: "/admin/dashboard", title: "Tenant overview", surface: "web", role: "admin", weekTarget: 9, status: "stub" },
  { href: null, title: "Integration status", surface: "web", role: "admin", weekTarget: 9, status: "planned" },
  { href: null, title: "KPI dashboard", surface: "web", role: "admin", weekTarget: 9, status: "planned" },
  { href: null, title: "Eval results dashboard", surface: "web", role: "admin", weekTarget: 9, status: "planned" },
  { href: null, title: "User & role management", surface: "web", role: "admin", weekTarget: 9, status: "planned" },
  { href: null, title: "Policy bundle management", surface: "web", role: "admin", weekTarget: 9, status: "planned" },
  { href: null, title: "Audit logs", surface: "web", role: "admin", weekTarget: 9, status: "planned" },
  { href: null, title: "Cost dashboard per agent", surface: "web", role: "admin", weekTarget: 9, status: "planned" },
  { href: null, title: "Red-team queue", surface: "web", role: "admin", weekTarget: 9, status: "planned" },
  { href: "/auditor/dashboard", title: "Trace explorer", surface: "web", role: "auditor", weekTarget: 9, status: "ready" },
  { href: null, title: "Single trace deep-dive", surface: "web", role: "auditor", weekTarget: 9, status: "planned" },
  { href: null, title: "FERPA scope-expansion log", surface: "web", role: "auditor", weekTarget: 9, status: "planned" },

  // 6.6 LMS embed
  { href: "/lms-embed/canvas", title: "Canvas frame + side panel", surface: "lms-embed", role: "student", weekTarget: 10, status: "ready" },
  { href: null, title: "Blackboard frame + side panel", surface: "lms-embed", role: "student", weekTarget: 10, status: "planned" },
  { href: null, title: "Moodle frame + side panel", surface: "lms-embed", role: "student", weekTarget: 10, status: "planned" },
  { href: null, title: "D2L frame + side panel", surface: "lms-embed", role: "student", weekTarget: 10, status: "planned" },
  { href: null, title: "Faculty deep-link configuration", surface: "lms-embed", role: "faculty", weekTarget: 10, status: "planned" },
  { href: null, title: "LMS-side opt-in toggle", surface: "lms-embed", role: "faculty", weekTarget: 10, status: "planned" },

  // 6.7 Mobile preview
  { href: "/mobile-preview/home", title: "Mobile companion home", surface: "mobile", role: "student", weekTarget: 11, status: "ready" },
  { href: null, title: "Mobile conversation", surface: "mobile", role: "student", weekTarget: 11, status: "planned" },
  { href: null, title: "Mobile voice reflection", surface: "mobile", role: "student", weekTarget: 11, status: "planned" },
  { href: null, title: "Mobile calendar nudge", surface: "mobile", role: "student", weekTarget: 11, status: "planned" },
  { href: null, title: "Mobile offline study pack", surface: "mobile", role: "student", weekTarget: 11, status: "planned" },
  { href: null, title: "Mobile push notification center", surface: "mobile", role: "student", weekTarget: 11, status: "planned" },
  { href: null, title: "Mobile Privacy Center", surface: "mobile", role: "student", weekTarget: 11, status: "planned" },
  { href: null, title: "Mobile settings / accessibility", surface: "mobile", role: "student", weekTarget: 11, status: "planned" },

  // 6.8 Chat preview
  { href: "/chat-preview/slack-student", title: "Slack — student /educlaw ask", surface: "chat", role: "student", weekTarget: 11, status: "ready" },
  { href: null, title: "Slack — faculty co-pilot in course channel", surface: "chat", role: "faculty", weekTarget: 11, status: "planned" },
  { href: null, title: "Slack — advising bot DM", surface: "chat", role: "advisor", weekTarget: 11, status: "planned" },
  { href: null, title: "Teams — student in-thread reply", surface: "chat", role: "student", weekTarget: 11, status: "planned" },
  { href: null, title: "Teams — ops agents catalog", surface: "chat", role: "all", weekTarget: 11, status: "planned" },
  { href: null, title: "Privacy notice mock", surface: "chat", role: "all", weekTarget: 11, status: "planned" },

  // 6.9 Cross-cutting
  { href: "/demo", title: "Screen index", surface: "cross-cutting", role: "all", weekTarget: 1, status: "ready" },
  { href: null, title: "Empty states gallery", surface: "cross-cutting", role: "all", weekTarget: 12, status: "planned" },
  { href: null, title: "Loading states gallery", surface: "cross-cutting", role: "all", weekTarget: 12, status: "planned" },
  { href: null, title: "Error states gallery", surface: "cross-cutting", role: "all", weekTarget: 12, status: "planned" },
  { href: null, title: "Accessibility test page", surface: "cross-cutting", role: "all", weekTarget: 12, status: "planned" },
  { href: "/states/components", title: "Component library showcase", surface: "cross-cutting", role: "all", weekTarget: 2, status: "ready" },
];
