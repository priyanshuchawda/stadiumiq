import { describe, expect, it } from "vitest";
import { validateServerEnv } from "@/lib/config/env";

describe("validateServerEnv", () => {
  it("accepts a well-formed environment and reports no warnings", () => {
    const result = validateServerEnv({
      GEMINI_API_KEY: "real-key",
      AI_MAX_OUTPUT_TOKENS: "1024",
      RATE_LIMIT_PER_MINUTE: "30",
      LOG_LEVEL: "info",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.warnings).toHaveLength(0);
    }
  });

  it("warns when the Gemini key is missing or a placeholder", () => {
    const result = validateServerEnv({
      GEMINI_API_KEY: "REPLACE_WITH_YOUR_GEMINI_API_KEY",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.warnings.join(" ")).toMatch(/GEMINI_API_KEY/);
    }
  });

  it("fails on a non-numeric token budget", () => {
    const result = validateServerEnv({
      AI_MAX_OUTPUT_TOKENS: "lots",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join(" ")).toMatch(/AI_MAX_OUTPUT_TOKENS/);
    }
  });

  it("fails on an invalid log level", () => {
    const result = validateServerEnv({
      LOG_LEVEL: "verbose",
    });
    expect(result.ok).toBe(false);
  });
});
