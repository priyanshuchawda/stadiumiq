import { buildRouteOverlay } from "@/server/services/map-service";
import { mapErrorToResponse } from "@/server/http/error-response";
import { MapRouteRequestSchema } from "@/lib/validation/schemas/map";

export async function POST(request: Request): Promise<Response> {
  try {
    return await handleRouteRequest(request);
  } catch (error) {
    return mapErrorToResponse(error, { route: "POST /api/map/route" });
  }
}

async function handleRouteRequest(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

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
