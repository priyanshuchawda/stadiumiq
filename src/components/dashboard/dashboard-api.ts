import type { DashboardSnapshot } from "@/types/dashboard";

export async function fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
  const response = await fetch("/api/dashboard");
  if (!response.ok) {
    throw new Error("Unable to load dashboard data.");
  }
  return (await response.json()) as DashboardSnapshot;
}
