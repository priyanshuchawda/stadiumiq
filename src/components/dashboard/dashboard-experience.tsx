"use client";

import { AiInsightsPanel } from "@/components/dashboard/ai-insights-panel";
import { IncidentFeed } from "@/components/dashboard/incident-feed";
import { KpiGrid } from "@/components/dashboard/kpi-card";
import { SentimentDigest } from "@/components/dashboard/sentiment-digest";
import { StaffingPanel } from "@/components/dashboard/staffing-panel";
import { useDashboardState } from "@/components/dashboard/use-dashboard-state";
import type { DashboardSnapshot } from "@/types/dashboard";

type DashboardExperienceProps = {
  initialSnapshot: DashboardSnapshot;
};

export function DashboardExperience({
  initialSnapshot,
}: DashboardExperienceProps): React.JSX.Element {
  const { snapshot, loading, error } = useDashboardState(initialSnapshot);

  return (
    <div className="grid gap-6" aria-busy={loading}>
      <p className="text-xs text-zinc-500">
        Updated {new Date(snapshot.updatedAt).toLocaleTimeString()}
      </p>
      <KpiGrid kpis={snapshot.kpis} />
      <div className="grid gap-6 lg:grid-cols-2">
        <IncidentFeed incidents={snapshot.incidents} />
        <StaffingPanel suggestions={snapshot.staffing} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <AiInsightsPanel ai={snapshot.ai} />
        <SentimentDigest entries={snapshot.ai.sentimentDigest} />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-amber-700 dark:text-amber-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
