import "server-only";

import { createSseStream } from "@/lib/ai/sse";
import { streamKai } from "@/lib/ai/stream-kai";
import { ChatRequestSchema } from "@/lib/validation/schemas/chat";
import { toUserContext } from "@/lib/validation/to-user-context";
import { checkRateLimit } from "@/server/security/rate-limit";

export type ChatHandlerResult =
  | { ok: true; stream: ReadableStream<Uint8Array> }
  | { ok: false; status: number; message: string; retryAfter?: number };

export function handleChatRequest(
  body: unknown,
  clientKey: string,
  signal?: AbortSignal,
): ChatHandlerResult {
  const parsed = ChatRequestSchema.safeParse(body);
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

  const events = streamKai({
    context: toUserContext(parsed.data.context),
    message: parsed.data.message,
    ...(signal ? { signal } : {}),
  });

  return { ok: true, stream: createSseStream(events) };
}
