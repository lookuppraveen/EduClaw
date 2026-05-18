import { config } from "dotenv";
import { spawn } from "node:child_process";

config({ path: ".env.test", override: true });

const [, , command, ...args] = process.argv;

if (!command) {
  process.exitCode = 1;
  throw new Error("Missing command to execute");
}

const child = spawn(command, args, {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: "test"
  }
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
