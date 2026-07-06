import { getClientKey } from "@/server/http/client-key";
import { checkRateLimit } from "@/server/security/rate-limit";

export type RateLimitDenied = {
  ok: false;
  status: 429;
  message: string;
  retryAfter: number;
};

export type RateLimitAllowed = { ok: true };

export type RateLimitGuardResult = RateLimitAllowed | RateLimitDenied;

export function enforceRateLimit(request: Request): RateLimitGuardResult {
  const clientKey = getClientKey(request);
  const rate = checkRateLimit(clientKey);
  if (!rate.allowed) {
    return {
      ok: false,
      status: 429,
      message: "Too many requests. Please wait and try again.",
      retryAfter: rate.retryAfterSeconds,
    };
  }
  return { ok: true };
}

export function rateLimitJsonResponse(denied: RateLimitDenied): Response {
  return Response.json(
    { error: denied.message },
    { status: denied.status, headers: { "Retry-After": String(denied.retryAfter) } },
  );
}
