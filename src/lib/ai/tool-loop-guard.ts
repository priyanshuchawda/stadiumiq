/**
 * Safety rails for the tool-calling loop (inspired by Gemini CLI loop detection
 * and Claude Code's max-turn circuit breaker). Prevents runaway cost / infinite
 * loops when the model repeatedly requests the same tool with the same args.
 */

export const MAX_TOOL_TURNS = 5;
export const MAX_REPEATED_CALLS = 2;

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`);
  return `{${entries.join(",")}}`;
}

export function toolCallSignature(name: string, args: unknown): string {
  return `${name}:${stableStringify(args ?? {})}`;
}

export type ToolLoopGuard = {
  /** Records a call; returns true when this exact call has repeated too often. */
  isRepeating: (name: string, args: unknown) => boolean;
};

export function createToolLoopGuard(
  maxRepeated: number = MAX_REPEATED_CALLS,
): ToolLoopGuard {
  const counts = new Map<string, number>();
  return {
    isRepeating(name, args) {
      const signature = toolCallSignature(name, args);
      const next = (counts.get(signature) ?? 0) + 1;
      counts.set(signature, next);
      return next > maxRepeated;
    },
  };
}
