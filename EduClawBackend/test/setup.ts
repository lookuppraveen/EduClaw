import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { beforeAll, beforeEach } from "vitest";
import { seedDatabase } from "../prisma/seed.js";
import { resetIdempotencyState } from "../src/common/idempotency-middleware.js";
import { resetHttpMetrics } from "../src/common/metrics.js";
import { resetRateLimitState } from "../src/common/rate-limit-middleware.js";

config({ path: ".env.test", override: true });

const prisma = new PrismaClient();

if (process.env.SKIP_DB_SETUP !== "true") {
  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await resetIdempotencyState();
    await resetHttpMetrics();
    await resetRateLimitState();
    await seedDatabase(prisma);
  });
}
