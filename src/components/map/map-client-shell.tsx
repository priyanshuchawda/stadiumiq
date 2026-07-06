"use client";

import { MapExperience } from "@/components/map/map-experience";
import type { MapCrowdSnapshot } from "@/types/map";

type MapClientShellProps = {
  initialCrowd: MapCrowdSnapshot;
};

export function MapClientShell({
  initialCrowd,
}: MapClientShellProps): React.JSX.Element {
  return <MapExperience initialCrowd={initialCrowd} />;
}
