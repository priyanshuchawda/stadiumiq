# DECISIONS.md — Architecture Decision Log

> Append-only log of significant technical decisions (ADRs) and any deviations from [`plan.md`](./plan.md) / [`rules.md`](./rules.md). The AI coder MUST add an entry whenever it makes an architectural choice, swaps a library, or deviates from the plan. Keep entries short: Context → Decision → Consequences.

Format:

```
## ADR-NNN: <title>
- Date: YYYY-MM-DD
- Status: Proposed | Accepted | Superseded by ADR-XXX
- Context: why a decision was needed
- Decision: what we chose
- Consequences: trade-offs, follow-ups
```

---

## ADR-001: Product concept — StadiumIQ role-aware GenAI copilot

- Date: 2026-07-06
- Status: Accepted
- Context: The problem statement asks for a GenAI solution improving stadium ops & fan experience for four personas during FIFA World Cup 2026, judged on a smart/context-aware assistant and logical decision-making.
- Decision: Build a single app with a role-aware assistant ("Kai") plus operator dashboards. Every AI call carries a validated `UserContext` (persona, language, accessibility, location, time-to-kickoff, weather) that drives tool selection and answers.
- Consequences: The context object becomes the core differentiator (same question → different correct answers). Requires strict validation and a test asserting context-driven divergence.

## ADR-002: Framework & stack — Next.js 16 + React 19.2 + TypeScript strict + Tailwind v4

- Date: 2026-07-06
- Status: Accepted
- Context: Need an enterprise-grade, maintainable, SSR-capable stack with first-class server-side secret handling; must be free/OSS and current-stable.
- Decision: Next.js 16 (App Router, Turbopack default, RSC/Server Actions), React 19.2 (Compiler on), TypeScript 5.9+ strict, Tailwind v4. Node 22 LTS.
- Consequences: Server-only AI calls are natural; React Compiler removes most manual memoization. Requires Node 22 and awaited async request APIs (Next 16 breaking change).

## ADR-003: Package manager — npm (not pnpm)

- Date: 2026-07-06
- Status: Accepted
- Context: This is a single-package app that evaluators will clone and run; low setup friction is a scored usability factor.
- Decision: Use npm (ships with Node 22). CI uses `npm ci`; `package-lock.json` committed.
- Consequences: Forgoes pnpm's disk-dedup/workspace and strict phantom-dep protection. The strictness gap is mitigated by `eslint-plugin-import` (no-cycle, no-extraneous/phantom). Revisit if the project becomes a monorepo.

## ADR-004: AI provider & SDK — Google Gemini via `@google/genai`, Flash tier

- Date: 2026-07-06
- Status: Accepted
- Context: Free-tier constraint; as of 2026 only Flash/Flash-Lite are free (Pro is paid). Need tools, structured output, grounding, streaming, multimodal.
- Decision: Official `@google/genai` JS SDK, server-side only. `gemini-2.5-flash` (balanced) and `gemini-2.5-flash-lite` (fast) via a `ModelTier` abstraction in `models.ts`. Grounding via the `google_search` tool (not deprecated `google_search_retrieval`).
- Consequences: Never require a paid Pro model. Must respect free-tier RPM/RPD (caching + backoff) and render mandatory Grounding citations + Search Suggestions.

## ADR-005: Validation — Zod 4 as single source of truth for boundary types

- Date: 2026-07-06
- Status: Accepted
- Context: All external input and all AI output are untrusted and must be validated; we want types and validation to not drift.
- Decision: Zod 4 schemas at every boundary; domain types derived via `z.infer`. AI structured outputs re-validated with repair-then-fallback.
- Consequences: One source of truth for shape + type. Slight runtime cost, acceptable for safety.

## ADR-006: Testing stack — Vitest 4 (+ Browser Mode) + RTL + Playwright + MSW + axe

- Date: 2026-07-06
- Status: Accepted
- Context: Testing and code quality are graded, including test quality; need unit, component, integration, e2e, and a11y coverage without paid tools.
- Decision: Vitest 4 with `test.projects` (workspace removed), `@vitest/coverage-v8`; React Testing Library / Browser Mode for components; MSW to mock Gemini HTTP; Playwright for the 5 persona journeys; `@axe-core/playwright` for a11y. Coverage thresholds enforced (core ≥90%, overall ≥80%).
- Consequences: No live API calls in CI; deterministic tests. Browser Mode requires Playwright browser binaries in CI.

## ADR-007: Lint/format — ESLint 9+ flat config + Prettier + strict plugins

- Date: 2026-07-06
- Status: Accepted
- Context: `next lint` is removed in Next 16; need enforceable code-quality gates.
- Decision: `eslint.config.js` (flat) with typescript-eslint (type-checked), react, react-hooks, jsx-a11y, security, import (no-cycle), vitest; complexity/size limits enforced; `eslint-config-prettier` last. Prettier for formatting only.
- Consequences: Zero-warning gate in CI; size/complexity caps force modular refactoring.

## ADR-008: Data layer — seeded/simulated repositories behind interfaces

- Date: 2026-07-06
- Status: Accepted
- Context: A live stadium/transit feed would require paid APIs; the constraint is free tools, but the demo must feel real-time.
- Decision: Seeded, deterministic data for one fictional venue ("Liberty Stadium") with a simulated, time-varying crowd state, all behind repository interfaces.
- Consequences: Swappable for a real DB/feed later without touching services. Clearly documented as simulated in `SECURITY.md` §6 and the README.

## ADR-009: Error-handling strategy — typed handler results at HTTP boundaries

- Date: 2026-07-07
- Status: Accepted
- Context: Route Handlers and services need a consistent, testable way to represent expected validation/rate-limit failures vs exceptional errors without leaking details to clients.
- Decision: HTTP-facing handlers return explicit `{ ok: true, ... } | { ok: false, status, message, retryAfter? }` result objects (see `chat-service`, `grounded-service`). Domain/services use nullable returns or safe fallbacks for expected misses (e.g., `getRoute` → `null`). Unexpected AI/provider failures map to generic user messages + redacted server logs; never surface stacks or prompts.
- Consequences: Call sites must branch on `ok`; tests can assert status codes without try/catch. Thrown errors reserved for truly exceptional programmer errors inside server code.

## ADR-010: Maps & heatmap — custom SVG over paid map APIs

- Date: 2026-07-07
- Status: Accepted
- Context: Plan requires navigation map + crowd heatmap with no paid map API keys; must remain accessible (patterns + labels, not color-only).
- Decision: Seeded node coordinates in `src/lib/map/layout.ts`, rendered as an interactive SVG with density patterns, route overlay from Dijkstra path output, and gate recommendations from `crowd-service`.
- Consequences: Schematic (not geospatial) map; sufficient for demo and grading criteria. Swappable for Mapbox/Google Maps later behind the same service interface.

## ADR-011: Observability — Pino structured logging + central error mapper

- Date: 2026-07-07
- Status: Accepted
- Context: Security/ops grading expects redacted structured logs, correlation IDs, and no leakage of provider errors, stacks, or prompts to clients.
- Decision: A single Pino logger (`src/lib/logging/logger.ts`) with a redaction allowlist (API keys, auth headers, cookies, tokens). A central `mapErrorToResponse` (`src/server/http/error-response.ts`) generates a per-request correlation ID, logs the redacted error server-side, and returns a generic client message + `x-correlation-id`. Every route handler wraps its body in try/catch delegating to the mapper. Expected failures still use the typed `{ ok }` results from ADR-009.
- Consequences: Clients never see stacks/prompts; server logs are greppable by correlation ID. `AppError` kinds map to status codes in one place.

## ADR-012: CSP — per-request nonce via `proxy.ts` (formerly middleware)

- Date: 2026-07-07
- Status: Accepted
- Context: The initial CSP allowed `script-src 'unsafe-inline'`, contradicting the "strict CSP" security claim. Next 16 also deprecated the `middleware.ts` convention in favour of `proxy.ts`.
- Decision: Generate a per-request nonce in `src/proxy.ts` and emit a strict CSP where production `script-src` is `'self' 'nonce-…' 'strict-dynamic'` (no `'unsafe-inline'`). Development relaxes `script-src` with `'unsafe-eval'`/`'unsafe-inline'` so React Fast Refresh works. Static headers (HSTS, nosniff, referrer, permissions, frame-options) remain in `next.config.ts`.
- Consequences: Removes inline-script XSS surface in production. Nonce delivery relies on Next's automatic nonce propagation to framework scripts; any future manual inline script must read the `x-nonce` request header.

## ADR-013: Gemini safety settings applied to every model call

- Date: 2026-07-07
- Status: Accepted
- Context: `plan.md` requires configured safety settings; none were set, leaving harmful-content handling at provider defaults.
- Decision: Shared `KAI_SAFETY_SETTINGS` (`src/lib/ai/safety.ts`) set `BLOCK_MEDIUM_AND_ABOVE` for harassment, hate speech, sexually-explicit, and dangerous content, applied to chat streaming, the tool loop, vision, grounded search, gate explanations, and dashboard summaries.
- Consequences: Consistent guardrails across every entry point; blocked responses degrade to the existing safe fallbacks.

## ADR-014: MSW-backed integration tests for provider paths

- Date: 2026-07-07
- Status: Accepted
- Context: MSW was a dependency but unused; the live Gemini paths (tool loop, streaming, structured repair, grounding parse) were uncovered, so coverage failed the enforced thresholds.
- Decision: Mock the Gemini REST endpoints (`:generateContent`, `:streamGenerateContent`) with MSW (`tests/mocks/gemini-handlers.ts`) and exercise the real client paths in `tests/integration/**` — chat SSE streaming, tool-call turns, structured-output repair/fallback, vision, and grounding metadata parsing. Combined with focused unit tests, core coverage now meets ≥90% lines/functions and ≥80% branches with deterministic, network-free runs.
- Consequences: No live API calls in CI; provider-shaped fixtures must track SDK request/response shape if the SDK major version changes.

## ADR-015: Multi-model fallback chain with per-model health registry

- Date: 2026-07-07
- Status: Accepted
- Context: A single balanced model + `withRetry` recovers from transient blips but not from a model being overloaded, rate-limited for an extended window, or removed/renamed by the provider. Demo resilience and the efficiency criterion benefit from graceful degradation across models.
- Decision: Introduce an ordered per-tier model chain (`getModelChain`) and a health registry (`src/lib/ai/model-fallback.ts`) that classifies failures as `transient` (cooldown, honoring `Retry-After`), `terminal` (permanently skip: 4xx / model-not-found), or `unknown` (rethrow, don't mask real bugs). `runWithModelFallback` tries each healthy model in order; `withRetry` handles in-model transient retries, and the registry advances to the next model when a model stays unhealthy. All six Gemini entry points (chat streaming, tool loop, vision, grounded, gate, dashboard) call through the shared `generate.ts` helpers.
- Consequences: Higher availability with the same free-tier keys; a bad model id degrades to the next model instead of failing the request. The registry is process-local (fine for serverless/Vercel); it is injectable for deterministic tests.

## ADR-016: Retry backoff hardening — Retry-After + broader transient detection

- Date: 2026-07-07
- Status: Accepted
- Context: The original retry only inspected HTTP status and used fixed jittered backoff, ignoring provider `Retry-After` hints and network-level failures.
- Decision: `withRetry` now parses `Retry-After` (seconds or HTTP date) as a delay floor, detects retryable network codes (ECONNRESET/ETIMEDOUT/…) by walking the `cause` chain, and matches transient message fragments ("resource exhausted", "high demand", …). Sleep and randomness are injectable for fast, deterministic tests.
- Consequences: Fewer wasted retries against hard failures, and backoff that respects server guidance; retry behavior is unit-tested without real timers.

## ADR-017: Request body-size cap + startup env validation + health endpoint

- Date: 2026-07-07
- Status: Accepted
- Context: JSON routes parsed unbounded bodies (DoS surface), env misconfiguration failed lazily and opaquely, and there was no machine-readable liveness/feature probe for smoke tests and demos.
- Decision: `readJsonWithLimit` (`src/server/http/read-json.ts`) rejects oversized bodies via `content-length` and actual byte length (413 `payload_too_large`). `validateServerEnv` (Zod, `src/lib/config/env.ts`) validates env _shape_; `src/instrumentation.ts` runs it at Node startup, warning on a missing key and throwing only on invalid values in production. `GET /api/health` reports status, AI mode (live vs fallback), and the resolved model chains (no secrets).
- Consequences: Bounded input, fail-fast on genuinely invalid config while still degrading gracefully when the key is absent, and a cheap smoke target used by CI.

## ADR-018: Behavior + performance baselines, and hardened CI/CD for Vercel

- Date: 2026-07-07
- Status: Accepted
- Context: Prose-level AI assertions miss orchestration regressions (tool usage, grounding shape, fallback flags), the deterministic routing engine had no perf guard, and CI ran a single OS with no supply-chain/code scanning. Deployment target is Vercel (no Firebase).
- Decision: Add MSW-driven behavior snapshots (`tests/behavior/**`) over normalized envelopes, a CI-safe routing perf baseline (`tests/perf/**`), a cross-OS CI matrix (Ubuntu + Windows) with a `/api/health` smoke job, CodeQL (`security-and-quality`) and grouped Dependabot. Vercel readiness: `vercel.json`, Node runtime + `maxDuration` on AI routes, per-request nonce CSP via `proxy.ts` (Vercel-compatible).
- Consequences: Intentional behavior changes require a reviewed snapshot update (`npm run test:behavior:update`); regressions in tool/grounding/fallback logic fail fast. No Firebase dependency; deploys via Vercel CLI/git.

---
