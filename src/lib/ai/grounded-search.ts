import "server-only";
import { getGeminiClient } from "@/lib/ai/client";
import { LruCache } from "@/lib/ai/lru-cache";
import { ModelTier, getMaxOutputTokens, resolveModelId } from "@/lib/ai/models";
import { parseGroundingMetadata } from "@/lib/ai/parse-grounding";
import { buildGroundedSystemPrompt, wrapUserMessage } from "@/lib/ai/prompts";
import { KAI_SAFETY_SETTINGS } from "@/lib/ai/safety";
import { withRetry } from "@/lib/ai/with-retry";
import {
  getGreenestOption,
  getTransportOptions,
} from "@/server/services/transport-service";
import type { GroundedAnswer } from "@/types/grounding";
import type { UserContext } from "@/types/stadium";

export type GroundedRequest = {
  context: UserContext;
  message: string;
};

const DEFAULT_TTL_SECONDS = 300;
const groundedCache = new LruCache<GroundedAnswer>(40, readGroundingCacheTtlMs());

export function clearGroundedCacheForTests(): void {
  groundedCache.clear();
}

function readGroundingCacheTtlMs(): number {
  const raw = process.env["GROUNDING_CACHE_TTL_SECONDS"];
  const seconds = raw ? Number.parseInt(raw, 10) : DEFAULT_TTL_SECONDS;
  return Number.isFinite(seconds) ? seconds * 1000 : DEFAULT_TTL_SECONDS * 1000;
}

export async function askGroundedKai(
  request: GroundedRequest,
): Promise<GroundedAnswer> {
  const cacheKey = `${request.context.language}:${request.message.trim().toLowerCase()}`;
  const cached = groundedCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const client = getGeminiClient();
  const payload = client
    ? await callGroundedModel(client, request)
    : buildTransportFallback(request);

  groundedCache.set(cacheKey, payload);
  return payload;
}

async function callGroundedModel(
  client: NonNullable<ReturnType<typeof getGeminiClient>>,
  request: GroundedRequest,
): Promise<GroundedAnswer> {
  try {
    const response = await withRetry(() =>
      client.models.generateContent({
        model: resolveModelId(ModelTier.BALANCED),
        contents: wrapUserMessage(request.message),
        config: {
          systemInstruction: buildGroundedSystemPrompt(request.context),
          tools: [{ googleSearch: {} }],
          temperature: 1,
          maxOutputTokens: getMaxOutputTokens(),
          safetySettings: KAI_SAFETY_SETTINGS,
        },
      }),
    );

    const answer = response.text?.trim() ?? "";
    const grounding = parseGroundingMetadata(
      response.candidates?.[0]?.groundingMetadata,
    );

    return {
      answer:
        answer.length > 0
          ? answer
          : "I couldn't find live transport details right now. Try the stadium shuttle or metro.",
      fallback: false,
      ...grounding,
    };
  } catch {
    return buildTransportFallback(request);
  }
}

function buildTransportFallback(request: GroundedRequest): GroundedAnswer {
  const destination = extractDestination(request.message);
  const eco = request.message.toLowerCase().includes("green");
  const options = getTransportOptions({ destination, ecoPriority: eco });
  const best = eco ? getGreenestOption({ destination, ecoPriority: true }) : options[0];
  const top = best ?? options[0];

  const answer = top
    ? `${top.description} Estimated ${top.durationMinutes} min, carbon ~${top.carbonGrams}g.`
    : "Take the stadium shuttle to the nearest metro hub, then connect to your destination.";

  return {
    answer,
    fallback: true,
    webSearchQueries: [`${destination} transit after stadium event`],
    sources: [
      {
        title: "Liberty Stadium Mobility Guide",
        uri: "https://www.metlifestadium.com/plan-your-visit/getting-here",
      },
      {
        title: "NJ Transit Event Service",
        uri: "https://www.njtransit.com/",
      },
    ],
    searchSuggestionsHtml: null,
  };
}

function extractDestination(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("airport")) {
    return "airport";
  }
  if (lower.includes("downtown")) {
    return "downtown";
  }
  return "city center";
}
