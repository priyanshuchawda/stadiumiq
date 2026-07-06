import type { MobilityLevel, Persona, TicketType } from "@/types/domain";

export type UserLocation = {
  gate?: string;
  section?: string;
};

export type UserAccessibility = {
  mobility: MobilityLevel;
  lowVision: boolean;
  sensorySensitive: boolean;
};

export type UserWeather = {
  tempC: number;
  condition: string;
};

export type UserContext = {
  persona: Persona;
  language: string;
  accessibility: UserAccessibility;
  location?: UserLocation;
  ticketType?: TicketType;
  minutesToKickoff?: number;
  weather?: UserWeather;
};

export type RouteStep = {
  instruction: string;
  from: string;
  to: string;
  stepFree: boolean;
  estimatedMinutes: number;
};

export type RouteResult = {
  from: string;
  to: string;
  stepFree: boolean;
  totalMinutes: number;
  steps: RouteStep[];
};

export type CrowdStatus = {
  area: string;
  density: import("@/types/domain").DensityLevel;
  waitMinutes: number;
  recommendation: string;
};

export type TransportOption = {
  mode: import("@/types/domain").TransportMode;
  destination: string;
  durationMinutes: number;
  carbonGrams: number;
  ecoScore: number;
  description: string;
};

export type Amenity = {
  id: string;
  type: import("@/types/domain").AmenityType;
  name: string;
  nearSection: string;
  gate: string;
  accessible: boolean;
  dietaryTags: string[];
};

export type SopStep = {
  order: number;
  action: string;
  contact?: string;
};

export type SopResult = {
  topic: string;
  title: string;
  steps: SopStep[];
};

export type GateRecommendation = {
  recommendedGate: string;
  reason: string;
  alternatives: string[];
};
