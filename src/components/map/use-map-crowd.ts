"use client";

import { useCallback, useEffect, useState } from "react";
import { loadCrowdData } from "@/components/map/map-actions";
import type { MapCrowdSnapshot } from "@/types/map";
import type { MobilityLevel } from "@/types/domain";

const REFRESH_MS = 60_000;

export function useMapCrowd(
  initialCrowd: MapCrowdSnapshot,
  mobility: MobilityLevel,
): {
  crowd: MapCrowdSnapshot;
  loadingCrowd: boolean;
  crowdError: string | null;
  refreshCrowd: (nextMobility: MobilityLevel) => void;
} {
  const [crowd, setCrowd] = useState(initialCrowd);
  const [loadingCrowd, setLoadingCrowd] = useState(false);
  const [crowdError, setCrowdError] = useState<string | null>(null);

  const refreshCrowd = useCallback((nextMobility: MobilityLevel) => {
    void loadCrowdData(nextMobility, {
      onStart: () => {
        setLoadingCrowd(true);
        setCrowdError(null);
      },
      onSuccess: (snapshot) => {
        setCrowd(snapshot);
        setLoadingCrowd(false);
      },
      onError: () => {
        setLoadingCrowd(false);
        setCrowdError("Crowd data is temporarily unavailable.");
      },
    });
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      refreshCrowd(mobility);
    }, REFRESH_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, [mobility, refreshCrowd]);

  return { crowd, loadingCrowd, crowdError, refreshCrowd };
}
