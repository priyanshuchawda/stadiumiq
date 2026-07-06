import type { UserContext } from "@/types/stadium";
import type { ValidatedUserContext } from "@/lib/validation/schemas/stadium";

function normalizeLocation(
  location: ValidatedUserContext["location"],
): UserContext["location"] {
  if (!location) {
    return undefined;
  }
  return {
    ...(location.gate ? { gate: location.gate } : {}),
    ...(location.section ? { section: location.section } : {}),
  };
}

export function toUserContext(context: ValidatedUserContext): UserContext {
  return {
    persona: context.persona,
    language: context.language,
    accessibility: context.accessibility,
    location: normalizeLocation(context.location),
    ...(context.ticketType ? { ticketType: context.ticketType } : {}),
    ...(context.minutesToKickoff !== undefined
      ? { minutesToKickoff: context.minutesToKickoff }
      : {}),
    ...(context.weather ? { weather: context.weather } : {}),
  };
}
