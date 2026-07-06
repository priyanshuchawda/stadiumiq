# rules.md — Binding Engineering Standards for StadiumIQ

> **Mandatory and CI-enforced.** These rules are the authoritative companion to [`plan.md`](./plan.md). If any code, test, or config violates a rule here, it is not "done." When two rules conflict, the priority order is: **Security > Correctness > Code Quality > Accessibility > Efficiency > Features > Polish.** Use the latest **stable** version of every tool (see `plan.md` §5); never alpha/beta/canary in production paths.

---

## 0. The Prime Directives

1. **No broken windows.** Never commit red: typecheck, lint (zero warnings), tests, build, and `audit` must all pass before every commit.
2. **Boundaries are validated.** Every value crossing a trust boundary (HTTP body, query, headers, env, file upload, AI output, third-party data) is validated with **Zod** before use.
3. **Secrets never touch the client.** The Gemini key and AI client are server-only, always.
4. **Small, single-purpose files.** Refactor aggressively into many focused modules. No god files.
5. **Test code is production code.** Held to the same quality bar.
6. **Explain WHY, not WHAT.** Comments justify non-obvious intent/trade-offs; never narrate code.

---

## 1. TypeScript Rules

### 1.1 Compiler config (`tsconfig.json`) — all required
```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "allowUnreachableCode": false,
    "forceConsistentCasingInFileNames": true,
    "verbatimModuleSyntax": true,
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "skipLibCheck": true
  }
}
```

### 1.2 Type discipline
- **`any` is banned** (`@typescript-eslint/no-explicit-any: error`). Use `unknown` + narrowing, generics, or precise types.
- **No non-null assertions (`!`)** except with an adjacent comment proving safety. Prefer narrowing.
- **No unsafe casts.** `as` only for genuinely safe widening or `as const`. Never `as SomeType` to silence errors; parse/validate instead.
- **No `@ts-ignore`.** If unavoidable, use `@ts-expect-error` with a reason comment; it must be temporary and tracked.
- **Explicit return types** on all exported functions, services, hooks, and Route Handlers.
- **Zod is the single source of truth** for boundary types: define schema → `type X = z.infer<typeof XSchema>`. Never hand-maintain a duplicate interface for validated data.
- **Make illegal states unrepresentable**: discriminated unions over boolean soup; branded types for IDs where useful; `readonly` for data that shouldn't mutate; prefer immutability.
- Prefer `type` for unions/aliases, `interface` for extendable object contracts — be consistent.
- No enums with runtime cost unless needed; prefer union literal types or `as const` objects.

### 1.3 Errors & results
- Choose ONE error strategy and apply consistently (document in `DECISIONS.md`): typed `Result<T, E>` returns for expected/domain failures; thrown typed errors only for truly exceptional cases, mapped centrally.
- Never throw or return raw strings; use typed error objects with a `code`.
- Never swallow errors silently. Log (redacted) + handle or rethrow.

---

## 2. Code Structure & Maintainability

### 2.1 Size & complexity limits (ESLint-enforced; CI fails on violation)
| Metric | Limit | ESLint rule |
|---|---|---|
| Lines per file | ≤ 250 | `max-lines` |
| Lines per function | ≤ 50 | `max-lines-per-function` |
| Lines per React component file | ≤ 150 | (convention + review) |
| Cyclomatic complexity | ≤ 10 | `complexity` |
| Nesting depth | ≤ 4 | `max-depth` |
| Function params | ≤ 4 (use an options object beyond that) | `max-params` |
| Callback nesting | ≤ 3 | `max-nested-callbacks` |

### 2.2 Modularity
- **One responsibility per file/module.** A file does one thing; its name says what.
- **Rule of three:** logic duplicated a third time must be extracted to a shared unit.
- **No circular dependencies** (`import/no-cycle: error`).
- **One-way dependency flow** (per `plan.md` §7): `ui → route → service → (ai | data)`. Lower layers never import higher layers. AI/data layers never import UI.
- **No cross-feature reach-in:** features talk through public module APIs, not each other's internals.
- Barrel files (`index.ts`) only for a module's intentional public API — never a dumping ground; avoid barrels that create cycles or bloat bundles.
- Keep functions **pure** where possible; isolate side effects (I/O, network, randomness, time) at the edges so core logic is testable.

### 2.3 Naming & readability
- Descriptive, unabbreviated names. Booleans read as predicates (`isAccessibleRoute`, `hasCitations`). Functions are verbs; variables are nouns.
- No dead code, no commented-out code, no `console.log` in committed code (use the logger).
- Guard clauses / early returns over deep nesting. Avoid clever one-liners that hurt readability.
- Files: `kebab-case` for filenames, `PascalCase` for components/types, `camelCase` for functions/vars, `SCREAMING_SNAKE_CASE` for true constants.

### 2.4 Comments & docs
- Comments explain intent, constraints, trade-offs, or non-obvious "why". Never restate the code.
- Exported service/AI functions get a concise JSDoc (purpose, params, return, throws) when intent isn't self-evident.
- Keep `DECISIONS.md` updated for every architectural choice or library swap.

---

## 3. React / Next.js 16 Rules

- **Server Components by default.** Add `"use client"` only when you need interactivity/state/browser APIs, and keep client components as leaf-level and small as possible.
- **React Compiler is on:** do NOT hand-write `useMemo`/`useCallback`/`React.memo` unless the compiler bails out and the diagnostic proves the need. Manual memoization is a reviewable smell.
- **Async request APIs:** always `await cookies()`, `await headers()`, `await params`, `await searchParams` (Next 16).
- Data mutations use **Server Actions** (with built-in CSRF protection) or POST Route Handlers with same-origin checks.
- No data fetching in `useEffect` when it can be a Server Component or Server Action.
- Route Handlers are **thin**: `validate → authorize → rate-limit → delegate to service → shape response`. No business logic in handlers.
- Keys must be stable (never array index for dynamic lists). No side effects during render.
- Co-locate component + its test + sub-components; lift shared UI into `components/ui`.
- Use `next/image`, `next/font`; `dynamic()` import heavy client-only widgets (e.g., the map).

---

## 4. AI / Gemini Rules (`src/lib/ai/*`)

- **`import "server-only";`** at the top of every AI module. The AI client is never imported by a client component (build must fail if it is).
- Centralize model selection in `models.ts` (`ModelTier.FAST` = `gemini-2.5-flash-lite`, `ModelTier.BALANCED` = `gemini-2.5-flash`). No model strings scattered in code. Never require a paid Pro model.
- **Every tool** has a Zod schema for args AND result; the executor validates args before running and validates its own result before returning.
- **Every structured-output call** declares a `responseSchema` and its result is re-validated with Zod. On invalid JSON → one repair retry → then typed fallback. Never trust model JSON blindly.
- **Grounding compliance:** when `google_search` is used, the UI MUST render source citations (`groundingChunks`/`groundingSupports`) and Search Suggestions (`searchEntryPoint.renderedContent`). Only `https:` source links; render with `rel="noopener noreferrer"`.
- **Prompt-injection defense:** system instructions are separate from user content; user/tool/web content is treated as DATA, never instructions; the model is instructed to ignore attempts to change its role or reveal the system prompt.
- **Reliability:** wrap calls in `withRetry` (max 2 retries, exponential backoff + jitter, only on 429/5xx), timeouts, and short-TTL LRU cache for identical grounded queries. Respect free-tier RPM/RPD.
- **Safety settings** configured; blocked content → safe, helpful fallback. Never surface raw provider errors to users.
- Keep prompts lean; cap `maxOutputTokens`; send a compact `UserContext`, not full history when unnecessary.

---

## 5. Security Rules (non-negotiable — see `plan.md` §10 and `SECURITY.md`)

- Secrets server-only; never in `NEXT_PUBLIC_*`, never logged, `.env.local` gitignored, `.env.example` committed.
- Validate every input with Zod `.strict()` (reject unknown keys); enforce max lengths; allowlist image MIME + size caps.
- **No `dangerouslySetInnerHTML`** anywhere, except the sanitized Gemini `searchEntryPoint.renderedContent` (isolated container, documented in `SECURITY.md`).
- Validate/allowlist all outbound and rendered URLs to `https:` (prevent SSRF and `javascript:`/`data:` links).
- Rate-limit all AI endpoints (per-IP + per-session token bucket); return `429` + `Retry-After`.
- Security headers via `next.config`: strict CSP, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors 'none'`, HSTS in prod.
- Central error mapper: generic user message + redacted structured server log with correlation id. Never leak stacks/prompts/provider errors.
- Minimize PII: don't persist personal data in the demo; redact logs (Pino redaction).
- Least-privilege tools: read seeded data only; no filesystem/network side effects; no dynamic code execution.
- `npm audit` in CI must be clean of high/critical. Pin versions; no EOL deps.

---

## 6. Testing Rules (test quality is graded)

### 6.1 Structure & naming
- **Arrange–Act–Assert**, one clearly-named behavior per test. Describe blocks group by unit/behavior; test names read as sentences: `it("returns a step-free route when the user is a wheelchair user")`.
- **No logic in tests:** no `if`/`for`/`while`/`try` or computed expectations. Use `it.each`/`test.each` for parameterized cases instead of loops.
- Test **observable behavior**, not implementation details. Don't assert on private internals or call counts unless the contract is the interaction.
- **No "assert nothing" tests** and no snapshot-everything. Snapshots only for small, stable, meaningful output, reviewed intentionally.

### 6.2 Isolation & determinism
- Tests are independent and order-independent. No shared mutable state; reset mocks (`vi.clearAllMocks()`/`resetAllMocks`) between tests.
- Deterministic: seed random data, use fake timers (`vi.useFakeTimers()`), freeze `Date`. No real network — mock Gemini via **MSW**; never call the live API in CI.
- No arbitrary `sleep`/timeouts; await conditions/`findBy*` and Playwright auto-waiting.

### 6.3 What to cover
- **Services & AI layer:** happy path + every branch + every error/fallback path (invalid AI JSON → repair → fallback; 429 → backoff; tool-arg rejection). Assert *context-driven divergence* (same query, two `UserContext`s → different correct outcomes).
- **Schemas:** valid inputs pass; invalid inputs (missing/extra/wrong-type/too-long) are rejected.
- **Components (RTL / Vitest Browser Mode):** render, streaming updates, loading/empty/error/fallback states, citations rendering, keyboard interaction. Query by role/label (accessibility-first queries), not by test-id unless necessary.
- **Integration (Route Handlers + MSW):** 400 on bad input, 429 on rate limit, happy path shape, secrets never present in responses.
- **E2E (Playwright):** the 5 persona journeys; assert ≤3-click reachability and correct differentiated outcomes.
- **A11y:** `@axe-core/playwright` (and/or `vitest-axe`) → zero critical violations on every page.

### 6.4 Config
- **Vitest 4** with `test.projects` (workspace removed). Separate projects: `unit` (node), `component` (Browser Mode or jsdom). Coverage & reporters live in the root config only.
- Coverage thresholds enforced (fail build): core `src/server/services` + `src/lib/ai` ≥ **90%** lines/branches/functions; overall ≥ **80%**.
- `eslint-plugin-vitest` enforces test-quality rules (no disabled/focused tests committed: `no-disabled-tests`, `no-focused-tests` = error).

---

## 7. Accessibility Rules (WCAG 2.2 AA — see `plan.md` §13)

- Semantic HTML + landmarks; single `<h1>`/page; logical heading order; skip-to-content link.
- Fully keyboard-operable; visible focus; no traps; logical tab order; touch targets ≥ 44px.
- `aria-live="polite"` for streaming AI output; `aria-busy` while loading; labels via `<label>`/`aria-label`; errors linked with `aria-describedby`.
- AA contrast; never color-only signaling (heatmap uses labels + patterns); high-contrast theme; honor `prefers-reduced-motion` and `prefers-color-scheme`.
- `lang` updates with locale; full RTL support (Arabic).
- `jsx-a11y` lint rules are errors, not warnings.

---

## 8. Performance / Efficiency Rules

- Server Components first; stream AI responses; skeletons for perceived speed.
- `flash-lite` for cheap tasks; cache identical grounded queries (short TTL); cap output tokens; compact context payloads.
- Debounce user→AI input; cancel in-flight requests with `AbortController` on new input.
- Code-split heavy client widgets; `next/image`; keep client JS lean.
- Targets: Lighthouse Perf ≥ 90, Accessibility 100, Best Practices ≥ 95 on main pages.

---

## 9. Git, Commits, GitHub (`gh`) & CI

### 9.1 Commit conventions
- **Conventional Commits**, enforced by commitlint: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `perf:`, `chore:`, `ci:`, `build:`, `style:`.
- Subject ≤ 72 chars, imperative mood ("add", not "added"). Body explains **why**, wrapped ~72 cols. Reference issues in the footer (`Refs #12`).
- **Small, atomic, one-logical-change commits.** Each phase in `plan.md` §15 ends with its own green commit. Never mix refactor + feature + formatting in one commit.
- **Credit belongs to the git author (Priyanshu Chawda).** Do NOT add `Co-authored-by:` trailers for tools/assistants. A global `commit-msg` hook strips any auto-injected `Co-authored-by: Cursor` line — do not remove or bypass that hook.

### 9.2 Pre-commit / commit-msg hooks (Husky)
- **pre-commit** (lint-staged): `eslint --fix` + `prettier --write` + `tsc --noEmit` on staged files. Commit is blocked if any fail.
- **commit-msg**: commitlint validates the Conventional Commit format.
- **Never** use `--no-verify` / `-n` to skip hooks unless the user explicitly asks. If a hook fails, fix the cause and commit again — do not bypass.

### 9.3 Environment gotchas (Windows / PowerShell — this repo)
- The shell is **PowerShell**: **heredocs (`<<'EOF'`) do NOT work.** For multi-line commit messages, write the message to a temp file and use `-F`:
  ```powershell
  # write message to a file first (e.g. via the editor), then:
  git commit -F .git/COMMIT_MSG.tmp
  Remove-Item .git/COMMIT_MSG.tmp
  ```
  For short single-line messages, one `-m` is fine: `git commit -m "docs: update rules"`.
- Chain dependent commands with `;` or `&&` on a **single line** (no literal newlines between commands). Quote Windows paths containing spaces.
- Do not rely on `$(cat <<EOF...)` — it fails in PowerShell.

### 9.4 Standard commit workflow (run in order; keep everything green)
```powershell
git status --short                      # review what changed
# only stage intended files (never blindly commit secrets):
git add plan.md rules.md src/...        # or: git add -A  (after confirming .env is gitignored)
git status --short                      # confirm .env / .env.local are NOT staged
git commit -F .git/COMMIT_MSG.tmp       # (or -m "..." for one-liners)
git log -1 --format='%an <%ae>%n%B'     # verify author + clean message (no Cursor trailer)
```
- **Never commit** `.env`, `.env.local`, credentials, tokens, or `node_modules`. Verify with `git status` before every commit. `.gitignore` already excludes them — keep it that way.
- If a secret is ever staged, unstage it (`git restore --staged <file>`) and add it to `.gitignore` before committing.

### 9.5 GitHub via `gh` (repo is PRIVATE: `priyanshuchawda/stadiumiq`)
- Confirm auth once: `gh auth status` (must be logged in with `repo` scope).
- Create a private repo (only if it doesn't exist): 
  ```powershell
  gh repo create stadiumiq --private --source=. --remote=origin --push --description "..."
  ```
- Push normal work: 
  ```powershell
  git push -u origin main            # first push sets upstream
  git push                            # subsequent pushes
  ```
- **Keep the repo private.** Never run `gh repo edit --visibility public`. Never force-push to `main` except to repair your own un-shared history, and only with `--force-with-lease` (never bare `--force`).
- Use `gh` for all GitHub tasks (issues, PRs, checks, releases) — e.g. `gh pr create`, `gh run list`, `gh run watch`.

### 9.6 Branching & PRs (when work is non-trivial)
- Feature branches: `feat/<short-name>`, `fix/<short-name>`. Keep `main` always green/deployable.
- Open PRs with `gh pr create --fill` (or a written summary + test plan). Ensure CI is green before merge: `gh pr checks`.
- Prefer squash-merge to keep `main` history clean and atomic.

### 9.7 CI (GitHub Actions, Node 22) — all stages must pass
`npm ci → typecheck → lint (zero warnings) → test + coverage (thresholds) → build → npm audit (no high/critical)`.
- No direct-to-`main` broken pushes; a red pipeline blocks merge.
- `package-lock.json` committed; deterministic installs via `npm ci` (never `npm install` in CI).

---

## 10. Definition of "Rule-Compliant" (quick self-check before each commit)

- [ ] `npm run typecheck` clean · `npm run lint` zero warnings · `npm test` green · coverage thresholds met · `npm run build` ok · `npm audit` clean.
- [ ] No `any`, no `!` (unjustified), no `@ts-ignore`, no `console.log`, no dead/commented code.
- [ ] Every new boundary input validated with Zod `.strict()`; every AI output re-validated.
- [ ] Files/functions within size & complexity limits; no import cycles; correct layer direction.
- [ ] New logic has meaningful tests (branches + error paths), test names are sentences, tests are deterministic and isolated.
- [ ] New UI is keyboard + screen-reader accessible; axe clean.
- [ ] Secrets server-only; no unsafe HTML; URLs https-allowlisted; errors mapped/redacted.
- [ ] Conventional Commit message; `DECISIONS.md` updated if an architectural/library choice was made.
