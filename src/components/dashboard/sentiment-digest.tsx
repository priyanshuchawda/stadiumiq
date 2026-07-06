import type { SentimentEntry } from "@/types/dashboard";

type SentimentDigestProps = {
  entries: SentimentEntry[];
};

const TONE_LABELS: Record<SentimentEntry["tone"], string> = {
  positive: "Positive",
  mixed: "Mixed",
  concerned: "Concerned",
};

export function SentimentDigest({ entries }: SentimentDigestProps): React.JSX.Element {
  return (
    <section
      aria-label="Multilingual sentiment digest"
      className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <h2 className="text-lg font-semibold">Sentiment digest</h2>
      <ul className="mt-3 grid gap-3">
        {entries.map((entry) => (
          <li
            key={entry.language}
            className="rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium uppercase">{entry.language}</span>
              <span className="rounded bg-zinc-200 px-2 py-0.5 text-xs dark:bg-zinc-800">
                {TONE_LABELS[entry.tone]}
              </span>
            </div>
            <p className="mt-2">{entry.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
