import { getModelChain, ModelTier } from "@/lib/ai/models";
import { getServerEnvStatus } from "@/lib/env/check-gemini-key";

export const dynamic = "force-dynamic";

export function GET(): Response {
  const env = getServerEnvStatus();
  return Response.json(
    {
      status: "ok",
      time: new Date().toISOString(),
      features: {
        geminiConfigured: env.hasGeminiKey,
        aiMode: env.hasGeminiKey ? "live" : "fallback",
      },
      models: {
        balanced: getModelChain(ModelTier.BALANCED),
        fast: getModelChain(ModelTier.FAST),
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
