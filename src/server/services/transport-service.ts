import { listTransportTemplates } from "@/server/data/repositories/stadium-repository";
import type { TransportOption } from "@/types/stadium";

export type GetTransportOptionsInput = {
  destination: string;
  ecoPriority: boolean;
};

export function getTransportOptions(
  input: GetTransportOptionsInput,
): TransportOption[] {
  const options = listTransportTemplates().map((template) => ({
    ...template,
    destination: input.destination,
  }));

  if (input.ecoPriority) {
    return [...options].sort((a, b) => b.ecoScore - a.ecoScore);
  }

  return [...options].sort((a, b) => a.durationMinutes - b.durationMinutes);
}

export function getGreenestOption(
  input: GetTransportOptionsInput,
): TransportOption | null {
  const sorted = getTransportOptions({ ...input, ecoPriority: true });
  return sorted[0] ?? null;
}
