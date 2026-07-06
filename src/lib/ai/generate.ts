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
import {
  EmptyModelResponseError,
  getRetryErrorType,
  withRetry,
} from "@/lib/ai/with-retry";
import { logger } from "@/lib/logging/logger";

type GenerateParamsWithoutModel = Omit<GenerateContentParameters, "model">;

type GenerateWithFallbackInput = {
  client: GoogleGenAI;
  tier: ModelTier;
  buildParams: (model: string) => GenerateParamsWithoutModel;
  registry?: ModelHealthRegistry;
  signal?: AbortSignal | undefined;
  /** When true, a structurally empty response triggers a retry / model fallback. */
  retryOnEmpty?: boolean;
};

function withSignal(
  params: GenerateParamsWithoutModel,
  model: string,
  signal: AbortSignal | undefined,
): GenerateContentParameters {
  if (!signal) {
    return { ...params, model };
  }
  return {
    ...params,
    model,
    config: { ...(params.config ?? {}), abortSignal: signal },
  };
}

export function isEmptyModelResponse(response: GenerateContentResponse): boolean {
  const hasToolCalls = (response.functionCalls?.length ?? 0) > 0;
  const hasText = (response.text?.trim().length ?? 0) > 0;
  return !hasToolCalls && !hasText;
}

/**
 * Non-streaming generateContent across the tier's model fallback chain, with
 * per-model transient retry (withRetry) nested inside per-model fallback, and
 * optional abort + retry-on-empty-content handling.
 */
export function generateContentWithFallback(
  input: GenerateWithFallbackInput,
): Promise<GenerateContentResponse> {
  return runWithModelFallback({
    models: getModelChain(input.tier),
    registry: input.registry ?? getSharedModelHealthRegistry(),
    execute: (model) =>
      withRetry(
        async () => {
          const response = await input.client.models.generateContent(
            withSignal(input.buildParams(model), model, input.signal),
          );
          if (input.retryOnEmpty && isEmptyModelResponse(response)) {
            throw new EmptyModelResponseError();
          }
          return response;
        },
        {
          signal: input.signal,
          onRetry: (attempt, error, delayMs) => {
            logger.debug(
              { model, attempt, delayMs, errorType: getRetryErrorType(error) },
              "gemini_retry",
            );
          },
        },
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
      withRetry(
        () =>
          input.client.models.generateContentStream(
            withSignal(input.buildParams(model), model, input.signal),
          ),
        { signal: input.signal },
      ),
  });
}
