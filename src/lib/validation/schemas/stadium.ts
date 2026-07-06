import * as z from "zod";
import { AMENITY_TYPES, MOBILITY_LEVELS, PERSONAS, TICKET_TYPES } from "@/types/domain";

export const UserContextSchema = z
  .object({
    persona: z.enum(PERSONAS),
    language: z.string().min(2).max(10),
    accessibility: z.object({
      mobility: z.enum(MOBILITY_LEVELS),
      lowVision: z.boolean(),
      sensorySensitive: z.boolean(),
    }),
    location: z
      .object({
        gate: z.string().max(8).optional(),
        section: z.string().max(16).optional(),
      })
      .optional(),
    ticketType: z.enum(TICKET_TYPES).optional(),
    minutesToKickoff: z.number().int().min(0).max(600).optional(),
    weather: z
      .object({
        tempC: z.number().min(-30).max(55),
        condition: z.string().max(64),
      })
      .optional(),
  })
  .strict();

export type ValidatedUserContext = z.infer<typeof UserContextSchema>;

export const RouteRequestSchema = z
  .object({
    from: z.string().min(1).max(32),
    to: z.string().min(1).max(32),
    stepFree: z.boolean().default(false),
    avoidStairs: z.boolean().default(false),
  })
  .strict();

export const CrowdRequestSchema = z
  .object({
    area: z.string().min(1).max(32),
  })
  .strict();

export const TransportRequestSchema = z
  .object({
    destination: z.string().min(1).max(64),
    ecoPriority: z.boolean().default(false),
  })
  .strict();

export const AmenityRequestSchema = z
  .object({
    type: z.enum(AMENITY_TYPES),
    nearSection: z.string().max(16).optional(),
  })
  .strict();

export const SopRequestSchema = z
  .object({
    topic: z.string().min(1).max(64),
  })
  .strict();
