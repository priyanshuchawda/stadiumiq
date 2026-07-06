import { describe, expect, it, vi } from "vitest";
import {
  EmptyModelResponseError,
  extractErrorCode,
  getRetryErrorType,
  isRetryableError,
  parseGoogleRetryInfoMs,
  readRetryAfterMs,
  withRetry,
} from "@/lib/ai/with-retry";

describe("withRetry", () => {
  it("returns immediately on success", async () => {
    const op = vi.fn().mockResolvedValue("ok");
    const result = await withRetry(op, { maxRetries: 2, baseDelayMs: 1 });
    expect(result).toBe("ok");
    expect(op).toHaveBeenCalledTimes(1);
  });

  it("retries on a 503 then succeeds", async () => {
    const op = vi
      .fn()
      .mockRejectedValueOnce({ status: 503 })
      .mockResolvedValue("recovered");
    const result = await withRetry(op, { maxRetries: 2, baseDelayMs: 1 });
    expect(result).toBe("recovered");
    expect(op).toHaveBeenCalledTimes(2);
  });

  it("does not retry non-retryable (400) errors", async () => {
    const op = vi.fn().mockRejectedValue({ status: 400 });
    await expect(withRetry(op, { maxRetries: 3, baseDelayMs: 1 })).rejects.toEqual({
      status: 400,
    });
    expect(op).toHaveBeenCalledTimes(1);
  });

  it("throws after exhausting retries on repeated 429", async () => {
    const op = vi.fn().mockRejectedValue({ status: 429 });
    await expect(withRetry(op, { maxRetries: 2, baseDelayMs: 1 })).rejects.toEqual({
      status: 429,
    });
    expect(op).toHaveBeenCalledTimes(3);
  });

  it("uses an injected sleep and honors Retry-After as a delay floor", async () => {
    const delays: number[] = [];
    const sleep = vi.fn(async (ms: number) => {
      delays.push(ms);
    });
    const op = vi
      .fn()
      .mockRejectedValueOnce({ status: 429, retryAfter: "2" })
      .mockResolvedValue("done");

    const result = await withRetry(op, {
      baseDelayMs: 10,
      jitterRatio: 0,
      sleep,
      randomFn: () => 0.5,
    });

    expect(result).toBe("done");
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(delays[0]).toBeGreaterThanOrEqual(2000);
  });

  it("retries on retryable network codes and calls onRetry", async () => {
    const onRetry = vi.fn();
    const op = vi
      .fn()
      .mockRejectedValueOnce({ code: "ECONNRESET" })
      .mockResolvedValue("ok");
    const result = await withRetry(op, { baseDelayMs: 1, jitterRatio: 0, onRetry });
    expect(result).toBe("ok");
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("detects retryable error message fragments", () => {
    expect(
      isRetryableError(new Error("The model is overloaded due to high demand")),
    ).toBe(true);
    expect(isRetryableError(new Error("bad request"))).toBe(false);
  });

  it("walks cause chains to extract a network code", () => {
    const nested = { cause: { cause: { code: "ETIMEDOUT" } } };
    expect(extractErrorCode(nested)).toBe("ETIMEDOUT");
  });

  it("parses Retry-After from a headers.get() interface", () => {
    const error = {
      headers: { get: (name: string) => (name === "retry-after" ? "3" : null) },
    };
    expect(readRetryAfterMs(error)).toBe(3000);
  });

  it("treats an EmptyModelResponseError as retryable", () => {
    expect(isRetryableError(new EmptyModelResponseError())).toBe(true);
  });

  it("parses google.rpc RetryInfo retryDelay from details", () => {
    const error = {
      details: [
        { "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: "12s" },
      ],
    };
    expect(parseGoogleRetryInfoMs(error)).toBe(12000);
  });

  it("parses retryDelay embedded in an error message", () => {
    const error = new Error('{"error":{"details":[{"retryDelay":"5s"}]}}');
    expect(parseGoogleRetryInfoMs(error)).toBe(5000);
  });

  it("classifies retry error types without leaking messages", () => {
    expect(getRetryErrorType({ status: 429 })).toBe("rate_limit");
    expect(getRetryErrorType({ status: 503 })).toBe("server");
    expect(getRetryErrorType({ status: 400 })).toBe("client");
    expect(getRetryErrorType({ code: "ECONNRESET" })).toBe("network");
    expect(getRetryErrorType(new EmptyModelResponseError())).toBe("empty");
    expect(getRetryErrorType(new Error("weird"))).toBe("unknown");
  });

  it("stops retrying and throws when the signal aborts", async () => {
    const controller = new AbortController();
    controller.abort();
    const op = vi.fn().mockRejectedValue({ status: 503 });
    await expect(withRetry(op, { signal: controller.signal })).rejects.toBeTruthy();
    expect(op).not.toHaveBeenCalled();
  });
});
