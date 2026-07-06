import { describe, expect, it } from "vitest";
import { getDensityVisual, formatCrowdAria } from "@/lib/map/density-visuals";

describe("density-visuals", () => {
  it("provides text labels for each density level", () => {
    expect(getDensityVisual("high").label).toBe("High density");
    expect(formatCrowdAria("Gate B", "high", 8)).toContain("8 minute wait");
  });
});
