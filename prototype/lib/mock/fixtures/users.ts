import type { User, Role } from "../types";

export const users: Record<Role, User> = {
  student: {
    id: "u_student_1",
    name: "Maya Chen",
    email: "maya.chen@example.edu",
    role: "student",
    avatarInitials: "MC",
  },
  faculty: {
    id: "u_faculty_1",
    name: "Dr. Aisha Patel",
    email: "apatel@example.edu",
    role: "faculty",
    avatarInitials: "AP",
  },
  advisor: {
    id: "u_advisor_1",
    name: "Jordan Reyes",
    email: "jreyes@example.edu",
    role: "advisor",
    avatarInitials: "JR",
  },
  admin: {
    id: "u_admin_1",
    name: "Samira Okafor",
    email: "sokafor@example.edu",
    role: "admin",
    avatarInitials: "SO",
  },
  auditor: {
    id: "u_auditor_1",
    name: "Theo Lindgren",
    email: "tlindgren@example.edu",
    role: "auditor",
    avatarInitials: "TL",
  },
};
