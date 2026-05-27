import { prisma } from "../../db/prisma.js";
import type { FerpaScopeRecordPage } from "../../types/audit.js";
import type { ConsentScope, ConsentScopeKey } from "../../types/learner-state.js";

const toScopes = (consent: {
  courseContext: boolean;
  priorConversations: boolean;
  advisorVisibility: boolean;
  thirdPartyTools: boolean;
}): ConsentScope[] => [
  { key: "course_context", enabled: consent.courseContext },
  { key: "prior_conversations", enabled: consent.priorConversations },
  { key: "advisor_visibility", enabled: consent.advisorVisibility },
  { key: "third_party_tools", enabled: consent.thirdPartyTools }
];

export interface FerpaScopeFilters {
  learnerId?: string;
  scope?: ConsentScopeKey;
  enabled?: boolean;
  limit?: number;
  cursor?: string;
}

export const listFerpaScopeRecords = async (filters: FerpaScopeFilters): Promise<FerpaScopeRecordPage> => {
  const limit = filters.limit ?? 50;
  const rows = await prisma.consent.findMany({
    where: {
      ...(filters.learnerId ? { learnerId: filters.learnerId } : {}),
      ...(filters.scope === "course_context" && filters.enabled !== undefined ? { courseContext: filters.enabled } : {}),
      ...(filters.scope === "prior_conversations" && filters.enabled !== undefined ? { priorConversations: filters.enabled } : {}),
      ...(filters.scope === "advisor_visibility" && filters.enabled !== undefined ? { advisorVisibility: filters.enabled } : {}),
      ...(filters.scope === "third_party_tools" && filters.enabled !== undefined ? { thirdPartyTools: filters.enabled } : {})
    },
    include: {
      history: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    },
    orderBy: { learnerId: "asc" },
    take: limit + 1,
    ...(filters.cursor ? { cursor: { learnerId: filters.cursor }, skip: 1 } : {})
  });

  const records = rows
    .slice(0, limit)
    .map((row) => ({
      learnerId: row.learnerId,
      scopes: toScopes(row),
      updatedAt: row.updatedAt.toISOString(),
      latestEvent: row.history[0]
        ? {
            id: row.history[0].id,
            actorUserId: row.history[0].actorUserId,
            reason: row.history[0].reason,
            createdAt: row.history[0].createdAt.toISOString()
          }
        : null
    }))
    .filter((record) => {
      if (!filters.scope || filters.enabled !== undefined) {
        return true;
      }

      return record.scopes.some((scope) => scope.key === filters.scope);
    });

  return {
    records,
    nextCursor: rows.length > limit ? records.at(-1)?.learnerId ?? null : null
  };
};
