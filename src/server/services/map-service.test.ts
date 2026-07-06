import { describe, expect, it, vi } from "vitest";
import {
  buildCrowdAreas,
  buildMapCrowdSnapshot,
  buildRouteOverlay,
} from "@/server/services/map-service";
import type { UserContext } from "@/types/stadium";

vi.mock("@/lib/ai/gate-explanation", () => ({
  explainGateRecommendation: vi.fn(async ({ recommendation }) => recommendation.reason),
}));

const wheelchairFan: UserContext = {
  persona: "fan",
  language: "en",
  accessibility: { mobility: "wheelchair", lowVision: false, sensorySensitive: false },
};

describe("buildCrowdAreas", () => {
  it("returns density labels for all seeded areas", () => {
    const areas = buildCrowdAreas(1_700_000_000_000);
    expect(areas.length).toBeGreaterThan(4);
    expect(areas.find((area) => area.areaId === "gate-b")?.area).toBe("Gate B");
  });
});

describe("buildRouteOverlay", () => {
  it("finds a step-free route from Gate C to Section 112", () => {
    const overlay = buildRouteOverlay("gate-c", "section-112", true);
    expect(overlay?.route.stepFree).toBe(true);
    expect(overlay?.nodeIds).toContain("accessible-ramp");
  });

  it("returns null when no step-free path exists", () => {
    const overlay = buildRouteOverlay("gate-b", "section-318", true);
    expect(overlay).toBeNull();
  });
});

describe("buildMapCrowdSnapshot", () => {
  it("includes gate recommendation and explanation for wheelchair users", async () => {
    const snapshot = await buildMapCrowdSnapshot(wheelchairFan, 1_700_000_000_000);
    expect(snapshot.gate.recommendedGate).toMatch(/Gate [AC]/);
    expect(snapshot.explanation).toContain("step-free");
    expect(snapshot.areas.some((area) => area.density)).toBe(true);
  });
});
