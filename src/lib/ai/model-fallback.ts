import { extractErrorCode, extractStatus, readRetryAfterMs } from "@/lib/ai/with-retry";

export type ModelFailureKind = "transient" | "terminal" | "unknown";

const TRANSIENT_STATUS = new Set([429, 499, 500, 502, 503, 504]);
const TERMINAL_STATUS = new Set([400, 401, 403, 404, 410, 422]);
const TRANSIENT_NETWORK_CODES = new Set([
  "ECONNRESET",
  "ETIMEDOUT",
  "ENOTFOUND",
  "EAI_AGAIN",
  "ECONNREFUSED",
]);
const TERMINAL_MODEL_PATTERNS = [
  /model.+not found/i,
  /not found for api version/i,
  /unsupported model/i,
  /invalid model/i,
  /model.+does not exist/i,
  /permission denied/i,
];
const TRANSIENT_MESSAGE_FRAGMENTS = [
  "high demand",
  "resource exhausted",
  "temporarily unavailable",
  "service unavailable",
  "unavailable",
  "fetch failed",
  "socket hang up",
];

export const DEFAULT_MODEL_COOLDOWN_MS = 45_000;

export function classifyModelFailure(error: unknown): ModelFailureKind {
  const status = extractStatus(error);
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (status !== null && TERMINAL_STATUS.has(status)) {
    return "terminal";
  }
  if (TERMINAL_MODEL_PATTERNS.some((pattern) => pattern.test(message))) {
    return "terminal";
  }
  if (status !== null && TRANSIENT_STATUS.has(status)) {
    return "transient";
  }
  const code = extractErrorCode(error);
  if (code && TRANSIENT_NETWORK_CODES.has(code)) {
    return "transient";
  }
  if (TRANSIENT_MESSAGE_FRAGMENTS.some((fragment) => message.includes(fragment))) {
    return "transient";
  }
  return "unknown";
}

type ModelState =
  { status: "terminal" } | { status: "cooldown"; availableAfterMs: number };

export type ModelHealthRegistry = {
  isAvailable: (model: string) => boolean;
  markSuccess: (model: string) => void;
  markFailure: (model: string, kind: ModelFailureKind, error?: unknown) => void;
  reset: () => void;
};

export function createModelHealthRegistry(
  options: { now?: () => number; cooldownMs?: number } = {},
): ModelHealthRegistry {
  const now = options.now ?? (() => Date.now());
  const cooldownMs = options.cooldownMs ?? DEFAULT_MODEL_COOLDOWN_MS;
  const states = new Map<string, ModelState>();

  function isAvailable(model: string): boolean {
    const state = states.get(model);
    if (!state) {
      return true;
    }
    if (state.status === "terminal") {
      return false;
    }
    if (state.availableAfterMs > now()) {
      return false;
    }
    states.delete(model);
    return true;
  }

  return {
    isAvailable,
    markSuccess(model) {
      states.delete(model);
    },
    markFailure(model, kind, error) {
      if (kind === "terminal") {
        states.set(model, { status: "terminal" });
        return;
      }
      if (kind === "transient") {
        const retryAfterMs = readRetryAfterMs(error) ?? 0;
        states.set(model, {
          status: "cooldown",
          availableAfterMs: now() + Math.max(cooldownMs, retryAfterMs),
        });
      }
    },
    reset() {
      states.clear();
    },
  };
}

const sharedRegistry = createModelHealthRegistry();

export function getSharedModelHealthRegistry(): ModelHealthRegistry {
  return sharedRegistry;
}

export function resetSharedModelHealthRegistryForTests(): void {
  sharedRegistry.reset();
}

/**
 * Runs `execute` across a model fallback chain. Transient/terminal failures
 * mark the model unhealthy and advance to the next model; an `unknown` failure
 * is treated as a real error and rethrown immediately.
 */
export async function runWithModelFallback<T>(params: {
  models: readonly string[];
  execute: (model: string) => Promise<T>;
  registry?: ModelHealthRegistry;
}): Promise<T> {
  const registry = params.registry ?? sharedRegistry;
  let lastError: unknown = null;
  let attempted = 0;

  for (const model of params.models) {
    if (!registry.isAvailable(model)) {
      continue;
    }
    attempted += 1;
    try {
      const result = await params.execute(model);
      registry.markSuccess(model);
      return result;
    } catch (error) {
      const kind = classifyModelFailure(error);
      registry.markFailure(model, kind, error);
      lastError = error;
      if (kind === "unknown") {
        throw error;
      }
    }
  }

  if (attempted === 0) {
    throw lastError ?? new Error("No Gemini models are currently available");
  }
  throw lastError instanceof Error ? lastError : new Error("Gemini request failed");
}
