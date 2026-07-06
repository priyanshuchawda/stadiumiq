import { describe, expect, it, beforeEach } from "vitest";
import { enforceRateLimit } from "@/server/http/rate-limit-guard";
import { resetRateLimitsForTests } from "@/server/security/rate-limit";

function makeRequest(ip: string): Request {
  return new Request("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "x-real-ip": ip },
  });
}

describe("enforceRateLimit", () => {
  beforeEach(() => {
    resetRateLimitsForTests();
  });

  it("allows requests under the limit", () => {
    const result = enforceRateLimit(makeRequest("203.0.113.7"));
    expect(result.ok).toBe(true);
  });

  it("denies requests after the bucket is exhausted", () => {
    const request = makeRequest("203.0.113.8");
    for (let i = 0; i < 25; i += 1) {
      enforceRateLimit(request);
    }
    const denied = enforceRateLimit(request);
    expect(denied.ok).toBe(false);
    if (!denied.ok) {
      expect(denied.status).toBe(429);
      expect(denied.retryAfter).toBeGreaterThan(0);
    }
  });
});
