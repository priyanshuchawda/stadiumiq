import type { GraphEdge, GraphNode } from "@/server/data/seeds/stadium-graph";
import { STADIUM_EDGES, STADIUM_NODES } from "@/server/data/seeds/stadium-graph";
import { normalizeLocationId } from "@/server/data/normalize-location";
import type { RouteResult, RouteStep } from "@/types/stadium";

export function buildAdjacency(
  edges: GraphEdge[],
  stepFreeOnly: boolean,
): Map<string, GraphEdge[]> {
  const adj = new Map<string, GraphEdge[]>();
  for (const edge of edges) {
    if (stepFreeOnly && !edge.stepFree) {
      continue;
    }
    for (const direction of [
      { from: edge.from, to: edge.to },
      { from: edge.to, to: edge.from },
    ]) {
      const list = adj.get(direction.from) ?? [];
      list.push({ ...edge, from: direction.from, to: direction.to });
      adj.set(direction.from, list);
    }
  }
  return adj;
}

export function findNodeLabel(nodeId: string, nodes: GraphNode[]): string {
  return nodes.find((node) => node.id === nodeId)?.label ?? nodeId;
}

type ReconstructInput = {
  previous: Map<string, string | null>;
  end: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export function reconstructPath(input: ReconstructInput): RouteStep[] {
  const path: string[] = [];
  let current: string | null = input.end;
  while (current) {
    path.unshift(current);
    current = input.previous.get(current) ?? null;
  }

  const steps: RouteStep[] = [];
  for (let index = 0; index < path.length - 1; index += 1) {
    const from = path[index];
    const to = path[index + 1];
    if (!from || !to) {
      continue;
    }
    const edge = input.edges.find(
      (item) =>
        (item.from === from && item.to === to) ||
        (item.from === to && item.to === from),
    );
    steps.push({
      instruction: `Proceed from ${findNodeLabel(from, input.nodes)} to ${findNodeLabel(to, input.nodes)}`,
      from,
      to,
      stepFree: edge?.stepFree ?? false,
      estimatedMinutes: edge?.minutes ?? 1,
    });
  }
  return steps;
}

export function runDijkstra(
  from: string,
  to: string,
  adj: Map<string, GraphEdge[]>,
  nodeIds: string[],
): { distance: number; previous: Map<string, string | null> } {
  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const unvisited = new Set<string>(nodeIds);

  for (const id of nodeIds) {
    distances.set(id, id === from ? 0 : Number.POSITIVE_INFINITY);
    previous.set(id, null);
  }

  while (unvisited.size > 0) {
    const current = pickLowestCostNode(unvisited, distances);
    if (!current) {
      break;
    }
    unvisited.delete(current);
    if (current === to) {
      break;
    }
    relaxNeighbors(current, adj, distances, previous);
  }

  return { distance: distances.get(to) ?? Number.POSITIVE_INFINITY, previous };
}

function pickLowestCostNode(
  unvisited: Set<string>,
  distances: Map<string, number>,
): string | null {
  let current: string | null = null;
  let lowest = Number.POSITIVE_INFINITY;
  for (const id of unvisited) {
    const cost = distances.get(id) ?? Number.POSITIVE_INFINITY;
    if (cost < lowest) {
      lowest = cost;
      current = id;
    }
  }
  return current;
}

function relaxNeighbors(
  current: string,
  adj: Map<string, GraphEdge[]>,
  distances: Map<string, number>,
  previous: Map<string, string | null>,
): void {
  const neighbors = adj.get(current) ?? [];
  for (const edge of neighbors) {
    const alt = (distances.get(current) ?? 0) + edge.minutes;
    if (alt < (distances.get(edge.to) ?? Number.POSITIVE_INFINITY)) {
      distances.set(edge.to, alt);
      previous.set(edge.to, current);
    }
  }
}

export function findRoute(
  fromInput: string,
  toInput: string,
  options: { stepFree: boolean },
): RouteResult | null {
  const from = normalizeLocationId(fromInput);
  const to = normalizeLocationId(toInput);
  const nodeIds = STADIUM_NODES.map((node) => node.id);
  const adj = buildAdjacency(STADIUM_EDGES, options.stepFree);
  const { distance, previous } = runDijkstra(from, to, adj, nodeIds);

  if (distance === Number.POSITIVE_INFINITY) {
    return null;
  }

  const steps = reconstructPath({
    previous,
    end: to,
    nodes: STADIUM_NODES,
    edges: STADIUM_EDGES,
  });
  const totalMinutes = steps.reduce((sum, step) => sum + step.estimatedMinutes, 0);

  return {
    from: findNodeLabel(from, STADIUM_NODES),
    to: findNodeLabel(to, STADIUM_NODES),
    stepFree: steps.every((step) => step.stepFree),
    totalMinutes,
    steps,
  };
}
