import { findRoute } from "@/server/data/routing/find-route";
import type { RouteResult } from "@/types/stadium";

export type GetRouteInput = {
  from: string;
  to: string;
  stepFree: boolean;
  avoidStairs: boolean;
};

export function getRoute(input: GetRouteInput): RouteResult | null {
  const stepFree = input.stepFree || input.avoidStairs;
  return findRoute(input.from, input.to, { stepFree });
}
