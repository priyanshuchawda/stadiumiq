import { describe, expect, it } from "vitest";
import { encodeSseEvent } from "@/lib/ai/sse";

describe("encodeSseEvent", () => {
  it("formats token events", () => {
    const encoded = encodeSseEvent({ type: "token", text: "Hi" });
    expect(encoded).toContain("event: token");
    expect(encoded).toContain('"text":"Hi"');
  });
});
