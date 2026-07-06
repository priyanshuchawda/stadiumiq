import { describe, expect, it } from "vitest";
import { executeToolCall } from "@/lib/ai/tool-executors";
import type { UserContext } from "@/types/stadium";

const context: UserContext = {
  persona: "fan",
  language: "en",
  accessibility: { mobility: "wheelchair", lowVision: false, sensorySensitive: false },
};

describe("executeToolCall", () => {
  it("executes getRoute with step-free default for wheelchair users", async () => {
    const result = await executeToolCall(
      "getRoute",
      { from: "Gate C", to: "Section 112" },
      context,
    );
    expect(result).not.toBeNull();
  });

  it("executes getSOP for lost child topic", async () => {
    const result = await executeToolCall("getSOP", { topic: "lost child" }, context);
    expect(result).toMatchObject({ topic: "lost_child" });
  });
});
