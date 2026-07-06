# plan.md — StadiumIQ: GenAI Stadium Operations & Fan Experience Platform (FIFA World Cup 2026)

> **This is the single source of truth for the AI coder.** Read this entire file **and `rules.md`** before writing any code. Follow both exactly. `rules.md` contains the **binding, enforceable coding/testing/security standards** — it is not optional. When a decision is ambiguous, prefer: **Security > Correctness > Code Quality > Accessibility > Efficiency > Features > Polish.** Do not skip the "Rules" and "Definition of Done" sections — they are graded.
>
> **Companion file:** [`rules.md`](./rules.md) — read it now. Every rule there is mandatory and CI-enforced.

---

## 0. TL;DR for the AI Coder

Build **StadiumIQ**, a production-grade, enterprise-quality **GenAI web app** (Next.js 16 App Router + React 19.2 + TypeScript strict + Tailwind v4) that acts as a **smart, dynamic, context-aware assistant** for four personas during the FIFA World Cup 2026: **Fans, Organizers, Volunteers, Venue Staff**.

The intelligence layer is **Google Gemini (free tier: `gemini-2.5-flash` / `gemini-2.5-flash-lite`)** using **function calling (tools)**, **structured output (JSON schema)**, **Grounding with Google Search** (real-time facts + citations), **streaming**, and **multimodal input** (photo of a sign/ticket).

Everything must use **free/open tooling**. No paid services required to run or grade it.

Deliver in **phases** (Section 15). Each phase ends with green tests, green lint, green typecheck, and a working demo path.

---

## 1. Problem Statement (verbatim scope)

> Build a GenAI-enabled solution that enhances stadium operations and the overall tournament experience for fans, organizers, volunteers, or venue staff. The solution must leverage Generative AI to improve **navigation, crowd management, accessibility, transportation, sustainability, multilingual assistance, operational intelligence, or real-time decision support** during the FIFA World Cup 2026.

**The solution must demonstrate:**
- Ability to build a smart, dynamic assistant
- Logical decision making based on user context
- Practical and real-world usability
- Clean and maintainable code

**Evaluation focus areas:** Code Quality, Security, Efficiency, Testing, Accessibility.

**Impact tiers (how scoring is weighted):**
- **High Impact** → Code Quality, Security, "smart dynamic assistant", "logical decision making on user context". Nail these.
- **Medium Impact** → Efficiency, Testing, practical real-world usability.
- **Low Impact** → Final polish (animations, empty states, micro-copy). Do them last, but do them.

---

## 2. Solution Concept — Why It Wins

**StadiumIQ** is a single app with a **role-aware AI copilot** named **"Kai"** plus **operational dashboards**. Every AI answer is **grounded, cited, context-aware, and action-oriented** (it can call tools, not just chat).

### Idea ↔ Problem mapping (every capability traces to a problem-statement keyword)

| Problem keyword | StadiumIQ feature | GenAI mechanism |
|---|---|---|
| **Navigation** | Indoor wayfinding: "shortest step-free route from Gate C to Section 112, nearest halal food + accessible toilet" | Function calling → routing tool; structured output route steps |
| **Crowd management** | Live gate/concourse density heatmap + "which gate should I use now?" | Function calling → crowd tool; logical decision on context (density, ETA, accessibility need) |
| **Transportation** | "Best way home to downtown after the match" (metro vs shuttle vs rideshare), real-time | **Grounding w/ Google Search** for live transit/service updates + citations |
| **Sustainability** | Greenest travel option, recycling bin locator, carbon estimate, water refill stations | Structured output + tool for eco scoring |
| **Multilingual assistance** | Real-time answers + UI in many languages; photo-translate a sign/menu | Gemini multilingual + multimodal image input |
| **Accessibility** | Step-free routes, sensory-friendly rooms, audio descriptions, screen-reader-first UI | Context flags in user profile drive AI decisions + WCAG 2.2 AA UI |
| **Operational intelligence** | Organizer dashboard: incident summaries, staffing suggestions, sentiment digest | Structured output summarization over event feed |
| **Real-time decision support** | Staff copilot: "surge at Gate B, 8-min wait" → recommended actions | Grounding + function calling + reasoning |

### The "smart, dynamic, context-aware" proof
Kai always receives a **typed `UserContext`** (persona, language, accessibility needs, current location/section, ticket type, mobility, time-to-kickoff, weather). The system prompt + tools force the model to **reason over this context** and **choose tools**, producing **different, correct answers for different users asking the same question.** This is the single most important differentiator and directly satisfies "logical decision making based on user context."

---

## 3. Personas & Core User Journeys (build these; they are the demo script)

1. **Fan (wheelchair user, Spanish speaker)** → "How do I get to my seat and where's the nearest accessible bathroom?" → step-free route + Spanish answer + map.
2. **Fan (leaving early)** → "Fastest greenest way to the airport now?" → grounded transit answer with citations + carbon note.
3. **Volunteer** → "A lost child was found at Gate D, what's the protocol?" → grounded/structured SOP checklist + who to contact.
4. **Venue staff** → "Crowd surge at Gate B" → decision-support recommendations + one-tap actions.
5. **Organizer** → dashboard: real-time KPIs, incident summaries, multilingual sentiment digest, staffing suggestions.

Each journey must be reachable in **≤ 3 clicks** from the home screen and must work end-to-end in the demo.

---

## 4. Non-Negotiable Constraints

- **Free tools only.** Gemini free tier, open-source libs, local/free hosting (Vercel Hobby or `next build && next start`). Mock external data where a paid API would otherwise be needed (see Section 9 — data is seeded/mocked but realistic).
- **No secrets in the client.** All Gemini calls go through **server-side Next.js Route Handlers / Server Actions**. The API key never reaches the browser.
- **Runs with a single `.env.local` var** (`GEMINI_API_KEY`) and `npm install && npm run dev`. Must degrade gracefully (clear UI message) if the key is missing — never crash.
- **Offline-friendly demo:** if Gemini is unavailable, show a graceful fallback + cached/mock answer so the demo never dies.

---

## 5. Tech Stack (all free / OSS — latest stable, verified July 2026)

> **Always install the latest stable at build time** (`@latest`), then pin exact resolved versions in `package-lock.json`. The versions below are the current-stable floor — do not go lower, and never use alpha/beta/canary/`preview` in production paths unless a stable equivalent does not exist (then document it in `DECISIONS.md`).

| Concern | Choice | Min stable (Jul 2026) | Notes |
|---|---|---|---|
| Framework | **Next.js (App Router)** | **16.2.x** | Turbopack is the default bundler; RSC, Route Handlers, Server Actions. `next lint` is removed — run ESLint directly. |
| UI runtime | **React** | **19.2** | **React Compiler is enabled** (stable) → do **not** hand-write `useMemo`/`useCallback`/`React.memo` unless the compiler bails out and diagnostics justify it. |
| Language | **TypeScript, `strict: true`** | **5.9+** (6.x fine) | No `any`. Full strict flag set in `rules.md`. |
| Runtime | **Node.js LTS** | **22.x** (min 20.9) | Pin in `engines` and CI. |
| Package manager | **npm** | 10.x (bundled with Node 22) | Chosen for zero-friction cloning by evaluators (ships with Node). Commit `package-lock.json`; CI uses `npm ci`. (Single-package app — pnpm's monorepo/dedup wins don't apply.) |
| AI SDK | **`@google/genai`** (official Google GenAI JS SDK) | latest | Server-side only. |
| Styling | **Tailwind CSS v4** (CSS-first config) + CSS variables | **4.x** | No legacy `tailwind.config.js` unless needed; theme tokens as CSS vars for dark/high-contrast. |
| UI primitives | **Radix UI** | latest | Accessible, unstyled primitives (dialog/menu/tooltip/etc.). |
| Validation | **Zod** | **4.x** | Import as `import * as z from "zod"`. Validate every input & every AI structured output; infer types via `z.infer`. |
| State (client) | React state / `useReducer`; **Zustand** only if genuinely shared | latest | Keep global state minimal; prefer server state. |
| i18n | **`next-intl`** | latest | Multilingual UI + RTL. |
| Maps/heatmap | **Custom SVG** stadium map | — | No paid map key; seeded coordinates. |
| Unit/Component tests | **Vitest 4** (+ **Browser Mode**, stable) + **React Testing Library** | **4.x** | Use `test.projects` (workspace is removed). Coverage via **`@vitest/coverage-v8`**. |
| Network mocking | **MSW** | 2.x | Mock Gemini HTTP in tests; never hit the real API in CI. |
| E2E | **Playwright** | latest | 5 persona journeys + `@axe-core/playwright` for a11y. |
| Lint | **ESLint 9+ flat config** (`eslint.config.js`) | **9.x/10.x** | `typescript-eslint` (type-checked rules), `eslint-plugin-react`, `react-hooks`, `jsx-a11y`, `eslint-plugin-security`, `eslint-plugin-import`, `eslint-plugin-vitest`. `eslint-config-prettier` last. |
| Format | **Prettier** | latest | Formatting only; ESLint owns correctness. |
| Git hooks | **Husky** + **lint-staged** + **commitlint** | latest | Conventional Commits; pre-commit gate. |
| CI | **GitHub Actions** | — | `typecheck → lint → test → coverage → build → audit`, Node 22. |
| Logging | **Pino** (structured, redacted) | latest | No PII/secrets in logs; correlation ids. |
| Rate limiting | In-memory token bucket | — | Protect AI endpoints (Upstash free tier optional later). |

> If any library above is unavailable/incompatible at build time, pick the closest maintained OSS equivalent, install its **latest stable**, and **document the swap in `DECISIONS.md`**. Do not introduce paid dependencies. Never leave a dependency on an EOL/deprecated version.

---

## 6. Google Gemini Integration Spec (read carefully — this is the core)

### 6.1 Models (free tier, verified July 2026)
- Default: **`gemini-2.5-flash`** (reasoning + tools + grounding, free tier).
- Cheap/fast path (autocomplete, classification, short answers): **`gemini-2.5-flash-lite`**.
- Do **not** hard-code a single model string in many places. Centralize in `src/lib/ai/models.ts` with a `ModelTier` enum (`FAST`, `BALANCED`) so models can be swapped in one place.
- Never default to Pro models (paid-only on free tier as of 2026). If a Pro model is ever configured, it must be opt-in via env, never required.

### 6.2 SDK usage (server only)
- Use `@google/genai`. Initialize a **singleton client** in `src/lib/ai/client.ts` reading `process.env.GEMINI_API_KEY`.
- All model calls live in `src/lib/ai/` and are invoked only from Route Handlers / Server Actions. **Never import the AI client into a Client Component.**

### 6.3 Capabilities to implement
1. **System prompt + typed context injection** — build a `buildSystemPrompt(context: UserContext)` that encodes persona, language, accessibility, location, and safety rules. The prompt must instruct the model to (a) reason over context, (b) prefer tools for facts, (c) never invent stadium data, (d) always answer in the user's language, (e) be concise and action-first.
2. **Function calling (tools)** — declare typed tools the model can call:
   - `getRoute({ from, to, stepFree, avoidStairs })` → route steps.
   - `getCrowdStatus({ area })` → density, wait time, recommendation.
   - `getTransportOptions({ destination, ecoPriority })` → options + carbon.
   - `getAmenities({ type, nearSection })` → toilets (accessible), food (dietary), water refill, first aid, prayer rooms, sensory rooms.
   - `getSOP({ topic })` → volunteer/staff standard operating procedures.
   Each tool has a **Zod schema** for args and result. The server executes the tool against seeded data, returns results to the model, and the model composes the final answer.
3. **Structured output** — for dashboards & SOP checklists, request JSON constrained by a schema (`responseMimeType: "application/json"` + `responseSchema`). **Always re-validate the model's JSON with Zod** before use. If invalid → one retry with a repair prompt → then fallback.
4. **Grounding with Google Search** — enable the `google_search` tool for real-time/transport/news questions. You **must render** the returned Search Suggestions (`searchEntryPoint.renderedContent`) and **source citations** (`groundingChunks` + `groundingSupports`) in the UI. Build a `<GroundingCitations />` component and a `<SearchSuggestions />` component. This is both a compliance requirement and a scoring win ("safe and responsible implementation").
5. **Streaming** — stream Kai's responses to the UI (Route Handler returning a `ReadableStream`; render tokens progressively) for perceived performance.
6. **Multimodal** — allow an image upload (sign/menu/ticket photo); send as inline data to Gemini for translation/explanation. Enforce max size + MIME allowlist server-side.
7. **Safety settings** — configure Gemini safety settings; on blocked content, return a safe, helpful fallback message. Never surface raw errors.

### 6.4 Reliability rules
- Wrap all model calls with: timeout, **retry with exponential backoff + jitter** (max 2 retries, only on 429/5xx), and a circuit-breaker-lite (short-circuit to fallback after repeated failures).
- **Token/latency budget**: keep prompts lean; cap `maxOutputTokens`; use `flash-lite` for trivial tasks; cache identical grounded queries for a short TTL (in-memory LRU) to respect free-tier RPD/RPM limits.
- Handle free-tier **rate limits (RPM/RPD)** gracefully: on 429, back off and show "high demand, retrying…", then fallback.

---

## 7. Architecture

```
Browser (Client Components, streaming UI, a11y)
        │  fetch / server action (typed)
        ▼
Next.js Route Handlers / Server Actions  ── validate (Zod) → rate limit → authz
        │
        ▼
Application Services  (src/server/services/*)   ← business logic, framework-agnostic
        │
        ├── AI layer (src/lib/ai/*)  → Gemini (tools, grounding, structured output)
        └── Data layer (src/server/data/*) → seeded/mock repositories (swap-ready for real DB)
```

**Layering rules (enforced):**
- Client Components never call Gemini or read secrets.
- Route Handlers are thin: validate → authorize → rate-limit → delegate to a service → shape response.
- Services contain logic and are unit-testable without Next.js.
- Data access is behind repository interfaces so mock data can later be swapped for a real DB without touching services.
- One-directional dependency: `ui → route → service → (ai | data)`. No upward imports.

---

## 8. Project Structure

```
stadiumiq/
├─ src/
│  ├─ app/
│  │  ├─ (marketing)/page.tsx            # landing + demo entry
│  │  ├─ assistant/page.tsx              # Kai chat (fan/volunteer/staff)
│  │  ├─ dashboard/page.tsx              # organizer operational intelligence
│  │  ├─ map/page.tsx                    # navigation + crowd heatmap
│  │  ├─ api/
│  │  │  ├─ chat/route.ts                # streaming Kai endpoint
│  │  │  ├─ grounded/route.ts            # grounded search endpoint
│  │  │  └─ vision/route.ts              # multimodal image endpoint
│  │  ├─ layout.tsx                      # a11y shell, skip links, theme, i18n
│  │  └─ globals.css
│  ├─ components/                        # presentational + Radix wrappers
│  │  ├─ ai/ (ChatWindow, Message, GroundingCitations, SearchSuggestions)
│  │  ├─ map/ (StadiumMap, CrowdHeatmap, RouteOverlay)
│  │  ├─ dashboard/ (KpiCard, IncidentFeed, SentimentDigest)
│  │  └─ ui/ (Button, Dialog, Toast — accessible primitives)
│  ├─ lib/
│  │  ├─ ai/ (client.ts, models.ts, prompts.ts, tools.ts, grounding.ts, schema.ts, safety.ts, withRetry.ts)
│  │  ├─ validation/ (zod schemas shared)
│  │  ├─ i18n/
│  │  └─ utils/
│  ├─ server/
│  │  ├─ services/ (assistantService.ts, crowdService.ts, transportService.ts, opsService.ts)
│  │  ├─ data/ (repositories + seeds: stadium.ts, crowd.ts, transport.ts, sop.ts, amenities.ts)
│  │  ├─ security/ (rateLimit.ts, sanitize.ts, authz.ts)
│  │  └─ logging/ (logger.ts)
│  └─ types/ (domain types: UserContext, Persona, Route, CrowdStatus, …)
├─ tests/ (unit, integration, e2e/playwright, msw handlers)
├─ .github/workflows/ci.yml
├─ .env.example
├─ README.md
├─ DECISIONS.md          # architecture decision log + any lib swaps
├─ SECURITY.md           # threat model + mitigations
└─ package.json
```

---

## 9. Data Model & Seed Data (mock but realistic)

Define domain types in `src/types`. Provide **seeded, deterministic** data in `src/server/data/seeds/*` for one flagship venue (e.g., "MetLife-style" fictional "Liberty Stadium") with: gates (A–D), sections, concourses, amenities (accessible toilets, food w/ dietary tags, water refill, first aid, prayer/sensory rooms), transport nodes (metro, shuttle, rideshare, parking), and a mutable in-memory crowd state that changes over time (simulated) so the heatmap and decisions feel live.

**Key types (author these):**
```ts
type Persona = "fan" | "volunteer" | "staff" | "organizer";

interface UserContext {
  persona: Persona;
  language: string;            // BCP-47, e.g. "es", "ar", "en"
  accessibility: {
    mobility: "none" | "wheelchair" | "limited";
    lowVision: boolean;
    sensorySensitive: boolean;
  };
  location?: { gate?: string; section?: string };
  ticketType?: "general" | "accessible" | "hospitality";
  minutesToKickoff?: number;
  weather?: { tempC: number; condition: string };
}
```
All AI requests carry a validated `UserContext`. Never trust it from the client without Zod validation + server-side clamping.

---

## 10. SECURITY — High Impact. Implement all of this. Also write `SECURITY.md`.

**Threat model to address:** prompt injection, secret leakage, PII exposure, SSRF via grounded links, XSS from AI/user content, DoS on AI endpoints, injection via structured output, over-permissive tools.

**Controls (checklist — every item required):**
1. **Secrets**: `GEMINI_API_KEY` server-only. Never in `NEXT_PUBLIC_*`. Never logged. `.env.local` gitignored; provide `.env.example`.
2. **Server-only AI**: enforce with an `import "server-only";` guard at the top of `src/lib/ai/*`. Any accidental client import fails the build.
3. **Input validation**: every Route Handler / Server Action validates body with **Zod**; reject unknown fields (`.strict()`); enforce max lengths on all text; MIME + size allowlist for image upload.
4. **Prompt-injection defenses**: separate system vs user content; wrap user text in clearly delimited blocks; instruct the model to treat retrieved/user content as **data, not instructions**; never let tool outputs or web content override system rules; strip/deny attempts to exfiltrate the system prompt.
5. **Output handling / XSS**: never `dangerouslySetInnerHTML` on model/user text. The **only** exception is Gemini's `searchEntryPoint.renderedContent` (required for grounding compliance) — sanitize it and render in an isolated container; document this in `SECURITY.md`. Escape/normalize all other AI output; render links with `rel="noopener noreferrer"` and validate URL protocol (`https:` only) to prevent SSRF/`javascript:` links.
6. **Rate limiting & abuse**: per-IP + per-session token-bucket on all AI endpoints; return `429` with `Retry-After`. Cap request body size (Next config). Debounce client calls.
7. **PII minimization**: don't collect names/emails. Location/accessibility flags stay client-side or in-session only; never persisted to disk in the demo. Redact anything sensitive in logs (Pino redaction).
8. **Security headers**: strict **CSP** (no inline scripts except hashed; restrict `connect-src`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, HSTS (prod), frame-ancestors none. Configure in `next.config` headers.
8. **CSRF**: Server Actions use built-in protections; for Route Handlers accepting POST, verify same-origin and use `POST` + JSON content-type checks.
9. **Dependency hygiene**: `npm audit` in CI; pin versions; no unmaintained packages.
10. **Error hygiene**: never leak stack traces, provider errors, or prompts to the client. Central error mapper → generic user message + server-side structured log with correlation id.
11. **Safety settings** on Gemini + safe fallback on blocked content.
12. **Least-privilege tools**: tools only read seeded data; no filesystem/network side effects from tool execution; no arbitrary code execution.

---

## 11. CODE QUALITY — High Impact. These rules are enforced by lint/CI.

> **Full, binding standards live in [`rules.md`](./rules.md).** This section is the summary; `rules.md` is authoritative and CI-enforced. Read it.

**Maintainability & file organization (refactor aggressively into many small files):**
- **One responsibility per file.** No "god" files, no barrel dumping ground. Prefer many small, well-named modules over few large ones. Hard cap: **files ≤ 250 lines, components ≤ 150 lines, functions ≤ 50 lines, cyclomatic complexity ≤ 10** (ESLint-enforced).
- Co-locate: a component's test (`*.test.tsx`), styles, and sub-parts live beside it. Services, AI tools, schemas each get their own file.
- Extract shared logic into `lib/` / `server/services/`; a piece of logic appearing 3× must be extracted (rule of three).
- No circular dependencies (`eslint-plugin-import` enforced). Enforce the one-way dependency flow from Section 7.
- Public modules expose a small, intentional API; keep internals unexported.

**TypeScript**
- `strict: true`, plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch`.
- **`any` is banned** (`@typescript-eslint/no-explicit-any: error`). Use `unknown` + narrowing. No non-null `!` assertions except with a justifying comment.
- Public functions/services have explicit return types. Domain modeled with discriminated unions; make illegal states unrepresentable.
- Validate all external/boundary data with Zod, then infer types from schemas (`z.infer`) — single source of truth.

**Structure & readability**
- Small, single-responsibility functions; files < ~250 lines where reasonable; components < ~150 lines.
- Clear naming; no abbreviations that aren't obvious. No dead code, no commented-out code.
- **Comments explain WHY, not what.** No narration comments. Public/exported APIs get concise JSDoc where intent isn't obvious.
- Pure business logic separated from I/O and framework code (testable services).
- No duplicated logic (DRY) — but don't over-abstract; prefer clarity.
- Consistent error handling via `Result`-style returns or typed thrown errors mapped centrally — pick one and be consistent (document in `DECISIONS.md`).

**React 19.2 specifics**
- React Compiler is on: **do not** manually memoize (`useMemo`/`useCallback`/`React.memo`) unless the compiler bails out and its diagnostic justifies it. Treat manual memoization as a code smell to investigate.
- Use `use`, `useActionState`, `useFormStatus`, Server Actions where they simplify code. Access `cookies()`/`headers()`/`params`/`searchParams` with `await` (Next 16 async request APIs).

**Lint/format setup (must pass with zero warnings in CI — ESLint 9+ flat config `eslint.config.js`)**
- ESLint: `@typescript-eslint` (type-checked rules), `eslint-plugin-react`, `react-hooks`, `jsx-a11y`, `eslint-plugin-security`, `eslint-plugin-import` (ordering + no cycles), `eslint-plugin-vitest` (test quality). `eslint-config-prettier` MUST be last to disable formatting rules.
- Enforce complexity/size limits: `max-lines`, `max-lines-per-function`, `complexity`, `max-depth`, `max-params`.
- Prettier for formatting; ESLint for correctness. No conflicts.
- Husky pre-commit → `lint-staged` (eslint --fix + prettier + typecheck on staged) ; commit-msg → commitlint (Conventional Commits).
- CI gate: `typecheck && lint && test && build && audit` must all pass.

**Git**
- Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`). Small, focused commits per phase.

---

## 12. TESTING — Medium Impact. Target meaningful coverage, not vanity numbers.

> **Test code is production code.** It is graded for quality too. Full testing standards (naming, structure, what NOT to do) are in [`rules.md`](./rules.md). Summary below.

- **Unit (Vitest)**: all services (assistant decision logic, crowd recommendation, transport eco scoring, SOP lookup), all Zod schemas (valid + invalid), all utils. Deterministic; no network.
- **AI layer tests**: mock the Gemini client. Test (a) tool-arg validation, (b) structured-output Zod validation + repair/fallback path, (c) retry/backoff on 429/5xx, (d) prompt builder includes context & safety rules, (e) grounding metadata parsed correctly.
- **Integration (Route Handlers)**: use **MSW** to mock Gemini HTTP; assert validation rejects bad input (400), rate limit returns 429, happy path streams/returns expected shape, secrets never in response.
- **Component (RTL)**: chat renders streamed messages, citations render, error/fallback states, loading states.
- **E2E (Playwright)**: run the 5 persona journeys (Section 3) against mocked AI; assert correct, context-differentiated outcomes and ≤3-click reachability.
- **Accessibility tests**: integrate **axe** (`@axe-core/playwright` or `vitest-axe`) — zero critical violations on every page.
- **Coverage (`@vitest/coverage-v8`)**: enforce thresholds in `vitest.config` — **≥ 90% lines/branches/functions on `src/server/services` and `src/lib/ai`** (core logic), **≥ 80% overall**. CI fails if thresholds drop. Coverage is a floor, not the goal — every branch and error path must be *meaningfully* asserted, not just executed.
- **Test quality is graded** (see `rules.md`): descriptive names, Arrange-Act-Assert, one behavior per test, no logic/loops/conditionals in tests, no snapshot-everything, deterministic (fake timers/seeded data), no shared mutable state, mocks reset between tests. Test observable behavior, not implementation details.
- **Vitest 4** with `test.projects` to separate unit (node), component (Browser Mode / jsdom), and setup. Exclude e2e (`tests/e2e/**`) from Vitest so it doesn't collide with Playwright.
- Provide `npm test`, `npm run test:e2e`, `npm run test:a11y`, `npm run coverage`.

---

## 13. ACCESSIBILITY — Medium Impact. Target WCAG 2.2 AA.

- Semantic HTML, landmarks, one `<h1>` per page, logical heading order.
- **Keyboard**: everything operable; visible focus rings; no traps; skip-to-content link; logical tab order.
- **Screen readers**: proper labels, `aria-live="polite"` for streaming AI responses, `aria-busy` while loading, descriptive alt text; announce route steps.
- **Color/contrast**: AA contrast; don't convey info by color alone (crowd heatmap uses labels + patterns, not just red/green); provide **high-contrast theme** and respect `prefers-reduced-motion` + `prefers-color-scheme`.
- **Forms**: labels, error messages linked via `aria-describedby`, no placeholder-as-label.
- **Multilingual**: `lang` attribute updates with locale; RTL support for Arabic; the AI answers in the user's language.
- **Radix UI** primitives for dialogs/menus/tooltips to get focus management for free.
- Touch targets ≥ 44px; responsive/mobile-first (fans are on phones).
- The accessibility features are also product features (step-free routing, sensory rooms) — showcase them.

---

## 14. EFFICIENCY — Medium Impact.

- **Server Components by default**; `"use client"` only where interactivity is needed.
- Stream AI responses; show skeletons; optimistic UI where safe.
- Use `flash-lite` for cheap tasks; cache grounded/identical queries (short TTL LRU) to respect free-tier limits and cut latency.
- Cap `maxOutputTokens`, trim prompts, avoid re-sending large context each turn (send a compact context object).
- `next/image` for images; code-split heavy client components (dynamic import the map); memoize expensive renders.
- Lighthouse target: Performance ≥ 90, Accessibility 100, Best Practices ≥ 95 on the main pages. Keep client JS lean.
- Debounce/throttle user input to AI; cancel in-flight requests on new input (`AbortController`).

---

## 15. Build Plan — Phases (execute in order; each phase must end green)

> After each phase: run `typecheck + lint + test + build`, fix everything, commit with a Conventional Commit. Do not advance with red.

### Phase 0 — Scaffolding & Guardrails
- Init **Next.js 16** (`npx create-next-app@latest --typescript --tailwind --app --eslint`) on **Node 22**, Turbopack default. Configure `tsconfig` strict flags (see `rules.md`).
- Set up **ESLint 9+ flat config** (all plugins + complexity limits), Prettier, Husky, lint-staged, commitlint, **Vitest 4** (with `test.projects` + `@vitest/coverage-v8`), Playwright, MSW, axe.
- Add `.env.example` (`GEMINI_API_KEY=`), security headers in `next.config`, base layout with skip link + theme + i18n provider.
- Add GitHub Actions CI (`typecheck, lint, test, build, audit`).
- **DoD**: `npm run dev` boots a themed, accessible empty shell; CI passes; missing key shows a friendly banner, no crash.

### Phase 1 — Domain, Data & Services (no AI yet)
- Author `src/types` domain model + Zod schemas.
- Seed data for Liberty Stadium (gates, sections, amenities, transport, SOPs, simulated crowd state).
- Implement repositories + services (`crowdService`, `transportService`, `opsService`, amenity/SOP lookups) with pure logic + unit tests.
- **DoD**: services fully unit-tested; `getRoute`, `getCrowdStatus`, `getTransportOptions`, `getAmenities`, `getSOP` work against seeds.

### Phase 2 — AI Core (Gemini)
- `src/lib/ai`: client singleton (`server-only`), models/tiers, prompt builder (context + safety), tool declarations + executors (wired to Phase 1 services), structured-output schemas + Zod validation + repair/fallback, `withRetry`, safety config, LRU cache.
- Unit tests with a mocked client for all of the above.
- **DoD**: given a `UserContext` + question, the AI layer returns a correct, tool-informed, validated answer (tested with mocks). Two different contexts → two different correct decisions (assert this in a test).

### Phase 3 — Assistant UX (Kai) + Streaming + Multimodal
- `api/chat` streaming Route Handler (validate → rate limit → service → stream). `assistant/page.tsx` chat UI with `aria-live`, persona/context selector, language switch, loading/error/fallback states.
- `api/vision` image endpoint (allowlist + size cap) + upload UI.
- Component + integration + a11y tests (MSW-mocked Gemini).
- **DoD**: fan/volunteer/staff can chat; responses stream; image translate works; context changes answers; a11y clean.

### Phase 4 — Navigation Map + Crowd Heatmap
- SVG stadium map, route overlay, crowd heatmap (labels+patterns, not color-only), "which gate now?" wired to crowd decision logic + AI explanation.
- **DoD**: step-free routing + live-feeling heatmap render and update; keyboard/screen-reader accessible; tested.

### Phase 5 — Grounding with Google Search
- `api/grounded` endpoint enabling `google_search` tool for transport/real-time questions.
- `<GroundingCitations />` + `<SearchSuggestions />` (render `searchEntryPoint.renderedContent`, sanitized) — **required compliance**.
- Route grounding into the transport/real-time journeys.
- **DoD**: grounded answers show citations + search suggestions; sources are `https:` only; tested with mocked grounding metadata.

### Phase 6 — Organizer Operational Intelligence Dashboard
- KPI cards, incident feed, multilingual **sentiment digest** and **incident summaries** via structured output; staffing suggestions from decision logic.
- **DoD**: dashboard renders live-updating KPIs + AI summaries (validated JSON); accessible; tested.

### Phase 7 — Hardening, Docs, Polish (Low Impact last)
- Complete `SECURITY.md` (threat model + controls), `DECISIONS.md`, `README.md` (setup, run, test, demo script, architecture diagram, evaluation-criteria mapping).
- Empty/error/loading states, micro-copy, animations respecting reduced-motion, favicon/branding.
- Final passes: axe, Lighthouse, `npm audit`, coverage, full e2e.
- **DoD**: all criteria in Section 17 satisfied; demo script runs flawlessly.

---

## 16. Environment & Commands

`.env.example`:
```
GEMINI_API_KEY=            # from Google AI Studio (free tier)
# Optional overrides:
AI_MODEL_BALANCED=gemini-2.5-flash
AI_MODEL_FAST=gemini-2.5-flash-lite
```

Scripts (in `package.json`, run via **npm**):
```
dev, build, start, typecheck, lint, lint:fix, format, format:check,
test, test:watch, test:e2e, test:a11y, coverage, audit, prepare(husky)
```

README must document: get a free key at Google AI Studio → put in `.env.local` → `npm install` → `npm run dev` → follow demo script. Also document **Node 22 LTS** as the only prerequisite (npm ships with it).

---

## 17. Definition of Done — Acceptance Checklist (grade yourself against this)

**Assistant intelligence (High Impact)**
- [ ] Kai answers are grounded in tools/seeds or Google Search, never hallucinated stadium facts.
- [ ] Same question + different `UserContext` → provably different, correct decisions (covered by a test).
- [ ] Multilingual answers; multimodal image translate works.

**Security (High Impact)**
- [ ] API key server-only; `server-only` guard; nothing in client bundle (verify build output).
- [ ] All inputs Zod-validated `.strict()`; image MIME/size enforced.
- [ ] Prompt-injection mitigations in place; retrieved/user content treated as data.
- [ ] No `dangerouslySetInnerHTML` except sanitized grounding `renderedContent` (documented).
- [ ] Rate limiting (429 + Retry-After); CSP + security headers; no error/secret leakage; PII minimized; `npm audit` clean of high/critical.

**Code Quality (High Impact)**
- [ ] TS strict, zero `any`, explicit return types on public APIs; illegal states unrepresentable.
- [ ] ESLint (incl. security + a11y) zero warnings; Prettier clean; no cycles; layered architecture respected.
- [ ] Small, well-named, documented-where-needed units; no dead/commented code.

**Testing (Medium Impact)**
- [ ] Unit (services, schemas, AI layer w/ mocks), integration (MSW), component (RTL), e2e (Playwright, 5 journeys), a11y (axe) — all green in CI. Meaningful coverage on core.

**Accessibility (Medium Impact)**
- [ ] WCAG 2.2 AA; keyboard-complete; screen-reader friendly (aria-live streaming); high-contrast + reduced-motion; RTL; axe zero critical; touch targets ≥44px.

**Efficiency (Medium Impact)**
- [ ] RSC-first; streaming; caching + flash-lite for cheap tasks; token/latency budgets; Lighthouse Perf ≥90, A11y 100.

**Usability & Polish (Medium/Low)**
- [ ] 5 journeys reachable in ≤3 clicks and demo-ready; graceful fallbacks; clean empty/error/loading states; complete README/SECURITY/DECISIONS docs.

---

## 18. Guardrails for the AI Coder (do & don't)

**Do:** follow phases in order; keep everything green; validate every boundary; centralize model/prompt/tool config; write tests as you build (not after); prefer Server Components; document decisions and any library swaps in `DECISIONS.md`; keep the demo bulletproof with fallbacks.

**Don't:** put the API key or AI client in the browser; use `any`; add paid services; render untrusted HTML; invent stadium facts in code that should come from tools; write narration comments; ship red tests/lint; over-engineer beyond this plan.

**When blocked or ambiguous:** choose the option that best serves the priority order in the header (Security > Correctness > Code Quality > Accessibility > Efficiency > Features > Polish), implement it, and note the decision in `DECISIONS.md`.

---

## 19. Reference Notes (verified July 2026)

- Gemini free tier = **Flash / Flash-Lite only** (`gemini-2.5-flash`, `gemini-2.5-flash-lite`); Pro models are paid — do not require them.
- **Grounding with Google Search**: enable the `google_search` tool (not the deprecated `google_search_retrieval`). Response includes `groundingMetadata` with `webSearchQueries`, `groundingChunks` (sources), `groundingSupports` (text↔source mapping), and `searchEntryPoint.renderedContent` (Search Suggestions HTML you **must** display). Use temperature ~1.0 for grounded calls per Google guidance.
- Respect free-tier RPM/RPD limits via caching + backoff.
- Use the official **`@google/genai`** JS SDK, server-side only.
- Docs: Grounding — https://ai.google.dev/gemini-api/docs/generate-content/google-search ; Interactions/Grounding — https://ai.google.dev/gemini-api/docs/interactions/google-search ; Pricing — https://ai.google.dev/gemini-api/docs/pricing ; Models — https://ai.google.dev/gemini-api/docs/models
