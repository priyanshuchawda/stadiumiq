import "server-only";

import { getGeminiClient } from "@/lib/ai/client";
import { buildSystemPrompt, wrapUserMessage } from "@/lib/ai/prompts";
import { getMaxOutputTokens, ModelTier, resolveModelId } from "@/lib/ai/models";
import { withRetry } from "@/lib/ai/with-retry";
import type { UserContext } from "@/types/stadium";

type VisionAnalysisInput = {
  file: File;
  request: { prompt: string; context: UserContext };
};

export async function analyzeVisionImage(
  input: VisionAnalysisInput,
): Promise<{ answer: string; fallback: boolean }> {
  const client = getGeminiClient();
  const { file, request } = input;

  if (!client) {
    return {
      answer: "Vision analysis unavailable without a Gemini API key.",
      fallback: true,
    };
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const model = resolveModelId(ModelTier.BALANCED);

  const response = await withRetry(() =>
    client.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            { text: wrapUserMessage(request.prompt) },
            { inlineData: { mimeType: file.type, data: bytes.toString("base64") } },
          ],
        },
      ],
      config: {
        systemInstruction: buildSystemPrompt(request.context),
        maxOutputTokens: getMaxOutputTokens(),
      },
    }),
  );

  return {
    answer: response.text?.trim() ?? "Could not analyze the image.",
    fallback: false,
  };
}
