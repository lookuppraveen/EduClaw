import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../common/async-handler.js";
import { listFerpaScopeRecords } from "../../repositories/prisma/audit.repository.js";

const ferpaScopeQuerySchema = z.object({
  learnerId: z.string().min(1).max(120).optional(),
  scope: z.enum(["course_context", "prior_conversations", "advisor_visibility", "third_party_tools"]).optional(),
  enabled: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  cursor: z.string().min(1).optional()
});

export const auditRouter = Router();

auditRouter.get("/ferpa-scope", asyncHandler(async (req, res) => {
  const query = ferpaScopeQuerySchema.parse(req.query);
  const page = await listFerpaScopeRecords(query);

  return res.status(200).json({
    records: page.records,
    page: {
      limit: query.limit,
      nextCursor: page.nextCursor
    }
  });
}));
