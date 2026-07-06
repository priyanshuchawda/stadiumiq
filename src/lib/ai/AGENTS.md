# AI layer (`src/lib/ai/`)

- Use `generateContentWithFallback` / `generateContentStreamWithFallback` — never call Gemini directly.
- Sanitize all user/model text with `stripUnsafeUnicode` before prompts or SSE.
- Tool args: validate with Zod in `tool-executors.ts`; never trust model JSON blindly.
- Caches: `AsyncCache` for in-flight dedup; clear `*ForTests()` helpers in unit tests.
- Streaming chat: `streamKai` reuses tool-loop final text — do not add a redundant generate call.
