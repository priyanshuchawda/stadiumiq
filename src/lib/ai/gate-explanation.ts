import "server-only";
import { getGeminiClient } from "@/lib/ai/client";
import { generateContentWithFallback } from "@/lib/ai/generate";
import { ModelTier, getMaxOutputTokens } from "@/lib/ai/models";
import { KAI_SAFETY_SETTINGS } from "@/lib/ai/safety";
import { enrichmentSignal } from "@/lib/ai/timeouts";
import type { CrowdStatus, GateRecommendation, UserContext } from "@/types/stadium";

type ExplainGateInput = {
  context: UserContext;
  recommendation: GateRecommendation;
  crowdStatuses: CrowdStatus[];
};

export async function explainGateRecommendation(
  input: ExplainGateInput,
): Promise<string> {
  const client = getGeminiClient();
  if (!client) {
    return input.recommendation.reason;
  }

  const crowdSummary = input.crowdStatuses
    .map((item) => `${item.area}: ${item.density}, ${item.waitMinutes} min`)
    .join("; ");

  const prompt = [
    "You are Kai, a concise stadium assistant.",
    `Respond in ${input.context.language}.`,
    `Recommended gate: ${input.recommendation.recommendedGate}.`,
    `Reason: ${input.recommendation.reason}`,
    `Alternatives: ${input.recommendation.alternatives.join(", ") || "none"}.`,
    `Live crowd: ${crowdSummary}.`,
    input.context.accessibility.mobility === "wheelchair"
      ? "User needs step-free access."
      : "User has no step-free requirement.",
    "Write 2 short sentences explaining which gate to use now and why.",
  ].join(" ");

  try {
    const response = await generateContentWithFallback({
      client,
      tier: ModelTier.FAST,
      signal: enrichmentSignal(),
      buildParams: () => ({
        contents: prompt,
        config: {
          maxOutputTokens: Math.min(256, getMaxOutputTokens()),
          safetySettings: KAI_SAFETY_SETTINGS,
        },
      }),
    });
    const text = response.text?.trim();
    return text && text.length > 0 ? text : input.recommendation.reason;
  } catch {
    return input.recommendation.reason;
  }
}
