import { spawnSync } from "node:child_process";

const runScript = (script) => {
  return spawnSync(process.execPath, [script], {
    env: process.env,
    stdio: "inherit"
  }).status ?? 1;
};

const initialCheck = runScript("scripts/check-test-db.mjs");
if (initialCheck === 0) {
  process.exit(0);
}

if (!process.env.TEST_DATABASE_ADMIN_URL) {
  process.exit(initialCheck);
}

console.error("");
console.error("Attempting to bootstrap the test database with TEST_DATABASE_ADMIN_URL...");

const setup = runScript("scripts/setup-test-db.mjs");
if (setup !== 0) {
  process.exit(setup);
}

process.exit(runScript("scripts/check-test-db.mjs"));
