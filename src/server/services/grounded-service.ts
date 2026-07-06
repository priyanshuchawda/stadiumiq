import "server-only";

import { askGroundedKai } from "@/lib/ai/grounded-search";
import { GroundedRequestSchema } from "@/lib/validation/schemas/grounding";
import { toUserContext } from "@/lib/validation/to-user-context";
import {
  enforceRateLimit,
  type RateLimitGuardResult,
} from "@/server/http/rate-limit-guard";
import type { GroundedAnswer } from "@/types/grounding";

export type GroundedHandlerResult =
  | { ok: true; payload: GroundedAnswer }
  | { ok: false; status: number; message: string; retryAfter?: number };

export async function handleGroundedRequest(
  body: unknown,
  request: Request,
): Promise<GroundedHandlerResult> {
  const rate = enforceRateLimit(request);
  if (!rate.ok) {
    return toGroundedDenied(rate);
  }

  const parsed = GroundedRequestSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, status: 400, message: "Invalid request." };
  }

  const payload = await askGroundedKai({
    context: toUserContext(parsed.data.context),
    message: parsed.data.message,
  });

  return { ok: true, payload };
}

function toGroundedDenied(
  rate: Extract<RateLimitGuardResult, { ok: false }>,
): GroundedHandlerResult {
  return {
    ok: false,
    status: rate.status,
    message: rate.message,
    retryAfter: rate.retryAfter,
  };
}
