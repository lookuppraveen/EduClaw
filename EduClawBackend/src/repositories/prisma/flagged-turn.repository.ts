import type { Prisma } from "@prisma/client";
import { newId } from "../../common/crypto.js";
import { prisma } from "../../db/prisma.js";
import type {
  FlaggedTurn,
  FlaggedTurnCreateInput,
  FlaggedTurnDetail,
  FlaggedTurnStatus,
  ReviewDecision,
  ReviewDecisionCreateInput,
  ReviewDecisionType
} from "../../types/reviews.js";

const mapFlaggedTurn = (row: {
  id: string;
  turnId: string;
  policyId: string;
  clauseId: string;
  courseId: string;
  learnerId: string;
  status: "pending" | "resolved";
  reason: string;
  createdAt: Date;
  resolvedAt: Date | null;
}): FlaggedTurn => ({
  id: row.id,
  turnId: row.turnId,
  policyId: row.policyId,
  clauseId: row.clauseId,
  courseId: row.courseId,
  learnerId: row.learnerId,
  status: row.status,
  reason: row.reason,
  createdAt: row.createdAt.toISOString(),
  resolvedAt: row.resolvedAt?.toISOString() ?? null
});

const mapReviewDecision = (row: {
  id: string;
  flagId: string;
  reviewerId: string;
  decision: "approve" | "override" | "escalate";
  note: string;
  policyId: string;
  clauseId: string;
  courseId: string;
  createdAt: Date;
}): ReviewDecision => ({
  id: row.id,
  flagId: row.flagId,
  reviewerId: row.reviewerId,
  decision: row.decision,
  note: row.note,
  policyId: row.policyId,
  clauseId: row.clauseId,
  courseId: row.courseId,
  createdAt: row.createdAt.toISOString()
});

const mapFlaggedTurnDetail = (row: Parameters<typeof mapFlaggedTurn>[0] & {
  decisions: Parameters<typeof mapReviewDecision>[0][];
}): FlaggedTurnDetail => ({
  ...mapFlaggedTurn(row),
  decisions: row.decisions.map(mapReviewDecision)
});

export interface FlaggedTurnListFilters {
  courseIds?: string[];
  courseId?: string;
  status?: FlaggedTurnStatus;
}

export const createFlaggedTurn = async (input: FlaggedTurnCreateInput): Promise<FlaggedTurn> => {
  const row = await prisma.flaggedTurn.create({
    data: {
      id: newId(),
      turnId: input.turnId,
      policyId: input.policyId,
      clauseId: input.clauseId,
      courseId: input.courseId,
      learnerId: input.learnerId,
      reason: input.reason
    }
  });

  return mapFlaggedTurn(row);
};

export const findFlaggedTurnByTurnId = async (turnId: string): Promise<FlaggedTurn | null> => {
  const row = await prisma.flaggedTurn.findUnique({ where: { turnId } });
  if (!row) return null;
  return mapFlaggedTurn(row);
};

export const listFlaggedTurns = async (filters: FlaggedTurnListFilters): Promise<FlaggedTurn[]> => {
  const where: Prisma.FlaggedTurnWhereInput = {
    ...(filters.courseId ? { courseId: filters.courseId } : {}),
    ...(filters.courseIds ? { courseId: { in: filters.courseIds } } : {}),
    ...(filters.status ? { status: filters.status } : {})
  };

  const rows = await prisma.flaggedTurn.findMany({
    where,
    orderBy: { createdAt: "desc" }
  });

  return rows.map(mapFlaggedTurn);
};

export const findFlaggedTurnById = async (flagId: string): Promise<FlaggedTurnDetail | null> => {
  const row = await prisma.flaggedTurn.findUnique({
    where: { id: flagId },
    include: { decisions: { orderBy: { createdAt: "asc" } } }
  });
  if (!row) return null;
  return mapFlaggedTurnDetail(row);
};

export type CreateReviewDecisionResult =
  | { status: "created"; decision: ReviewDecision }
  | { status: "not_found" }
  | { status: "already_resolved" };

export const createReviewDecision = async (input: ReviewDecisionCreateInput): Promise<CreateReviewDecisionResult> => {
  const decision = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const flag = await tx.flaggedTurn.findUnique({ where: { id: input.flagId } });
    if (!flag) return { status: "not_found" as const };

    const resolved = await tx.flaggedTurn.updateMany({
      where: {
        id: flag.id,
        status: "pending"
      },
      data: {
        status: "resolved",
        resolvedAt: new Date()
      }
    });

    if (resolved.count === 0) {
      return { status: "already_resolved" as const };
    }

    const created = await tx.reviewDecision.create({
      data: {
        id: newId(),
        flagId: flag.id,
        reviewerId: input.reviewerId,
        decision: input.decision as ReviewDecisionType,
        note: input.note,
        policyId: flag.policyId,
        clauseId: flag.clauseId,
        courseId: flag.courseId
      }
    });

    return { status: "created" as const, decision: mapReviewDecision(created) };
  });

  return decision;
};
