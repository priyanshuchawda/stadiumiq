import type { IncidentSummary, OpsKpi } from "@/server/services/ops-service";

export type SentimentEntry = {
  language: string;
  summary: string;
  tone: "positive" | "mixed" | "concerned";
};

export type DashboardAiInsights = {
  incidentSummary: string;
  priorityActions: string[];
  sentimentDigest: SentimentEntry[];
  fallback: boolean;
};

export type DashboardSnapshot = {
  kpis: OpsKpi[];
  incidents: IncidentSummary[];
  staffing: string[];
  ai: DashboardAiInsights;
  updatedAt: string;
};
