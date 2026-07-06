import type { IncidentSummary } from "@/server/services/ops-service";

type IncidentFeedProps = {
  incidents: IncidentSummary[];
};

export function IncidentFeed({ incidents }: IncidentFeedProps): React.JSX.Element {
  return (
    <section
      aria-label="Incident feed"
      className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <h2 className="text-lg font-semibold">Live incidents</h2>
      {incidents.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          No high-density incidents right now.
        </p>
      ) : (
        <ul className="mt-3 grid gap-2">
          {incidents.map((incident) => (
            <li
              key={incident.id}
              className="rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-900"
            >
              <span className="font-medium">{incident.area}</span>
              <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs dark:bg-amber-950">
                {incident.severity}
              </span>
              <p className="mt-1">{incident.message}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
