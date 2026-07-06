import { explainGateRecommendation } from "@/lib/ai/gate-explanation";
import { MAP_NODE_LAYOUTS } from "@/lib/map/layout";
import { listCrowdAreas } from "@/server/data/repositories/stadium-repository";
import { getCrowdStatus, recommendGate } from "@/server/services/crowd-service";
import { getRoute } from "@/server/services/route-service";
import type { MapNodeLayout } from "@/lib/map/layout";
import type { CrowdAreaView, MapCrowdSnapshot, RouteOverlayData } from "@/types/map";
import type { RouteResult, UserContext } from "@/types/stadium";

export function listMapNodes(): MapNodeLayout[] {
  return MAP_NODE_LAYOUTS;
}

export function buildCrowdAreas(now = Date.now()): CrowdAreaView[] {
  return listCrowdAreas().map((seed) => {
    const status = getCrowdStatus(seed.areaId, now);
    return {
      areaId: seed.areaId,
      area: status?.area ?? seed.label,
      density: status?.density ?? seed.baseDensity,
      waitMinutes: status?.waitMinutes ?? seed.baseWaitMinutes,
      recommendation: status?.recommendation ?? "Flow is manageable.",
    };
  });
}

export async function buildMapCrowdSnapshot(
  context: UserContext,
  now = Date.now(),
): Promise<MapCrowdSnapshot> {
  const areas = buildCrowdAreas(now);
  const gate = recommendGate(context, now);
  const explanation = await explainGateRecommendation({
    context,
    recommendation: gate,
    crowdStatuses: areas,
  });

  return {
    areas,
    gate,
    explanation,
    updatedAt: new Date(now).toISOString(),
  };
}

export function buildRouteOverlay(
  from: string,
  to: string,
  stepFree: boolean,
): RouteOverlayData | null {
  const route = getRoute({ from, to, stepFree, avoidStairs: stepFree });
  if (!route) {
    return null;
  }

  const nodeIds = collectRouteNodeIds(route);
  return { route, nodeIds };
}

function collectRouteNodeIds(route: RouteResult): string[] {
  const ids: string[] = [];
  for (const step of route.steps) {
    if (!ids.includes(step.from)) {
      ids.push(step.from);
    }
    if (!ids.includes(step.to)) {
      ids.push(step.to);
    }
  }
  return ids;
}

export function buildDefaultMapContext(): UserContext {
  return {
    persona: "fan",
    language: "en",
    accessibility: { mobility: "none", lowVision: false, sensorySensitive: false },
    location: { gate: "C", section: "112" },
  };
}
