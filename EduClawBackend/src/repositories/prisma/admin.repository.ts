import type { Prisma } from "@prisma/client";
import { newId } from "../../common/crypto.js";
import { prisma } from "../../db/prisma.js";
import type { AdminKpis, AuditLogRecord, IntegrationStatusRecord, IntegrationStatusValue } from "../../types/admin.js";

const mapIntegration = (row: {
  name: string;
  displayName: string;
  status: IntegrationStatusValue;
  details: string;
  lastCheckedAt: Date;
  updatedAt: Date;
}): IntegrationStatusRecord => ({
  name: row.name,
  displayName: row.displayName,
  status: row.status,
  details: row.details,
  lastCheckedAt: row.lastCheckedAt.toISOString(),
  updatedAt: row.updatedAt.toISOString()
});

const mapAuditLog = (row: {
  id: string;
  actorUserId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: unknown;
  createdAt: Date;
}): AuditLogRecord => ({
  id: row.id,
  actorUserId: row.actorUserId,
  action: row.action,
  targetType: row.targetType,
  targetId: row.targetId,
  metadata: row.metadata,
  createdAt: row.createdAt.toISOString()
});

export const getAdminKpis = async (): Promise<AdminKpis> => {
  const [
    totalUsers,
    students,
    faculty,
    advisors,
    totalCourses,
    totalConversations,
    totalTurns,
    publishedPolicies,
    draftPolicies,
    pendingFlags,
    resolvedFlags,
    advisorVisibilityEnabled
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { role: "student", deletedAt: null } }),
    prisma.user.count({ where: { role: "faculty", deletedAt: null } }),
    prisma.user.count({ where: { role: "advisor", deletedAt: null } }),
    prisma.course.count({ where: { deletedAt: null } }),
    prisma.conversation.count({ where: { deletedAt: null } }),
    prisma.conversationTurn.count(),
    prisma.validationPolicy.count({ where: { status: "published", deletedAt: null } }),
    prisma.validationPolicy.count({ where: { status: "draft", deletedAt: null } }),
    prisma.flaggedTurn.count({ where: { status: "pending" } }),
    prisma.flaggedTurn.count({ where: { status: "resolved" } }),
    prisma.consent.count({ where: { advisorVisibility: true } })
  ]);

  return {
    users: {
      total: totalUsers,
      students,
      faculty,
      advisors
    },
    courses: {
      total: totalCourses
    },
    conversations: {
      total: totalConversations,
      turns: totalTurns
    },
    policy: {
      published: publishedPolicies,
      draft: draftPolicies,
      flaggedPending: pendingFlags,
      flaggedResolved: resolvedFlags
    },
    privacy: {
      advisorVisibilityEnabled
    }
  };
};

export const listIntegrationStatuses = async (): Promise<IntegrationStatusRecord[]> => {
  const integrations = await prisma.integrationStatus.findMany({
    orderBy: { name: "asc" }
  });

  return integrations.map(mapIntegration);
};

export const updateIntegrationStatus = async (
  name: string,
  input: { displayName?: string; status: IntegrationStatusValue; details: string }
): Promise<IntegrationStatusRecord> => {
  const updated = await prisma.integrationStatus.upsert({
    where: { name },
    update: {
      displayName: input.displayName,
      status: input.status,
      details: input.details,
      lastCheckedAt: new Date()
    },
    create: {
      name,
      displayName: input.displayName ?? name,
      status: input.status,
      details: input.details,
      lastCheckedAt: new Date()
    }
  });

  return mapIntegration(updated);
};

export interface AuditLogFilters {
  action?: string;
  targetType?: string;
  actorUserId?: string;
  limit: number;
  cursor?: string;
}

export const listAuditLogs = async (filters: AuditLogFilters): Promise<{ logs: AuditLogRecord[]; nextCursor: string | null }> => {
  const where: Prisma.AuditLogWhereInput = {
    ...(filters.action ? { action: filters.action } : {}),
    ...(filters.targetType ? { targetType: filters.targetType } : {}),
    ...(filters.actorUserId ? { actorUserId: filters.actorUserId } : {})
  };

  const rows = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: filters.limit + 1,
    ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {})
  });

  const page = rows.slice(0, filters.limit);
  return {
    logs: page.map(mapAuditLog),
    nextCursor: rows.length > filters.limit ? page[page.length - 1]?.id ?? null : null
  };
};

export const createAuditLog = async (input: {
  actorUserId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: Prisma.InputJsonValue;
}): Promise<AuditLogRecord> => {
  const created = await prisma.auditLog.create({
    data: {
      id: newId(),
      actorUserId: input.actorUserId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: input.metadata
    }
  });

  return mapAuditLog(created);
};
