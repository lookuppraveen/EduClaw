export type PolicyStatus = "draft" | "published" | "archived";

export type PolicyViolationAction = "modify" | "block" | "flag";

export interface PolicyClause {
  id: string;
  rule: string;
  when: string;
  onViolation: PolicyViolationAction;
  createdAt: string;
  updatedAt: string;
}

export interface ValidationPolicy {
  id: string;
  courseId: string;
  assignmentId: string | null;
  title: string;
  status: PolicyStatus;
  publishedAt: string | null;
  createdById: string;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
  clauses: PolicyClause[];
}
