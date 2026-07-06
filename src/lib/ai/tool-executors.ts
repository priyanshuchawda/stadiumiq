import * as z from "zod";
import { AMENITY_TYPES } from "@/types/domain";
import { getAmenities } from "@/server/services/amenity-service";
import { getCrowdStatus } from "@/server/services/crowd-service";
import { getRoute } from "@/server/services/route-service";
import { getSOP } from "@/server/services/sop-service";
import { getTransportOptions } from "@/server/services/transport-service";
import type { UserContext } from "@/types/stadium";

// `.strict()` rejects unknown/privileged fields the model may hallucinate,
// keeping tool inputs to exactly the declared surface (defense-in-depth).
const RouteArgsSchema = z
  .object({
    from: z.string().min(1).max(120),
    to: z.string().min(1).max(120),
    stepFree: z.boolean().optional(),
    avoidStairs: z.boolean().optional(),
  })
  .strict();

const CrowdArgsSchema = z.object({ area: z.string().min(1).max(120) }).strict();

const TransportArgsSchema = z
  .object({
    destination: z.string().min(1).max(120),
    ecoPriority: z.boolean().optional(),
  })
  .strict();

const AmenityArgsSchema = z
  .object({
    type: z.enum(AMENITY_TYPES),
    nearSection: z.string().min(1).max(120).optional(),
  })
  .strict();

const SopArgsSchema = z.object({ topic: z.string().min(1).max(120) }).strict();

export type ToolError = { error: string };

function toolError(name: string, error: z.ZodError): ToolError {
  const detail = error.issues
    .map((issue) => `${issue.path.join(".") || "arguments"}: ${issue.message}`)
    .join("; ");
  return { error: `Invalid arguments for ${name}: ${detail}` };
}

function runTool<T>(
  name: string,
  schema: z.ZodType<T>,
  args: unknown,
  run: (data: T) => unknown,
): unknown {
  const parsed = schema.safeParse(args);
  if (!parsed.success) {
    return toolError(name, parsed.error);
  }
  return run(parsed.data);
}

type ToolHandler = (args: unknown, context: UserContext) => unknown;

// Dispatch table: each tool validates its args (strict schema) then runs. A
// malformed call returns a model-readable error instead of throwing.
const TOOL_HANDLERS: Record<string, ToolHandler> = {
  getRoute: (args, context) =>
    runTool("getRoute", RouteArgsSchema, args, (data) =>
      getRoute({
        from: data.from,
        to: data.to,
        stepFree: data.stepFree ?? context.accessibility.mobility === "wheelchair",
        avoidStairs: data.avoidStairs ?? false,
      }),
    ),
  getCrowdStatus: (args) =>
    runTool("getCrowdStatus", CrowdArgsSchema, args, (data) =>
      getCrowdStatus(data.area),
    ),
  getTransportOptions: (args) =>
    runTool("getTransportOptions", TransportArgsSchema, args, (data) =>
      getTransportOptions({
        destination: data.destination,
        ecoPriority: data.ecoPriority ?? false,
      }),
    ),
  getAmenities: (args, context) =>
    runTool("getAmenities", AmenityArgsSchema, args, (data) =>
      getAmenities({
        type: data.type,
        ...(data.nearSection ? { nearSection: data.nearSection } : {}),
        context,
      }),
    ),
  getSOP: (args) =>
    runTool("getSOP", SopArgsSchema, args, (data) => getSOP(data.topic)),
};

/**
 * Executes a model-requested tool call. Arguments are validated with `safeParse`
 * so a malformed call returns a machine-readable error the model can read from
 * the function response and self-correct — instead of throwing and aborting the
 * turn.
 */
export async function executeToolCall(
  name: string,
  args: unknown,
  context: UserContext,
): Promise<unknown> {
  const handler = TOOL_HANDLERS[name];
  if (!handler) {
    return { error: `Unknown tool: ${name}` };
  }
  return handler(args, context);
}
