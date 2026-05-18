import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../common/async-handler.js";
import { HttpError } from "../../common/errors.js";
import {
  hasCourseEnrollmentRole,
  listCourseIdsForEnrollmentRole
} from "../../repositories/prisma/course.repository.js";
import {
  archivePolicy,
  createPolicy,
  findPolicyById,
  listPolicies,
  publishPolicy,
  updatePolicy
} from "../../repositories/prisma/policy.repository.js";
import type { UserRole } from "../../types/auth.js";
import type { ValidationPolicy } from "../../types/policies.js";

const policyClauseSchema = z.object({
  rule: z.string().min(1).max(1000),
  when: z.string().min(1).max(1000),
  onViolation: z.enum(["modify", "block", "flag"])
});

const createPolicySchema = z.object({
  courseId: z.string().min(1),
  assignmentId: z.string().min(1).nullable().optional(),
  title: z.string().min(1).max(200),
  clauses: z.array(policyClauseSchema).default([])
});

const updatePolicySchema = z.object({
  assignmentId: z.string().min(1).nullable().optional(),
  title: z.string().min(1).max(200).optional(),
  clauses: z.array(policyClauseSchema).optional()
}).refine((value) => value.assignmentId !== undefined || value.title !== undefined || value.clauses !== undefined, {
  message: "At least one policy field must be provided"
});

const listPolicyQuerySchema = z.object({
  courseId: z.string().min(1).optional(),
  assignmentId: z.string().min(1).nullable().optional()
});

const requireParam = (value: string | string[] | undefined, name: string): string => {
  if (typeof value !== "string" || value.length === 0) {
    throw new HttpError(400, "VALIDATION_ERROR", `Missing or invalid path parameter: ${name}`);
  }
  return value;
};

const hasRole = (roles: UserRole[], role: UserRole): boolean => roles.includes(role);

const assertPolicyWriteAccess = async (actorUserId: string, actorRoles: UserRole[], courseId: string): Promise<void> => {
  if (hasRole(actorRoles, "admin")) {
    return;
  }

  if (hasRole(actorRoles, "faculty") && (await hasCourseEnrollmentRole(actorUserId, courseId, ["faculty"]))) {
    return;
  }

  throw new HttpError(403, "POLICY_FORBIDDEN", "Insufficient permissions for this course policy");
};

const assertExistingPolicyAccess = async (
  actorUserId: string,
  actorRoles: UserRole[],
  policyId: string
): Promise<ValidationPolicy> => {
  const policy = await findPolicyById(policyId);
  if (!policy) {
    throw new HttpError(404, "POLICY_NOT_FOUND", "Validation policy not found");
  }

  await assertPolicyWriteAccess(actorUserId, actorRoles, policy.courseId);
  return policy;
};

export const policiesRouter = Router();

policiesRouter.get("/", asyncHandler(async (req, res) => {
  const authUser = req.authUser;
  if (!authUser) {
    throw new HttpError(401, "AUTH_UNAUTHORIZED", "Unauthorized");
  }

  const query = listPolicyQuerySchema.parse(req.query);
  if (query.courseId) {
    await assertPolicyWriteAccess(authUser.id, authUser.roles, query.courseId);
    const policies = await listPolicies({
      courseId: query.courseId,
      assignmentId: query.assignmentId
    });
    return res.status(200).json({ policies });
  }

  const courseIds = hasRole(authUser.roles, "admin")
    ? undefined
    : await listCourseIdsForEnrollmentRole(authUser.id, ["faculty"]);
  const policies = await listPolicies({ courseIds, assignmentId: query.assignmentId });
  return res.status(200).json({ policies });
}));

policiesRouter.post("/", asyncHandler(async (req, res) => {
  const authUser = req.authUser;
  if (!authUser) {
    throw new HttpError(401, "AUTH_UNAUTHORIZED", "Unauthorized");
  }

  const body = createPolicySchema.parse(req.body);
  await assertPolicyWriteAccess(authUser.id, authUser.roles, body.courseId);

  const policy = await createPolicy({
    courseId: body.courseId,
    assignmentId: body.assignmentId ?? null,
    title: body.title,
    clauses: body.clauses,
    actorUserId: authUser.id
  });

  return res.status(201).json({ policy });
}));

policiesRouter.get("/:policyId", asyncHandler(async (req, res) => {
  const authUser = req.authUser;
  if (!authUser) {
    throw new HttpError(401, "AUTH_UNAUTHORIZED", "Unauthorized");
  }

  const policyId = requireParam(req.params.policyId, "policyId");
  const policy = await assertExistingPolicyAccess(authUser.id, authUser.roles, policyId);

  return res.status(200).json({ policy });
}));

policiesRouter.put("/:policyId", asyncHandler(async (req, res) => {
  const authUser = req.authUser;
  if (!authUser) {
    throw new HttpError(401, "AUTH_UNAUTHORIZED", "Unauthorized");
  }

  const policyId = requireParam(req.params.policyId, "policyId");
  await assertExistingPolicyAccess(authUser.id, authUser.roles, policyId);
  const body = updatePolicySchema.parse(req.body);

  const policy = await updatePolicy(policyId, {
    assignmentId: body.assignmentId,
    title: body.title,
    clauses: body.clauses,
    actorUserId: authUser.id
  });

  return res.status(200).json({ policy });
}));

policiesRouter.delete("/:policyId", asyncHandler(async (req, res) => {
  const authUser = req.authUser;
  if (!authUser) {
    throw new HttpError(401, "AUTH_UNAUTHORIZED", "Unauthorized");
  }

  const policyId = requireParam(req.params.policyId, "policyId");
  await assertExistingPolicyAccess(authUser.id, authUser.roles, policyId);
  await archivePolicy(policyId, authUser.id);

  return res.status(204).send();
}));

policiesRouter.post("/:policyId/publish", asyncHandler(async (req, res) => {
  const authUser = req.authUser;
  if (!authUser) {
    throw new HttpError(401, "AUTH_UNAUTHORIZED", "Unauthorized");
  }

  const policyId = requireParam(req.params.policyId, "policyId");
  const current = await assertExistingPolicyAccess(authUser.id, authUser.roles, policyId);
  if (current.clauses.length === 0) {
    throw new HttpError(422, "POLICY_EMPTY", "Cannot publish a policy without clauses");
  }

  const policy = await publishPolicy(policyId, authUser.id);
  return res.status(200).json({ policy });
}));
