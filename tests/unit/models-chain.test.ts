import { afterEach, describe, expect, it } from "vitest";
import { getModelChain, ModelTier, resolveModelId } from "@/lib/ai/models";

afterEach(() => {
  delete process.env["AI_MODEL_BALANCED"];
  delete process.env["AI_MODEL_FAST"];
});

describe("getModelChain", () => {
  it("orders the tier's primary model first, then the other tier's model", () => {
    process.env["AI_MODEL_BALANCED"] = "balanced-model";
    process.env["AI_MODEL_FAST"] = "fast-model";
    expect(getModelChain(ModelTier.BALANCED)).toEqual(["balanced-model", "fast-model"]);
    expect(getModelChain(ModelTier.FAST)).toEqual(["fast-model", "balanced-model"]);
  });

  it("deduplicates when both tiers resolve to the same model", () => {
    process.env["AI_MODEL_BALANCED"] = "same-model";
    process.env["AI_MODEL_FAST"] = "same-model";
    expect(getModelChain(ModelTier.BALANCED)).toEqual(["same-model"]);
  });

  it("uses defaults when env is unset", () => {
    const chain = getModelChain(ModelTier.BALANCED);
    expect(chain[0]).toBe(resolveModelId(ModelTier.BALANCED));
    expect(chain.length).toBeGreaterThanOrEqual(1);
  });
});
