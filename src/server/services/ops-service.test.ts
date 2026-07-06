import { describe, expect, it } from "vitest";
import {
  getIncidentFeed,
  getOperationalKpis,
  suggestStaffing,
} from "@/server/services/ops-service";

describe("opsService", () => {
  it("returns KPI cards", () => {
    const kpis = getOperationalKpis(1_700_000_000_000);
    expect(kpis.length).toBe(3);
    expect(kpis[0]?.label).toBe("Active gates");
  });

  it("returns incidents and staffing suggestions for high-density areas", () => {
    const now = 1_700_000_000_000;
    const incidents = getIncidentFeed(now);
    const staffing = suggestStaffing(now);
    expect(Array.isArray(incidents)).toBe(true);
    expect(staffing.length).toBeGreaterThan(0);
  });
});
