import type { OpsKpi } from "@/server/services/ops-service";

type KpiCardProps = {
  kpi: OpsKpi;
};

const TREND_LABELS: Record<OpsKpi["trend"], string> = {
  up: "Trending up",
  down: "Trending down",
  stable: "Stable",
};

export function KpiCard({ kpi }: KpiCardProps): React.JSX.Element {
  return (
    <article className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{kpi.label}</p>
      <p className="mt-1 text-3xl font-bold">{kpi.value}</p>
      <p className="mt-2 text-xs text-zinc-500">{TREND_LABELS[kpi.trend]}</p>
    </article>
  );
}

type KpiGridProps = {
  kpis: OpsKpi[];
};

export function KpiGrid({ kpis }: KpiGridProps): React.JSX.Element {
  return (
    <section
      aria-label="Key performance indicators"
      className="grid gap-4 sm:grid-cols-3"
    >
      {kpis.map((kpi) => (
        <KpiCard key={kpi.label} kpi={kpi} />
      ))}
    </section>
  );
}
