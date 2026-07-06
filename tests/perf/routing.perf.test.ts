import { describe, expect, it } from "vitest";
import { findRoute } from "@/server/data/routing/find-route";
import { recommendGate } from "@/server/services/crowd-service";
import type { UserContext } from "@/types/stadium";

const fanContext: UserContext = {
  persona: "fan",
  language: "en",
  accessibility: { mobility: "none", lowVision: false, sensorySensitive: false },
};

// Generous ceilings: these guard against accidental O(n^2)/allocation regressions
// in the deterministic engine, not absolute machine speed. CI-safe headroom.
const ROUTE_ITERATIONS = 5_000;
const ROUTE_BUDGET_MS = 750;
const GATE_ITERATIONS = 5_000;
const GATE_BUDGET_MS = 750;

function measure(iterations: number, run: (index: number) => unknown): number {
  const start = performance.now();
  for (let index = 0; index < iterations; index += 1) {
    run(index);
  }
  return performance.now() - start;
}

describe("routing performance baselines", () => {
  it(`findRoute stays under ${ROUTE_BUDGET_MS}ms for ${ROUTE_ITERATIONS} runs`, () => {
    const elapsed = measure(ROUTE_ITERATIONS, () =>
      findRoute("gate-c", "section-112", { stepFree: false }),
    );
    expect(findRoute("gate-c", "section-112", { stepFree: false })).not.toBeNull();
    expect(elapsed).toBeLessThan(ROUTE_BUDGET_MS);
  });

  it(`recommendGate stays under ${GATE_BUDGET_MS}ms for ${GATE_ITERATIONS} runs`, () => {
    const now = Date.parse("2026-07-07T12:00:00Z");
    const elapsed = measure(GATE_ITERATIONS, () => recommendGate(fanContext, now));
    expect(recommendGate(fanContext, now).recommendedGate).toBeTruthy();
    expect(elapsed).toBeLessThan(GATE_BUDGET_MS);
  });
});
