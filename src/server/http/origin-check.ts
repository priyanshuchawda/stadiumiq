import { AppError } from "@/lib/errors/app-error";

const DEFAULT_ALLOWED = new Set(["http://localhost:3000", "https://localhost:3000"]);

function readAllowedOrigins(): Set<string> {
  const raw = process.env["ALLOWED_ORIGINS"];
  if (!raw || raw.trim().length === 0) {
    return DEFAULT_ALLOWED;
  }
  return new Set(
    raw
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
}

function deriveRequestOrigin(request: Request): string | null {
  const origin = request.headers.get("origin");
  if (origin) {
    return origin;
  }
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  if (host) {
    return `${proto}://${host.split(",")[0]?.trim()}`;
  }
  return null;
}

/**
 * Rejects cross-origin POSTs to expensive AI routes unless the Origin (or
 * derived same-site origin) is on the allowlist. Same-origin navigations without
 * an Origin header are allowed.
 */
export function assertAllowedOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) {
    return;
  }
  const allowed = readAllowedOrigins();
  const derived = deriveRequestOrigin(request);
  if (allowed.has(origin) || (derived && allowed.has(derived))) {
    return;
  }
  throw new AppError("validation", "Cross-origin request not allowed.");
}
