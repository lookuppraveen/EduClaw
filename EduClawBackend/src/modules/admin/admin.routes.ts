import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../common/async-handler.js";
import { HttpError } from "../../common/errors.js";
import { renderPrometheusMetrics } from "../../common/metrics.js";
import { createAuditLog, getAdminKpis, listAuditLogs, listIntegrationStatuses, updateIntegrationStatus } from "../../repositories/prisma/admin.repository.js";

const integrationStatusSchema = z.object({
  displayName: z.string().min(1).max(120).optional(),
  status: z.enum(["connected", "degraded", "disconnected"]),
  details: z.string().min(1).max(1000)
});

const auditLogQuerySchema = z.object({
  action: z.string().min(1).max(120).optional(),
  targetType: z.string().min(1).max(120).optional(),
  actorUserId: z.string().min(1).max(120).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  cursor: z.string().min(1).optional()
});

const requireParam = (value: string | string[] | undefined, name: string): string => {
  if (typeof value !== "string" || value.length === 0) {
    throw new HttpError(400, "VALIDATION_ERROR", `Missing or invalid path parameter: ${name}`);
  }
  return value;
};

export const adminRouter = Router();

adminRouter.get("/kpis", asyncHandler(async (_req, res) => {
  const kpis = await getAdminKpis();
  return res.status(200).json({ kpis });
}));

adminRouter.get("/metrics", (_req, res) => {
  res.setHeader("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
  return res.status(200).send(renderPrometheusMetrics());
});

adminRouter.get("/integrations", asyncHandler(async (_req, res) => {
  const integrations = await listIntegrationStatuses();
  return res.status(200).json({ integrations });
}));

adminRouter.put("/integrations/:name", asyncHandler(async (req, res) => {
  const authUser = req.authUser;
  if (!authUser) {
    throw new HttpError(401, "AUTH_UNAUTHORIZED", "Unauthorized");
  }

  const name = requireParam(req.params.name, "name");
  const body = integrationStatusSchema.parse(req.body);
  const integration = await updateIntegrationStatus(name, body);

  await createAuditLog({
    actorUserId: authUser.id,
    action: "integration.update",
    targetType: "integration",
    targetId: name,
    metadata: {
      status: body.status,
      details: body.details
    }
  });

  return res.status(200).json({ integration });
}));

adminRouter.get("/audit-logs", asyncHandler(async (req, res) => {
  const query = auditLogQuerySchema.parse(req.query);
  const page = await listAuditLogs(query);

  return res.status(200).json({
    logs: page.logs,
    page: {
      limit: query.limit,
      nextCursor: page.nextCursor
    }
  });
}));
