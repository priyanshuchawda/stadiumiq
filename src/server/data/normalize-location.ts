import { LOCATION_ALIASES } from "@/server/data/seeds/stadium-graph";

export function normalizeLocationId(input: string): string {
  const trimmed = input.trim().toLowerCase();
  const alias = LOCATION_ALIASES[trimmed];
  if (alias) {
    return alias;
  }
  return trimmed.replace(/\s+/g, "-");
}
