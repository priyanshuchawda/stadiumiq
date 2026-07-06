import { buildMapCrowdSnapshot } from "@/server/services/map-service";
import { MapCrowdQuerySchema } from "@/lib/validation/schemas/map";
import { UserContextSchema } from "@/lib/validation/schemas/stadium";
import { toUserContext } from "@/lib/validation/to-user-context";

export async function GET(request: Request): Promise<Response> {
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
  return Response.json(snapshot);
}
