import { MAP_NODE_LAYOUTS } from "@/lib/map/layout";
import { HeatmapNode } from "@/components/map/heatmap-node";
import type { CrowdAreaView } from "@/types/map";

type CrowdHeatmapProps = {
  areas: CrowdAreaView[];
  selectedNodeId?: string | undefined;
};

function findCrowdForNode(
  nodeId: string,
  areas: CrowdAreaView[],
): CrowdAreaView | undefined {
  return areas.find((area) => area.areaId === nodeId);
}

export function CrowdHeatmap({
  areas,
  selectedNodeId,
}: CrowdHeatmapProps): React.JSX.Element {
  const heatmapNodes = MAP_NODE_LAYOUTS.filter((node) =>
    ["gate", "concourse"].includes(node.kind),
  );

  return (
    <g aria-label="Crowd density heatmap" aria-hidden="true">
      {heatmapNodes.map((node) => (
        <HeatmapNode
          key={node.id}
          node={node}
          crowd={findCrowdForNode(node.id, areas)}
          selected={selectedNodeId === node.id}
        />
      ))}
    </g>
  );
}
