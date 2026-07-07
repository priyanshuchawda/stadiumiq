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

/** Origin the request was actually served on, honoring reverse-proxy headers. */
function deriveSelfOrigin(request: Request): string | null {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) {
    return null;
  }
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host.split(",")[0]?.trim()}`;
}

/**
 * Rejects cross-origin POSTs to expensive AI routes. Allowed when the Origin
 * header is on the allowlist, or when it matches the origin the request was
 * served on (same-site behind a proxy/CDN, e.g. Vercel), or when no Origin
 * header is present (same-origin navigation).
 */
export function assertAllowedOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) {
    return;
  }
  if (readAllowedOrigins().has(origin)) {
    return;
  }
  if (origin === deriveSelfOrigin(request)) {
    return;
  }
  throw new AppError("validation", "Cross-origin request not allowed.");
}
