import { afterEach, describe, expect, it, vi } from "vitest";
import type { GoogleGenAI } from "@google/genai";
import {
  generateContentStreamWithFallback,
  generateContentWithFallback,
} from "@/lib/ai/generate";
import { ModelTier } from "@/lib/ai/models";
import { createModelHealthRegistry } from "@/lib/ai/model-fallback";

afterEach(() => {
  delete process.env["AI_MODEL_BALANCED"];
  delete process.env["AI_MODEL_FAST"];
});

function makeClient(overrides: {
  generateContent?: ReturnType<typeof vi.fn>;
  generateContentStream?: ReturnType<typeof vi.fn>;
}): GoogleGenAI {
  return {
    models: {
      generateContent: overrides.generateContent ?? vi.fn(),
      generateContentStream: overrides.generateContentStream ?? vi.fn(),
    },
  } as unknown as GoogleGenAI;
}

describe("generateContentWithFallback", () => {
  it("injects the selected model and returns the response", async () => {
    const generateContent = vi.fn().mockResolvedValue({ text: "hi" });
    const client = makeClient({ generateContent });
    const registry = createModelHealthRegistry();

    const response = await generateContentWithFallback({
      client,
      tier: ModelTier.BALANCED,
      registry,
      buildParams: () => ({ contents: "hello" }),
    });

    expect(response).toEqual({ text: "hi" });
    expect(generateContent).toHaveBeenCalledWith(
      expect.objectContaining({ contents: "hello", model: expect.any(String) }),
    );
  });

  it("falls back to the secondary model when the primary is unavailable", async () => {
    process.env["AI_MODEL_BALANCED"] = "model-primary";
    process.env["AI_MODEL_FAST"] = "model-secondary";
    const generateContent = vi.fn(async (params: { model: string }) => {
      if (params.model === "model-primary") {
        throw { status: 503 };
      }
      return { text: "from-secondary" };
    });
    const client = makeClient({ generateContent });
    const registry = createModelHealthRegistry();

    const response = await generateContentWithFallback({
      client,
      tier: ModelTier.BALANCED,
      registry,
      buildParams: () => ({ contents: "hello" }),
    });

    expect(response).toEqual({ text: "from-secondary" });
    const usedModels = new Set(generateContent.mock.calls.map((call) => call[0].model));
    expect(usedModels.has("model-primary")).toBe(true);
    expect(usedModels.has("model-secondary")).toBe(true);
    expect(registry.isAvailable("model-primary")).toBe(false);
  });
});

describe("generateContentStreamWithFallback", () => {
  it("injects the model into the stream call", async () => {
    const generateContentStream = vi.fn().mockResolvedValue("stream");
    const client = makeClient({ generateContentStream });
    const registry = createModelHealthRegistry();

    const stream = await generateContentStreamWithFallback({
      client,
      tier: ModelTier.FAST,
      registry,
      buildParams: () => ({ contents: "hello" }),
    });

    expect(stream).toBe("stream");
    expect(generateContentStream).toHaveBeenCalledWith(
      expect.objectContaining({ contents: "hello", model: expect.any(String) }),
    );
  });
});
