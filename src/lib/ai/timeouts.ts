/**
 * Deadlines for AI calls made while rendering a page/response. External model
 * calls must be bounded so a slow/rate-limited provider degrades to a
 * deterministic fallback quickly instead of blocking the render.
 */
export const AI_ENRICHMENT_TIMEOUT_MS = 12_000;

export function enrichmentSignal(): AbortSignal {
  return AbortSignal.timeout(AI_ENRICHMENT_TIMEOUT_MS);
}
