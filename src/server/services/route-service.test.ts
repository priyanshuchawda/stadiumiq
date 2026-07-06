import { describe, expect, it } from "vitest";
import { getRoute } from "@/server/services/route-service";

describe("getRoute", () => {
  it("returns a step-free route from Gate C to Section 112", () => {
    const route = getRoute({
      from: "Gate C",
      to: "Section 112",
      stepFree: true,
      avoidStairs: false,
    });

    expect(route).not.toBeNull();
    expect(route?.stepFree).toBe(true);
    expect(route?.steps.length).toBeGreaterThan(0);
  });

  it("returns null for unknown locations", () => {
    const route = getRoute({
      from: "Unknown",
      to: "Section 112",
      stepFree: false,
      avoidStairs: false,
    });

    expect(route).toBeNull();
  });
});
