import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const redactDatabaseUrl = (value) => {
  if (!value) {
    return "(not set)";
  }

  try {
    const url = new URL(value);
    if (url.password) {
      url.password = "****";
    }
    return url.toString();
  } catch {
    return "(invalid DATABASE_URL)";
  }
};

try {
  await prisma.$queryRawUnsafe("select 1");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Unable to connect to the test database before running Prisma migrations.");
  console.error(`Resolved DATABASE_URL: ${redactDatabaseUrl(process.env.DATABASE_URL)}`);
  console.error("");
  console.error("Expected test database:");
  console.error("  role: educlaw");
  console.error("  password: educlaw");
  console.error("  database: educlaw_test");
  console.error("");
  console.error("Fix options:");
  console.error("  1. Set TEST_DATABASE_ADMIN_URL and run `npm run test:db:setup`.");
  console.error("  2. Set TEST_DATABASE_URL to a reachable PostgreSQL test database.");
  console.error("");
  console.error(message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
