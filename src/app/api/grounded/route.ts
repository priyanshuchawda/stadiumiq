import { handleGroundedRequest } from "@/server/services/grounded-service";

export async function POST(request: Request): Promise<Response> {
  const clientKey = request.headers.get("x-forwarded-for") ?? "local";
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
    return Response.json({ error: result.message }, { status: result.status, headers });
  }

  return Response.json(result.payload);
}
