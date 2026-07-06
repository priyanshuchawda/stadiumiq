import { describe, expect, it } from "vitest";
import { checkGeminiKeyConfigured } from "@/lib/env/check-gemini-key";

describe("checkGeminiKeyConfigured", () => {
  it("returns false when key is missing", () => {
    expect(checkGeminiKeyConfigured(undefined)).toBe(false);
  });

  it("returns false for placeholder key", () => {
    expect(checkGeminiKeyConfigured("REPLACE_WITH_YOUR_GEMINI_API_KEY")).toBe(false);
  });

  it("returns true for a real key value", () => {
    expect(checkGeminiKeyConfigured("test-key-value")).toBe(true);
  });
});
