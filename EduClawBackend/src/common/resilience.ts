import { HttpError } from "./errors.js";

interface CircuitState {
  failures: number;
  openedUntil: number;
}

export interface ResilienceOptions<T = unknown> {
  circuitName: string;
  maxAttempts?: number;
  retryDelayMs?: number;
  failureThreshold?: number;
  openMs?: number;
  isFailureResult?: (result: T) => boolean;
  createResultFailureError?: (result: T) => unknown;
}

const circuits = new Map<string, CircuitState>();

const delay = async (milliseconds: number): Promise<void> => {
  if (milliseconds <= 0) return;
  await new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
};

const getCircuitState = (name: string): CircuitState => {
  const existing = circuits.get(name);
  if (existing) return existing;

  const created = { failures: 0, openedUntil: 0 };
  circuits.set(name, created);
  return created;
};

const recordSuccess = (name: string): void => {
  circuits.set(name, { failures: 0, openedUntil: 0 });
};

const recordFailure = (name: string, failureThreshold: number, openMs: number): void => {
  const state = getCircuitState(name);
  const failures = state.failures + 1;
  circuits.set(name, {
    failures,
    openedUntil: failures >= failureThreshold ? Date.now() + openMs : state.openedUntil
  });
};

export const resetCircuitBreakers = (): void => {
  circuits.clear();
};

export const runWithRetryAndCircuitBreaker = async <T>(
  operation: () => Promise<T>,
  options: ResilienceOptions<T>
): Promise<T> => {
  const maxAttempts = options.maxAttempts ?? 2;
  const retryDelayMs = options.retryDelayMs ?? 100;
  const failureThreshold = options.failureThreshold ?? 3;
  const openMs = options.openMs ?? 30_000;
  const state = getCircuitState(options.circuitName);

  if (state.openedUntil > Date.now()) {
    throw new HttpError(503, "EXTERNAL_CIRCUIT_OPEN", "External dependency circuit is open", {
      circuitName: options.circuitName,
      retryAfterSeconds: Math.ceil((state.openedUntil - Date.now()) / 1000)
    });
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let result: T;
    try {
      result = await operation();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await delay(retryDelayMs);
      }
      continue;
    }

    if (options.isFailureResult?.(result)) {
      recordFailure(options.circuitName, failureThreshold, openMs);
      throw options.createResultFailureError?.(result) ?? new HttpError(
        503,
        "EXTERNAL_DEPENDENCY_UNAVAILABLE",
        "External dependency is unavailable"
      );
    }

    recordSuccess(options.circuitName);
    return result;
  }

  recordFailure(options.circuitName, failureThreshold, openMs);
  throw lastError;
};
