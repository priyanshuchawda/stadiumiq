import { parseGoogleRetryInfoMs } from "@/lib/ai/google-error-details";

export { parseGoogleRetryInfoMs };

export type RetryOptions = {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitterRatio?: number;
  shouldRetry?: (error: unknown) => boolean;
  sleep?: (ms: number) => Promise<void>;
  randomFn?: () => number;
  onRetry?: (attempt: number, error: unknown, delayMs: number) => void;
  signal?: AbortSignal | undefined;
};

/**
 * Thrown when the model returns a structurally empty response (no text, no tool
 * calls). Treated as a retryable/transient condition so a retry or model
 * fallback can recover, mirroring Gemini CLI's `shouldRetryOnContent`.
 */
export class EmptyModelResponseError extends Error {
  constructor(message = "Empty response from model") {
    super(message);
    this.name = "EmptyModelResponseError";
  }
}

const DEFAULTS = {
  maxRetries: 2,
  baseDelayMs: 400,
  maxDelayMs: 4_000,
  jitterRatio: 0.25,
} as const;

const RETRYABLE_STATUS = new Set([429, 499, 500, 502, 503, 504]);
const RETRYABLE_NETWORK_CODES = new Set([
  "ECONNRESET",
  "ETIMEDOUT",
  "EPIPE",
  "ENOTFOUND",
  "EAI_AGAIN",
  "ECONNREFUSED",
  "EPROTO",
]);
const RETRYABLE_MESSAGE_FRAGMENTS = [
  "fetch failed",
  "socket hang up",
  "incomplete json",
  "temporarily unavailable",
  "service unavailable",
  "resource exhausted",
  "high demand",
];

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function extractStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") {
    return null;
  }
  if ("status" in error) {
    return readNumber((error as { status: unknown }).status);
  }
  if ("statusCode" in error) {
    return readNumber((error as { statusCode: unknown }).statusCode);
  }
  return null;
}

export function extractErrorCode(error: unknown): string | null {
  let current: unknown = error;
  for (let depth = 0; depth < 5; depth += 1) {
    if (!current || typeof current !== "object") {
      return null;
    }
    if ("code" in current && typeof (current as { code: unknown }).code === "string") {
      return (current as { code: string }).code;
    }
    if (!("cause" in current)) {
      return null;
    }
    current = (current as { cause: unknown }).cause;
  }
  return null;
}

function readRetryAfterSeconds(raw: string): number | null {
  const numeric = Number(raw);
  if (Number.isFinite(numeric) && numeric > 0) {
    return Math.round(numeric * 1_000);
  }
  const parsedDate = Date.parse(raw);
  if (!Number.isFinite(parsedDate)) {
    return null;
  }
  const delay = parsedDate - Date.now();
  return delay > 0 ? delay : null;
}

export function readRetryAfterMs(error: unknown): number | null {
  if (!error || typeof error !== "object") {
    return null;
  }
  const record = error as Record<string, unknown>;
  if (typeof record["retryAfter"] === "string") {
    return readRetryAfterSeconds(record["retryAfter"].trim());
  }
  const headers = record["headers"];
  if (headers && typeof headers === "object" && "get" in headers) {
    const getter = (headers as { get: (name: string) => unknown }).get;
    if (typeof getter === "function") {
      const value = getter.call(headers, "retry-after");
      if (typeof value === "string" && value.trim().length > 0) {
        return readRetryAfterSeconds(value.trim());
      }
    }
  }
  return parseGoogleRetryInfoMs(error);
}

export type RetryErrorType =
  "rate_limit" | "server" | "network" | "empty" | "client" | "unknown";

/**
 * Coarse, PII-free classification of a failure for telemetry/logging — never
 * includes the raw error message (which may echo user input or provider detail).
 */
export function getRetryErrorType(error: unknown): RetryErrorType {
  if (error instanceof EmptyModelResponseError) {
    return "empty";
  }
  const status = extractStatus(error);
  if (status === 429) {
    return "rate_limit";
  }
  if (status !== null && status >= 500) {
    return "server";
  }
  if (status !== null && status >= 400) {
    return "client";
  }
  const code = extractErrorCode(error);
  if (code && RETRYABLE_NETWORK_CODES.has(code)) {
    return "network";
  }
  return "unknown";
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof EmptyModelResponseError) {
    return true;
  }
  const status = extractStatus(error);
  if (status !== null && RETRYABLE_STATUS.has(status)) {
    return true;
  }
  const code = extractErrorCode(error);
  if (code && RETRYABLE_NETWORK_CODES.has(code)) {
    return true;
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return RETRYABLE_MESSAGE_FRAGMENTS.some((fragment) => message.includes(fragment));
  }
  return false;
}

function computeDelayMs(params: {
  attempt: number;
  error: unknown;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterRatio: number;
  randomFn: () => number;
}): number {
  const exponential = Math.min(
    params.maxDelayMs,
    params.baseDelayMs * 2 ** params.attempt,
  );
  const retryAfterMs = readRetryAfterMs(params.error);
  const floor = retryAfterMs ? Math.max(exponential, retryAfterMs) : exponential;
  if (params.jitterRatio <= 0) {
    return floor;
  }
  const jitter = (params.randomFn() * 2 - 1) * floor * params.jitterRatio;
  return Math.max(0, Math.round(floor + jitter));
}

type ResolvedRetryConfig = Required<
  Pick<
    RetryOptions,
    | "maxRetries"
    | "baseDelayMs"
    | "maxDelayMs"
    | "jitterRatio"
    | "shouldRetry"
    | "sleep"
    | "randomFn"
  >
>;

function resolveRetryConfig(options: RetryOptions): ResolvedRetryConfig {
  return {
    maxRetries: options.maxRetries ?? DEFAULTS.maxRetries,
    baseDelayMs: options.baseDelayMs ?? DEFAULTS.baseDelayMs,
    maxDelayMs: options.maxDelayMs ?? DEFAULTS.maxDelayMs,
    jitterRatio: options.jitterRatio ?? DEFAULTS.jitterRatio,
    shouldRetry: options.shouldRetry ?? isRetryableError,
    sleep: options.sleep ?? defaultSleep,
    randomFn: options.randomFn ?? Math.random,
  };
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const config = resolveRetryConfig(options);
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= config.maxRetries) {
    options.signal?.throwIfAborted();
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (
        options.signal?.aborted ||
        !config.shouldRetry(error) ||
        attempt === config.maxRetries
      ) {
        throw error;
      }
      const delayMs = computeDelayMs({
        attempt,
        error,
        baseDelayMs: config.baseDelayMs,
        maxDelayMs: config.maxDelayMs,
        jitterRatio: config.jitterRatio,
        randomFn: config.randomFn,
      });
      options.onRetry?.(attempt + 1, error, delayMs);
      await config.sleep(delayMs);
      attempt += 1;
    }
  }

  throw lastError;
}
