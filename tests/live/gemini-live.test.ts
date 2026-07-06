import { beforeEach, describe, expect, it } from "vitest";
import { getGeminiClient, resetGeminiClientForTests } from "@/lib/ai/client";
import { clearKaiCacheForTests, askKai } from "@/lib/ai/assistant-service";
import type { UserContext } from "@/types/stadium";

const liveEnabled = process.env["GEMINI_LIVE_TEST"] === "true";

describe.skipIf(!liveEnabled)("gemini live integration", () => {
  beforeEach(() => {
    resetGeminiClientForTests();
    clearKaiCacheForTests();
  });

  it("returns a live answer from Gemini", async () => {
    const context: UserContext = {
      persona: "fan",
      language: "en",
      accessibility: { mobility: "none", lowVision: false, sensorySensitive: false },
      location: { gate: "C", section: "112" },
    };

    const response = await askKai({
      context,
      message: "What is the crowd status at Gate B?",
    });

    expect(getGeminiClient()).not.toBeNull();
    expect(response.answer.length).toBeGreaterThan(10);
    expect(response.fallback).toBe(false);
  }, 30_000);
});
