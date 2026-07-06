export type AppErrorKind =
  | "validation"
  | "payload_too_large"
  | "rate_limit"
  | "not_found"
  | "provider"
  | "internal";

const STATUS_BY_KIND: Record<AppErrorKind, number> = {
  validation: 400,
  payload_too_large: 413,
  rate_limit: 429,
  not_found: 404,
  provider: 502,
  internal: 500,
};

const SAFE_MESSAGE_BY_KIND: Record<AppErrorKind, string> = {
  validation: "Invalid request.",
  payload_too_large: "Request body is too large.",
  rate_limit: "Too many requests. Please wait and try again.",
  not_found: "The requested resource was not found.",
  provider: "The AI service is temporarily unavailable. Please try again.",
  internal: "Something went wrong. Please try again.",
};

export class AppError extends Error {
  readonly kind: AppErrorKind;

  constructor(kind: AppErrorKind, message?: string) {
    super(message ?? SAFE_MESSAGE_BY_KIND[kind]);
    this.name = "AppError";
    this.kind = kind;
  }
}

export function statusForKind(kind: AppErrorKind): number {
  return STATUS_BY_KIND[kind];
}

export function safeMessageForKind(kind: AppErrorKind): string {
  return SAFE_MESSAGE_BY_KIND[kind];
}
