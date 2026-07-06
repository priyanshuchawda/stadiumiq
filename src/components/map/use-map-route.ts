"use client";

import { useCallback, useState } from "react";
import { planRouteOnMap } from "@/components/map/map-actions";
import type { RouteOverlayData } from "@/types/map";
import type { MobilityLevel } from "@/types/domain";

export function useMapRoute(
  from: string,
  to: string,
  stepFree: boolean,
  mobility: MobilityLevel,
): {
  route: RouteOverlayData | null;
  loadingRoute: boolean;
  routeError: string | null;
  planRoute: () => Promise<void>;
} {
  const [route, setRoute] = useState<RouteOverlayData | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const planRoute = useCallback(async () => {
    await planRouteOnMap(
      { from, to, stepFree, mobility },
      {
        onStart: () => {
          setLoadingRoute(true);
          setRouteError(null);
        },
        onSuccess: (overlay) => {
          setRoute(overlay);
          setLoadingRoute(false);
        },
        onError: () => {
          setRoute(null);
          setLoadingRoute(false);
          setRouteError(
            "No step-free route found. Try another gate or disable step-free.",
          );
        },
      },
    );
  }, [from, to, stepFree, mobility]);

  return { route, loadingRoute, routeError, planRoute };
}
