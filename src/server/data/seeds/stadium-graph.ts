export type GraphNode = {
  id: string;
  label: string;
  kind: "gate" | "concourse" | "section" | "amenity";
};

export type GraphEdge = {
  from: string;
  to: string;
  minutes: number;
  stepFree: boolean;
};

export const STADIUM_NODES: GraphNode[] = [
  { id: "gate-a", label: "Gate A", kind: "gate" },
  { id: "gate-b", label: "Gate B", kind: "gate" },
  { id: "gate-c", label: "Gate C", kind: "gate" },
  { id: "gate-d", label: "Gate D", kind: "gate" },
  { id: "concourse-n", label: "North Concourse", kind: "concourse" },
  { id: "concourse-s", label: "South Concourse", kind: "concourse" },
  { id: "section-112", label: "Section 112", kind: "section" },
  { id: "section-205", label: "Section 205", kind: "section" },
  { id: "section-318", label: "Section 318", kind: "section" },
  { id: "accessible-ramp", label: "Accessible Ramp", kind: "amenity" },
];

export const STADIUM_EDGES: GraphEdge[] = [
  { from: "gate-a", to: "concourse-n", minutes: 3, stepFree: true },
  { from: "gate-b", to: "concourse-n", minutes: 4, stepFree: false },
  { from: "gate-c", to: "concourse-s", minutes: 3, stepFree: true },
  { from: "gate-d", to: "concourse-s", minutes: 5, stepFree: false },
  { from: "concourse-n", to: "section-112", minutes: 4, stepFree: false },
  { from: "concourse-n", to: "accessible-ramp", minutes: 2, stepFree: true },
  { from: "accessible-ramp", to: "section-112", minutes: 3, stepFree: true },
  { from: "concourse-n", to: "section-205", minutes: 5, stepFree: true },
  { from: "concourse-s", to: "section-318", minutes: 4, stepFree: false },
  { from: "concourse-s", to: "accessible-ramp", minutes: 3, stepFree: true },
];

export const LOCATION_ALIASES: Record<string, string> = {
  "gate a": "gate-a",
  "gate b": "gate-b",
  "gate c": "gate-c",
  "gate d": "gate-d",
  "section 112": "section-112",
  "section 205": "section-205",
  "section 318": "section-318",
  "north concourse": "concourse-n",
  "south concourse": "concourse-s",
};
