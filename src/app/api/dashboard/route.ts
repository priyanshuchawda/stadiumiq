import { mapErrorToResponse } from "@/server/http/error-response";
import {
  enforceRateLimit,
  rateLimitJsonResponse,
} from "@/server/http/rate-limit-guard";
import { buildDashboardSnapshot } from "@/server/services/dashboard-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const rate = enforceRateLimit(request);
    if (!rate.ok) {
      return rateLimitJsonResponse(rate);
    }
    const snapshot = await buildDashboardSnapshot();
    return Response.json(snapshot, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return mapErrorToResponse(error, { route: "GET /api/dashboard" });
  }
}
