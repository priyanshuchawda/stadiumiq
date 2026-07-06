/**
 * Parsers for structured `google.rpc` error detail payloads returned by the
 * Gemini API (e.g. RetryInfo.retryDelay), kept isolated from the generic retry
 * logic so each stays small and focused.
 */

export function parseDurationToMs(raw: string): number | null {
  const match = raw.trim().match(/^(\d+(?:\.\d+)?)s$/);
  if (!match?.[1]) {
    return null;
  }
  const seconds = Number(match[1]);
  return Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds * 1_000) : null;
}

function retryDelayFromDetails(details: unknown): number | null {
  if (!Array.isArray(details)) {
    return null;
  }
  for (const detail of details) {
    const delay = (detail as { retryDelay?: unknown })?.retryDelay;
    if (typeof delay === "string") {
      const ms = parseDurationToMs(delay);
      if (ms) {
        return ms;
      }
    }
  }
  return null;
}

/**
 * Extracts a `google.rpc.RetryInfo.retryDelay` (e.g. "12s") from a structured
 * error `details` array or from the serialized error message.
 */
export function parseGoogleRetryInfoMs(error: unknown): number | null {
  if (!error || typeof error !== "object") {
    return null;
  }
  const fromDetails = retryDelayFromDetails((error as { details?: unknown }).details);
  if (fromDetails) {
    return fromDetails;
  }
  if (error instanceof Error) {
    const match = error.message.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?s)"/);
    if (match?.[1]) {
      return parseDurationToMs(match[1]);
    }
  }
  return null;
}
