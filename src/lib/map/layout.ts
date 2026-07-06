export type MapNodeLayout = {
  id: string;
  label: string;
  kind: "gate" | "concourse" | "section" | "amenity";
  x: number;
  y: number;
  radius: number;
};

export const MAP_VIEWBOX = { width: 800, height: 560 };

export const MAP_NODE_LAYOUTS: MapNodeLayout[] = [
  { id: "gate-a", label: "Gate A", kind: "gate", x: 140, y: 90, radius: 36 },
  { id: "gate-b", label: "Gate B", kind: "gate", x: 360, y: 90, radius: 36 },
  { id: "gate-c", label: "Gate C", kind: "gate", x: 140, y: 470, radius: 36 },
  { id: "gate-d", label: "Gate D", kind: "gate", x: 360, y: 470, radius: 36 },
  {
    id: "concourse-n",
    label: "North Concourse",
    kind: "concourse",
    x: 250,
    y: 190,
    radius: 48,
  },
  {
    id: "concourse-s",
    label: "South Concourse",
    kind: "concourse",
    x: 250,
    y: 370,
    radius: 48,
  },
  {
    id: "section-112",
    label: "Section 112",
    kind: "section",
    x: 70,
    y: 260,
    radius: 32,
  },
  {
    id: "section-205",
    label: "Section 205",
    kind: "section",
    x: 430,
    y: 260,
    radius: 32,
  },
  {
    id: "section-318",
    label: "Section 318",
    kind: "section",
    x: 250,
    y: 500,
    radius: 32,
  },
  {
    id: "accessible-ramp",
    label: "Accessible Ramp",
    kind: "amenity",
    x: 250,
    y: 280,
    radius: 28,
  },
];

export const MAP_EDGE_PATHS: { from: string; to: string }[] = [
  { from: "gate-a", to: "concourse-n" },
  { from: "gate-b", to: "concourse-n" },
  { from: "gate-c", to: "concourse-s" },
  { from: "gate-d", to: "concourse-s" },
  { from: "concourse-n", to: "section-112" },
  { from: "concourse-n", to: "accessible-ramp" },
  { from: "accessible-ramp", to: "section-112" },
  { from: "concourse-n", to: "section-205" },
  { from: "concourse-s", to: "section-318" },
  { from: "concourse-s", to: "accessible-ramp" },
];
