import { http, HttpResponse } from "msw";

function sseChunk(text: string): string {
  const payload = {
    candidates: [{ content: { role: "model", parts: [{ text }] } }],
  };
  return `data: ${JSON.stringify(payload)}\n\n`;
}

const GROUNDING_METADATA = {
  webSearchQueries: ["stadium transit after event"],
  groundingChunks: [
    { web: { uri: "https://www.njtransit.com/", title: "NJ Transit" } },
    { web: { uri: "https://www.njtransit.com/", title: "NJ Transit dup" } },
    { web: { uri: "https://transit.example/routes" } }, // no title -> uri used
    { web: { uri: "http://insecure.example.com", title: "Dropped (not https)" } },
    {}, // no web chunk -> skipped
  ],
  searchEntryPoint: {
    renderedContent: '<div>See <a href="https://x.test">routes</a></div>',
  },
};

const DASHBOARD_JSON = JSON.stringify({
  incidentSummary: "Gate B queue is elevated; dispatch stewards.",
  priorityActions: ["Open Gate C lanes", "Add stewards at Gate B"],
  sentimentDigest: [
    { language: "en", summary: "Queues manageable overall.", tone: "mixed" },
    { language: "es", summary: "Se necesita mas senalizacion.", tone: "concerned" },
  ],
});

function jsonResponse(text: string, withGrounding: boolean): Response {
  return HttpResponse.json({
    candidates: [
      {
        content: { role: "model", parts: [{ text }] },
        ...(withGrounding ? { groundingMetadata: GROUNDING_METADATA } : {}),
      },
    ],
  });
}

// Non-streaming generateContent. Returns structured JSON for dashboard calls
// (responseMimeType=application/json) and plain grounded text otherwise.
export const generateContentHandler = http.post(
  /:generateContent/,
  async ({ request }) => {
    const raw = await request.text();
    if (raw.includes("application/json")) {
      return jsonResponse(DASHBOARD_JSON, false);
    }
    return jsonResponse("Gate C has the shortest wait right now.", true);
  },
);

// Streaming generateContentStream (SSE). Emits two token chunks.
export const streamGenerateContentHandler = http.post(/:streamGenerateContent/, () => {
  const body = `${sseChunk("Gate C ")}${sseChunk("has the shortest wait.")}`;
  return new HttpResponse(body, {
    headers: { "Content-Type": "text/event-stream" },
  });
});

export const geminiHandlers = [streamGenerateContentHandler, generateContentHandler];
