import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { beforeAll, beforeEach } from "vitest";
import { seedDatabase } from "../prisma/seed.js";

config({ path: ".env.test", override: true });

const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.$connect();
});

beforeEach(async () => {
  await seedDatabase(prisma);
});
