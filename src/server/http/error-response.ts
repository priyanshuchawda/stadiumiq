import "server-only";
import { createCorrelationId, logger } from "@/lib/logging/logger";
import {
  AppError,
  safeMessageForKind,
  statusForKind,
  type AppErrorKind,
} from "@/lib/errors/app-error";

type ErrorResponseOptions = {
  route: string;
  retryAfterSeconds?: number;
};

export function mapErrorToResponse(
  error: unknown,
  options: ErrorResponseOptions,
): Response {
  const correlationId = createCorrelationId();
  const kind: AppErrorKind = error instanceof AppError ? error.kind : "internal";
  const status = statusForKind(kind);

  logger.error(
    {
      correlationId,
      route: options.route,
      kind,
      err:
        error instanceof Error ? { name: error.name, message: error.message } : error,
    },
    "request_failed",
  );

  const headers: Record<string, string> = { "x-correlation-id": correlationId };
  if (kind === "rate_limit" && options.retryAfterSeconds) {
    headers["Retry-After"] = String(options.retryAfterSeconds);
  }

  return Response.json(
    { error: safeMessageForKind(kind), correlationId },
    { status, headers },
  );
}
