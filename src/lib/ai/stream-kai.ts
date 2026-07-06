import type { Content } from "@google/genai";
import { getGeminiClient } from "@/lib/ai/client";
import { buildKaiFallbackAnswer } from "@/lib/ai/fallback";
import {
  generateContentStreamWithFallback,
  generateContentWithFallback,
} from "@/lib/ai/generate";
import type { StreamEvent } from "@/lib/ai/sse";
import { ModelTier } from "@/lib/ai/models";
import { buildSystemPrompt, wrapUserMessage } from "@/lib/ai/prompts";
import { getMaxOutputTokens } from "@/lib/ai/models";
import { KAI_SAFETY_SETTINGS } from "@/lib/ai/safety";
import { stripUnsafeUnicode } from "@/lib/ai/sanitize";
import { STADIUM_TOOL_DECLARATIONS } from "@/lib/ai/tool-declarations";
import { createToolLoopGuard, MAX_TOOL_TURNS } from "@/lib/ai/tool-loop-guard";
import { applyToolCalls } from "@/lib/ai/tool-turn";
import type { KaiRequest } from "@/lib/ai/assistant-service";
import type { UserContext } from "@/types/stadium";

async function resolveToolTurns(
  contents: Content[],
  context: UserContext,
  signal?: AbortSignal,
): Promise<string[]> {
  const client = getGeminiClient();
  if (!client) {
    return [];
  }

  const usedTools: string[] = [];
  const guard = createToolLoopGuard();

  for (let turn = 0; turn < MAX_TOOL_TURNS; turn += 1) {
    signal?.throwIfAborted();
    const response = await generateContentWithFallback({
      client,
      tier: ModelTier.BALANCED,
      signal,
      buildParams: () => ({
        contents,
        config: {
          systemInstruction: buildSystemPrompt(context),
          maxOutputTokens: getMaxOutputTokens(),
          safetySettings: KAI_SAFETY_SETTINGS,
          tools: [{ functionDeclarations: STADIUM_TOOL_DECLARATIONS }],
        },
      }),
    });

    const calls = response.functionCalls;
    if (!calls || calls.length === 0) {
      break;
    }

    const looped = await applyToolCalls({ contents, calls, usedTools, guard, context });
    if (looped) {
      break;
    }
  }

  return usedTools;
}

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

function* streamFallbackText(text: string): Generator<string> {
  const words = text.split(" ");
  for (const word of words) {
    yield `${word} `;
  }
}

function buildFallbackText(context: UserContext): string {
  return buildKaiFallbackAnswer(context);
}

export async function* streamKai(request: KaiRequest): AsyncGenerator<StreamEvent> {
  const signal = request.signal;
  const contents: Content[] = [
    { role: "user", parts: [{ text: wrapUserMessage(request.message) }] },
  ];

  const usedTools = await resolveToolTurns(contents, request.context, signal);
  if (usedTools.length > 0) {
    yield { type: "tools", names: usedTools };
  }

  const client = getGeminiClient();
  const fallback = !client;
  const tokenStream = client
    ? streamTokensFromGemini(contents, request.context, signal)
    : streamFallbackText(buildFallbackText(request.context));

  let emitted = false;
  for await (const token of tokenStream) {
    emitted = true;
    yield { type: "token", text: token };
  }

  if (!emitted && client) {
    yield { type: "token", text: buildFallbackText(request.context) };
  }

  yield { type: "done", fallback, usedTools };
}
