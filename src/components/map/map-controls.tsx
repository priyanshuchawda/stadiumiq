import { AccessFields, RouteSelectors } from "@/components/map/map-control-fields";
import type { MobilityLevel } from "@/types/domain";

type MapControlsProps = {
  from: string;
  to: string;
  stepFree: boolean;
  mobility: MobilityLevel;
  loadingRoute: boolean;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onStepFreeChange: (value: boolean) => void;
  onMobilityChange: (value: MobilityLevel) => void;
  onPlanRoute: () => void;
};

export function MapControls(props: MapControlsProps): React.JSX.Element {
  return (
    <section
      aria-label="Route planning controls"
      className="grid gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <h2 className="text-lg font-semibold">Plan your route</h2>
      <RouteSelectors
        from={props.from}
        to={props.to}
        onFromChange={props.onFromChange}
        onToChange={props.onToChange}
      />
      <AccessFields
        stepFree={props.stepFree}
        mobility={props.mobility}
        onStepFreeChange={props.onStepFreeChange}
        onMobilityChange={props.onMobilityChange}
      />
      <button
        type="button"
        className="min-h-11 rounded-md bg-emerald-700 px-4 font-medium text-white hover:bg-emerald-800"
        disabled={props.loadingRoute}
        onClick={props.onPlanRoute}
      >
        {props.loadingRoute ? "Calculating route…" : "Show route on map"}
      </button>
    </section>
  );
}
