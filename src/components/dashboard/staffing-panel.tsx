type StaffingPanelProps = {
  suggestions: string[];
};

export function StaffingPanel({ suggestions }: StaffingPanelProps): React.JSX.Element {
  return (
    <section
      aria-label="Staffing suggestions"
      className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <h2 className="text-lg font-semibold">Staffing suggestions</h2>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
        {suggestions.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
