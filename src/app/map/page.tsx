import { MapClientShell } from "@/components/map/map-client-shell";
import {
  buildDefaultMapContext,
  buildMapCrowdSnapshot,
} from "@/server/services/map-service";

export default async function MapPage(): Promise<React.JSX.Element> {
  const initialCrowd = await buildMapCrowdSnapshot(buildDefaultMapContext());

  return (
    <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-bold">Stadium Map</h1>
      <p className="mt-2 mb-6 text-zinc-600 dark:text-zinc-400">
        Live crowd heatmap, step-free routing, and Kai-powered gate recommendations for
        Liberty Stadium.
      </p>
      <MapClientShell initialCrowd={initialCrowd} />
    </main>
  );
}
