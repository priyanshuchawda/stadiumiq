import { assertAllowedOrigin } from "@/server/http/origin-check";
import { mapErrorToResponse } from "@/server/http/error-response";
import {
  enforceRateLimit,
  rateLimitJsonResponse,
} from "@/server/http/rate-limit-guard";
import {
  ALLOWED_IMAGE_MIMES,
  MAX_IMAGE_BYTES,
  VisionRequestSchema,
} from "@/lib/validation/schemas/chat";
import { toUserContext } from "@/lib/validation/to-user-context";
import { analyzeVisionImage } from "@/server/services/vision-service";

export const runtime = "nodejs";
export const maxDuration = 30;

const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

function isAllowedMime(mime: string): mime is (typeof ALLOWED_IMAGE_MIMES)[number] {
  return (ALLOWED_IMAGE_MIMES as readonly string[]).includes(mime);
}

function isUploadTooLarge(request: Request): boolean {
  const declared = Number(request.headers.get("content-length"));
  return (
    Number.isFinite(declared) && declared > MAX_IMAGE_BYTES + MULTIPART_OVERHEAD_BYTES
  );
}

type ParsedVisionForm =
  | {
      ok: true;
      file: File;
      prompt?: string;
      context: ReturnType<typeof toUserContext>;
    }
  | { ok: false; status: number; message: string };

async function parseVisionForm(request: Request): Promise<ParsedVisionForm> {
  const form = await request.formData();
  const file = form.get("image");
  const contextRaw = form.get("context");
  const promptRaw = form.get("prompt");

  if (!(file instanceof File)) {
    return { ok: false, status: 400, message: "Image file is required." };
  }
  if (!isAllowedMime(file.type)) {
    return { ok: false, status: 400, message: "Unsupported image type." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, status: 400, message: "Image too large." };
  }

  let contextJson: unknown;
  try {
    contextJson = JSON.parse(typeof contextRaw === "string" ? contextRaw : "{}");
  } catch {
    return { ok: false, status: 400, message: "Invalid context JSON." };
  }

  const parsed = VisionRequestSchema.safeParse({
    prompt: typeof promptRaw === "string" ? promptRaw : undefined,
    context: contextJson,
  });

  if (!parsed.success) {
    return { ok: false, status: 400, message: "Invalid vision request." };
  }

  return {
    ok: true,
    file,
    ...(parsed.data.prompt !== undefined ? { prompt: parsed.data.prompt } : {}),
    context: toUserContext(parsed.data.context),
  };
}

export async function POST(request: Request): Promise<Response> {
  try {
    assertAllowedOrigin(request);
    return await handleVisionRequest(request);
  } catch (error) {
    return mapErrorToResponse(error, { route: "POST /api/vision" });
  }
}

async function handleVisionRequest(request: Request): Promise<Response> {
  const rate = enforceRateLimit(request);
  if (!rate.ok) {
    return rateLimitJsonResponse(rate);
  }
  if (isUploadTooLarge(request)) {
    return Response.json({ error: "Upload too large." }, { status: 413 });
  }

  const parsed = await parseVisionForm(request);
  if (!parsed.ok) {
    return Response.json({ error: parsed.message }, { status: parsed.status });
  }

  const result = await analyzeVisionImage({
    file: parsed.file,
    request: {
      prompt: parsed.prompt ?? "Describe this stadium image for the visitor.",
      context: parsed.context,
    },
  });

  return Response.json({ answer: result.answer, fallback: result.fallback });
}
