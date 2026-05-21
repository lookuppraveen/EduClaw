import { Router } from "express";
import { z } from "zod";
import { HttpError } from "../../common/errors.js";
import { asyncHandler } from "../../common/async-handler.js";
import { getConsentRecord, listConsentEvents, updateConsentRecord } from "../../repositories/prisma/consent.repository.js";
import { createAuditLog } from "../../repositories/prisma/admin.repository.js";
import { assertConsentWriteAccess } from "../learner-state/abac.js";

const consentScopeSchema = z.object({
  key: z.enum(["course_context", "prior_conversations", "advisor_visibility", "third_party_tools"]),
  enabled: z.boolean()
});

const updateConsentSchema = z.object({
  scopes: z.array(consentScopeSchema).min(1),
  reason: z.string().min(1).max(500).optional()
});

export const consentRouter = Router();

consentRouter.get("/me", asyncHandler(async (req, res) => {
  const authUser = req.authUser;
  if (!authUser) {
    throw new HttpError(401, "AUTH_UNAUTHORIZED", "Unauthorized");
  }

  const consent = await getConsentRecord(authUser.id);
  if (!consent) {
    throw new HttpError(404, "CONSENT_NOT_FOUND", "Consent record not found");
  }

  return res.status(200).json({ consent });
}));

consentRouter.put("/me", asyncHandler(async (req, res) => {
  const authUser = req.authUser;
  if (!authUser) {
    throw new HttpError(401, "AUTH_UNAUTHORIZED", "Unauthorized");
  }

  assertConsentWriteAccess(authUser.id, authUser.id);

  const body = updateConsentSchema.parse(req.body);
  const updated = await updateConsentRecord(authUser.id, authUser.id, body.scopes, body.reason ?? null);
  await createAuditLog({
    actorUserId: authUser.id,
    action: "consent.update",
    targetType: "consent",
    targetId: authUser.id,
    metadata: {
      scopes: body.scopes,
      reason: body.reason ?? null
    }
  });

  return res.status(200).json({ consent: updated });
}));

consentRouter.get("/me/history", asyncHandler(async (req, res) => {
  const authUser = req.authUser;
  if (!authUser) {
    throw new HttpError(401, "AUTH_UNAUTHORIZED", "Unauthorized");
  }

  const events = await listConsentEvents(authUser.id);
  return res.status(200).json({ events });
}));
