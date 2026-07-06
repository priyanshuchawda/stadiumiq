import { describe, expect, it } from "vitest";
import { readJsonWithLimit } from "@/server/http/read-json";
import { AppError } from "@/lib/errors/app-error";

function makeRequest(body: string, headers: Record<string, string> = {}): Request {
  return new Request("https://example.test/api", {
    method: "POST",
    body,
    headers,
  });
}

describe("readJsonWithLimit", () => {
  it("parses a valid JSON body", async () => {
    const request = makeRequest(JSON.stringify({ message: "hi" }));
    await expect(readJsonWithLimit(request)).resolves.toEqual({ message: "hi" });
  });

  it("rejects an oversized declared content-length", async () => {
    const request = makeRequest("{}", { "content-length": String(64 * 1024) });
    await expect(readJsonWithLimit(request, 1024)).rejects.toBeInstanceOf(AppError);
  });

  it("rejects an oversized actual body", async () => {
    const request = makeRequest(JSON.stringify({ blob: "x".repeat(2048) }));
    await expect(readJsonWithLimit(request, 512)).rejects.toMatchObject({
      kind: "payload_too_large",
    });
  });

  it("rejects invalid JSON as a validation error", async () => {
    const request = makeRequest("{ not json");
    await expect(readJsonWithLimit(request)).rejects.toMatchObject({
      kind: "validation",
    });
  });
});
