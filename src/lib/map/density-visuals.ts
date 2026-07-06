import type { DensityLevel } from "@/types/domain";

export type DensityVisual = {
  patternId: string;
  label: string;
  shortLabel: string;
};

const DENSITY_VISUALS: Record<DensityLevel, DensityVisual> = {
  low: { patternId: "density-low", label: "Low density", shortLabel: "Low" },
  moderate: {
    patternId: "density-moderate",
    label: "Moderate density",
    shortLabel: "Moderate",
  },
  high: { patternId: "density-high", label: "High density", shortLabel: "High" },
  critical: {
    patternId: "density-critical",
    label: "Critical density",
    shortLabel: "Critical",
  },
};

export function getDensityVisual(level: DensityLevel): DensityVisual {
  return DENSITY_VISUALS[level];
}

export function formatCrowdAria(
  label: string,
  density: DensityLevel,
  waitMinutes: number,
): string {
  const visual = getDensityVisual(density);
  return `${label}: ${visual.label}, ${waitMinutes} minute wait`;
}
