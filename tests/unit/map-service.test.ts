import { describe, expect, it } from "vitest";
import {
  buildDefaultMapContext,
  buildRouteOverlay,
  listMapNodes,
} from "@/server/services/map-service";

describe("map-service helpers", () => {
  it("lists map nodes for rendering", () => {
    const nodes = listMapNodes();
    expect(nodes.length).toBeGreaterThan(0);
    expect(nodes[0]).toHaveProperty("id");
  });

  it("builds a default fan map context", () => {
    const context = buildDefaultMapContext();
    expect(context.persona).toBe("fan");
    expect(context.location?.gate).toBe("C");
  });

  it("returns a route overlay with ordered node ids", () => {
    const overlay = buildRouteOverlay("gate-c", "section-112", false);
    expect(overlay).not.toBeNull();
    expect(overlay?.nodeIds.length).toBeGreaterThan(0);
  });

  it("returns null when no route exists", () => {
    const overlay = buildRouteOverlay("gate-c", "nonexistent-node", false);
    expect(overlay).toBeNull();
  });
});
