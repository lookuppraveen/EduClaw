import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../common/async-handler.js";
import { HttpError } from "../../common/errors.js";
import { createAuditLog } from "../../repositories/prisma/admin.repository.js";
import { ReviewService } from "./services/review.service.js";

const listQuerySchema = z.object({
  courseId: z.string().min(1).optional(),
  status: z.enum(["pending", "resolved"]).optional()
});

const decisionSchema = z.object({
  decision: z.enum(["approve", "override", "escalate"]),
  note: z.string().min(1).max(1000)
});

const requireParam = (value: string | string[] | undefined, name: string): string => {
  if (typeof value !== "string" || value.length === 0) {
    throw new HttpError(400, "VALIDATION_ERROR", `Missing or invalid path parameter: ${name}`);
  }
  return value;
};

const service = new ReviewService();

export const reviewsRouter = Router();

reviewsRouter.get("/flagged", asyncHandler(async (req, res) => {
  const authUser = req.authUser;
  if (!authUser) {
    throw new HttpError(401, "AUTH_UNAUTHORIZED", "Unauthorized");
  }

  const query = listQuerySchema.parse(req.query);
  const flagged = await service.listFlaggedReviews(
    { userId: authUser.id, roles: authUser.roles },
    query
  );

  return res.status(200).json({ flagged });
}));

reviewsRouter.get("/flagged/:flagId", asyncHandler(async (req, res) => {
  const authUser = req.authUser;
  if (!authUser) {
    throw new HttpError(401, "AUTH_UNAUTHORIZED", "Unauthorized");
  }

  const flagId = requireParam(req.params.flagId, "flagId");
  const flaggedTurn = await service.getFlaggedReview({ userId: authUser.id, roles: authUser.roles }, flagId);

  return res.status(200).json({ flaggedTurn });
}));

reviewsRouter.post("/flagged/:flagId/decision", asyncHandler(async (req, res) => {
  const authUser = req.authUser;
  if (!authUser) {
    throw new HttpError(401, "AUTH_UNAUTHORIZED", "Unauthorized");
  }

  const flagId = requireParam(req.params.flagId, "flagId");
  const body = decisionSchema.parse(req.body);
  const decision = await service.createDecision(
    { userId: authUser.id, roles: authUser.roles },
    flagId,
    body
  );
  await createAuditLog({
    actorUserId: authUser.id,
    action: "review.decision.create",
    targetType: "review_decision",
    targetId: decision.id,
    metadata: {
      flagId,
      decision: decision.decision,
      courseId: decision.courseId
    }
  });

  return res.status(201).json({ decision });
}));
