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

---
