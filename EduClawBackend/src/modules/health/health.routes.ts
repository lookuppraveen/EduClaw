import { Router } from "express";
import { prisma } from "../../db/prisma.js";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  return res.status(200).json({ status: "ok" });
});

healthRouter.get("/ready", async (_req, res) => {
  const checkedAt = new Date().toISOString();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      status: "ready",
      checkedAt,
      checks: {
        database: { status: "ok" }
      }
    });
  } catch {
    return res.status(503).json({
      status: "not_ready",
      checkedAt,
      checks: {
        database: { status: "unavailable" }
      }
    });
  }
});
