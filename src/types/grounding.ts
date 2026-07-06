export type GroundingSource = {
  title: string;
  uri: string;
};

export type GroundedAnswer = {
  answer: string;
  fallback: boolean;
  webSearchQueries: string[];
  sources: GroundingSource[];
  searchSuggestionsHtml: string | null;
};
