import { buildMapCrowdSnapshot } from "@/server/services/map-service";
import { mapErrorToResponse } from "@/server/http/error-response";
import {
  enforceRateLimit,
  rateLimitJsonResponse,
} from "@/server/http/rate-limit-guard";
import { MapCrowdQuerySchema } from "@/lib/validation/schemas/map";
import { UserContextSchema } from "@/lib/validation/schemas/stadium";
import { toUserContext } from "@/lib/validation/to-user-context";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const rate = enforceRateLimit(request);
    if (!rate.ok) {
      return rateLimitJsonResponse(rate);
    }
    return await handleCrowdRequest(request);
  } catch (error) {
    return mapErrorToResponse(error, { route: "GET /api/map/crowd" });
  }
}

async function handleCrowdRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const parsed = MapCrowdQuerySchema.safeParse({
    mobility: url.searchParams.get("mobility") ?? "none",
    language: url.searchParams.get("language") ?? "en",
  });

  if (!parsed.success) {
    return Response.json({ error: "Invalid query parameters." }, { status: 400 });
  }

  const context = toUserContext(
    UserContextSchema.parse({
      persona: "fan",
      language: parsed.data.language,
      accessibility: {
        mobility: parsed.data.mobility,
        lowVision: false,
        sensorySensitive: false,
      },
    }),
  );

  const snapshot = await buildMapCrowdSnapshot(context);
  return Response.json(snapshot, { headers: { "Cache-Control": "no-store" } });
}
