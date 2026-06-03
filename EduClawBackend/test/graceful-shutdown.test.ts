import type { Server } from "node:http";
import { describe, expect, it, vi } from "vitest";
import { setupGracefulShutdown } from "../src/common/graceful-shutdown.js";

const createServer = (close: Server["close"]): Server => {
  return { close } as Server;
};

describe("graceful shutdown", () => {
  it("closes the server, disconnects dependencies, and exits successfully", async () => {
    let server: Server;
    const close = vi.fn<(callback?: (error?: Error) => void) => Server>((callback) => {
      callback?.();
      return server;
    });
    server = createServer(close as Server["close"]);
    const disconnect = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const exit = vi.fn<(code: number) => void>();
    const logger = {
      error: vi.fn(),
      log: vi.fn()
    };

    const handle = setupGracefulShutdown({
      server,
      disconnect,
      exit,
      logger,
      signals: []
    });

    await handle.shutdown("SIGTERM");

    expect(close).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(0);
    expect(logger.log).toHaveBeenCalledWith("Graceful shutdown complete");
  });

  it("exits with failure when server close fails", async () => {
    let server: Server;
    const close = vi.fn<(callback?: (error?: Error) => void) => Server>((callback) => {
      callback?.(new Error("close failed"));
      return server;
    });
    server = createServer(close as Server["close"]);
    const disconnect = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const exit = vi.fn<(code: number) => void>();
    const logger = {
      error: vi.fn(),
      log: vi.fn()
    };

    const handle = setupGracefulShutdown({
      server,
      disconnect,
      exit,
      logger,
      signals: []
    });

    await handle.shutdown("SIGINT");

    expect(close).toHaveBeenCalledTimes(1);
    expect(disconnect).not.toHaveBeenCalled();
    expect(exit).toHaveBeenCalledWith(1);
    expect(logger.error).toHaveBeenCalledWith("Graceful shutdown failed", expect.any(Error));
  });
});
