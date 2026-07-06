import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { setupServer } from "msw/node";
import { geminiHandlers } from "../mocks/gemini-handlers";
import { resetGeminiClientForTests } from "@/lib/ai/client";
import { askKai, clearKaiCacheForTests } from "@/lib/ai/assistant-service";
import { clearGroundedCacheForTests } from "@/lib/ai/grounded-search";
import { handleGroundedRequest } from "@/server/services/grounded-service";
import { buildDashboardSnapshot } from "@/server/services/dashboard-service";
import { resetSharedModelHealthRegistryForTests } from "@/lib/ai/model-fallback";
import type { UserContext } from "@/types/stadium";

const server = setupServer(...geminiHandlers);

const fanContext: UserContext = {
  persona: "fan",
  language: "en",
  accessibility: { mobility: "none", lowVision: false, sensorySensitive: false },
};

const wheelchairContext: UserContext = {
  ...fanContext,
  accessibility: { mobility: "wheelchair", lowVision: false, sensorySensitive: false },
};

/**
 * Behavior baselines: snapshot the orchestration *envelope* (not free-form
 * prose) so regressions in tool usage, grounding shape, or fallback flags are
 * caught. Update intentionally with `vitest -u` when behavior changes on purpose.
 */
describe("assistant behavior baselines (MSW-mocked Gemini)", () => {
  beforeAll(() => {
    process.env["GEMINI_API_KEY"] = "test-key-123";
    resetGeminiClientForTests();
    server.listen({ onUnhandledRequest: "error" });
  });

  beforeEach(() => {
    clearKaiCacheForTests();
    clearGroundedCacheForTests();
    resetSharedModelHealthRegistryForTests();
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
    delete process.env["GEMINI_API_KEY"];
    resetGeminiClientForTests();
  });

  it("askKai envelope is stable for a fan gate question", async () => {
    const result = await askKai({
      context: fanContext,
      message: "Which gate is fastest?",
    });
    expect({
      fallback: result.fallback,
      usedTools: result.usedTools,
      hasAnswer: result.answer.length > 0,
    }).toMatchSnapshot();
  });

  it("askKai envelope is stable for a wheelchair user", async () => {
    const result = await askKai({
      context: wheelchairContext,
      message: "Step-free route to my seat?",
    });
    expect({
      fallback: result.fallback,
      usedTools: result.usedTools,
      hasAnswer: result.answer.length > 0,
    }).toMatchSnapshot();
  });

  it("grounded envelope preserves https sources and search queries", async () => {
    const result = await handleGroundedRequest(
      { message: "Transit options after the match?", context: fanContext },
      "203.0.113.10",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect({
        fallback: result.payload.fallback,
        sourceUris: result.payload.sources.map((source) => source.uri).sort(),
        webSearchQueries: result.payload.webSearchQueries,
      }).toMatchSnapshot();
    }
  });

  it("dashboard AI envelope is stable", async () => {
    const snapshot = await buildDashboardSnapshot(Date.parse("2026-07-07T12:00:00Z"));
    expect({
      fallback: snapshot.ai.fallback,
      incidentSummary: snapshot.ai.incidentSummary,
      priorityActionCount: snapshot.ai.priorityActions.length,
      sentimentLanguages: snapshot.ai.sentimentDigest.map((entry) => entry.language),
    }).toMatchSnapshot();
  });
});
