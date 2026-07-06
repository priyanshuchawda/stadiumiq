import { getGeminiClient } from "@/lib/ai/client";
import { buildKaiFallbackAnswer } from "@/lib/ai/fallback";
import { LruCache } from "@/lib/ai/lru-cache";
import { ModelTier } from "@/lib/ai/models";
import { runToolLoop } from "@/lib/ai/tool-loop";
import type { UserContext } from "@/types/stadium";

export type KaiRequest = {
  context: UserContext;
  message: string;
  tier?: ModelTier;
  signal?: AbortSignal;
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

  const loopResult = await runToolLoop({
    client,
    tier: request.tier ?? ModelTier.BALANCED,
    context: request.context,
    message: request.message,
    ...(request.signal ? { signal: request.signal } : {}),
  });

  const payload = loopResult.answer
    ? {
        answer: loopResult.answer,
        usedTools: loopResult.usedTools,
        fallback: false,
      }
    : buildFallbackResponse(request.context);

  responseCache.set(cacheKey, payload);
  return payload;
}

function buildFallbackResponse(context: UserContext): KaiResponse {
  return {
    answer: buildKaiFallbackAnswer(context),
    usedTools: [],
    fallback: true,
  };
}
