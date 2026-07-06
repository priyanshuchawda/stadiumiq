import type { MapCrowdSnapshot } from "@/types/map";

type GateRecommendationPanelProps = {
  crowd: MapCrowdSnapshot;
  loading: boolean;
};

export function GateRecommendationPanel({
  crowd,
  loading,
}: GateRecommendationPanelProps): React.JSX.Element {
  return (
    <section
      aria-label="Which gate now"
      className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <h2 className="text-lg font-semibold">Which gate now?</h2>
      <div aria-live="polite" aria-atomic="true" className="mt-3 grid gap-2">
        {loading ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Refreshing crowd data…
          </p>
        ) : null}
        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
          {crowd.gate.recommendedGate}
        </p>
        <p className="text-sm">{crowd.explanation}</p>
        {crowd.gate.alternatives.length > 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Alternatives: {crowd.gate.alternatives.join(", ")}
          </p>
        ) : null}
        <p className="text-xs text-zinc-500">
          Updated {new Date(crowd.updatedAt).toLocaleTimeString()}
        </p>
      </div>
    </section>
  );
}
