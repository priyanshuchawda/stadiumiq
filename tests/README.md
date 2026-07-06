# StadiumIQ test layout

| Directory            | Purpose                                                           |
| -------------------- | ----------------------------------------------------------------- |
| `tests/unit/`        | Fast isolated tests for HTTP helpers, security, AI utilities      |
| `tests/integration/` | MSW-mocked Gemini orchestration across services                   |
| `tests/behavior/`    | Snapshot baselines for AI response envelopes                      |
| `tests/component/`   | React component tests (jsdom)                                     |
| `tests/e2e/`         | Playwright journeys (CI only; skip locally if dev server is busy) |
| `tests/live/`        | Optional real Gemini smoke (`npm run test:live`)                  |
| `tests/fixtures/`    | Shared contexts and request builders                              |

## Commands

```bash
npm run test              # unit + component
npm run test:behavior     # envelope snapshots
npm run coverage          # v8 coverage on services, HTTP, security, AI
npm run test:e2e          # Playwright (requires build + server)
```

## Conventions

- Reset rate limits with `resetRateLimitsForTests()` when exercising HTTP guards.
- Clear AI caches (`clearKaiCacheForTests`, `clearGroundedCacheForTests`, etc.) in `beforeEach` when MSW handlers change per test.
- Prefer precise assertions over `toBeTruthy()` for security-sensitive paths.
- Use `tests/fixtures/contexts.ts` for `UserContext` and `Request` builders.
