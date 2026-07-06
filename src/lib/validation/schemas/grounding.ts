import * as z from "zod";
import { UserContextSchema } from "@/lib/validation/schemas/stadium";

export const GroundedRequestSchema = z
  .object({
    message: z.string().min(1).max(2000),
    context: UserContextSchema,
  })
  .strict();

export type GroundedRequestBody = z.infer<typeof GroundedRequestSchema>;
