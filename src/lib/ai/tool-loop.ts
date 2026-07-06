import type { Content } from "@google/genai";
import type { GoogleGenAI } from "@google/genai";
import { generateContentWithFallback } from "@/lib/ai/generate";
import { getMaxOutputTokens, ModelTier } from "@/lib/ai/models";
import { buildSystemPrompt, wrapUserMessage } from "@/lib/ai/prompts";
import { KAI_SAFETY_SETTINGS } from "@/lib/ai/safety";
import { STADIUM_TOOL_DECLARATIONS } from "@/lib/ai/tool-declarations";
import { createToolLoopGuard, MAX_TOOL_TURNS } from "@/lib/ai/tool-loop-guard";
import { applyToolCalls } from "@/lib/ai/tool-turn";
import type { UserContext } from "@/types/stadium";

type ToolLoopInput = {
  client: GoogleGenAI;
  tier: ModelTier;
  context: UserContext;
  message: string;
  signal?: AbortSignal;
};

type ToolLoopResult = {
  answer: string;
  usedTools: string[];
};

export async function runToolLoop(
  input: ToolLoopInput,
): Promise<ToolLoopResult | null> {
  const usedTools: string[] = [];
  const guard = createToolLoopGuard();
  const contents: Content[] = [
    { role: "user", parts: [{ text: wrapUserMessage(input.message) }] },
  ];

  for (let turn = 0; turn < MAX_TOOL_TURNS; turn += 1) {
    input.signal?.throwIfAborted();
    const response = await generateContentWithFallback({
      client: input.client,
      tier: input.tier,
      signal: input.signal,
      buildParams: () => ({
        contents,
        config: {
          systemInstruction: buildSystemPrompt(input.context),
          maxOutputTokens: getMaxOutputTokens(),
          safetySettings: KAI_SAFETY_SETTINGS,
          tools: [{ functionDeclarations: STADIUM_TOOL_DECLARATIONS }],
        },
      }),
    });

    const calls = response.functionCalls;
    if (calls && calls.length > 0) {
      const looped = await applyToolCalls({
        contents,
        calls,
        usedTools,
        guard,
        context: input.context,
      });
      if (looped) {
        break;
      }
      continue;
    }

    const answer = response.text?.trim();
    if (answer) {
      return { answer, usedTools };
    }
  }

  return null;
}
