import "server-only";
import pino from "pino";

const REDACT_PATHS = [
  "apiKey",
  "GEMINI_API_KEY",
  "authorization",
  "headers.authorization",
  "headers.cookie",
  "*.apiKey",
  "*.password",
  "*.token",
];

export const logger = pino({
  level: process.env["LOG_LEVEL"] ?? "info",
  redact: { paths: REDACT_PATHS, censor: "[redacted]" },
  base: { app: "stadiumiq" },
});

export type LogContext = Record<string, unknown> & { correlationId: string };

export function createCorrelationId(): string {
  return globalThis.crypto.randomUUID();
}
