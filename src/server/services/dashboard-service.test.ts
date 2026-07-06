import { describe, expect, it, vi } from "vitest";
import { buildDashboardSnapshot } from "@/server/services/dashboard-service";

vi.mock("@/lib/ai/client", () => ({
  getGeminiClient: () => null,
  resetGeminiClientForTests: vi.fn(),
}));

describe("buildDashboardSnapshot", () => {
  it("returns KPIs, incidents, staffing, and AI insights", async () => {
    const snapshot = await buildDashboardSnapshot(1_700_000_000_000);
    expect(snapshot.kpis).toHaveLength(3);
    expect(Array.isArray(snapshot.incidents)).toBe(true);
    expect(snapshot.staffing.length).toBeGreaterThan(0);
    expect(snapshot.ai.sentimentDigest.length).toBeGreaterThan(0);
    expect(snapshot.updatedAt).toBeTruthy();
  });
});
