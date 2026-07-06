import { describe, expect, it } from "vitest";
import { getClientKey } from "@/server/http/client-key";

describe("getClientKey", () => {
  it("prefers x-real-ip over x-forwarded-for", () => {
    const request = new Request("http://localhost/api/chat", {
      headers: {
        "x-real-ip": "203.0.113.1",
        "x-forwarded-for": "198.51.100.99, 10.0.0.1",
      },
    });
    expect(getClientKey(request)).toBe("203.0.113.1");
  });

  it("falls back to the first x-forwarded-for hop", () => {
    const request = new Request("http://localhost/api/chat", {
      headers: { "x-forwarded-for": "198.51.100.50, 10.0.0.2" },
    });
    expect(getClientKey(request)).toBe("198.51.100.50");
  });

  it("returns local when no IP headers are present", () => {
    const request = new Request("http://localhost/api/chat");
    expect(getClientKey(request)).toBe("local");
  });
});
