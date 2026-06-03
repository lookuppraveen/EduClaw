import { config } from "dotenv";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";

config({ path: ".env.test", override: false });

if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

const [, , command, ...args] = process.argv;

if (!command) {
  process.exitCode = 1;
  throw new Error("Missing command to execute");
}

const packageForCommand = {
  prisma: "prisma",
  tsx: "tsx",
  vitest: "vitest"
};

const resolveNodeBin = async (name) => {
  const packageName = packageForCommand[name];
  if (!packageName) {
    return null;
  }

  const packageRoot = join(process.cwd(), "node_modules", packageName);
  const packageJsonPath = join(packageRoot, "package.json");
  if (!existsSync(packageJsonPath)) {
    return null;
  }

  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
  const bin = typeof packageJson.bin === "string" ? packageJson.bin : packageJson.bin?.[name];
  if (typeof bin !== "string") {
    return null;
  }

  const binPath = join(packageRoot, bin);
  return existsSync(binPath) ? binPath : null;
};

const nodeBin = await resolveNodeBin(command);
const child = nodeBin
  ? spawn(process.execPath, [nodeBin, ...args], {
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    })
  : spawn(command, args, {
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_ENV: "test"
      }
    });

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
