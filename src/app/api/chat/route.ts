import { getClientKey } from "@/server/http/client-key";
import { mapErrorToResponse } from "@/server/http/error-response";
import { handleChatRequest } from "@/server/services/chat-service";

export async function POST(request: Request): Promise<Response> {
  try {
    const clientKey = getClientKey(request);
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const result = handleChatRequest(body, clientKey);
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
