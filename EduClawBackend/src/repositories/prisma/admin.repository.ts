import { Prisma } from "@prisma/client";
import { createHash } from "node:crypto";
import { newId } from "../../common/crypto.js";
import { prisma } from "../../db/prisma.js";
import type { AdminKpis, AuditLogRecord, IntegrationStatusRecord, IntegrationStatusValue } from "../../types/admin.js";

const AUDIT_CHAIN_GENESIS = "GENESIS";
const AUDIT_LOG_WRITE_MAX_ATTEMPTS = 3;
const AUDIT_LOG_RETRY_BASE_DELAY_MS = 25;

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
};

export const calculateAuditLogHash = (input: {
  id: string;
  actorUserId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: unknown;
  previousHash: string | null;
  createdAt: Date;
}): string => {
  const payload = stableStringify({
    id: input.id,
    actorUserId: input.actorUserId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    metadata: input.metadata,
    previousHash: input.previousHash ?? AUDIT_CHAIN_GENESIS,
    createdAt: input.createdAt.toISOString()
  });

  return createHash("sha256").update(payload).digest("hex");
};

const delay = async (milliseconds: number): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
};

export const isRetryableAuditLogWriteError = (error: unknown): boolean => {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
};

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
  previousHash?: string | null;
  hash?: string | null;
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
    prisma.userRoleAssignment.count({ where: { roleName: "student", user: { deletedAt: null } } }),
    prisma.userRoleAssignment.count({ where: { roleName: "faculty", user: { deletedAt: null } } }),
    prisma.userRoleAssignment.count({ where: { roleName: "advisor", user: { deletedAt: null } } }),
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
  for (let attempt = 1; attempt <= AUDIT_LOG_WRITE_MAX_ATTEMPTS; attempt += 1) {
    try {
      const created = await prisma.$transaction(async (tx) => {
        const previous = await tx.auditLog.findFirst({
          where: { hash: { not: null } },
          orderBy: [
            { createdAt: "desc" },
            { id: "desc" }
          ],
          select: { hash: true }
        });
        const createdAt = new Date();
        const id = newId();
        const previousHash = previous?.hash ?? null;
        const hash = calculateAuditLogHash({
          id,
          actorUserId: input.actorUserId,
          action: input.action,
          targetType: input.targetType,
          targetId: input.targetId,
          metadata: input.metadata,
          previousHash,
          createdAt
        });

        return await tx.auditLog.create({
          data: {
            id,
            actorUserId: input.actorUserId,
            action: input.action,
            targetType: input.targetType,
            targetId: input.targetId,
            metadata: input.metadata,
            previousHash,
            hash,
            createdAt
          }
        });
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      });

      return mapAuditLog(created);
    } catch (error) {
      if (!isRetryableAuditLogWriteError(error) || attempt === AUDIT_LOG_WRITE_MAX_ATTEMPTS) {
        throw error;
      }

      await delay(AUDIT_LOG_RETRY_BASE_DELAY_MS * attempt);
    }
  }

  throw new Error("Audit log write retry loop exited unexpectedly");
};

export const verifyAuditLogIntegrity = async (): Promise<{ valid: boolean; brokenAt: string | null }> => {
  const rows = await prisma.auditLog.findMany({
    orderBy: [
      { createdAt: "asc" },
      { id: "asc" }
    ]
  });

  let expectedPreviousHash: string | null = null;
  let chainStarted = false;
  for (const row of rows) {
    if (!row.hash && !chainStarted) {
      continue;
    }

    if (!row.hash) {
      return { valid: false, brokenAt: row.id };
    }

    chainStarted = true;

    if (row.previousHash !== expectedPreviousHash) {
      return { valid: false, brokenAt: row.id };
    }

    const expectedHash = calculateAuditLogHash({
      id: row.id,
      actorUserId: row.actorUserId,
      action: row.action,
      targetType: row.targetType,
      targetId: row.targetId,
      metadata: row.metadata,
      previousHash: row.previousHash,
      createdAt: row.createdAt
    });

    if (row.hash !== expectedHash) {
      return { valid: false, brokenAt: row.id };
    }

    expectedPreviousHash = row.hash;
  }

  return { valid: true, brokenAt: null };
};
