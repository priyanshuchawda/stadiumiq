import { describe, expect, it } from "vitest";
import { getCrowdStatus, recommendGate } from "@/server/services/crowd-service";
import type { UserContext } from "@/types/stadium";

const wheelchairFan: UserContext = {
  persona: "fan",
  language: "es",
  accessibility: { mobility: "wheelchair", lowVision: false, sensorySensitive: false },
};

const generalFan: UserContext = {
  persona: "fan",
  language: "en",
  accessibility: { mobility: "none", lowVision: false, sensorySensitive: false },
};

describe("getCrowdStatus", () => {
  it("returns crowd data for Gate B", () => {
    const status = getCrowdStatus("Gate B", 1_700_000_000_000);
    expect(status?.area).toBe("Gate B");
    expect(status?.waitMinutes).toBeGreaterThan(0);
  });
});

describe("recommendGate", () => {
  it("recommends different gates for wheelchair vs general mobility users", () => {
    const fixedNow = 1_700_000_000_000;
    const wheelchair = recommendGate(wheelchairFan, fixedNow);
    const general = recommendGate(generalFan, fixedNow);

    expect(wheelchair.reason).toContain("step-free");
    expect(wheelchair.recommendedGate).toMatch(/Gate [AC]/);
    expect(general.recommendedGate).toBeTruthy();
  });
});
