export type StreamEvent =
  | { type: "token"; text: string }
  | { type: "tools"; names: string[] }
  | { type: "done"; fallback: boolean; usedTools: string[] }
  | { type: "error"; message: string };

export function encodeSseEvent(event: StreamEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

export function createSseStream(
  events: AsyncIterable<StreamEvent>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of events) {
          controller.enqueue(encoder.encode(encodeSseEvent(event)));
        }
        controller.close();
      } catch {
        controller.enqueue(
          encoder.encode(
            encodeSseEvent({ type: "error", message: "Something went wrong." }),
          ),
        );
        controller.close();
      }
    },
  });
}
