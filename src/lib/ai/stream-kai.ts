import type { Content } from "@google/genai";
import { getGeminiClient } from "@/lib/ai/client";
import { buildKaiFallbackAnswer } from "@/lib/ai/fallback";
import type { StreamEvent } from "@/lib/ai/sse";
import { ModelTier, resolveModelId } from "@/lib/ai/models";
import { buildSystemPrompt, wrapUserMessage } from "@/lib/ai/prompts";
import { getMaxOutputTokens } from "@/lib/ai/models";
import { KAI_SAFETY_SETTINGS } from "@/lib/ai/safety";
import { STADIUM_TOOL_DECLARATIONS } from "@/lib/ai/tool-declarations";
import { executeToolCall } from "@/lib/ai/tool-executors";
import { withRetry } from "@/lib/ai/with-retry";
import type { KaiRequest } from "@/lib/ai/assistant-service";
import type { UserContext } from "@/types/stadium";

async function resolveToolTurns(
  contents: Content[],
  context: UserContext,
): Promise<string[]> {
  const client = getGeminiClient();
  if (!client) {
    return [];
  }

  const model = resolveModelId(ModelTier.BALANCED);
  const usedTools: string[] = [];

  for (let turn = 0; turn < 4; turn += 1) {
    const response = await withRetry(() =>
      client.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: buildSystemPrompt(context),
          maxOutputTokens: getMaxOutputTokens(),
          safetySettings: KAI_SAFETY_SETTINGS,
          tools: [{ functionDeclarations: STADIUM_TOOL_DECLARATIONS }],
        },
      }),
    );

    const calls = response.functionCalls;
    if (!calls || calls.length === 0) {
      break;
    }

    for (const call of calls) {
      if (!call.name) {
        continue;
      }
      usedTools.push(call.name);
      const result = await executeToolCall(call.name, call.args ?? {}, context);
      contents.push({
        role: "model",
        parts: [{ functionCall: { name: call.name, args: call.args ?? {} } }],
      });
      contents.push({
        role: "user",
        parts: [{ functionResponse: { name: call.name, response: { result } } }],
      });
    }
  }

  return usedTools;
}

async function* streamTokensFromGemini(
  contents: Content[],
  context: UserContext,
): AsyncGenerator<string> {
  const client = getGeminiClient();
  if (!client) {
    return;
  }

  const model = resolveModelId(ModelTier.BALANCED);
  const stream = await withRetry(() =>
    client.models.generateContentStream({
      model,
      contents,
      config: {
        systemInstruction: buildSystemPrompt(context),
        maxOutputTokens: getMaxOutputTokens(),
        safetySettings: KAI_SAFETY_SETTINGS,
      },
    }),
  );

  for await (const chunk of stream) {
    const text = chunk.text;
    if (text) {
      yield text;
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
  const contents: Content[] = [
    { role: "user", parts: [{ text: wrapUserMessage(request.message) }] },
  ];

  const usedTools = await resolveToolTurns(contents, request.context);
  if (usedTools.length > 0) {
    yield { type: "tools", names: usedTools };
  }

  const client = getGeminiClient();
  const fallback = !client;
  const tokenStream = client
    ? streamTokensFromGemini(contents, request.context)
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
