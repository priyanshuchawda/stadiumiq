"use client";

import { useState } from "react";
import { useMapCrowd } from "@/components/map/use-map-crowd";
import { useMapRoute } from "@/components/map/use-map-route";
import type { MapCrowdSnapshot } from "@/types/map";
import type { MobilityLevel } from "@/types/domain";

export function useMapState(initialCrowd: MapCrowdSnapshot) {
  const [mobility, setMobilityState] = useState<MobilityLevel>("none");
  const [from, setFrom] = useState("gate-c");
  const [to, setTo] = useState("section-112");
  const [stepFree, setStepFree] = useState(false);

  const crowdState = useMapCrowd(initialCrowd, mobility);
  const routeState = useMapRoute(from, to, stepFree, mobility);

  const setMobility = (value: MobilityLevel): void => {
    setMobilityState(value);
    if (value === "wheelchair") {
      setStepFree(true);
    }
    crowdState.refreshCrowd(value);
  };

  return {
    crowd: crowdState.crowd,
    route: routeState.route,
    loadingCrowd: crowdState.loadingCrowd,
    loadingRoute: routeState.loadingRoute,
    error: crowdState.crowdError ?? routeState.routeError,
    mobility,
    from,
    to,
    stepFree,
    setMobility,
    setFrom,
    setTo,
    setStepFree,
    planRoute: routeState.planRoute,
  };
}
