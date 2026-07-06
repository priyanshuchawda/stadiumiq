import { MAP_NODE_LAYOUTS } from "@/lib/map/layout";
import type { MobilityLevel } from "@/types/domain";

const NODE_OPTIONS = MAP_NODE_LAYOUTS.map((node) => ({
  id: node.id,
  label: node.label,
}));

type RouteSelectorsProps = {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
};

export function RouteSelectors({
  from,
  to,
  onFromChange,
  onToChange,
}: RouteSelectorsProps): React.JSX.Element {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1 text-sm">
        From
        <select
          className="min-h-11 rounded-md border border-zinc-300 px-3 dark:border-zinc-700 dark:bg-zinc-950"
          value={from}
          onChange={(event) => {
            onFromChange(event.target.value);
          }}
        >
          {NODE_OPTIONS.map((node) => (
            <option key={node.id} value={node.id}>
              {node.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        To
        <select
          className="min-h-11 rounded-md border border-zinc-300 px-3 dark:border-zinc-700 dark:bg-zinc-950"
          value={to}
          onChange={(event) => {
            onToChange(event.target.value);
          }}
        >
          {NODE_OPTIONS.map((node) => (
            <option key={node.id} value={node.id}>
              {node.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

type AccessFieldsProps = {
  stepFree: boolean;
  mobility: MobilityLevel;
  onStepFreeChange: (value: boolean) => void;
  onMobilityChange: (value: MobilityLevel) => void;
};

export function AccessFields({
  stepFree,
  mobility,
  onStepFreeChange,
  onMobilityChange,
}: AccessFieldsProps): React.JSX.Element {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium">Access needs</legend>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={mobility === "wheelchair"}
          onChange={(event) => {
            onMobilityChange(event.target.checked ? "wheelchair" : "none");
          }}
        />
        Wheelchair / step-free priority
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={stepFree || mobility === "wheelchair"}
          disabled={mobility === "wheelchair"}
          onChange={(event) => {
            onStepFreeChange(event.target.checked);
          }}
        />
        Step-free route only
      </label>
    </fieldset>
  );
}
