import { describe, expect, it } from "vitest";
import { createSseStream, encodeSseEvent } from "@/lib/ai/sse";
import type { StreamEvent } from "@/lib/ai/sse";

async function drain(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
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

describe("encodeSseEvent", () => {
  it("encodes an event with type and data lines", () => {
    const encoded = encodeSseEvent({ type: "token", text: "hi" });
    expect(encoded).toBe('event: token\ndata: {"type":"token","text":"hi"}\n\n');
  });
});

describe("createSseStream", () => {
  it("streams every event from the async iterable", async () => {
    async function* events(): AsyncGenerator<StreamEvent> {
      yield { type: "token", text: "a" };
      yield { type: "done", fallback: false, usedTools: [] };
    }
    const body = await drain(createSseStream(events()));
    expect(body).toContain("event: token");
    expect(body).toContain("event: done");
  });

  it("emits an error event when the iterable throws", async () => {
    async function* events(): AsyncGenerator<StreamEvent> {
      yield { type: "token", text: "a" };
      throw new Error("boom");
    }
    const body = await drain(createSseStream(events()));
    expect(body).toContain("event: error");
    expect(body).toContain("Something went wrong.");
  });
});
