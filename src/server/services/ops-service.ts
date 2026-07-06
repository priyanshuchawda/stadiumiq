import { getCrowdStatus } from "@/server/services/crowd-service";
import { listCrowdAreas } from "@/server/data/repositories/stadium-repository";
import type { DensityLevel } from "@/types/domain";

export type OpsKpi = {
  label: string;
  value: string;
  trend: "up" | "down" | "stable";
};

export type IncidentSummary = {
  id: string;
  area: string;
  severity: DensityLevel;
  message: string;
};

export function getOperationalKpis(now = Date.now()): OpsKpi[] {
  const gates = listCrowdAreas().filter((area) => area.areaId.startsWith("gate-"));
  const highCrowd = gates.filter((gate) => {
    const status = getCrowdStatus(gate.areaId, now);
    return status?.density === "high" || status?.density === "critical";
  });

  return [
    { label: "Active gates", value: String(gates.length), trend: "stable" },
    {
      label: "High-density zones",
      value: String(highCrowd.length),
      trend: highCrowd.length > 1 ? "up" : "stable",
    },
    {
      label: "Avg gate wait",
      value: `${Math.round(
        gates.reduce(
          (sum, gate) => sum + (getCrowdStatus(gate.areaId, now)?.waitMinutes ?? 0),
          0,
        ) / gates.length,
      )} min`,
      trend: "stable",
    },
  ];
}

function toIncident(areaId: string, now: number): IncidentSummary | null {
  const status = getCrowdStatus(areaId, now);
  if (!status || status.density === "low" || status.density === "moderate") {
    return null;
  }
  return {
    id: areaId,
    area: status.area,
    severity: status.density,
    message: `${status.area}: ${status.recommendation} (${status.waitMinutes} min wait)`,
  };
}

export function getIncidentFeed(now = Date.now()): IncidentSummary[] {
  const incidents: IncidentSummary[] = [];
  for (const area of listCrowdAreas()) {
    const incident = toIncident(area.areaId, now);
    if (incident) {
      incidents.push(incident);
    }
  }
  return incidents;
}

export function suggestStaffing(now = Date.now()): string[] {
  const incidents = getIncidentFeed(now);
  if (incidents.length === 0) {
    return ["Maintain baseline staffing across all gates."];
  }
  return incidents.map(
    (incident) =>
      `Deploy 2 additional stewards to ${incident.area} (${incident.severity} density).`,
  );
}
