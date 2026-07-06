import { describe, expect, it } from "vitest";
import { assertAllowedOrigin } from "@/server/http/origin-check";

describe("assertAllowedOrigin", () => {
  it("allows same-origin requests without an Origin header", () => {
    const request = new Request("http://localhost:3000/api/chat", { method: "POST" });
    expect(() => assertAllowedOrigin(request)).not.toThrow();
  });

  it("allows localhost origins by default", () => {
    const request = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { origin: "http://localhost:3000" },
    });
    expect(() => assertAllowedOrigin(request)).not.toThrow();
  });

  it("rejects disallowed cross-origin POSTs", () => {
    const request = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { origin: "https://evil.example" },
    });
    expect(() => assertAllowedOrigin(request)).toThrow(
      /Cross-origin request not allowed/,
    );
  });
});
