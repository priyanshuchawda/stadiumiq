export enum ModelTier {
  FAST = "FAST",
  BALANCED = "BALANCED",
}

const DEFAULT_MODELS: Record<ModelTier, string> = {
  [ModelTier.FAST]: "gemini-2.5-flash-lite",
  [ModelTier.BALANCED]: "gemini-2.5-flash",
};

export function resolveModelId(tier: ModelTier): string {
  if (tier === ModelTier.FAST) {
    return process.env["AI_MODEL_FAST"] ?? DEFAULT_MODELS[ModelTier.FAST];
  }
  return process.env["AI_MODEL_BALANCED"] ?? DEFAULT_MODELS[ModelTier.BALANCED];
}

export function getMaxOutputTokens(): number {
  const raw = process.env["AI_MAX_OUTPUT_TOKENS"];
  const parsed = raw ? Number.parseInt(raw, 10) : 1024;
  return Number.isFinite(parsed) ? parsed : 1024;
}
