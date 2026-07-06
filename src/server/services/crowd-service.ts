import { listCrowdAreas } from "@/server/data/repositories/stadium-repository";
import type { DensityLevel } from "@/types/domain";
import type { CrowdStatus, GateRecommendation, UserContext } from "@/types/stadium";

const DENSITY_ORDER: DensityLevel[] = ["low", "moderate", "high", "critical"];
const STEP_FREE_GATES = new Set(["gate-a", "gate-c"]);

function bumpDensity(level: DensityLevel, offset: number): DensityLevel {
  const index = DENSITY_ORDER.indexOf(level);
  const next = Math.min(DENSITY_ORDER.length - 1, Math.max(0, index + offset));
  return DENSITY_ORDER[next] ?? level;
}

function simulateOffset(areaId: string, now: number): number {
  const minuteSlot = Math.floor(now / 120_000);
  const hash = areaId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return (minuteSlot + hash) % 3 === 0 ? 1 : 0;
}

export function getCrowdStatus(area: string, now = Date.now()): CrowdStatus | null {
  const normalized = area.trim().toLowerCase().replace(/\s+/g, "-");
  const seed = listCrowdAreas().find((item) => item.areaId === normalized);
  if (!seed) {
    return null;
  }

  const offset = simulateOffset(seed.areaId, now);
  const density = bumpDensity(seed.baseDensity, offset);
  const waitMinutes = seed.baseWaitMinutes + offset * 2;

  const recommendation =
    density === "critical"
      ? "Avoid this area; use an alternate gate."
      : density === "high"
        ? "Expect delays; consider another entrance."
        : "Flow is manageable.";

  return { area: seed.label, density, waitMinutes, recommendation };
}

type GateScore = {
  gateId: string;
  label: string;
  wait: number;
  score: number;
};

function scoreGates(
  gates: ReturnType<typeof listCrowdAreas>,
  needsStepFree: boolean,
  now: number,
): GateScore[] {
  return gates
    .map((gate) => {
      const status = getCrowdStatus(gate.areaId, now);
      const stepFree = STEP_FREE_GATES.has(gate.areaId);
      const penalty = needsStepFree && !stepFree ? 100 : 0;
      const wait = status?.waitMinutes ?? gate.baseWaitMinutes;
      return { gateId: gate.areaId, label: gate.label, wait, score: wait + penalty };
    })
    .sort((a, b) => a.score - b.score);
}

function buildGateReason(best: GateScore | undefined, needsStepFree: boolean): string {
  const label = best?.label ?? "Gate C";
  const wait = best?.wait ?? 0;
  if (needsStepFree) {
    return `${label} has the shortest step-free wait (${wait} min).`;
  }
  return `${label} currently has the lowest wait (${wait} min).`;
}

export function recommendGate(
  context: UserContext,
  now = Date.now(),
): GateRecommendation {
  const gates = listCrowdAreas().filter((area) => area.areaId.startsWith("gate-"));
  const needsStepFree = context.accessibility.mobility === "wheelchair";
  const scored = scoreGates(gates, needsStepFree, now);
  const best = scored[0];
  const alternatives = scored.slice(1, 3).map((item) => item.label);

  return {
    recommendedGate: best?.label ?? "Gate C",
    reason: buildGateReason(best, needsStepFree),
    alternatives,
  };
}
