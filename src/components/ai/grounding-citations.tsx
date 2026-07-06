import type { GroundingSource } from "@/types/grounding";

type GroundingCitationsProps = {
  sources: GroundingSource[];
  webSearchQueries?: string[] | undefined;
};

export function GroundingCitations({
  sources,
  webSearchQueries = [],
}: GroundingCitationsProps): React.JSX.Element | null {
  if (sources.length === 0 && webSearchQueries.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Grounding sources"
      className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-700 dark:bg-zinc-900"
    >
      {webSearchQueries.length > 0 ? (
        <p className="mb-2 text-zinc-600 dark:text-zinc-400">
          Searched: {webSearchQueries.join(", ")}
        </p>
      ) : null}
      {sources.length > 0 ? (
        <ul className="grid gap-1">
          {sources.map((source) => (
            <li key={source.uri}>
              <a
                href={source.uri}
                rel="noopener noreferrer"
                target="_blank"
                className="min-h-11 inline-flex items-center text-emerald-700 underline dark:text-emerald-400"
              >
                {source.title}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
