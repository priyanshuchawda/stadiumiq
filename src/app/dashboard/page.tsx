import { DashboardClientShell } from "@/components/dashboard/dashboard-client-shell";
import { buildDashboardSnapshot } from "@/server/services/dashboard-service";

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const initialSnapshot = await buildDashboardSnapshot();

  return (
    <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-bold">Operations Dashboard</h1>
      <p className="mt-2 mb-6 text-zinc-600 dark:text-zinc-400">
        Real-time KPIs, incident feed, multilingual sentiment digest, and AI staffing
        guidance for Liberty Stadium organizers.
      </p>
      <DashboardClientShell initialSnapshot={initialSnapshot} />
    </main>
  );
}
