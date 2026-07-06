import { buildDashboardSnapshot } from "@/server/services/dashboard-service";

export async function GET(): Promise<Response> {
  const snapshot = await buildDashboardSnapshot();
  return Response.json(snapshot);
}
