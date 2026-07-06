import * as z from "zod";
import { AMENITY_TYPES } from "@/types/domain";
import { getAmenities } from "@/server/services/amenity-service";
import { getCrowdStatus } from "@/server/services/crowd-service";
import { getRoute } from "@/server/services/route-service";
import { getSOP } from "@/server/services/sop-service";
import { getTransportOptions } from "@/server/services/transport-service";
import type { UserContext } from "@/types/stadium";

const RouteArgsSchema = z.object({
  from: z.string(),
  to: z.string(),
  stepFree: z.boolean().optional(),
  avoidStairs: z.boolean().optional(),
});

const CrowdArgsSchema = z.object({ area: z.string() });

const TransportArgsSchema = z.object({
  destination: z.string(),
  ecoPriority: z.boolean().optional(),
});

const AmenityArgsSchema = z.object({
  type: z.enum(AMENITY_TYPES),
  nearSection: z.string().optional(),
});

const SopArgsSchema = z.object({ topic: z.string() });

export async function executeToolCall(
  name: string,
  args: unknown,
  context: UserContext,
): Promise<unknown> {
  switch (name) {
    case "getRoute": {
      const parsed = RouteArgsSchema.parse(args);
      return getRoute({
        from: parsed.from,
        to: parsed.to,
        stepFree: parsed.stepFree ?? context.accessibility.mobility === "wheelchair",
        avoidStairs: parsed.avoidStairs ?? false,
      });
    }
    case "getCrowdStatus":
      return getCrowdStatus(CrowdArgsSchema.parse(args).area);
    case "getTransportOptions": {
      const parsed = TransportArgsSchema.parse(args);
      return getTransportOptions({
        destination: parsed.destination,
        ecoPriority: parsed.ecoPriority ?? false,
      });
    }
    case "getAmenities": {
      const parsed = AmenityArgsSchema.parse(args);
      return getAmenities({
        type: parsed.type,
        ...(parsed.nearSection ? { nearSection: parsed.nearSection } : {}),
        context,
      });
    }
    case "getSOP":
      return getSOP(SopArgsSchema.parse(args).topic);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
