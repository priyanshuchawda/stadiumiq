# Server layer (`src/server/`)

- API routes: rate-limit first (`enforceRateLimit`), then validate body (`readJsonWithLimit` for JSON).
- POST AI routes: call `assertAllowedOrigin` before reading the body.
- Prefer `mapErrorToResponse` for consistent error shapes; never leak stack traces.
- Client identity: `getClientKey` prefers `x-real-ip` over spoofable `x-forwarded-for`.
