import { AppError } from "@/lib/errors/app-error";

/** Default cap for JSON request bodies (chat, grounded). Vision uploads use their own limit. */
export const DEFAULT_MAX_BODY_BYTES = 32 * 1024;

/**
 * Reads and parses a JSON request body while enforcing a hard byte cap.
 * Rejects oversized payloads before parsing to protect against abuse/DoS.
 */
export async function readJsonWithLimit(
  request: Request,
  maxBytes: number = DEFAULT_MAX_BODY_BYTES,
): Promise<unknown> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new AppError("payload_too_large");
  }

  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > maxBytes) {
    throw new AppError("payload_too_large");
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new AppError("validation", "Invalid JSON body.");
  }
}
