import "server-only";
import type { GroundingMetadata } from "@google/genai";
import { sanitizeGroundingHtml } from "@/lib/utils/sanitize-grounding-html";
import { sanitizeHttpsUrl } from "@/lib/utils/is-https-url";
import type { GroundingSource } from "@/types/grounding";

export type ParsedGrounding = {
  webSearchQueries: string[];
  sources: GroundingSource[];
  searchSuggestionsHtml: string | null;
};

function extractWebSources(
  chunks: GroundingMetadata["groundingChunks"],
): GroundingSource[] {
  const sources: GroundingSource[] = [];
  for (const chunk of chunks ?? []) {
    const uri = chunk.web?.uri;
    const safeUri = uri ? sanitizeHttpsUrl(uri) : null;
    if (!safeUri) {
      continue;
    }
    sources.push({
      title: chunk.web?.title?.trim() || safeUri,
      uri: safeUri,
    });
  }
  return dedupeSources(sources);
}

function dedupeSources(sources: GroundingSource[]): GroundingSource[] {
  const seen = new Set<string>();
  return sources.filter((source) => {
    if (seen.has(source.uri)) {
      return false;
    }
    seen.add(source.uri);
    return true;
  });
}

export function parseGroundingMetadata(
  metadata: GroundingMetadata | undefined,
): ParsedGrounding {
  const rendered = metadata?.searchEntryPoint?.renderedContent?.trim();
  return {
    webSearchQueries: metadata?.webSearchQueries ?? [],
    sources: extractWebSources(metadata?.groundingChunks),
    searchSuggestionsHtml: rendered ? sanitizeGroundingHtml(rendered) : null,
  };
}
