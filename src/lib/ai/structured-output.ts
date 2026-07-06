import * as z from "zod";

export function parseStructuredOutput<T>(
  schema: z.ZodType<T>,
  raw: string,
): { success: true; data: T } | { success: false; error: string } {
  try {
    const json: unknown = JSON.parse(raw);
    const parsed = schema.safeParse(json);
    if (parsed.success) {
      return { success: true, data: parsed.data };
    }
    return { success: false, error: parsed.error.message };
  } catch {
    return { success: false, error: "Invalid JSON from model" };
  }
}

export function buildRepairPrompt(original: string, error: string): string {
  return `Fix this JSON to match the schema. Error: ${error}\nJSON:\n${original}`;
}
