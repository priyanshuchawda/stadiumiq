import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { resetGeminiClientForTests } from "@/lib/ai/client";
import { askKai, clearKaiCacheForTests } from "@/lib/ai/assistant-service";
import { askGroundedKai, clearGroundedCacheForTests } from "@/lib/ai/grounded-search";
import { explainGateRecommendation } from "@/lib/ai/gate-explanation";
import { analyzeVisionImage } from "@/server/services/vision-service";
import { buildDashboardSnapshot } from "@/server/services/dashboard-service";
import type { GateRecommendation, UserContext } from "@/types/stadium";

const fan: UserContext = {
  persona: "fan",
  language: "en",
  accessibility: { mobility: "none", lowVision: false, sensorySensitive: false },
};

const wheelchairFan: UserContext = {
  ...fan,
  accessibility: { mobility: "wheelchair", lowVision: false, sensorySensitive: false },
};

const recommendation: GateRecommendation = {
  recommendedGate: "C",
  reason: "Gate C has the lowest wait.",
  alternatives: ["A"],
};

describe("AI fallbacks without a Gemini key", () => {
  beforeAll(() => {
    delete process.env["GEMINI_API_KEY"];
    resetGeminiClientForTests();
  });

  beforeEach(() => {
    clearKaiCacheForTests();
    clearGroundedCacheForTests();
  });

  afterAll(() => {
    resetGeminiClientForTests();
  });

  it("askKai diverges by accessibility context", async () => {
    const wheelchair = await askKai({ context: wheelchairFan, message: "gate?" });
    const general = await askKai({ context: fan, message: "gate?" });
    expect(wheelchair.fallback).toBe(true);
    expect(wheelchair.answer).not.toEqual(general.answer);
    expect(wheelchair.answer.toLowerCase()).toContain("step-free");
  });

  it("grounded fallback picks a destination-aware option (airport)", async () => {
    const result = await askGroundedKai({
      context: fan,
      message: "route to the airport",
    });
    expect(result.fallback).toBe(true);
    expect(result.webSearchQueries[0]).toContain("airport");
    expect(result.sources.length).toBeGreaterThan(0);
  });

  it("grounded fallback honours a green/eco request downtown", async () => {
    const result = await askGroundedKai({
      context: fan,
      message: "greenest way downtown",
    });
    expect(result.fallback).toBe(true);
    expect(result.webSearchQueries[0]).toContain("downtown");
  });

  it("grounded fallback defaults to city center", async () => {
    const result = await askGroundedKai({ context: fan, message: "how do I leave?" });
    expect(result.webSearchQueries[0]).toContain("city center");
  });

  it("gate explanation returns the deterministic reason", async () => {
    const explanation = await explainGateRecommendation({
      context: fan,
      recommendation,
      crowdStatuses: [
        { area: "Gate C", density: "low", waitMinutes: 2, recommendation: "" },
      ],
    });
    expect(explanation).toBe(recommendation.reason);
  });

  it("vision analysis reports it is unavailable", async () => {
    const file = new File([new Uint8Array([1])], "x.jpg", { type: "image/jpeg" });
    const result = await analyzeVisionImage({
      file,
      request: { prompt: "read this", context: fan },
    });
    expect(result.fallback).toBe(true);
  });

  it("dashboard returns deterministic fallback insights", async () => {
    const snapshot = await buildDashboardSnapshot(Date.parse("2026-07-07T12:00:00Z"));
    expect(snapshot.ai.fallback).toBe(true);
    expect(snapshot.ai.sentimentDigest.length).toBe(3);
  });
});
