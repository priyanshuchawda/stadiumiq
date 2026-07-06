import type { StreamEvent } from "@/lib/ai/sse";
import type { UserContext } from "@/types/stadium";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type StreamMeta = { fallback: boolean; usedTools: string[] };

function applyStreamEvent(
  event: StreamEvent,
  onToken: (text: string) => void,
  meta: StreamMeta,
): void {
  if (event.type === "token") {
    onToken(event.text);
  }
  if (event.type === "done") {
    meta.fallback = event.fallback;
    meta.usedTools = event.usedTools;
  }
  if (event.type === "error") {
    throw new Error(event.message);
  }
}

export async function parseSseResponse(
  response: Response,
  onToken: (text: string) => void,
): Promise<StreamMeta> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response stream");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  const meta: StreamMeta = { fallback: false, usedTools: [] };

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const event = parseSsePart(part);
      if (event) {
        applyStreamEvent(event, onToken, meta);
      }
    }
  }

  return meta;
}

function parseSsePart(part: string): StreamEvent | null {
  const dataLine = part.split("\n").find((line) => line.startsWith("data: "));
  if (!dataLine) {
    return null;
  }
  try {
    return JSON.parse(dataLine.slice(6)) as StreamEvent;
  } catch {
    return null;
  }
}

export async function sendChatMessage(
  message: string,
  context: UserContext,
  onToken: (text: string) => void,
  signal?: AbortSignal,
): Promise<StreamMeta> {
  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, context }),
  };
  if (signal) {
    init.signal = signal;
  }

  const response = await fetch("/api/chat", init);
  if (!response.ok) {
    const payload = (await response.json()) as { error?: string };
    throw new Error(payload.error ?? "Chat request failed");
  }

  return parseSseResponse(response, onToken);
}

export async function sendVisionRequest(
  file: File,
  context: UserContext,
  prompt: string,
): Promise<string> {
  const form = new FormData();
  form.append("image", file);
  form.append("context", JSON.stringify(context));
  form.append("prompt", prompt);

  const response = await fetch("/api/vision", { method: "POST", body: form });
  const payload = (await response.json()) as { answer?: string; error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? "Vision request failed");
  }
  return payload.answer ?? "";
}
