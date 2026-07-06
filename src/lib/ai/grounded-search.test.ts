import { describe, expect, it, vi } from "vitest";
import { askGroundedKai, clearGroundedCacheForTests } from "@/lib/ai/grounded-search";

vi.mock("@/lib/ai/client", () => ({
  getGeminiClient: () => null,
  resetGeminiClientForTests: vi.fn(),
}));

const fanContext = {
  persona: "fan" as const,
  language: "en",
  accessibility: {
    mobility: "none" as const,
    lowVision: false,
    sensorySensitive: false,
  },
};

describe("askGroundedKai fallback", () => {
  it("returns transport guidance with https citations", async () => {
    clearGroundedCacheForTests();
    const result = await askGroundedKai({
      context: fanContext,
      message: "Fastest greenest way to the airport after the match?",
    });

    expect(result.answer.length).toBeGreaterThan(10);
    expect(result.fallback).toBe(true);
    expect(result.sources.every((source) => source.uri.startsWith("https://"))).toBe(
      true,
    );
  });
});
