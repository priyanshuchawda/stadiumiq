import { afterEach, describe, expect, it, vi } from "vitest";
import { assertAllowedOrigin } from "@/server/http/origin-check";

afterEach(() => {
  vi.unstubAllEnvs();
});

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

  it("honors a configured ALLOWED_ORIGINS allowlist", () => {
    vi.stubEnv("ALLOWED_ORIGINS", "https://stadiumiq.example, https://staging.example");

    const allowed = new Request("https://stadiumiq.example/api/chat", {
      method: "POST",
      headers: { origin: "https://stadiumiq.example" },
    });
    expect(() => assertAllowedOrigin(allowed)).not.toThrow();

    const localhostNoLongerAllowed = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { origin: "http://localhost:3000" },
    });
    expect(() => assertAllowedOrigin(localhostNoLongerAllowed)).toThrow(
      /Cross-origin request not allowed/,
    );
  });

  it("falls back to defaults when ALLOWED_ORIGINS is blank", () => {
    vi.stubEnv("ALLOWED_ORIGINS", "   ");
    const request = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { origin: "http://localhost:3000" },
    });
    expect(() => assertAllowedOrigin(request)).not.toThrow();
  });

  it("accepts a same-site request behind a proxy without extra config", () => {
    // Origin matches the host the request was served on (e.g. a Vercel
    // deployment URL), so it is same-site even if not on the allowlist.
    const request = new Request("https://stadiumiq.example/api/chat", {
      method: "POST",
      headers: {
        origin: "https://stadiumiq.example",
        "x-forwarded-proto": "https",
        "x-forwarded-host": "stadiumiq.example",
      },
    });
    expect(() => assertAllowedOrigin(request)).not.toThrow();
  });

  it("rejects a cross-site origin that mismatches the forwarded host", () => {
    const request = new Request("https://stadiumiq.example/api/chat", {
      method: "POST",
      headers: {
        origin: "https://evil.example",
        "x-forwarded-proto": "https",
        "x-forwarded-host": "stadiumiq.example",
      },
    });
    expect(() => assertAllowedOrigin(request)).toThrow(
      /Cross-origin request not allowed/,
    );
  });
});
