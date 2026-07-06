/** Compile-time exhaustiveness guard for discriminated unions. */
export function checkExhaustive(value: never): never {
  throw new Error(`Unhandled case: ${String(value)}`);
}
