export type RetryOptions = {
  maxRetries: number;
  baseDelayMs: number;
};

const DEFAULT_RETRY: RetryOptions = { maxRetries: 2, baseDelayMs: 400 };

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = DEFAULT_RETRY,
): Promise<T> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= options.maxRetries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const status = extractStatus(error);
      if (!isRetryableStatus(status) || attempt === options.maxRetries) {
        throw error;
      }
      const jitter = Math.floor(Math.random() * 100);
      const backoff = options.baseDelayMs * 2 ** attempt + jitter;
      await delay(backoff);
      attempt += 1;
    }
  }

  throw lastError;
}

function extractStatus(error: unknown): number {
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as { status: unknown }).status;
    if (typeof status === "number") {
      return status;
    }
  }
  return 500;
}
