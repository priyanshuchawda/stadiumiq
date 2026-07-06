import { CrowdHeatmap } from "@/components/map/crowd-heatmap";
import { DensityPatterns } from "@/components/map/density-patterns";
import { RouteOverlay } from "@/components/map/route-overlay";
import { MAP_NODE_LAYOUTS, MAP_VIEWBOX } from "@/lib/map/layout";
import type { CrowdAreaView } from "@/types/map";

type StadiumMapProps = {
  areas: CrowdAreaView[];
  routeNodeIds?: string[] | undefined;
  selectedNodeId?: string | undefined;
  onSelectNode?: ((nodeId: string) => void) | undefined;
};

export function StadiumMap({
  areas,
  routeNodeIds = [],
  selectedNodeId,
  onSelectNode,
}: StadiumMapProps): React.JSX.Element {
  return (
    <svg
      viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
      role="img"
      aria-labelledby="stadium-map-title stadium-map-desc"
      className="h-auto w-full max-w-3xl rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <title id="stadium-map-title">Liberty Stadium map</title>
      <desc id="stadium-map-desc">
        Schematic map with gates, concourses, sections, crowd density patterns, and
        route overlay.
      </desc>
      <DensityPatterns />
      <RouteOverlay nodeIds={routeNodeIds} />
      <CrowdHeatmap
        areas={areas}
        selectedNodeId={selectedNodeId}
        onSelectNode={onSelectNode}
      />
      <MapNodes selectedNodeId={selectedNodeId} onSelectNode={onSelectNode} />
    </svg>
  );
}

type MapNodesProps = {
  selectedNodeId?: string | undefined;
  onSelectNode?: ((nodeId: string) => void) | undefined;
};

function MapNodes({ selectedNodeId, onSelectNode }: MapNodesProps): React.JSX.Element {
  return (
    <g aria-label="Stadium locations">
      {MAP_NODE_LAYOUTS.map((node) => {
        const selected = selectedNodeId === node.id;
        return (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={node.radius}
              className={
                node.kind === "gate"
                  ? "fill-white stroke-zinc-800 dark:fill-zinc-900 dark:stroke-zinc-100"
                  : "fill-zinc-100 stroke-zinc-600 dark:fill-zinc-800 dark:stroke-zinc-300"
              }
              strokeWidth={selected ? 3 : 1.5}
              role="button"
              tabIndex={0}
              aria-label={node.label}
              aria-pressed={selected}
              onClick={() => onSelectNode?.(node.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectNode?.(node.id);
                }
              }}
            />
            <text
              x={node.x}
              y={node.y + 4}
              textAnchor="middle"
              className="fill-zinc-900 text-[10px] font-semibold dark:fill-zinc-50"
            >
              {node.label.replace("Section ", "Sec ")}
            </text>
          </g>
        );
      })}
    </g>
  );
}
