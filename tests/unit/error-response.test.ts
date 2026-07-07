import { describe, expect, it } from "vitest";
import { mapErrorToResponse } from "@/server/http/error-response";
import { AppError } from "@/lib/errors/app-error";

describe("mapErrorToResponse", () => {
  it("maps unknown errors to a generic 500 with a correlation id", async () => {
    const response = mapErrorToResponse(new Error("secret internals"), {
      route: "POST /api/chat",
    });

    expect(response.status).toBe(500);
    expect(response.headers.get("x-correlation-id")).toBeTruthy();

    const body = (await response.json()) as { error: string };
    // Internal details must never leak to the client.
    expect(body.error).not.toContain("secret internals");
  });

  it("sets Retry-After for rate-limit errors", () => {
    const response = mapErrorToResponse(new AppError("rate_limit", "slow down"), {
      route: "POST /api/chat",
      retryAfterSeconds: 7,
    });

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("7");
  });

  it("omits Retry-After for non-rate-limit errors", () => {
    const response = mapErrorToResponse(new AppError("validation", "bad input"), {
      route: "POST /api/chat",
      retryAfterSeconds: 7,
    });

    expect(response.status).toBe(400);
    expect(response.headers.get("Retry-After")).toBeNull();
  });
});
