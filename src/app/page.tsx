import Link from "next/link";
import { DemoJourneys } from "@/components/home/demo-journeys";

export default function HomePage(): React.JSX.Element {
  return (
    <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <section className="mb-12 space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          FIFA World Cup 2026
        </p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          StadiumIQ — your context-aware stadium copilot
        </h1>
        <p className="max-w-2xl text-lg text-zinc-600 dark:text-zinc-300">
          Meet <strong>Kai</strong>, a GenAI assistant for fans, volunteers, venue
          staff, and organizers. Navigation, crowd management, accessibility, transport,
          sustainability, and operational intelligence — grounded in real stadium data.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/assistant"
            className="inline-flex min-h-11 items-center rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            Open Kai Assistant
          </Link>
          <Link
            href="/map"
            className="inline-flex min-h-11 items-center rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-semibold hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Stadium Map
          </Link>
        </div>
      </section>
      <DemoJourneys />
    </main>
  );
}
