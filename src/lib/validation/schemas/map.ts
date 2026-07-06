import * as z from "zod";
import { MOBILITY_LEVELS } from "@/types/domain";

export const MapCrowdQuerySchema = z
  .object({
    mobility: z.enum(MOBILITY_LEVELS).default("none"),
    language: z.string().min(2).max(10).default("en"),
  })
  .strict();

export const MapRouteRequestSchema = z
  .object({
    from: z.string().min(1).max(32),
    to: z.string().min(1).max(32),
    stepFree: z.boolean().default(false),
  })
  .strict();

export type MapCrowdQuery = z.infer<typeof MapCrowdQuerySchema>;
export type MapRouteRequest = z.infer<typeof MapRouteRequestSchema>;
