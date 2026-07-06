import type { UserContext } from "@/types/stadium";

type AccessibilityFieldsProps = {
  context: UserContext;
  onChange: (context: UserContext) => void;
};

export function AccessibilityFields({
  context,
  onChange,
}: AccessibilityFieldsProps): React.JSX.Element {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium">Accessibility</legend>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={context.accessibility.mobility === "wheelchair"}
          onChange={(event) =>
            onChange({
              ...context,
              accessibility: {
                ...context.accessibility,
                mobility: event.target.checked ? "wheelchair" : "none",
              },
            })
          }
        />
        Wheelchair / step-free routing
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={context.accessibility.sensorySensitive}
          onChange={(event) =>
            onChange({
              ...context,
              accessibility: {
                ...context.accessibility,
                sensorySensitive: event.target.checked,
              },
            })
          }
        />
        Sensory-sensitive
      </label>
    </fieldset>
  );
}

function buildLocation(gate: string, section: string): UserContext["location"] {
  if (!gate && !section) {
    return undefined;
  }
  return {
    ...(gate ? { gate } : {}),
    ...(section ? { section } : {}),
  };
}

type LocationFieldsProps = {
  context: UserContext;
  onChange: (context: UserContext) => void;
};

export function LocationFields({
  context,
  onChange,
}: LocationFieldsProps): React.JSX.Element {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="grid gap-1 text-sm">
        Gate
        <input
          className="min-h-11 rounded-md border border-zinc-300 px-3 dark:border-zinc-700 dark:bg-zinc-950"
          value={context.location?.gate ?? ""}
          onChange={(event) => {
            const gate = event.target.value.trim();
            const section = context.location?.section ?? "";
            onChange({ ...context, location: buildLocation(gate, section) });
          }}
          placeholder="C"
        />
      </label>
      <label className="grid gap-1 text-sm">
        Section
        <input
          className="min-h-11 rounded-md border border-zinc-300 px-3 dark:border-zinc-700 dark:bg-zinc-950"
          value={context.location?.section ?? ""}
          onChange={(event) => {
            const section = event.target.value.trim();
            const gate = context.location?.gate ?? "";
            onChange({ ...context, location: buildLocation(gate, section) });
          }}
          placeholder="112"
        />
      </label>
    </div>
  );
}
