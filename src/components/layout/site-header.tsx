import Link from "next/link";

const navItems = [
  { href: "/assistant", label: "Kai Assistant" },
  { href: "/map", label: "Stadium Map" },
  { href: "/dashboard", label: "Operations" },
] as const;

export function SiteHeader(): React.JSX.Element {
  return (
    <header className="border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-emerald-700 dark:text-emerald-400"
        >
          StadiumIQ
        </Link>
        <nav aria-label="Main navigation">
          <ul className="flex flex-wrap items-center gap-2 sm:gap-4">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
