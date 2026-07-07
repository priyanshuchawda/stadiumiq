import { describe, expect, it } from "vitest";
import { applyToolCalls } from "@/lib/ai/tool-turn";
import { createToolLoopGuard } from "@/lib/ai/tool-loop-guard";
import { fanContext } from "../fixtures/contexts";
import type { Content } from "@google/genai";

describe("applyToolCalls", () => {
  it("executes named calls and appends call + result to the conversation", async () => {
    const contents: Content[] = [];
    const usedTools: string[] = [];

    const tripped = await applyToolCalls({
      contents,
      calls: [{ name: "getCrowdStatus", args: { area: "Gate B" } }],
      usedTools,
      guard: createToolLoopGuard(),
      context: fanContext,
    });

    expect(tripped).toBe(false);
    expect(usedTools).toEqual(["getCrowdStatus"]);
    expect(contents).toHaveLength(2);
    expect(contents[0]?.role).toBe("model");
    expect(contents[1]?.role).toBe("user");
  });

  it("skips malformed calls without a name", async () => {
    const contents: Content[] = [];
    const usedTools: string[] = [];

    const tripped = await applyToolCalls({
      contents,
      calls: [{ args: { area: "Gate B" } }],
      usedTools,
      guard: createToolLoopGuard(),
      context: fanContext,
    });

    expect(tripped).toBe(false);
    expect(usedTools).toEqual([]);
    expect(contents).toEqual([]);
  });

  it("stops the loop when the guard detects a repeated identical call", async () => {
    const tripped = await applyToolCalls({
      contents: [],
      calls: [{ name: "getCrowdStatus", args: {} }],
      usedTools: [],
      guard: { isRepeating: () => true },
      context: fanContext,
    });

    expect(tripped).toBe(true);
  });
});
