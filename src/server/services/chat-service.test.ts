import { describe, expect, it, beforeEach } from "vitest";
import { handleChatRequest } from "@/server/services/chat-service";
import { resetRateLimitsForTests } from "@/server/security/rate-limit";

describe("handleChatRequest", () => {
  beforeEach(() => {
    resetRateLimitsForTests();
  });

  it("rejects invalid payloads", () => {
    const result = handleChatRequest({ bad: true }, "127.0.0.1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
    }
  });

  it("returns SSE stream for valid payloads", () => {
    const result = handleChatRequest(
      {
        message: "Which gate should I use?",
        context: {
          persona: "fan",
          language: "en",
          accessibility: {
            mobility: "none",
            lowVision: false,
            sensorySensitive: false,
          },
        },
      },
      "127.0.0.1",
    );
    expect(result.ok).toBe(true);
  });
});
