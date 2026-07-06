import { buildDashboardAiInsights } from "@/lib/ai/dashboard-summaries";
import {
  getIncidentFeed,
  getOperationalKpis,
  suggestStaffing,
} from "@/server/services/ops-service";
import type { DashboardSnapshot } from "@/types/dashboard";

export async function buildDashboardSnapshot(
  now = Date.now(),
): Promise<DashboardSnapshot> {
  const incidents = getIncidentFeed(now);
  const staffing = suggestStaffing(now);
  const ai = await buildDashboardAiInsights({ incidents, staffing });

  return {
    kpis: getOperationalKpis(now),
    incidents,
    staffing,
    ai,
    updatedAt: new Date(now).toISOString(),
  };
}
