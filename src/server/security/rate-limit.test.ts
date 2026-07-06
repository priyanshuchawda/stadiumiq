import { describe, expect, it, beforeEach } from "vitest";
import { checkRateLimit, resetRateLimitsForTests } from "@/server/security/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimitsForTests();
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
});
