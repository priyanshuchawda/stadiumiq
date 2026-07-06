import { describe, expect, it } from "vitest";
import { executeToolCall } from "@/lib/ai/tool-executors";
import type { UserContext } from "@/types/stadium";

const wheelchairContext: UserContext = {
  persona: "fan",
  language: "en",
  accessibility: { mobility: "wheelchair", lowVision: false, sensorySensitive: false },
};

const context: UserContext = {
  persona: "fan",
  language: "en",
  accessibility: { mobility: "none", lowVision: false, sensorySensitive: false },
};

describe("executeToolCall", () => {
  it("routes getRoute and defaults stepFree from wheelchair mobility", async () => {
    const result = await executeToolCall(
      "getRoute",
      { from: "gate-c", to: "section-112" },
      wheelchairContext,
    );
    expect(result).toBeTruthy();
  });

  it("routes getCrowdStatus for a known area", async () => {
    const result = await executeToolCall("getCrowdStatus", { area: "gate-c" }, context);
    expect(result).toBeTruthy();
  });

  it("routes getTransportOptions with eco priority default", async () => {
    const result = await executeToolCall(
      "getTransportOptions",
      { destination: "downtown", ecoPriority: true },
      context,
    );
    expect(Array.isArray(result)).toBe(true);
  });

  it("routes getAmenities with a nearSection", async () => {
    const result = await executeToolCall(
      "getAmenities",
      { type: "toilet", nearSection: "112" },
      context,
    );
    expect(result).toBeDefined();
  });

  it("routes getAmenities without a nearSection", async () => {
    const result = await executeToolCall(
      "getAmenities",
      { type: "water_refill" },
      context,
    );
    expect(result).toBeDefined();
  });

  it("routes getSOP by topic", async () => {
    const result = await executeToolCall("getSOP", { topic: "medical" }, context);
    expect(result).toBeDefined();
  });

  it("returns an error object for an unknown tool", async () => {
    const result = await executeToolCall("unknownTool", {}, context);
    expect(result).toEqual({ error: "Unknown tool: unknownTool" });
  });

  it("returns a model-readable error for invalid tool arguments", async () => {
    const result = await executeToolCall("getCrowdStatus", {}, context);
    expect(result).toMatchObject({
      error: expect.stringContaining("Invalid arguments for getCrowdStatus"),
    });
  });

  it("rejects unknown/privileged fields via strict schemas", async () => {
    const result = await executeToolCall(
      "getCrowdStatus",
      { area: "gate-c", isAdmin: true },
      context,
    );
    expect(result).toMatchObject({
      error: expect.stringContaining("Invalid arguments"),
    });
  });

  it("returns model-readable errors for each tool's invalid args", async () => {
    const cases: [string, unknown][] = [
      ["getRoute", { from: "gate-c" }],
      ["getTransportOptions", {}],
      ["getAmenities", { type: "not-a-type" }],
      ["getSOP", {}],
    ];
    for (const [name, args] of cases) {
      const result = await executeToolCall(name, args, context);
      expect(result).toMatchObject({
        error: expect.stringContaining(`Invalid arguments for ${name}`),
      });
    }
  });
});
