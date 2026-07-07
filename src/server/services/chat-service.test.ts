import { describe, expect, it, beforeEach } from "vitest";
import { handleChatRequest } from "@/server/services/chat-service";
import { resetRateLimitsForTests } from "@/server/security/rate-limit";

function makeChatRequest(ip = "127.0.0.1"): Request {
  return new Request("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "x-real-ip": ip },
  });
}

describe("handleChatRequest", () => {
  beforeEach(() => {
    resetRateLimitsForTests();
  });

  it("rejects invalid payloads", () => {
    const result = handleChatRequest({ bad: true }, makeChatRequest());
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
      makeChatRequest(),
    );
    expect(result.ok).toBe(true);
  });

  it("returns 429 with Retry-After once the client exhausts its budget", () => {
    let denied: ReturnType<typeof handleChatRequest> | null = null;
    for (let i = 0; i < 50; i += 1) {
      const result = handleChatRequest({ bad: true }, makeChatRequest("10.0.0.9"));
      if (!result.ok && result.status === 429) {
        denied = result;
        break;
      }
    }

    expect(denied).not.toBeNull();
    if (denied && !denied.ok) {
      expect(denied.message).toMatch(/Too many requests/);
      expect(denied.retryAfter).toBeGreaterThan(0);
    }
  });
});
