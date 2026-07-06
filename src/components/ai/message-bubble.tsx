import { GroundingCitations } from "@/components/ai/grounding-citations";
import { SearchSuggestions } from "@/components/ai/search-suggestions";
import type { GroundedAnswer } from "@/types/grounding";

type MessageBubbleProps = {
  role: "user" | "assistant";
  content: string;
  grounding?: GroundedAnswer | undefined;
};

export function MessageBubble({
  role,
  content,
  grounding,
}: MessageBubbleProps): React.JSX.Element {
  const isUser = role === "user";
  return (
    <div
      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
        isUser
          ? "ml-auto bg-emerald-600 text-white"
          : "mr-auto bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
      }`}
    >
      <span className="sr-only">{isUser ? "You said:" : "Kai said:"}</span>
      {content}
      {!isUser && grounding ? (
        <>
          <GroundingCitations
            sources={grounding.sources}
            webSearchQueries={grounding.webSearchQueries}
          />
          <SearchSuggestions html={grounding.searchSuggestionsHtml} />
        </>
      ) : null}
    </div>
  );
}
