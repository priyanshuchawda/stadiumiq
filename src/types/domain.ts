export const PERSONAS = ["fan", "volunteer", "staff", "organizer"] as const;

export type Persona = (typeof PERSONAS)[number];

export const MOBILITY_LEVELS = ["none", "wheelchair", "limited"] as const;

export type MobilityLevel = (typeof MOBILITY_LEVELS)[number];

export const TICKET_TYPES = ["general", "accessible", "hospitality"] as const;

export type TicketType = (typeof TICKET_TYPES)[number];

export const DENSITY_LEVELS = ["low", "moderate", "high", "critical"] as const;

export type DensityLevel = (typeof DENSITY_LEVELS)[number];

export const AMENITY_TYPES = [
  "toilet",
  "accessible_toilet",
  "food",
  "water_refill",
  "first_aid",
  "prayer_room",
  "sensory_room",
  "recycling",
] as const;

export type AmenityType = (typeof AMENITY_TYPES)[number];

export const TRANSPORT_MODES = [
  "metro",
  "shuttle",
  "rideshare",
  "parking",
  "walk",
] as const;

export type TransportMode = (typeof TRANSPORT_MODES)[number];
