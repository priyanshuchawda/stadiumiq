import { describe, expect, it } from "vitest";
import * as z from "zod";
import { buildRepairPrompt, parseStructuredOutput } from "@/lib/ai/structured-output";

const schema = z.object({ name: z.string() }).strict();

describe("parseStructuredOutput", () => {
  it("parses valid JSON matching the schema", () => {
    const result = parseStructuredOutput(schema, '{"name":"Kai"}');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Kai");
    }
  });

  it("reports a schema mismatch as a failure with an error message", () => {
    const result = parseStructuredOutput(schema, '{"name":123}');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.length).toBeGreaterThan(0);
    }
  });

  it("reports invalid JSON as a failure", () => {
    const result = parseStructuredOutput(schema, "not json");
    expect(result).toEqual({ success: false, error: "Invalid JSON from model" });
  });

  it("builds a repair prompt containing the error and original text", () => {
    const prompt = buildRepairPrompt('{"a":1}', "some error");
    expect(prompt).toContain("some error");
    expect(prompt).toContain('{"a":1}');
  });
});
