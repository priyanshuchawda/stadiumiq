import { mapErrorToResponse } from "@/server/http/error-response";
import { buildDashboardSnapshot } from "@/server/services/dashboard-service";

export async function GET(): Promise<Response> {
  try {
    const snapshot = await buildDashboardSnapshot();
    return Response.json(snapshot);
  } catch (error) {
    return mapErrorToResponse(error, { route: "GET /api/dashboard" });
  }
}
