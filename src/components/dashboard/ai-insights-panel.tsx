import type { DashboardAiInsights } from "@/types/dashboard";

type AiInsightsPanelProps = {
  ai: DashboardAiInsights;
};

export function AiInsightsPanel({ ai }: AiInsightsPanelProps): React.JSX.Element {
  return (
    <section
      aria-label="AI operational insights"
      className="grid gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <h2 className="text-lg font-semibold">AI incident summary</h2>
      <p className="text-sm">{ai.incidentSummary}</p>
      <h3 className="text-sm font-semibold">Priority actions</h3>
      <ul className="list-disc space-y-1 pl-5 text-sm">
        {ai.priorityActions.map((action) => (
          <li key={action}>{action}</li>
        ))}
      </ul>
      {ai.fallback ? (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Offline AI summary — connect Gemini for live structured insights.
        </p>
      ) : null}
    </section>
  );
}
