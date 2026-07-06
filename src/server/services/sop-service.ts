import { findSopByTopic } from "@/server/data/repositories/stadium-repository";
import type { SopResult } from "@/types/stadium";

export function getSOP(topic: string): SopResult | null {
  const normalized = topic.trim().toLowerCase();
  const aliases: Record<string, string> = {
    "lost child": "lost_child",
    "medical emergency": "medical_emergency",
    "crowd surge": "crowd_surge",
  };
  const key = aliases[normalized] ?? normalized.replace(/\s+/g, "_");
  return findSopByTopic(key);
}
