# Operations runbook

## Health checks

- `GET /api/health` — liveness; returns `{ status: "ok" }` when env is valid.
- Vercel deployment logs — watch for Gemini quota or timeout errors.

## Environment

| Variable                      | Required   | Notes                                               |
| ----------------------------- | ---------- | --------------------------------------------------- |
| `GEMINI_API_KEY`              | Yes (prod) | Without it, AI routes serve deterministic fallbacks |
| `ALLOWED_ORIGINS`             | Prod       | Comma-separated origins for POST AI routes          |
| `RATE_LIMIT_PER_MINUTE`       | No         | Default 20/min per client IP                        |
| `GROUNDING_CACHE_TTL_SECONDS` | No         | Default 300                                         |

## Incident response

1. **429 spikes** — increase `RATE_LIMIT_PER_MINUTE` or inspect abusive IPs in Vercel logs (`x-real-ip`).
2. **Gemini quota** — model fallback chain degrades to FAST tier; fallbacks activate if all models fail.
3. **Slow dashboard/map** — AI insights cache TTL is 60s; clients poll every 60s by design.

## Deploy

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

Push to `main`; Vercel auto-deploys via `vercel.json`.
