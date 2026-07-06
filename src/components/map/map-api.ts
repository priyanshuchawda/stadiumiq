import type { MapCrowdSnapshot, RouteOverlayData } from "@/types/map";
import type { MobilityLevel } from "@/types/domain";

export async function fetchCrowdSnapshot(
  mobility: MobilityLevel,
  language: string,
): Promise<MapCrowdSnapshot> {
  const params = new URLSearchParams({ mobility, language });
  const response = await fetch(`/api/map/crowd?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Unable to load crowd data.");
  }
  return (await response.json()) as MapCrowdSnapshot;
}

export async function fetchRouteOverlay(input: {
  from: string;
  to: string;
  stepFree: boolean;
}): Promise<RouteOverlayData> {
  const response = await fetch("/api/map/route", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error("No route found for the selected locations.");
  }
  return (await response.json()) as RouteOverlayData;
}
