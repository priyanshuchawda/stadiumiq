# Performance

Measured numbers and the budgets that guard them. Everything here is
reproducible: `npm run test:perf` for engine baselines, and the Lighthouse
workflow (`.github/workflows/lighthouse.yml`) for page-level scores.

## Deterministic engine (measured)

Measured with Node 22 on a development machine (July 2026), 5,000 iterations
per operation:

| Operation                                    | Total (5,000 runs) | Per operation | CI budget           |
| -------------------------------------------- | ------------------ | ------------- | ------------------- |
| `findRoute` (Dijkstra, gate-c → section-112) | ~28 ms             | ~6 µs         | 750 ms / 5,000 runs |
| `recommendGate` (context-aware gate scoring) | ~9 ms              | ~2 µs         | 750 ms / 5,000 runs |

The CI budgets in `tests/perf/routing.perf.test.ts` are deliberately generous
(~25x headroom): they exist to catch accidental algorithmic regressions
(O(n²) loops, runaway allocation), not to measure absolute machine speed.

## Page performance (enforced in CI)

Every push runs Lighthouse against a production build of `/`, `/assistant`,
`/map`, and `/dashboard` (`lighthouserc.json`):

| Category       | Gate                                     |
| -------------- | ---------------------------------------- |
| Accessibility  | **error below 95**                       |
| Best practices | **error below 90**                       |
| SEO            | **error below 90**                       |
| Performance    | warn below 80 (CI runners vary in speed) |

Pages are server-rendered first (no `ssr: false` islands); the map and
dashboard hydrate progressively over the SSR output.

## AI cost efficiency

The Gemini free tier is the AI budget, so every call is treated as expensive:

- **No duplicate model calls** — when the tool loop already produced a final
  answer, the streaming path replays it instead of calling the model again
  (`src/lib/ai/stream-kai.ts`).
- **60s caches with stampede protection** — dashboard insights, gate
  explanations, and grounded answers share an `AsyncCache` (TTL + LRU +
  in-flight deduplication), so concurrent identical requests cost one call
  (`src/lib/ai/async-cache.ts`).
- **Model tiering** — cheap tasks (gate explanations) run on
  `gemini-2.5-flash-lite`; conversational reasoning runs on `flash`. Output
  tokens are capped per task (`src/lib/ai/models.ts`).
- **Fallback chain with cooldowns** — a throttled model is put in cooldown
  (honoring `Retry-After`) instead of being hammered
  (`src/lib/ai/model-fallback.ts`).
- **Client-side discipline** — debounced input and `AbortController` cancel
  superseded requests before they spend quota.
