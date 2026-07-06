import { describe, expect, it } from "vitest";
import { parseGroundingMetadata } from "@/lib/ai/parse-grounding";

describe("parseGroundingMetadata", () => {
  it("extracts https sources and sanitizes search suggestions", () => {
    const parsed = parseGroundingMetadata({
      webSearchQueries: ["stadium shuttle schedule"],
      groundingChunks: [
        {
          web: {
            title: "NJ Transit",
            uri: "https://www.njtransit.com/",
          },
        },
        {
          web: {
            title: "Blocked",
            uri: "javascript:alert(1)",
          },
        },
      ],
      searchEntryPoint: {
        renderedContent:
          '<div><a href="https://www.google.com/search?q=shuttle">More on shuttle</a></div>',
      },
    });

    expect(parsed.webSearchQueries).toEqual(["stadium shuttle schedule"]);
    expect(parsed.sources).toHaveLength(1);
    expect(parsed.sources[0]?.uri).toBe("https://www.njtransit.com/");
    expect(parsed.searchSuggestionsHtml).toContain(
      "https://www.google.com/search?q=shuttle",
    );
    expect(parsed.searchSuggestionsHtml).not.toContain("javascript:");
  });
});
