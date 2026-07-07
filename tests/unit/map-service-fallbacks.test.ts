import { describe, expect, it, vi } from "vitest";
import { buildCrowdAreas, buildRouteOverlay } from "@/server/services/map-service";
import type { RouteResult } from "@/types/stadium";

vi.mock("@/server/services/crowd-service", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/server/services/crowd-service")>();
  return { ...actual, getCrowdStatus: vi.fn(() => undefined) };
});

vi.mock("@/server/services/route-service", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/server/services/route-service")>();
  const loopingRoute: RouteResult = {
    from: "Gate A",
    to: "Gate A",
    stepFree: true,
    totalMinutes: 4,
    steps: [
      {
        instruction: "Walk to B",
        from: "a",
        to: "b",
        stepFree: true,
        estimatedMinutes: 2,
      },
      {
        instruction: "Return to A",
        from: "b",
        to: "a",
        stepFree: true,
        estimatedMinutes: 2,
      },
    ],
  };
  return { ...actual, getRoute: vi.fn(() => loopingRoute) };
});

describe("map-service degraded-data behavior", () => {
  it("falls back to seeded values when live crowd status is unavailable", () => {
    const areas = buildCrowdAreas();
    expect(areas.length).toBeGreaterThan(0);
    for (const area of areas) {
      expect(area.area.length).toBeGreaterThan(0);
      expect(area.waitMinutes).toBeGreaterThanOrEqual(0);
      expect(area.recommendation).toBe("Flow is manageable.");
    }
  });

  it("deduplicates node ids for routes that revisit a node", () => {
    const overlay = buildRouteOverlay("a", "a", true);
    expect(overlay).not.toBeNull();
    expect(overlay?.nodeIds).toEqual(["a", "b"]);
  });
});
