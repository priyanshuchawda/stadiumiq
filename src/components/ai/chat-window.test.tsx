import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatWindow } from "@/components/ai/chat-window";

describe("ChatWindow", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("renders context panel and input", () => {
    render(<ChatWindow />);
    expect(
      screen.getByRole("region", { name: /assistant context settings/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/message to kai/i)).toBeInTheDocument();
  });

  it("submits a message and shows assistant reply", async () => {
    const user = userEvent.setup();
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode('event: token\ndata: {"type":"token","text":"Gate C"}\n\n'),
        );
        controller.enqueue(
          encoder.encode(
            'event: done\ndata: {"type":"done","fallback":true,"usedTools":[]}\n\n',
          ),
        );
        controller.close();
      },
    });

    vi.mocked(fetch).mockResolvedValue(
      new Response(stream, {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      }),
    );

    render(<ChatWindow />);
    await user.type(screen.getByLabelText(/message to kai/i), "Which gate?");
    const sendButtons = screen.getAllByRole("button", { name: /^send$/i });
    await user.click(sendButtons[0]!);

    expect((await screen.findAllByText(/Gate C/)).length).toBeGreaterThan(0);
  });
});
