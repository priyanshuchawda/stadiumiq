import { getGeminiClient } from "@/lib/ai/client";
import { LruCache } from "@/lib/ai/lru-cache";
import { ModelTier, resolveModelId } from "@/lib/ai/models";
import { runToolLoop } from "@/lib/ai/tool-loop";
import type { UserContext } from "@/types/stadium";

export type KaiRequest = {
  context: UserContext;
  message: string;
  tier?: ModelTier;
};

export type KaiResponse = {
  answer: string;
  usedTools: string[];
  fallback: boolean;
};

const responseCache = new LruCache<KaiResponse>(50, 300_000);

export function clearKaiCacheForTests(): void {
  responseCache.clear();
}

export async function askKai(request: KaiRequest): Promise<KaiResponse> {
  const cacheKey = `${request.context.persona}:${request.context.language}:${request.message}`;
  const cached = responseCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const client = getGeminiClient();
  if (!client) {
    return buildFallbackResponse(request.context);
  }

  const model = resolveModelId(request.tier ?? ModelTier.BALANCED);
  const loopResult = await runToolLoop({
    client,
    model,
    context: request.context,
    message: request.message,
  });

  const payload = loopResult
    ? { answer: loopResult.answer, usedTools: loopResult.usedTools, fallback: false }
    : buildFallbackResponse(request.context);

  responseCache.set(cacheKey, payload);
  return payload;
}

function buildFallbackResponse(context: UserContext): KaiResponse {
  if (context.accessibility.mobility === "wheelchair") {
    return {
      answer:
        "Use Gate C for step-free entry. Head to the North Concourse accessible ramp toward Section 112. Nearest accessible restroom is on the North Concourse.",
      usedTools: [],
      fallback: true,
    };
  }
  return {
    answer:
      "Gate C currently has the shortest wait. Follow concourse signage to your section and allow extra time near Gate B.",
    usedTools: [],
    fallback: true,
  };
}
