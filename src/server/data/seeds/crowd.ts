import type { DensityLevel } from "@/types/domain";

export type CrowdAreaSeed = {
  areaId: string;
  label: string;
  baseDensity: DensityLevel;
  baseWaitMinutes: number;
};

export const CROWD_AREAS: CrowdAreaSeed[] = [
  { areaId: "gate-a", label: "Gate A", baseDensity: "moderate", baseWaitMinutes: 4 },
  { areaId: "gate-b", label: "Gate B", baseDensity: "high", baseWaitMinutes: 8 },
  { areaId: "gate-c", label: "Gate C", baseDensity: "low", baseWaitMinutes: 2 },
  { areaId: "gate-d", label: "Gate D", baseDensity: "moderate", baseWaitMinutes: 5 },
  {
    areaId: "concourse-n",
    label: "North Concourse",
    baseDensity: "moderate",
    baseWaitMinutes: 3,
  },
  {
    areaId: "concourse-s",
    label: "South Concourse",
    baseDensity: "high",
    baseWaitMinutes: 6,
  },
];
