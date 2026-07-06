export function DensityPatterns(): React.JSX.Element {
  return (
    <defs>
      <pattern id="density-low" width="10" height="10" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1.5" className="fill-emerald-600/40" />
      </pattern>
      <pattern id="density-moderate" width="8" height="8" patternUnits="userSpaceOnUse">
        <path d="M0 8 L8 0" className="stroke-amber-600/50" strokeWidth="1.5" />
      </pattern>
      <pattern id="density-high" width="8" height="8" patternUnits="userSpaceOnUse">
        <path
          d="M0 8 L8 0 M0 0 L8 8"
          className="stroke-orange-600/60"
          strokeWidth="1.5"
        />
      </pattern>
      <pattern id="density-critical" width="6" height="6" patternUnits="userSpaceOnUse">
        <path
          d="M0 6 L6 0 M0 0 L6 6 M3 0 L3 6 M0 3 L6 3"
          className="stroke-red-700/70"
          strokeWidth="1"
        />
      </pattern>
    </defs>
  );
}
