"use client";

import { useMemo } from "react";
import { sanitizeGroundingHtml } from "@/lib/utils/sanitize-grounding-html";

type SearchSuggestionsProps = {
  html: string | null | undefined;
};

export function SearchSuggestions({
  html,
}: SearchSuggestionsProps): React.JSX.Element | null {
  // Defense in depth: HTML is sanitized server-side in parse-grounding, but we
  // re-sanitize at the render boundary so no future call site can bypass it.
  const safeHtml = useMemo(() => (html ? sanitizeGroundingHtml(html) : null), [html]);

  if (!safeHtml) {
    return null;
  }

  return (
    <section
      aria-label="Google search suggestions"
      className="search-suggestions mt-3 rounded-lg border border-zinc-200 p-3 text-xs dark:border-zinc-700"
      // Gemini Grounding compliance: only sanitized searchEntryPoint.renderedContent uses innerHTML.
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
