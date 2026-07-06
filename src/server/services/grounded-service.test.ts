import { describe, expect, it, vi } from "vitest";
import { handleGroundedRequest } from "@/server/services/grounded-service";

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
      "test-client",
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.sources[0]?.uri.startsWith("https://")).toBe(true);
    }
  });

  it("rejects invalid bodies", async () => {
    const result = await handleGroundedRequest({ bad: true }, "test-client");
    expect(result.ok).toBe(false);
  });
});
