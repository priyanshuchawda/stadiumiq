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
});
