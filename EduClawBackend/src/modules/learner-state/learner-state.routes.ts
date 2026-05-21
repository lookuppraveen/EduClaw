import { Router } from "express";
import { z } from "zod";
import { HttpError } from "../../common/errors.js";
import { asyncHandler } from "../../common/async-handler.js";
import { createAuditLog } from "../../repositories/prisma/admin.repository.js";
import { createReflectionEntry, findLearnerState, listReflectionEntries, replaceLearnerGoals } from "../../repositories/prisma/learner-state.repository.js";
import { findUserById } from "../../repositories/prisma/user.repository.js";
import { assertLearnerReadAccess, assertLearnerWriteAccess } from "./abac.js";

const requireParam = (value: string | string[] | undefined, name: string): string => {
  if (typeof value !== "string" || value.length === 0) {
    throw new HttpError(400, "VALIDATION_ERROR", `Missing or invalid path parameter: ${name}`);
  }
  return value;
};

const goalTextSchema = z.string().trim().min(1).max(500);
const goalInputSchema = z.union([
  goalTextSchema.transform((text) => ({ text })),
  z.object({ text: goalTextSchema })
]);

const updateGoalsSchema = z.object({
  goals: z.array(goalInputSchema).max(20)
});

const createReflectionSchema = z.object({
  prompt: z.string().trim().min(1).max(1000),
  response: z.string().trim().min(1).max(5000),
  kind: z.enum(["metacognitive", "goal_check"]).optional().default("metacognitive")
});

const listReflectionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  cursor: z.string().min(1).optional(),
  kind: z.enum(["metacognitive", "goal_check"]).optional()
});

const assertLearnerExists = async (learnerId: string): Promise<void> => {
  const learner = await findUserById(learnerId);
  if (!learner) {
    throw new HttpError(404, "LEARNER_NOT_FOUND", "Learner not found");
  }
};

export const learnerStateRouter = Router();

learnerStateRouter.get("/:learnerId/state", asyncHandler(async (req, res) => {
  const authUser = req.authUser;
  if (!authUser) {
    throw new HttpError(401, "AUTH_UNAUTHORIZED", "Unauthorized");
  }

  const learnerId = requireParam(req.params.learnerId, "learnerId");
  const state = await findLearnerState(learnerId);
  if (!state) {
    throw new HttpError(404, "LEARNER_STATE_NOT_FOUND", "Learner state not found");
  }

  await assertLearnerReadAccess(authUser.id, authUser.roles, learnerId);

  return res.status(200).json({
    learnerId: state.learnerId,
    goals: state.goals,
    mastery: state.mastery,
    reflections: state.reflections
  });
}));

learnerStateRouter.get("/:learnerId/mastery", asyncHandler(async (req, res) => {
  const authUser = req.authUser;
  if (!authUser) {
    throw new HttpError(401, "AUTH_UNAUTHORIZED", "Unauthorized");
  }

  const learnerId = requireParam(req.params.learnerId, "learnerId");
  const state = await findLearnerState(learnerId);
  if (!state) {
    throw new HttpError(404, "LEARNER_STATE_NOT_FOUND", "Learner state not found");
  }

  await assertLearnerReadAccess(authUser.id, authUser.roles, learnerId);

  return res.status(200).json({ mastery: state.mastery });
}));

learnerStateRouter.get("/:learnerId/reflections", asyncHandler(async (req, res) => {
  const authUser = req.authUser;
  if (!authUser) {
    throw new HttpError(401, "AUTH_UNAUTHORIZED", "Unauthorized");
  }

  const learnerId = requireParam(req.params.learnerId, "learnerId");
  await assertLearnerExists(learnerId);

  await assertLearnerReadAccess(authUser.id, authUser.roles, learnerId);

  const query = listReflectionsQuerySchema.parse(req.query);
  const page = await listReflectionEntries(learnerId, query);
  return res.status(200).json({
    reflections: page.reflections,
    page: {
      limit: query.limit,
      nextCursor: page.nextCursor
    }
  });
}));

learnerStateRouter.put("/:learnerId/goals", asyncHandler(async (req, res) => {
  const authUser = req.authUser;
  if (!authUser) {
    throw new HttpError(401, "AUTH_UNAUTHORIZED", "Unauthorized");
  }

  const learnerId = requireParam(req.params.learnerId, "learnerId");
  assertLearnerWriteAccess(authUser.id, learnerId);
  await assertLearnerExists(learnerId);

  const body = updateGoalsSchema.parse(req.body);
  const goals = await replaceLearnerGoals(learnerId, body.goals);
  await createAuditLog({
    actorUserId: authUser.id,
    action: "learner.goals.update",
    targetType: "learner_state",
    targetId: learnerId,
    metadata: {
      goalCount: goals.length
    }
  });

  return res.status(200).json({ learnerId, goals });
}));

learnerStateRouter.post("/:learnerId/reflections", asyncHandler(async (req, res) => {
  const authUser = req.authUser;
  if (!authUser) {
    throw new HttpError(401, "AUTH_UNAUTHORIZED", "Unauthorized");
  }

  const learnerId = requireParam(req.params.learnerId, "learnerId");
  assertLearnerWriteAccess(authUser.id, learnerId);
  await assertLearnerExists(learnerId);

  const body = createReflectionSchema.parse(req.body);
  const reflection = await createReflectionEntry(learnerId, body);
  await createAuditLog({
    actorUserId: authUser.id,
    action: "learner.reflection.create",
    targetType: "reflection_entry",
    targetId: reflection.id,
    metadata: {
      learnerId,
      kind: reflection.kind
    }
  });

  return res.status(201).json({ learnerId, reflection });
}));
