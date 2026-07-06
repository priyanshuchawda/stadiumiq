import { describe, expect, it, vi } from "vitest";
import { buildDashboardAiInsights } from "@/lib/ai/dashboard-summaries";

vi.mock("@/lib/ai/client", () => ({
  getGeminiClient: () => null,
  resetGeminiClientForTests: vi.fn(),
}));

describe("buildDashboardAiInsights", () => {
  it("returns validated fallback insights with multilingual sentiment", async () => {
    const insights = await buildDashboardAiInsights({
      incidents: [
        {
          id: "gate-b",
          area: "Gate B",
          severity: "high",
          message: "Expect delays",
        },
      ],
      staffing: ["Deploy 2 additional stewards to Gate B (high density)."],
    });

    expect(insights.fallback).toBe(true);
    expect(insights.sentimentDigest.length).toBeGreaterThan(1);
    expect(insights.priorityActions[0]).toContain("Gate B");
  });
});
