import * as z from "zod";
import { UserContextSchema } from "@/lib/validation/schemas/stadium";

export const ChatRequestSchema = z
  .object({
    message: z.string().min(1).max(2000),
    context: UserContextSchema,
  })
  .strict();

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const VisionRequestSchema = z
  .object({
    prompt: z
      .string()
      .min(1)
      .max(1000)
      .default("Translate and explain this sign for a stadium visitor."),
    context: UserContextSchema,
  })
  .strict();

export type VisionRequest = z.infer<typeof VisionRequestSchema>;

export const ALLOWED_IMAGE_MIMES = ["image/png", "image/jpeg", "image/webp"] as const;

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
