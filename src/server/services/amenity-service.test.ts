import { describe, expect, it } from "vitest";
import { getAmenities } from "@/server/services/amenity-service";
import type { UserContext } from "@/types/stadium";

const wheelchairContext: UserContext = {
  persona: "fan",
  language: "en",
  accessibility: { mobility: "wheelchair", lowVision: false, sensorySensitive: false },
};

describe("getAmenities", () => {
  it("finds accessible toilets near a section", () => {
    const amenities = getAmenities({ type: "accessible_toilet", nearSection: "112" });
    expect(amenities.length).toBeGreaterThan(0);
    expect(amenities.every((item) => item.accessible)).toBe(true);
  });

  it("filters to accessible amenities for wheelchair users", () => {
    const amenities = getAmenities({
      type: "food",
      context: wheelchairContext,
    });
    expect(amenities.every((item) => item.accessible)).toBe(true);
  });

  it("appends sensory rooms for sensory-sensitive users", () => {
    const amenities = getAmenities({
      type: "food",
      context: {
        persona: "fan",
        language: "en",
        accessibility: { mobility: "none", lowVision: false, sensorySensitive: true },
      },
    });
    expect(amenities.some((item) => item.type === "sensory_room")).toBe(true);
  });
});
