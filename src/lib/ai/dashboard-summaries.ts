import "server-only";
import { getGeminiClient } from "@/lib/ai/client";
import { ModelTier, getMaxOutputTokens, resolveModelId } from "@/lib/ai/models";
import { buildRepairPrompt, parseStructuredOutput } from "@/lib/ai/structured-output";
import { withRetry } from "@/lib/ai/with-retry";
import { DashboardAiOutputSchema } from "@/lib/validation/schemas/dashboard";
import type { DashboardAiInsights } from "@/types/dashboard";
import type { IncidentSummary } from "@/server/services/ops-service";

type BuildInsightsInput = {
  incidents: IncidentSummary[];
  staffing: string[];
};

export async function buildDashboardAiInsights(
  input: BuildInsightsInput,
): Promise<DashboardAiInsights> {
  const client = getGeminiClient();
  if (!client) {
    return buildFallbackInsights(input);
  }

  const prompt = buildPrompt(input);
  try {
    const raw = await requestStructuredSummary(client, prompt);
    const parsed = parseStructuredOutput(DashboardAiOutputSchema, raw);
    if (parsed.success) {
      return { ...parsed.data, fallback: false };
    }

    const repaired = await requestStructuredSummary(
      client,
      buildRepairPrompt(raw, parsed.error),
    );
    const retry = parseStructuredOutput(DashboardAiOutputSchema, repaired);
    if (retry.success) {
      return { ...retry.data, fallback: false };
    }
  } catch {
    // fall through
  }

  return buildFallbackInsights(input);
}

function buildPrompt(input: BuildInsightsInput): string {
  const incidentLines = input.incidents
    .map((item) => `${item.area} (${item.severity}): ${item.message}`)
    .join("\n");
  const staffingLines = input.staffing.join("\n");

  return [
    "Summarize stadium operations for organizers. Return JSON only.",
    "Include incidentSummary, priorityActions (max 4), and sentimentDigest in en/es/fr.",
    `Incidents:\n${incidentLines || "None"}`,
    `Staffing suggestions:\n${staffingLines}`,
  ].join("\n\n");
}

async function requestStructuredSummary(
  client: NonNullable<ReturnType<typeof getGeminiClient>>,
  prompt: string,
): Promise<string> {
  const response = await withRetry(() =>
    client.models.generateContent({
      model: resolveModelId(ModelTier.FAST),
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: Math.min(768, getMaxOutputTokens()),
        temperature: 0.4,
      },
    }),
  );
  return response.text?.trim() ?? "{}";
}

function buildFallbackInsights(input: BuildInsightsInput): DashboardAiInsights {
  const top = input.incidents[0];
  const incidentSummary = top
    ? `${top.area} needs attention: ${top.message}`
    : "Operations are stable across Liberty Stadium concourses and gates.";

  return {
    incidentSummary,
    priorityActions: input.staffing.slice(0, 4),
    sentimentDigest: [
      {
        language: "en",
        summary: "Fans report manageable queues; accessibility routes are clear.",
        tone: "mixed",
      },
      {
        language: "es",
        summary: "Aficionados piden más señalización bilingüe cerca de Gate B.",
        tone: "concerned",
      },
      {
        language: "fr",
        summary: "Ambiance positive; attente modérée aux portes nord.",
        tone: "positive",
      },
    ],
    fallback: true,
  };
}
