import type { Prisma } from "@prisma/client";
import { newId } from "../../common/crypto.js";
import { prisma } from "../../db/prisma.js";
import type { PolicyClause, PolicyViolationAction, ValidationPolicy } from "../../types/policies.js";

export interface PolicyClauseInput {
  rule: string;
  when: string;
  onViolation: PolicyViolationAction;
}

export interface PolicyCreateInput {
  courseId: string;
  assignmentId: string | null;
  title: string;
  clauses: PolicyClauseInput[];
  actorUserId: string;
}

export interface PolicyUpdateInput {
  assignmentId?: string | null;
  title?: string;
  clauses?: PolicyClauseInput[];
  actorUserId: string;
}

const mapClause = (clause: {
  id: string;
  rule: string;
  when: string;
  onViolation: "modify" | "block" | "flag";
  createdAt: Date;
  updatedAt: Date;
}): PolicyClause => ({
  id: clause.id,
  rule: clause.rule,
  when: clause.when,
  onViolation: clause.onViolation,
  createdAt: clause.createdAt.toISOString(),
  updatedAt: clause.updatedAt.toISOString()
});

const mapPolicy = (policy: {
  id: string;
  courseId: string;
  assignmentId: string | null;
  title: string;
  status: "draft" | "published" | "archived";
  publishedAt: Date | null;
  createdById: string;
  updatedById: string | null;
  createdAt: Date;
  updatedAt: Date;
  clauses: Parameters<typeof mapClause>[0][];
}): ValidationPolicy => ({
  id: policy.id,
  courseId: policy.courseId,
  assignmentId: policy.assignmentId,
  title: policy.title,
  status: policy.status,
  publishedAt: policy.publishedAt?.toISOString() ?? null,
  createdById: policy.createdById,
  updatedById: policy.updatedById,
  createdAt: policy.createdAt.toISOString(),
  updatedAt: policy.updatedAt.toISOString(),
  clauses: policy.clauses.map(mapClause)
});

const clauseCreateData = (clauses: PolicyClauseInput[], policyId: string): Prisma.PolicyClauseCreateManyInput[] =>
  clauses.map((clause) => ({
    id: newId(),
    policyId,
    rule: clause.rule,
    when: clause.when,
    onViolation: clause.onViolation
  }));

const nestedClauseCreateData = (clauses: PolicyClauseInput[]): Prisma.PolicyClauseCreateWithoutPolicyInput[] =>
  clauses.map((clause) => ({
    id: newId(),
    rule: clause.rule,
    when: clause.when,
    onViolation: clause.onViolation
  }));

export const listPolicies = async (filters: {
  courseIds?: string[];
  courseId?: string;
  assignmentId?: string | null;
}): Promise<ValidationPolicy[]> => {
  const courseFilter = filters.courseId
    ? { courseId: filters.courseId }
    : filters.courseIds
      ? { courseId: { in: filters.courseIds } }
      : {};

  const policies = await prisma.validationPolicy.findMany({
    where: {
      ...courseFilter,
      ...(filters.assignmentId !== undefined ? { assignmentId: filters.assignmentId } : {}),
      deletedAt: null
    },
    include: { clauses: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" }
  });

  return policies.map(mapPolicy);
};

export const findPolicyById = async (policyId: string): Promise<ValidationPolicy | null> => {
  const policy = await prisma.validationPolicy.findFirst({
    where: { id: policyId, deletedAt: null },
    include: { clauses: { orderBy: { createdAt: "asc" } } }
  });
  if (!policy) return null;
  return mapPolicy(policy);
};

export const createPolicy = async (input: PolicyCreateInput): Promise<ValidationPolicy> => {
  const policyId = newId();
  const created = await prisma.validationPolicy.create({
    data: {
      id: policyId,
      courseId: input.courseId,
      assignmentId: input.assignmentId,
      title: input.title,
      createdById: input.actorUserId,
      clauses: {
        create: nestedClauseCreateData(input.clauses)
      }
    },
    include: { clauses: { orderBy: { createdAt: "asc" } } }
  });

  return mapPolicy(created);
};

export const updatePolicy = async (policyId: string, input: PolicyUpdateInput): Promise<ValidationPolicy> => {
  const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    if (input.clauses) {
      await tx.policyClause.deleteMany({ where: { policyId } });
      if (input.clauses.length > 0) {
        await tx.policyClause.createMany({ data: clauseCreateData(input.clauses, policyId) });
      }
    }

    return await tx.validationPolicy.update({
      where: { id: policyId },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.assignmentId !== undefined ? { assignmentId: input.assignmentId } : {}),
        updatedById: input.actorUserId,
        status: "draft",
        publishedAt: null
      },
      include: { clauses: { orderBy: { createdAt: "asc" } } }
    });
  });

  return mapPolicy(updated);
};

export const publishPolicy = async (policyId: string, actorUserId: string): Promise<ValidationPolicy> => {
  const policy = await prisma.validationPolicy.update({
    where: { id: policyId },
    data: {
      status: "published",
      publishedAt: new Date(),
      updatedById: actorUserId
    },
    include: { clauses: { orderBy: { createdAt: "asc" } } }
  });

  return mapPolicy(policy);
};

export const archivePolicy = async (policyId: string, actorUserId: string): Promise<void> => {
  await prisma.validationPolicy.update({
    where: { id: policyId },
    data: {
      status: "archived",
      updatedById: actorUserId,
      deletedAt: new Date()
    }
  });
};
