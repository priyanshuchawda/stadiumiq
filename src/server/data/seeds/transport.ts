import type { TransportOption } from "@/types/stadium";

export const TRANSPORT_SEED: Omit<TransportOption, "destination">[] = [
  {
    mode: "metro",
    durationMinutes: 25,
    carbonGrams: 420,
    ecoScore: 92,
    description: "NJ Transit to Secaucus, transfer to AirTrain.",
  },
  {
    mode: "shuttle",
    durationMinutes: 35,
    carbonGrams: 890,
    ecoScore: 68,
    description: "Official FIFA shuttle to downtown hubs.",
  },
  {
    mode: "rideshare",
    durationMinutes: 18,
    carbonGrams: 2100,
    ecoScore: 35,
    description: "Curbside pickup at Lot K rideshare zone.",
  },
  {
    mode: "walk",
    durationMinutes: 45,
    carbonGrams: 0,
    ecoScore: 100,
    description: "Pedestrian path to Meadowlands Station.",
  },
];
