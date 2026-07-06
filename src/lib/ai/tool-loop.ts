import type { Content, FunctionCall } from "@google/genai";
import type { GoogleGenAI } from "@google/genai";
import { getMaxOutputTokens } from "@/lib/ai/models";
import { buildSystemPrompt, wrapUserMessage } from "@/lib/ai/prompts";
import { STADIUM_TOOL_DECLARATIONS } from "@/lib/ai/tool-declarations";
import { executeToolCall } from "@/lib/ai/tool-executors";
import { withRetry } from "@/lib/ai/with-retry";
import type { UserContext } from "@/types/stadium";

type ToolLoopInput = {
  client: GoogleGenAI;
  model: string;
  context: UserContext;
  message: string;
};

type ToolLoopResult = {
  answer: string;
  usedTools: string[];
};

export async function runToolLoop(
  input: ToolLoopInput,
): Promise<ToolLoopResult | null> {
  const usedTools: string[] = [];
  const contents: Content[] = [
    { role: "user", parts: [{ text: wrapUserMessage(input.message) }] },
  ];

  for (let turn = 0; turn < 4; turn += 1) {
    const response = await withRetry(() =>
      input.client.models.generateContent({
        model: input.model,
        contents,
        config: {
          systemInstruction: buildSystemPrompt(input.context),
          maxOutputTokens: getMaxOutputTokens(),
          tools: [{ functionDeclarations: STADIUM_TOOL_DECLARATIONS }],
        },
      }),
    );

    const calls = response.functionCalls;
    if (calls && calls.length > 0) {
      await appendToolResults(contents, calls, usedTools, input.context);
      continue;
    }

    const answer = response.text?.trim();
    if (answer) {
      return { answer, usedTools };
    }
  }

  return null;
}

async function appendToolResults(
  contents: Content[],
  calls: FunctionCall[],
  usedTools: string[],
  context: UserContext,
): Promise<void> {
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
