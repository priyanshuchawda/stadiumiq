const GROUNDING_KEYWORDS = [
  "transport",
  "transit",
  "metro",
  "subway",
  "shuttle",
  "airport",
  "rideshare",
  "uber",
  "lyft",
  "train",
  "bus",
  "traffic",
  "delay",
  "schedule",
  "real-time",
  "realtime",
  "live",
  "news",
  "weather",
  "greenest",
  "carbon",
  "eco",
  "sustainable",
  "parking",
  "home",
  "downtown",
  "leave",
  "after the match",
];

export function detectGroundingIntent(message: string, topic?: string): boolean {
  if (topic === "transport") {
    return true;
  }
  const normalized = message.toLowerCase();
  return GROUNDING_KEYWORDS.some((keyword) => normalized.includes(keyword));
}
