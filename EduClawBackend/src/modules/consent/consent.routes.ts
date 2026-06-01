import { Router } from "express";
import { z } from "zod";
import { HttpError } from "../../common/errors.js";
import { asyncHandler } from "../../common/async-handler.js";
import { getConsentRecord, listConsentEvents, updateConsentRecord } from "../../repositories/prisma/consent.repository.js";
import { createAuditLog } from "../../repositories/prisma/admin.repository.js";
import { assertConsentWriteAccess } from "../learner-state/abac.js";
import type { UserRole } from "../../types/auth.js";

const consentScopeKeys = ["course_context", "prior_conversations", "advisor_visibility", "third_party_tools"] as const;

const consentScopeSchema = z.object({
  key: z.enum(consentScopeKeys),
  enabled: z.boolean()
});

const updateConsentSchema = z.object({
  scopes: z.array(consentScopeSchema).length(consentScopeKeys.length),
  reason: z.string().min(1).max(500).optional()
}).superRefine((value, context) => {
  const keys = value.scopes.map((scope) => scope.key);
  const uniqueKeys = new Set(keys);

  if (uniqueKeys.size !== keys.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["scopes"],
      message: "Consent scopes must not contain duplicate keys"
    });
  }

  for (const key of consentScopeKeys) {
    if (!uniqueKeys.has(key)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scopes"],
        message: `Consent scope '${key}' is required`
      });
    }
  }
});

const hasRole = (roles: UserRole[], role: UserRole): boolean => roles.includes(role);

const requireParam = (value: string | string[] | undefined, name: string): string => {
  if (typeof value !== "string" || value.length === 0) {
    throw new HttpError(400, "VALIDATION_ERROR", `Missing or invalid path parameter: ${name}`);
  }
  return value;
};

const assertConsentHistoryReadAccess = (actorUserId: string, actorRoles: UserRole[], learnerId: string): void => {
  if (actorUserId === learnerId || hasRole(actorRoles, "admin") || hasRole(actorRoles, "auditor")) {
    return;
  }

  throw new HttpError(403, "CONSENT_FORBIDDEN", "Insufficient permissions for consent history access");
};

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

consentRouter.get("/:learnerId/history", asyncHandler(async (req, res) => {
  const authUser = req.authUser;
  if (!authUser) {
    throw new HttpError(401, "AUTH_UNAUTHORIZED", "Unauthorized");
  }

  const learnerId = requireParam(req.params.learnerId, "learnerId");
  assertConsentHistoryReadAccess(authUser.id, authUser.roles, learnerId);

  const events = await listConsentEvents(learnerId);
  return res.status(200).json({ learnerId, events });
}));
