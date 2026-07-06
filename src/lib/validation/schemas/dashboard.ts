import * as z from "zod";

export const SentimentEntrySchema = z
  .object({
    language: z.string().min(2).max(10),
    summary: z.string().min(1).max(500),
    tone: z.enum(["positive", "mixed", "concerned"]),
  })
  .strict();

export const DashboardAiOutputSchema = z
  .object({
    incidentSummary: z.string().min(1).max(1000),
    priorityActions: z.array(z.string().min(1).max(200)).min(1).max(6),
    sentimentDigest: z.array(SentimentEntrySchema).min(1).max(6),
  })
  .strict();

export type DashboardAiOutput = z.infer<typeof DashboardAiOutputSchema>;
