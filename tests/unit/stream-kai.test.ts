import { beforeEach, describe, expect, it, vi } from "vitest";
import { streamKai } from "@/lib/ai/stream-kai";
import { getGeminiClient } from "@/lib/ai/client";
import { runToolLoop } from "@/lib/ai/tool-loop";
import { generateContentStreamWithFallback } from "@/lib/ai/generate";
import { fanContext } from "../fixtures/contexts";
import type { StreamEvent } from "@/lib/ai/sse";

vi.mock("@/lib/ai/client", () => ({ getGeminiClient: vi.fn() }));
vi.mock("@/lib/ai/tool-loop", () => ({ runToolLoop: vi.fn() }));
vi.mock("@/lib/ai/generate", () => ({
  generateContentStreamWithFallback: vi.fn(),
}));

const mockedGetClient = vi.mocked(getGeminiClient);
const mockedRunToolLoop = vi.mocked(runToolLoop);
const mockedStream = vi.mocked(generateContentStreamWithFallback);

async function collect(events: AsyncGenerator<StreamEvent>): Promise<StreamEvent[]> {
  const out: StreamEvent[] = [];
  for await (const event of events) {
    out.push(event);
  }
  return out;
}

function tokensOf(events: StreamEvent[]): string {
  return events
    .filter((event) => event.type === "token")
    .map((event) => (event.type === "token" ? event.text : ""))
    .join("");
}

async function* fakeChunks(texts: string[]): AsyncGenerator<{ text: string }> {
  for (const text of texts) {
    yield { text };
  }
}

describe("streamKai", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("streams the deterministic fallback when no client is configured", async () => {
    mockedGetClient.mockReturnValue(null);

    const events = await collect(streamKai({ context: fanContext, message: "hi" }));

    expect(tokensOf(events)).toContain("Gate C");
    expect(events.at(-1)).toEqual({ type: "done", fallback: true, usedTools: [] });
    expect(mockedRunToolLoop).not.toHaveBeenCalled();
  });

  it("streams the tool-loop answer without a second model call", async () => {
    mockedGetClient.mockReturnValue({} as never);
    mockedRunToolLoop.mockResolvedValue({
      answer: "Gate A has the shortest wait.",
      usedTools: ["getCrowdStatus"],
      contents: [],
    });

    const events = await collect(streamKai({ context: fanContext, message: "gate?" }));

    expect(events[0]).toEqual({ type: "tools", names: ["getCrowdStatus"] });
    expect(tokensOf(events)).toContain("Gate A has the shortest wait.");
    expect(mockedStream).not.toHaveBeenCalled();
    expect(events.at(-1)).toEqual({
      type: "done",
      fallback: false,
      usedTools: ["getCrowdStatus"],
    });
  });

  it("falls back to model streaming when the tool loop yields no answer", async () => {
    mockedGetClient.mockReturnValue({} as never);
    mockedRunToolLoop.mockResolvedValue({ answer: null, usedTools: [], contents: [] });
    mockedStream.mockResolvedValue(fakeChunks(["Hello ", "", "world"]) as never);

    const events = await collect(streamKai({ context: fanContext, message: "hi" }));

    expect(tokensOf(events)).toBe("Hello world");
    expect(mockedStream).toHaveBeenCalledTimes(1);
  });

  it("emits a fallback token when the model stream produces nothing", async () => {
    mockedGetClient.mockReturnValue({} as never);
    mockedRunToolLoop.mockResolvedValue({ answer: null, usedTools: [], contents: [] });
    mockedStream.mockResolvedValue(fakeChunks([]) as never);

    const events = await collect(streamKai({ context: fanContext, message: "hi" }));

    expect(tokensOf(events)).toContain("Gate C");
    expect(events.at(-1)).toEqual({ type: "done", fallback: false, usedTools: [] });
  });
});
