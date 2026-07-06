import { checkRateLimit } from "@/server/security/rate-limit";
import {
  ALLOWED_IMAGE_MIMES,
  MAX_IMAGE_BYTES,
  VisionRequestSchema,
} from "@/lib/validation/schemas/chat";
import { toUserContext } from "@/lib/validation/to-user-context";
import { analyzeVisionImage } from "@/server/services/vision-service";

function isAllowedMime(mime: string): mime is (typeof ALLOWED_IMAGE_MIMES)[number] {
  return (ALLOWED_IMAGE_MIMES as readonly string[]).includes(mime);
}

export async function POST(request: Request): Promise<Response> {
  const clientKey = request.headers.get("x-forwarded-for") ?? "local";
  const rate = checkRateLimit(clientKey);
  if (!rate.allowed) {
    return Response.json(
      { error: "Too many requests." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  const form = await request.formData();
  const file = form.get("image");
  const contextRaw = form.get("context");
  const promptRaw = form.get("prompt");

  if (!(file instanceof File)) {
    return Response.json({ error: "Image file is required." }, { status: 400 });
  }
  if (!isAllowedMime(file.type)) {
    return Response.json({ error: "Unsupported image type." }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return Response.json({ error: "Image too large." }, { status: 400 });
  }

  let contextJson: unknown;
  try {
    contextJson = JSON.parse(typeof contextRaw === "string" ? contextRaw : "{}");
  } catch {
    return Response.json({ error: "Invalid context JSON." }, { status: 400 });
  }

  const parsed = VisionRequestSchema.safeParse({
    prompt: typeof promptRaw === "string" ? promptRaw : undefined,
    context: contextJson,
  });

  if (!parsed.success) {
    return Response.json({ error: "Invalid vision request." }, { status: 400 });
  }

  const result = await analyzeVisionImage({
    file,
    request: {
      prompt: parsed.data.prompt,
      context: toUserContext(parsed.data.context),
    },
  });

  return Response.json({ answer: result.answer, fallback: result.fallback });
}
