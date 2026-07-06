import type { UserContext } from "@/types/stadium";

export function buildKaiFallbackAnswer(context: UserContext): string {
  if (context.accessibility.mobility === "wheelchair") {
    return "Use Gate C for step-free entry. Head to the North Concourse accessible ramp toward Section 112. The nearest accessible restroom is on the North Concourse.";
  }
  return "Gate C currently has the shortest wait. Follow concourse signage to your section and allow extra time near Gate B.";
}
