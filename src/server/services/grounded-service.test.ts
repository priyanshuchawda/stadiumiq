import { describe, expect, it, beforeEach, vi } from "vitest";
import { handleGroundedRequest } from "@/server/services/grounded-service";
import { makeApiRequest } from "../../../tests/fixtures/contexts";
import { resetRateLimitsForTests } from "@/server/security/rate-limit";

vi.mock("@/lib/ai/grounded-search", () => ({
  askGroundedKai: vi.fn(async () => ({
    answer: "Take the metro.",
    fallback: false,
    webSearchQueries: ["metro schedule"],
    sources: [{ title: "Transit", uri: "https://example.com/transit" }],
    searchSuggestionsHtml: null,
  })),
  clearGroundedCacheForTests: vi.fn(),
}));

describe("handleGroundedRequest", () => {
  beforeEach(() => {
    resetRateLimitsForTests();
  });

  it("returns grounded payload for valid requests", async () => {
    const result = await handleGroundedRequest(
      {
        message: "Best way to the airport?",
        context: {
          persona: "fan",
          language: "en",
          accessibility: {
            mobility: "none",
            lowVision: false,
            sensorySensitive: false,
          },
        },
      },
      makeApiRequest("/api/grounded"),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.sources[0]?.uri.startsWith("https://")).toBe(true);
    }
  });

  it("rejects invalid bodies", async () => {
    const result = await handleGroundedRequest(
      { bad: true },
      makeApiRequest("/api/grounded"),
    );
    expect(result.ok).toBe(false);
  });

  it("returns 429 with Retry-After once the client exhausts its budget", async () => {
    let denied: Awaited<ReturnType<typeof handleGroundedRequest>> | null = null;
    for (let i = 0; i < 50; i += 1) {
      const result = await handleGroundedRequest(
        { bad: true },
        makeApiRequest("/api/grounded", "10.0.0.8"),
      );
      if (!result.ok && result.status === 429) {
        denied = result;
        break;
      }
    }

    expect(denied).not.toBeNull();
    if (denied && !denied.ok) {
      expect(denied.message).toMatch(/Too many requests/);
      expect(denied.retryAfter).toBeGreaterThan(0);
    }
  });
});
