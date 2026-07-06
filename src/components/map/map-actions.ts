import { fetchCrowdSnapshot, fetchRouteOverlay } from "@/components/map/map-api";
import type { MapCrowdSnapshot, RouteOverlayData } from "@/types/map";
import type { MobilityLevel } from "@/types/domain";

type CrowdCallbacks = {
  onStart: () => void;
  onSuccess: (crowd: MapCrowdSnapshot) => void;
  onError: () => void;
};

export async function loadCrowdData(
  mobility: MobilityLevel,
  callbacks: CrowdCallbacks,
): Promise<void> {
  callbacks.onStart();
  try {
    const crowd = await fetchCrowdSnapshot(mobility, "en");
    callbacks.onSuccess(crowd);
  } catch {
    callbacks.onError();
  }
}

type RouteInput = {
  from: string;
  to: string;
  stepFree: boolean;
  mobility: MobilityLevel;
};

type RouteCallbacks = {
  onStart: () => void;
  onSuccess: (route: RouteOverlayData) => void;
  onError: () => void;
};

export async function planRouteOnMap(
  input: RouteInput,
  callbacks: RouteCallbacks,
): Promise<void> {
  callbacks.onStart();
  try {
    const route = await fetchRouteOverlay({
      from: input.from,
      to: input.to,
      stepFree: input.stepFree || input.mobility === "wheelchair",
    });
    callbacks.onSuccess(route);
  } catch {
    callbacks.onError();
  }
}
