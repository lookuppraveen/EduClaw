import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  await prisma.$queryRawUnsafe("select 1");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Unable to connect to the test database before running Prisma migrations.");
  console.error("Check DATABASE_URL, PostgreSQL availability, database name, username, and password.");
  console.error(message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
