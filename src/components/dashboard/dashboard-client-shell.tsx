"use client";

import { DashboardExperience } from "@/components/dashboard/dashboard-experience";
import type { DashboardSnapshot } from "@/types/dashboard";

type DashboardClientShellProps = {
  initialSnapshot: DashboardSnapshot;
};

export function DashboardClientShell({
  initialSnapshot,
}: DashboardClientShellProps): React.JSX.Element {
  return <DashboardExperience initialSnapshot={initialSnapshot} />;
}
