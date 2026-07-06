import { getClientKey } from "@/server/http/client-key";
import { mapErrorToResponse } from "@/server/http/error-response";
import { handleGroundedRequest } from "@/server/services/grounded-service";

export async function POST(request: Request): Promise<Response> {
  try {
    const clientKey = getClientKey(request);
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const result = await handleGroundedRequest(body, clientKey);
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

    return Response.json(result.payload);
  } catch (error) {
    return mapErrorToResponse(error, { route: "POST /api/grounded" });
  }
}
