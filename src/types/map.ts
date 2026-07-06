import type { DensityLevel } from "@/types/domain";
import type { GateRecommendation, RouteResult } from "@/types/stadium";

export type CrowdAreaView = {
  areaId: string;
  area: string;
  density: DensityLevel;
  waitMinutes: number;
  recommendation: string;
};

export type MapCrowdSnapshot = {
  areas: CrowdAreaView[];
  gate: GateRecommendation;
  explanation: string;
  updatedAt: string;
};

export type RouteOverlayData = {
  route: RouteResult;
  nodeIds: string[];
};

export type MapNodeOption = {
  id: string;
  label: string;
};
