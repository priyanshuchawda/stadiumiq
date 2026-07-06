import { describe, expect, it } from "vitest";
import { getSOP } from "@/server/services/sop-service";

describe("getSOP", () => {
  it("returns lost child protocol", () => {
    const sop = getSOP("lost child");
    expect(sop?.topic).toBe("lost_child");
    expect(sop?.steps.length).toBeGreaterThan(0);
  });

  it("returns null for unknown topics", () => {
    expect(getSOP("unknown topic")).toBeNull();
  });
});
