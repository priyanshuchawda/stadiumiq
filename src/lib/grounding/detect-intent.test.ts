import { describe, expect, it } from "vitest";
import { detectGroundingIntent } from "@/lib/grounding/detect-intent";

describe("detectGroundingIntent", () => {
  it("detects transport topic param", () => {
    expect(detectGroundingIntent("hello", "transport")).toBe(true);
  });

  it("detects airport and green transport questions", () => {
    expect(
      detectGroundingIntent("Fastest greenest way to the airport now?", undefined),
    ).toBe(true);
    expect(detectGroundingIntent("Where is section 112?", undefined)).toBe(false);
  });
});
