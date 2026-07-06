import type { Content } from "@google/genai";
import { getGeminiClient } from "@/lib/ai/client";
import { buildKaiFallbackAnswer } from "@/lib/ai/fallback";
import { generateContentStreamWithFallback } from "@/lib/ai/generate";
import type { StreamEvent } from "@/lib/ai/sse";
import { ModelTier } from "@/lib/ai/models";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import { getMaxOutputTokens } from "@/lib/ai/models";
import { KAI_SAFETY_SETTINGS } from "@/lib/ai/safety";
import { stripUnsafeUnicode } from "@/lib/ai/sanitize";
import { runToolLoop } from "@/lib/ai/tool-loop";
import type { KaiRequest } from "@/lib/ai/assistant-service";
import type { UserContext } from "@/types/stadium";

async function* streamTokensFromGemini(
  contents: Content[],
  context: UserContext,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const client = getGeminiClient();
  if (!client) {
    return;
  }

  const stream = await generateContentStreamWithFallback({
    client,
    tier: ModelTier.BALANCED,
    signal,
    buildParams: () => ({
      contents,
      config: {
        systemInstruction: buildSystemPrompt(context),
        maxOutputTokens: getMaxOutputTokens(),
        safetySettings: KAI_SAFETY_SETTINGS,
      },
    }),
  });

  for await (const chunk of stream) {
    if (signal?.aborted) {
      return;
    }
    const text = chunk.text;
    if (text) {
      yield stripUnsafeUnicode(text);
    }
  }
}

function* streamText(text: string): Generator<string> {
  const words = text.split(" ");
  for (const word of words) {
    yield `${word} `;
  }
}

/**
 * Streams a Kai answer as SSE events. Reuses the shared tool loop for
 * function calling; when the loop already produced a final answer we stream
 * it directly instead of paying for a second model call. The streaming API is
 * only used when the loop ended without text (e.g. guard tripped).
 */
export async function* streamKai(request: KaiRequest): AsyncGenerator<StreamEvent> {
  const signal = request.signal;
  const client = getGeminiClient();
  const fallback = !client;

  let usedTools: string[] = [];
  let finalText: string | null = null;
  let contents: Content[] = [];

  if (client) {
    const outcome = await runToolLoop({
      client,
      tier: ModelTier.BALANCED,
      context: request.context,
      message: request.message,
      ...(signal ? { signal } : {}),
    });
    usedTools = outcome.usedTools;
    finalText = outcome.answer;
    contents = outcome.contents;
  }

  if (usedTools.length > 0) {
    yield { type: "tools", names: usedTools };
  }

  let emitted = false;

  if (finalText) {
    for (const token of streamText(finalText)) {
      emitted = true;
      yield { type: "token", text: token };
    }
  } else if (client) {
    for await (const token of streamTokensFromGemini(
      contents,
      request.context,
      signal,
    )) {
      emitted = true;
      yield { type: "token", text: token };
    }
  } else {
    for (const token of streamText(buildKaiFallbackAnswer(request.context))) {
      emitted = true;
      yield { type: "token", text: token };
    }
  }

  if (!emitted) {
    yield { type: "token", text: buildKaiFallbackAnswer(request.context) };
  }

  yield { type: "done", fallback, usedTools };
}
