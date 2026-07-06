import * as z from "zod";

/**
 * Removes Markdown code fences the model sometimes wraps JSON in
 * (```json ... ``` or ``` ... ```), returning the inner payload. Falls back to
 * the trimmed original when no fence is present.
 */
export function stripJsonFences(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i);
  if (fenced?.[1] !== undefined) {
    return fenced[1].trim();
  }
  return trimmed;
}

export function parseStructuredOutput<T>(
  schema: z.ZodType<T>,
  raw: string,
): { success: true; data: T } | { success: false; error: string } {
  try {
    const json: unknown = JSON.parse(stripJsonFences(raw));
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
