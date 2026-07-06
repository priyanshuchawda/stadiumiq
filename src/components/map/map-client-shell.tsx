"use client";

import dynamic from "next/dynamic";
import type { MapCrowdSnapshot } from "@/types/map";

const MapExperience = dynamic(
  () => import("@/components/map/map-experience").then((mod) => mod.MapExperience),
  {
    loading: () => (
      <p className="text-zinc-600 dark:text-zinc-400" role="status">
        Loading stadium map…
      </p>
    ),
    ssr: false,
  },
);

type MapClientShellProps = {
  initialCrowd: MapCrowdSnapshot;
};

export function MapClientShell({
  initialCrowd,
}: MapClientShellProps): React.JSX.Element {
  return <MapExperience initialCrowd={initialCrowd} />;
}
