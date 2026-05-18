import { Router } from "express";
import { HttpError } from "../../common/errors.js";
import { asyncHandler } from "../../common/async-handler.js";
import { findLearnerState } from "../../repositories/prisma/learner-state.repository.js";
import { assertLearnerReadAccess } from "./abac.js";

const requireParam = (value: string | string[] | undefined, name: string): string => {
  if (typeof value !== "string" || value.length === 0) {
    throw new HttpError(400, "VALIDATION_ERROR", `Missing or invalid path parameter: ${name}`);
  }
  return value;
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
  const state = await findLearnerState(learnerId);
  if (!state) {
    throw new HttpError(404, "LEARNER_STATE_NOT_FOUND", "Learner state not found");
  }

  await assertLearnerReadAccess(authUser.id, authUser.roles, learnerId);

  return res.status(200).json({ reflections: state.reflections });
}));
