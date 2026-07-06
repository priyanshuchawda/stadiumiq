import { buildRouteOverlay } from "@/server/services/map-service";
import { mapErrorToResponse } from "@/server/http/error-response";
import { readJsonWithLimit } from "@/server/http/read-json";
import {
  enforceRateLimit,
  rateLimitJsonResponse,
} from "@/server/http/rate-limit-guard";
import { MapRouteRequestSchema } from "@/lib/validation/schemas/map";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  try {
    const rate = enforceRateLimit(request);
    if (!rate.ok) {
      return rateLimitJsonResponse(rate);
    }
    return await handleRouteRequest(request);
  } catch (error) {
    return mapErrorToResponse(error, { route: "POST /api/map/route" });
  }
}

async function handleRouteRequest(request: Request): Promise<Response> {
  const body = await readJsonWithLimit(request);
  const parsed = MapRouteRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid route request." }, { status: 400 });
  }

  const overlay = buildRouteOverlay(
    parsed.data.from,
    parsed.data.to,
    parsed.data.stepFree,
  );

  if (!overlay) {
    return Response.json(
      { error: "No route found for the selected locations." },
      { status: 404 },
    );
  }

  return Response.json(overlay);
}
