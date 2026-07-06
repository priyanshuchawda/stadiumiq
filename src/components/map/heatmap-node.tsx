import { getDensityVisual, formatCrowdAria } from "@/lib/map/density-visuals";
import type { MapNodeLayout } from "@/lib/map/layout";
import type { CrowdAreaView } from "@/types/map";

type HeatmapNodeProps = {
  node: MapNodeLayout;
  crowd: CrowdAreaView | undefined;
  selected: boolean;
  onSelect?: ((nodeId: string) => void) | undefined;
};

export function HeatmapNode({
  node,
  crowd,
  selected,
  onSelect,
}: HeatmapNodeProps): React.JSX.Element {
  const density = crowd?.density ?? "low";
  const visual = getDensityVisual(density);
  const wait = crowd?.waitMinutes ?? 0;

  return (
    <g>
      <circle
        cx={node.x}
        cy={node.y}
        r={node.radius + 8}
        fill={`url(#${visual.patternId})`}
        className="stroke-zinc-400 dark:stroke-zinc-600"
        strokeWidth={selected ? 3 : 1}
        role="button"
        tabIndex={0}
        aria-label={formatCrowdAria(node.label, density, wait)}
        aria-pressed={selected}
        onClick={() => onSelect?.(node.id)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect?.(node.id);
          }
        }}
      />
      <text
        x={node.x}
        y={node.y + node.radius + 22}
        textAnchor="middle"
        className="fill-zinc-700 text-[11px] font-medium dark:fill-zinc-200"
      >
        {visual.shortLabel} · {wait}m
      </text>
    </g>
  );
}
