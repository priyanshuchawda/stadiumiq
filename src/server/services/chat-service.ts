import "server-only";

import { createSseStream } from "@/lib/ai/sse";
import { streamKai } from "@/lib/ai/stream-kai";
import { ChatRequestSchema } from "@/lib/validation/schemas/chat";
import { toUserContext } from "@/lib/validation/to-user-context";
import {
  enforceRateLimit,
  type RateLimitGuardResult,
} from "@/server/http/rate-limit-guard";

export type ChatHandlerResult =
  | { ok: true; stream: ReadableStream<Uint8Array> }
  | { ok: false; status: number; message: string; retryAfter?: number };

export function handleChatRequest(body: unknown, request: Request): ChatHandlerResult {
  const rate = enforceRateLimit(request);
  if (!rate.ok) {
    return toChatDenied(rate);
  }

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, status: 400, message: "Invalid request." };
  }

  const events = streamKai({
    context: toUserContext(parsed.data.context),
    message: parsed.data.message,
    signal: request.signal,
  });

  return { ok: true, stream: createSseStream(events) };
}

function toChatDenied(
  rate: Extract<RateLimitGuardResult, { ok: false }>,
): ChatHandlerResult {
  return {
    ok: false,
    status: rate.status,
    message: rate.message,
    retryAfter: rate.retryAfter,
  };
}
