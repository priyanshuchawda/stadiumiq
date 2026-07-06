import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { geminiHandlers } from "../mocks/gemini-handlers";
import { resetGeminiClientForTests } from "@/lib/ai/client";
import { askKai, clearKaiCacheForTests } from "@/lib/ai/assistant-service";
import { clearGroundedCacheForTests } from "@/lib/ai/grounded-search";
import { clearDashboardInsightsCacheForTests } from "@/lib/ai/dashboard-summaries";
import { clearGateExplanationCacheForTests } from "@/lib/ai/gate-explanation";
import { handleGroundedRequest } from "@/server/services/grounded-service";
import { analyzeVisionImage } from "@/server/services/vision-service";
import { buildDashboardSnapshot } from "@/server/services/dashboard-service";
import { buildMapCrowdSnapshot } from "@/server/services/map-service";
import { fanContext, makeApiRequest } from "../fixtures/contexts";
import type { UserContext } from "@/types/stadium";

const server = setupServer(...geminiHandlers);

describe("AI services with mocked Gemini (MSW)", () => {
  beforeAll(() => {
    process.env["GEMINI_API_KEY"] = "test-key-123";
    resetGeminiClientForTests();
    server.listen({ onUnhandledRequest: "error" });
  });

  beforeEach(() => {
    clearKaiCacheForTests();
    clearGroundedCacheForTests();
    clearDashboardInsightsCacheForTests();
    clearGateExplanationCacheForTests();
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
    delete process.env["GEMINI_API_KEY"];
    resetGeminiClientForTests();
  });

  it("askKai returns a live (non-fallback) answer via the tool loop", async () => {
    const result = await askKai({ context: fanContext, message: "Which gate?" });
    expect(result.fallback).toBe(false);
    expect(result.answer).toContain("Gate C");
  });

  it("askKai runs the tool loop and reports used tools", async () => {
    let call = 0;
    server.use(
      http.post(/:generateContent/, () => {
        call += 1;
        if (call === 1) {
          return HttpResponse.json({
            candidates: [
              {
                content: {
                  role: "model",
                  parts: [
                    {
                      functionCall: {
                        name: "getCrowdStatus",
                        args: { area: "gate-c" },
                      },
                    },
                  ],
                },
              },
            ],
          });
        }
        return HttpResponse.json({
          candidates: [
            { content: { role: "model", parts: [{ text: "Use Gate C." }] } },
          ],
        });
      }),
    );

    const result = await askKai({ context: fanContext, message: "gate status?" });
    expect(result.fallback).toBe(false);
    expect(result.usedTools).toContain("getCrowdStatus");
    expect(result.answer).toContain("Gate C");
  });

  it("askKai serves a cached response on repeat", async () => {
    const first = await askKai({ context: fanContext, message: "cache me" });
    const second = await askKai({ context: fanContext, message: "cache me" });
    expect(second).toEqual(first);
  });

  it("analyzeVisionImage returns a model answer", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "sign.jpg", {
      type: "image/jpeg",
    });
    const result = await analyzeVisionImage({
      file,
      request: { prompt: "What does this sign say?", context: fanContext },
    });
    expect(result.fallback).toBe(false);
    expect(result.answer.length).toBeGreaterThan(0);
  });

  it("handleGroundedRequest returns grounded sources parsed from metadata", async () => {
    const result = await handleGroundedRequest(
      {
        message: "How do I get downtown after the match?",
        context: fanContext,
      },
      makeApiRequest("/api/grounded", "198.51.100.5"),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.fallback).toBe(false);
      const uris = result.payload.sources.map((s) => s.uri);
      expect(uris).toContain("https://www.njtransit.com/");
      // https-only + deduped: insecure http dropped, njtransit deduped.
      expect(uris.filter((u) => u === "https://www.njtransit.com/").length).toBe(1);
      const titleless = result.payload.sources.find(
        (s) => s.uri === "https://transit.example/routes",
      );
      expect(titleless?.title).toBe("https://transit.example/routes");
      expect(result.payload.webSearchQueries).toContain("stadium transit after event");
    }
  });

  it("buildDashboardSnapshot parses structured AI insights", async () => {
    const snapshot = await buildDashboardSnapshot(Date.parse("2026-07-07T12:00:00Z"));
    expect(snapshot.ai.fallback).toBe(false);
    expect(snapshot.ai.priorityActions.length).toBeGreaterThan(0);
    expect(snapshot.ai.sentimentDigest.length).toBeGreaterThan(0);
  });

  it("dashboard repairs malformed AI JSON on the second attempt", async () => {
    let call = 0;
    const validJson = JSON.stringify({
      incidentSummary: "Stable operations.",
      priorityActions: ["Monitor Gate B"],
      sentimentDigest: [{ language: "en", summary: "Calm crowds.", tone: "positive" }],
    });
    server.use(
      http.post(/:generateContent/, () => {
        call += 1;
        const text = call === 1 ? "{ not valid json" : validJson;
        return HttpResponse.json({
          candidates: [{ content: { role: "model", parts: [{ text }] } }],
        });
      }),
    );

    const snapshot = await buildDashboardSnapshot(Date.parse("2026-07-07T13:00:00Z"));
    expect(snapshot.ai.fallback).toBe(false);
    expect(snapshot.ai.incidentSummary).toBe("Stable operations.");
    expect(call).toBeGreaterThanOrEqual(2);
  });

  it("dashboard falls back when the model never returns valid JSON", async () => {
    server.use(
      http.post(/:generateContent/, () =>
        HttpResponse.json({
          candidates: [
            { content: { role: "model", parts: [{ text: "still broken" }] } },
          ],
        }),
      ),
    );
    const snapshot = await buildDashboardSnapshot(Date.parse("2026-07-07T14:00:00Z"));
    expect(snapshot.ai.fallback).toBe(true);
  });

  it("buildMapCrowdSnapshot enriches the gate with an AI explanation", async () => {
    const snapshot = await buildMapCrowdSnapshot(
      fanContext,
      Date.parse("2026-07-07T12:00:00Z"),
    );
    expect(snapshot.explanation.length).toBeGreaterThan(0);
    expect(snapshot.gate.recommendedGate).toBeTruthy();
  });

  it("buildMapCrowdSnapshot handles the wheelchair step-free branch", async () => {
    const wheelchair: UserContext = {
      ...fanContext,
      accessibility: {
        mobility: "wheelchair",
        lowVision: false,
        sensorySensitive: false,
      },
    };
    const snapshot = await buildMapCrowdSnapshot(
      wheelchair,
      Date.parse("2026-07-07T12:30:00Z"),
    );
    expect(snapshot.explanation.length).toBeGreaterThan(0);
  });

  it("grounded requests are served from cache on repeat", async () => {
    const first = await handleGroundedRequest(
      { message: "repeatable transit question", context: fanContext },
      makeApiRequest("/api/grounded", "198.51.100.9"),
    );
    const second = await handleGroundedRequest(
      { message: "repeatable transit question", context: fanContext },
      makeApiRequest("/api/grounded", "198.51.100.9"),
    );
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(second.payload).toEqual(first.payload);
    }
  });
});
