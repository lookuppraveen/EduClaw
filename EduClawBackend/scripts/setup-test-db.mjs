import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";

config({ path: ".env.test", override: false });

const targetDatabaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const adminDatabaseUrl = process.env.TEST_DATABASE_ADMIN_URL;

const quoteIdentifier = (value) => `"${value.replaceAll("\"", "\"\"")}"`;
const quoteLiteral = (value) => `'${value.replaceAll("'", "''")}'`;

const redactDatabaseUrl = (value) => {
  if (!value) return "(not set)";

  try {
    const url = new URL(value);
    if (url.password) url.password = "****";
    return url.toString();
  } catch {
    return "(invalid database URL)";
  }
};

const parseTargetDatabase = (value) => {
  if (!value) {
    throw new Error("DATABASE_URL or TEST_DATABASE_URL is required");
  }

  const url = new URL(value);
  const database = url.pathname.replace(/^\//, "");
  if (!url.username || !url.password || !database) {
    throw new Error("Test database URL must include username, password, and database name");
  }

  return {
    database,
    password: decodeURIComponent(url.password),
    username: decodeURIComponent(url.username)
  };
};

if (!adminDatabaseUrl) {
  console.error("TEST_DATABASE_ADMIN_URL is required to bootstrap the test database.");
  console.error("It should point to an existing PostgreSQL database with permission to create roles and databases.");
  console.error("Example:");
  console.error("  TEST_DATABASE_ADMIN_URL=postgresql://postgres:password@localhost:5432/postgres?schema=public");
  process.exit(1);
}

const target = parseTargetDatabase(targetDatabaseUrl);
const admin = new PrismaClient({
  datasources: {
    db: {
      url: adminDatabaseUrl
    }
  }
});

try {
  const roles = await admin.$queryRawUnsafe(
    "select 1 from pg_roles where rolname = $1",
    target.username
  );
  if (roles.length === 0) {
    await admin.$executeRawUnsafe(
      `create role ${quoteIdentifier(target.username)} with login password ${quoteLiteral(target.password)}`
    );
  } else {
    await admin.$executeRawUnsafe(
      `alter role ${quoteIdentifier(target.username)} with login password ${quoteLiteral(target.password)}`
    );
  }

  const databases = await admin.$queryRawUnsafe(
    "select 1 from pg_database where datname = $1",
    target.database
  );
  if (databases.length === 0) {
    await admin.$executeRawUnsafe(
      `create database ${quoteIdentifier(target.database)} owner ${quoteIdentifier(target.username)}`
    );
  }

  console.log("Test database is ready.");
  console.log(`Target: ${redactDatabaseUrl(targetDatabaseUrl)}`);
} catch (error) {
  console.error("Unable to bootstrap the test database.");
  console.error(`Admin URL: ${redactDatabaseUrl(adminDatabaseUrl)}`);
  console.error(`Target URL: ${redactDatabaseUrl(targetDatabaseUrl)}`);
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await admin.$disconnect();
}
