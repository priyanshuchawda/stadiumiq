import { z } from "zod";
import { checkGeminiKeyConfigured } from "@/lib/env/check-gemini-key";

const positiveNumericString = (label: string) =>
  z
    .string()
    .optional()
    .refine(
      (value) =>
        value === undefined || (Number.isFinite(Number(value)) && Number(value) > 0),
      { message: `${label} must be a positive number` },
    );

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  GEMINI_API_KEY: z.string().optional(),
  AI_MODEL_FAST: z.string().min(1).optional(),
  AI_MODEL_BALANCED: z.string().min(1).optional(),
  AI_MAX_OUTPUT_TOKENS: positiveNumericString("AI_MAX_OUTPUT_TOKENS"),
  GROUNDING_CACHE_TTL_SECONDS: positiveNumericString("GROUNDING_CACHE_TTL_SECONDS"),
  RATE_LIMIT_PER_MINUTE: positiveNumericString("RATE_LIMIT_PER_MINUTE"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .optional(),
});

export type ServerEnv = z.infer<typeof EnvSchema>;

export type EnvValidationResult =
  { ok: true; env: ServerEnv; warnings: string[] } | { ok: false; errors: string[] };

/**
 * Validates runtime environment shape (types/formats), independent of value
 * presence. Missing recommended values surface as warnings, never hard errors,
 * so the app degrades gracefully to deterministic fallbacks.
 */
export function validateServerEnv(
  source: Record<string, string | undefined> = process.env,
): EnvValidationResult {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map(
        (issue) => `${issue.path.join(".") || "env"}: ${issue.message}`,
      ),
    };
  }

  const warnings: string[] = [];
  if (!checkGeminiKeyConfigured(parsed.data.GEMINI_API_KEY)) {
    warnings.push(
      "GEMINI_API_KEY is not configured; AI features will use deterministic fallbacks.",
    );
  }

  return { ok: true, env: parsed.data, warnings };
}
