import { beforeEach, describe, expect, it } from "vitest";
import { runToolLoop } from "@/lib/ai/tool-loop";
import { ModelTier } from "@/lib/ai/models";
import { createToolLoopGuard, toolCallSignature } from "@/lib/ai/tool-loop-guard";
import { resetSharedModelHealthRegistryForTests } from "@/lib/ai/model-fallback";
import { createFakeGemini } from "../mocks/fake-gemini";
import type { UserContext } from "@/types/stadium";

const context: UserContext = {
  persona: "fan",
  language: "en",
  accessibility: { mobility: "none", lowVision: false, sensorySensitive: false },
};

beforeEach(() => {
  resetSharedModelHealthRegistryForTests();
});

describe("tool-loop guard", () => {
  it("produces order-independent signatures for identical args", () => {
    expect(toolCallSignature("getRoute", { a: 1, b: 2 })).toBe(
      toolCallSignature("getRoute", { b: 2, a: 1 }),
    );
  });

  it("flags a repeated identical call after the threshold", () => {
    const guard = createToolLoopGuard();
    expect(guard.isRepeating("getCrowdStatus", { area: "gate-c" })).toBe(false);
    expect(guard.isRepeating("getCrowdStatus", { area: "gate-c" })).toBe(false);
    expect(guard.isRepeating("getCrowdStatus", { area: "gate-c" })).toBe(true);
  });
});

describe("runToolLoop with a deterministic fake model", () => {
  it("executes a tool call then returns the model's text answer", async () => {
    const fake = createFakeGemini({
      turns: [
        { functionCalls: [{ name: "getCrowdStatus", args: { area: "gate-c" } }] },
        { text: "Gate C has the shortest wait." },
      ],
    });

    const result = await runToolLoop({
      client: fake.client,
      tier: ModelTier.BALANCED,
      context,
      message: "which gate?",
    });

    expect(result?.answer).toContain("Gate C");
    expect(result?.usedTools).toContain("getCrowdStatus");
  });

  it("breaks the loop when the model repeats an identical tool call", async () => {
    const repeated = { name: "getCrowdStatus", args: { area: "gate-c" } };
    const fake = createFakeGemini({
      turns: [
        { functionCalls: [repeated] },
        { functionCalls: [repeated] },
        { functionCalls: [repeated] },
        { functionCalls: [repeated] },
        { functionCalls: [repeated] },
      ],
    });

    const result = await runToolLoop({
      client: fake.client,
      tier: ModelTier.BALANCED,
      context,
      message: "loop please",
    });

    expect(result.answer).toBeNull();
    expect(fake.generateContentCalls).toBeLessThanOrEqual(5);
  });

  it("aborts promptly when the signal is already aborted", async () => {
    const fake = createFakeGemini({ turns: [{ text: "unused" }] });
    const controller = new AbortController();
    controller.abort();

    await expect(
      runToolLoop({
        client: fake.client,
        tier: ModelTier.BALANCED,
        context,
        message: "cancel me",
        signal: controller.signal,
      }),
    ).rejects.toThrow();
    expect(fake.generateContentCalls).toBe(0);
  });
});
