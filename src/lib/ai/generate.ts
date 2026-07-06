import type {
  GenerateContentParameters,
  GenerateContentResponse,
  GoogleGenAI,
} from "@google/genai";
import { getModelChain, ModelTier } from "@/lib/ai/models";
import {
  getSharedModelHealthRegistry,
  runWithModelFallback,
  type ModelHealthRegistry,
} from "@/lib/ai/model-fallback";
import { withRetry } from "@/lib/ai/with-retry";

type GenerateParamsWithoutModel = Omit<GenerateContentParameters, "model">;

type GenerateWithFallbackInput = {
  client: GoogleGenAI;
  tier: ModelTier;
  buildParams: (model: string) => GenerateParamsWithoutModel;
  registry?: ModelHealthRegistry;
};

/**
 * Non-streaming generateContent across the tier's model fallback chain, with
 * per-model transient retry (withRetry) nested inside per-model fallback.
 */
export function generateContentWithFallback(
  input: GenerateWithFallbackInput,
): Promise<GenerateContentResponse> {
  return runWithModelFallback({
    models: getModelChain(input.tier),
    registry: input.registry ?? getSharedModelHealthRegistry(),
    execute: (model) =>
      withRetry(() =>
        input.client.models.generateContent({ ...input.buildParams(model), model }),
      ),
  });
}

/**
 * Streaming generateContentStream across the tier's model fallback chain.
 * Fallback applies to stream creation (before the first chunk streams).
 */
export function generateContentStreamWithFallback(input: GenerateWithFallbackInput) {
  return runWithModelFallback({
    models: getModelChain(input.tier),
    registry: input.registry ?? getSharedModelHealthRegistry(),
    execute: (model) =>
      withRetry(() =>
        input.client.models.generateContentStream({
          ...input.buildParams(model),
          model,
        }),
      ),
  });
}
