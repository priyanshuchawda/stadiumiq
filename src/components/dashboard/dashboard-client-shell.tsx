"use client";

import dynamic from "next/dynamic";
import type { DashboardSnapshot } from "@/types/dashboard";

const DashboardExperience = dynamic(
  () =>
    import("@/components/dashboard/dashboard-experience").then(
      (mod) => mod.DashboardExperience,
    ),
  {
    loading: () => (
      <p className="text-zinc-600 dark:text-zinc-400" role="status">
        Loading dashboard…
      </p>
    ),
    ssr: false,
  },
);

type DashboardClientShellProps = {
  initialSnapshot: DashboardSnapshot;
};

export function DashboardClientShell({
  initialSnapshot,
}: DashboardClientShellProps): React.JSX.Element {
  return <DashboardExperience initialSnapshot={initialSnapshot} />;
}
