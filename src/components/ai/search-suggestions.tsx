type SearchSuggestionsProps = {
  html: string | null | undefined;
};

export function SearchSuggestions({
  html,
}: SearchSuggestionsProps): React.JSX.Element | null {
  if (!html) {
    return null;
  }

  return (
    <section
      aria-label="Google search suggestions"
      className="search-suggestions mt-3 rounded-lg border border-zinc-200 p-3 text-xs dark:border-zinc-700"
      // Gemini Grounding compliance: only sanitized searchEntryPoint.renderedContent uses innerHTML.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
