import Link from "next/link";

const journeys = [
  {
    title: "Fan · Accessible route",
    href: "/assistant?persona=fan&lang=es",
    description: "Wheelchair user, Spanish — step-free route and accessible amenities.",
  },
  {
    title: "Fan · Green transport",
    href: "/assistant?persona=fan&topic=transport",
    description: "Fastest sustainable way to the airport after the match.",
  },
  {
    title: "Volunteer · Lost child SOP",
    href: "/assistant?persona=volunteer",
    description: "Structured protocol checklist with contacts.",
  },
  {
    title: "Staff · Crowd surge",
    href: "/assistant?persona=staff",
    description: "Real-time decision support for Gate B surge.",
  },
  {
    title: "Organizer · Operations",
    href: "/dashboard",
    description: "KPIs, incident summaries, and staffing suggestions.",
  },
] as const;

export function DemoJourneys(): React.JSX.Element {
  return (
    <section aria-labelledby="demo-journeys-heading">
      <h2 id="demo-journeys-heading" className="mb-4 text-2xl font-semibold">
        Demo journeys
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2">
        {journeys.map((journey) => (
          <li key={journey.href}>
            <Link
              href={journey.href}
              className="block min-h-11 rounded-xl border border-zinc-200 p-5 transition hover:border-emerald-400 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:border-zinc-800"
            >
              <h3 className="font-semibold">{journey.title}</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {journey.description}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
