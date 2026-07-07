import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit, resetRateLimitsForTests } from "@/server/security/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimitsForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests under the limit", () => {
    const result = checkRateLimit("test-ip", { limit: 2, windowMs: 60_000 });
    expect(result.allowed).toBe(true);
  });

  it("blocks requests over the limit", () => {
    const config = { limit: 1, windowMs: 60_000 };
    checkRateLimit("blocked-ip", config);
    const second = checkRateLimit("blocked-ip", config);
    expect(second.allowed).toBe(false);
    expect(second.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("refills the bucket after the window elapses", () => {
    vi.useFakeTimers();
    const config = { limit: 1, windowMs: 60_000 };

    expect(checkRateLimit("refill-ip", config).allowed).toBe(true);
    expect(checkRateLimit("refill-ip", config).allowed).toBe(false);

    vi.advanceTimersByTime(60_001);
    expect(checkRateLimit("refill-ip", config).allowed).toBe(true);
  });

  it("handles many concurrent clients without cross-contamination", () => {
    const config = { limit: 2, windowMs: 60_000 };
    const results = Array.from({ length: 100 }, (_, i) =>
      checkRateLimit(`client-${i}`, config),
    );
    expect(results.every((result) => result.allowed)).toBe(true);
  });

  it("evicts stale buckets once the map exceeds its cap", () => {
    vi.useFakeTimers();
    const config = { limit: 1, windowMs: 1_000 };

    for (let i = 0; i < 10_001; i += 1) {
      checkRateLimit(`flood-${i}`, config);
    }

    // Old buckets are now stale; the next call triggers pruning and the
    // limiter still answers correctly for a fresh client.
    vi.advanceTimersByTime(5_000);
    const result = checkRateLimit("fresh-client", config);
    expect(result.allowed).toBe(true);
  });
});
