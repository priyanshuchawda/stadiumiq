import "server-only";

import { askGroundedKai } from "@/lib/ai/grounded-search";
import { GroundedRequestSchema } from "@/lib/validation/schemas/grounding";
import { toUserContext } from "@/lib/validation/to-user-context";
import { checkRateLimit } from "@/server/security/rate-limit";
import type { GroundedAnswer } from "@/types/grounding";

export type GroundedHandlerResult =
  | { ok: true; payload: GroundedAnswer }
  | { ok: false; status: number; message: string; retryAfter?: number };

export async function handleGroundedRequest(
  body: unknown,
  clientKey: string,
): Promise<GroundedHandlerResult> {
  const parsed = GroundedRequestSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, status: 400, message: "Invalid request." };
  }

  const rate = checkRateLimit(clientKey);
  if (!rate.allowed) {
    return {
      ok: false,
      status: 429,
      message: "Too many requests. Please wait and try again.",
      retryAfter: rate.retryAfterSeconds,
    };
  }

  const payload = await askGroundedKai({
    context: toUserContext(parsed.data.context),
    message: parsed.data.message,
  });

  return { ok: true, payload };
}
