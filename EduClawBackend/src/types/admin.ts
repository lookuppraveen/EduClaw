export type IntegrationStatusValue = "connected" | "degraded" | "disconnected";

export interface AdminKpis {
  users: {
    total: number;
    students: number;
    faculty: number;
    advisors: number;
  };
  courses: {
    total: number;
  };
  conversations: {
    total: number;
    turns: number;
  };
  policy: {
    published: number;
    draft: number;
    flaggedPending: number;
    flaggedResolved: number;
  };
  privacy: {
    advisorVisibilityEnabled: number;
  };
}

export interface IntegrationStatusRecord {
  name: string;
  displayName: string;
  status: IntegrationStatusValue;
  details: string;
  lastCheckedAt: string;
  updatedAt: string;
}

export interface AuditLogRecord {
  id: string;
  actorUserId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: unknown;
  createdAt: string;
}
