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
    .optional()
});

export const auditRouter = Router();

auditRouter.get("/ferpa-scope", asyncHandler(async (req, res) => {
  const query = ferpaScopeQuerySchema.parse(req.query);
  const records = await listFerpaScopeRecords(query);

  return res.status(200).json({ records });
}));
