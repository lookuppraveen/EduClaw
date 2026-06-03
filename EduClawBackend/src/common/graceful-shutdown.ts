import type { Server } from "node:http";

type ShutdownSignal = "SIGINT" | "SIGTERM";

type ShutdownLogger = {
  error: (...args: unknown[]) => void;
  log: (...args: unknown[]) => void;
};

type GracefulShutdownOptions = {
  server: Server;
  disconnect: () => Promise<void>;
  signals?: ShutdownSignal[];
  timeoutMs?: number;
  logger?: ShutdownLogger;
  exit?: (code: number) => void;
};

type GracefulShutdownHandle = {
  shutdown: (signal: ShutdownSignal) => Promise<void>;
  dispose: () => void;
};

const closeServer = async (server: Server): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
};

export const setupGracefulShutdown = ({
  server,
  disconnect,
  signals = ["SIGTERM", "SIGINT"],
  timeoutMs = 10_000,
  logger = console,
  exit = process.exit
}: GracefulShutdownOptions): GracefulShutdownHandle => {
  let isShuttingDown = false;

  const shutdown = async (signal: ShutdownSignal): Promise<void> => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    logger.log(`Received ${signal}; shutting down gracefully`);

    const timeout = setTimeout(() => {
      logger.error(`Graceful shutdown exceeded ${timeoutMs}ms; forcing exit`);
      exit(1);
    }, timeoutMs);
    timeout.unref();

    try {
      await closeServer(server);
      await disconnect();
      clearTimeout(timeout);
      logger.log("Graceful shutdown complete");
      exit(0);
    } catch (error) {
      clearTimeout(timeout);
      logger.error("Graceful shutdown failed", error);
      exit(1);
    }
  };

  const handlers = signals.map((signal) => {
    const handler = (): void => {
      void shutdown(signal);
    };

    process.once(signal, handler);
    return { handler, signal };
  });

  return {
    shutdown,
    dispose: () => {
      for (const { handler, signal } of handlers) {
        process.off(signal, handler);
      }
    }
  };
};
