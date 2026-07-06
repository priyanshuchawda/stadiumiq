import { describe, expect, it } from "vitest";
import * as z from "zod";
import { parseStructuredOutput } from "@/lib/ai/structured-output";

const schema = z.object({ title: z.string() });

describe("parseStructuredOutput", () => {
  it("parses valid JSON", () => {
    const result = parseStructuredOutput(schema, '{"title":"Incident"}');
    expect(result.success).toBe(true);
  });

  it("rejects invalid JSON", () => {
    const result = parseStructuredOutput(schema, "not-json");
    expect(result.success).toBe(false);
  });
});
