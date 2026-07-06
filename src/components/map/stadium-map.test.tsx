import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StadiumMap } from "@/components/map/stadium-map";

const sampleAreas = [
  {
    areaId: "gate-a",
    area: "Gate A",
    density: "moderate" as const,
    waitMinutes: 4,
    recommendation: "Flow is manageable.",
  },
  {
    areaId: "gate-b",
    area: "Gate B",
    density: "high" as const,
    waitMinutes: 8,
    recommendation: "Expect delays.",
  },
];

describe("StadiumMap", () => {
  it("renders map title and density labels", () => {
    render(<StadiumMap areas={sampleAreas} routeNodeIds={["gate-c", "section-112"]} />);
    expect(
      screen.getByRole("img", { name: /Liberty Stadium map/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/High · 8m/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/Gate B: High density/i)).toBeInTheDocument();
  });
});
