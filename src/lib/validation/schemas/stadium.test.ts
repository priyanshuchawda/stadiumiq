import { describe, expect, it } from "vitest";
import { UserContextSchema } from "@/lib/validation/schemas/stadium";

describe("UserContextSchema", () => {
  it("accepts valid context", () => {
    const result = UserContextSchema.safeParse({
      persona: "fan",
      language: "es",
      accessibility: {
        mobility: "wheelchair",
        lowVision: false,
        sensorySensitive: false,
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects unknown fields", () => {
    const result = UserContextSchema.safeParse({
      persona: "fan",
      language: "en",
      accessibility: {
        mobility: "none",
        lowVision: false,
        sensorySensitive: false,
      },
      extra: true,
    });
    expect(result.success).toBe(false);
  });
});
