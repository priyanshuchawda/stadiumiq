import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { geminiHandlers } from "../mocks/gemini-handlers";
import { resetGeminiClientForTests } from "@/lib/ai/client";
import { POST } from "@/app/api/chat/route";

const server = setupServer(...geminiHandlers);

const validBody = {
  message: "Which gate should I use?",
  context: {
    persona: "fan",
    language: "en",
    accessibility: { mobility: "none", lowVision: false, sensorySensitive: false },
  },
};

function chatRequest(body: unknown, ip = "203.0.113.10"): Request {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

async function readStream(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    return "";
  }
  const decoder = new TextDecoder();
  let out = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    out += decoder.decode(value, { stream: true });
  }
  return out;
}

describe("/api/chat integration (MSW-mocked Gemini)", () => {
  beforeAll(() => {
    process.env["GEMINI_API_KEY"] = "test-key-123";
    resetGeminiClientForTests();
    server.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
    delete process.env["GEMINI_API_KEY"];
    resetGeminiClientForTests();
  });

  it("streams mocked Gemini tokens as SSE and a done event", async () => {
    const response = await POST(chatRequest(validBody));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");

    const body = await readStream(response);
    expect(body).toContain("Gate C");
    expect(body).toContain('"type":"done"');
  });

  it("rejects invalid payloads with 400", async () => {
    const response = await POST(chatRequest({ message: "" }));
    expect(response.status).toBe(400);
  });

  it("rejects malformed JSON with 400", async () => {
    const bad = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "203.0.113.11",
      },
      body: "{not json",
    });
    const response = await POST(bad);
    expect(response.status).toBe(400);
  });

  it("emits a tools event when the model requests a function call", async () => {
    let call = 0;
    server.use(
      http.post(/:generateContent/, () => {
        call += 1;
        if (call === 1) {
          return HttpResponse.json({
            candidates: [
              {
                content: {
                  role: "model",
                  parts: [
                    {
                      functionCall: {
                        name: "getCrowdStatus",
                        args: { area: "gate-c" },
                      },
                    },
                  ],
                },
              },
            ],
          });
        }
        return HttpResponse.json({
          candidates: [{ content: { role: "model", parts: [{ text: "done" }] } }],
        });
      }),
    );

    const response = await POST(chatRequest(validBody, "203.0.113.20"));
    const body = await readStream(response);
    expect(body).toContain('"type":"tools"');
    expect(body).toContain("getCrowdStatus");
  });

  it("falls back to a canned answer when the stream yields no tokens", async () => {
    server.use(
      http.post(/:streamGenerateContent/, () => {
        const empty = `data: ${JSON.stringify({
          candidates: [{ content: { role: "model", parts: [] } }],
        })}\n\n`;
        return new HttpResponse(empty, {
          headers: { "Content-Type": "text/event-stream" },
        });
      }),
    );
    const response = await POST(chatRequest(validBody, "203.0.113.21"));
    const body = await readStream(response);
    expect(body).toContain('"type":"token"');
    expect(body).toContain('"type":"done"');
  });
});
