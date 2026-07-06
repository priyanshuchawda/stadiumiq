type Bucket = {
  tokens: number;
  lastRefill: number;
};

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

export type RateLimitConfig = {
  limit: number;
  windowMs: number;
};

const DEFAULT_CONFIG: RateLimitConfig = {
  limit: Number.parseInt(process.env["RATE_LIMIT_PER_MINUTE"] ?? "20", 10),
  windowMs: 60_000,
};

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

function pruneStaleBuckets(now: number, windowMs: number): void {
  if (buckets.size <= MAX_BUCKETS) {
    return;
  }
  for (const [key, bucket] of buckets) {
    if (now - bucket.lastRefill >= windowMs * 2) {
      buckets.delete(key);
    }
  }
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig = DEFAULT_CONFIG,
): RateLimitResult {
  const now = Date.now();
  pruneStaleBuckets(now, config.windowMs);

  const bucket = buckets.get(key) ?? { tokens: config.limit, lastRefill: now };
  const elapsed = now - bucket.lastRefill;

  if (elapsed >= config.windowMs) {
    bucket.tokens = config.limit;
    bucket.lastRefill = now;
  }

  if (bucket.tokens <= 0) {
    const retryAfterMs = config.windowMs - (now - bucket.lastRefill);
    buckets.set(key, bucket);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetRateLimitsForTests(): void {
  buckets.clear();
}
