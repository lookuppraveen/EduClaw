import { app } from "./app.js";
import { env } from "./config/env.js";
import { setupGracefulShutdown } from "./common/graceful-shutdown.js";
import { prisma } from "./db/prisma.js";

const server = app.listen(env.PORT, () => {
  console.log(`EduClaw backend running on port ${env.PORT}`);
});

setupGracefulShutdown({
  server,
  disconnect: () => prisma.$disconnect()
});
