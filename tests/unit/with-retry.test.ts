import { describe, expect, it, vi } from "vitest";
import { withRetry } from "@/lib/ai/with-retry";

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
});
