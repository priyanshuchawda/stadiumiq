import { getClientKey } from "@/server/http/client-key";
import { mapErrorToResponse } from "@/server/http/error-response";
import { readJsonWithLimit } from "@/server/http/read-json";
import { handleGroundedRequest } from "@/server/services/grounded-service";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request): Promise<Response> {
  try {
    const clientKey = getClientKey(request);
    const body = await readJsonWithLimit(request);
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
