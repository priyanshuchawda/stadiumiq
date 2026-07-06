import type { Content, FunctionCall } from "@google/genai";
import { executeToolCall } from "@/lib/ai/tool-executors";
import type { ToolLoopGuard } from "@/lib/ai/tool-loop-guard";
import type { UserContext } from "@/types/stadium";

type ApplyToolCallsParams = {
  contents: Content[];
  calls: FunctionCall[];
  usedTools: string[];
  guard: ToolLoopGuard;
  context: UserContext;
};

/**
 * Executes a batch of model-requested tool calls, appending each call and its
 * result to the conversation. Returns true when the loop guard trips on a
 * repeated identical call, signalling the caller to stop the loop.
 */
export async function applyToolCalls(params: ApplyToolCallsParams): Promise<boolean> {
  for (const call of params.calls) {
    if (!call.name) {
      continue;
    }
    if (params.guard.isRepeating(call.name, call.args)) {
      return true;
    }
    params.usedTools.push(call.name);
    const result = await executeToolCall(call.name, call.args ?? {}, params.context);
    params.contents.push({
      role: "model",
      parts: [{ functionCall: { name: call.name, args: call.args ?? {} } }],
    });
    params.contents.push({
      role: "user",
      parts: [{ functionResponse: { name: call.name, response: { result } } }],
    });
  }
  return false;
}
