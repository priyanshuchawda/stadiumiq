import { getClientKey } from "@/server/http/client-key";
import { mapErrorToResponse } from "@/server/http/error-response";
import { readJsonWithLimit } from "@/server/http/read-json";
import { handleChatRequest } from "@/server/services/chat-service";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request): Promise<Response> {
  try {
    const clientKey = getClientKey(request);
    const body = await readJsonWithLimit(request);
    const result = handleChatRequest(body, clientKey, request.signal);
    if (!result.ok) {
      const headers: Record<string, string> = {};
      if (result.retryAfter) {
        headers["Retry-After"] = String(result.retryAfter);
      }
      return Response.json(
        { error: result.message },
        { status: result.status, headers },
      );
    }

    return new Response(result.stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return mapErrorToResponse(error, { route: "POST /api/chat" });
  }
}
