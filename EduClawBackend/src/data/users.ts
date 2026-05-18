import type { User } from "../types/auth.js";

export const users: User[] = [
  {
    id: "usr_student_1",
    name: "Maya Chen",
    email: "maya@example.edu",
    roles: ["student"]
  },
  {
    id: "usr_faculty_1",
    name: "Prof. Carter",
    email: "carter@example.edu",
    roles: ["faculty"]
  },
  {
    id: "usr_admin_1",
    name: "Admin Jane",
    email: "admin@example.edu",
    roles: ["admin"]
  },
  {
    id: "usr_advisor_1",
    name: "Advisor Lee",
    email: "advisor@example.edu",
    roles: ["advisor"]
  },
  {
    id: "usr_auditor_1",
    name: "Auditor Kim",
    email: "auditor@example.edu",
    roles: ["auditor"]
  }
];
