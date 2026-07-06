"use client";

import { forwardRef, useEffect, useRef } from "react";
import { GateRecommendationPanel } from "@/components/map/gate-recommendation-panel";
import { MapControls } from "@/components/map/map-controls";
import { StadiumMap } from "@/components/map/stadium-map";
import { useMapState } from "@/components/map/use-map-state";
import type { MapCrowdSnapshot } from "@/types/map";
import type { RouteResult } from "@/types/stadium";

type MapExperienceProps = {
  initialCrowd: MapCrowdSnapshot;
};

export function MapExperience({ initialCrowd }: MapExperienceProps): React.JSX.Element {
  const map = useMapState(initialCrowd);
  const routeRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (map.route) {
      routeRef.current?.focus();
    }
  }, [map.route]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="grid gap-4">
        <StadiumMap
          areas={map.crowd.areas}
          routeNodeIds={map.route?.nodeIds}
          selectedNodeId={map.from}
          onSelectNode={map.setFrom}
        />
        {map.route ? <RouteSteps ref={routeRef} route={map.route.route} /> : null}
        {map.error ? (
          <p
            role="alert"
            className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200"
          >
            {map.error}
          </p>
        ) : null}
      </div>
      <div className="grid content-start gap-4">
        <GateRecommendationPanel crowd={map.crowd} loading={map.loadingCrowd} />
        <MapControls
          from={map.from}
          to={map.to}
          stepFree={map.stepFree}
          mobility={map.mobility}
          loadingRoute={map.loadingRoute}
          onFromChange={map.setFrom}
          onToChange={map.setTo}
          onStepFreeChange={map.setStepFree}
          onMobilityChange={map.setMobility}
          onPlanRoute={() => {
            void map.planRoute();
          }}
        />
      </div>
    </div>
  );
}

const RouteSteps = forwardRef<HTMLElement, { route: RouteResult }>(function RouteSteps(
  { route },
  ref,
): React.JSX.Element {
  return (
    <section
      ref={ref}
      tabIndex={-1}
      aria-live="polite"
      aria-label="Route steps"
      className="rounded-xl border border-zinc-200 p-4 outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-zinc-800"
    >
      <h2 className="text-lg font-semibold">
        {route.from} → {route.to} ({route.totalMinutes} min)
      </h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
        {route.steps.map((step) => (
          <li key={`${step.from}-${step.to}`}>
            {step.instruction}
            {step.stepFree ? " (step-free)" : ""} — ~{step.estimatedMinutes} min
          </li>
        ))}
      </ol>
    </section>
  );
});
