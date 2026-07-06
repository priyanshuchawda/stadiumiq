import { MAP_EDGE_PATHS, MAP_NODE_LAYOUTS } from "@/lib/map/layout";

type RouteOverlayProps = {
  nodeIds: string[];
};

function buildPolylinePoints(nodeIds: string[]): string {
  return nodeIds
    .map((id) => MAP_NODE_LAYOUTS.find((node) => node.id === id))
    .filter((node): node is (typeof MAP_NODE_LAYOUTS)[number] => Boolean(node))
    .map((node) => `${node.x},${node.y}`)
    .join(" ");
}

export function RouteOverlay({ nodeIds }: RouteOverlayProps): React.JSX.Element | null {
  if (nodeIds.length < 2) {
    return null;
  }

  const points = buildPolylinePoints(nodeIds);

  return (
    <g aria-label="Planned route overlay">
      {MAP_EDGE_PATHS.map((edge) => {
        const from = MAP_NODE_LAYOUTS.find((node) => node.id === edge.from);
        const to = MAP_NODE_LAYOUTS.find((node) => node.id === edge.to);
        if (!from || !to) {
          return null;
        }
        return (
          <line
            key={`${edge.from}-${edge.to}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            className="stroke-zinc-300 dark:stroke-zinc-700"
            strokeWidth={2}
          />
        );
      })}
      <polyline
        points={points}
        fill="none"
        className="stroke-emerald-600 dark:stroke-emerald-400"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="10 6"
      />
    </g>
  );
}
