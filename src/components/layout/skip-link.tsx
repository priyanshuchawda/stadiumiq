export function SkipLink(): React.JSX.Element {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-emerald-700 focus:px-4 focus:py-2 focus:text-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
    >
      Skip to main content
    </a>
  );
}
