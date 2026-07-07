import { afterEach, describe, expect, it, vi } from "vitest";
import { AsyncCache } from "@/lib/ai/async-cache";

afterEach(() => {
  vi.useRealTimers();
});

describe("AsyncCache", () => {
  it("deduplicates concurrent loads for the same key", async () => {
    const cache = new AsyncCache<number>(4, 60_000);
    let loads = 0;

    const loader = async (): Promise<number> => {
      loads += 1;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return 42;
    };

    const [a, b] = await Promise.all([
      cache.getOrLoad("key", loader),
      cache.getOrLoad("key", loader),
    ]);

    expect(a).toBe(42);
    expect(b).toBe(42);
    expect(loads).toBe(1);
  });

  it("returns cached values without reloading", async () => {
    const cache = new AsyncCache<string>(4, 60_000);
    let loads = 0;
    const loader = async (): Promise<string> => {
      loads += 1;
      return "cached";
    };

    await cache.getOrLoad("key", loader);
    await cache.getOrLoad("key", loader);
    expect(loads).toBe(1);
  });

  it("reloads after the TTL expires", async () => {
    vi.useFakeTimers();
    const cache = new AsyncCache<number>(4, 1_000);
    let loads = 0;
    const loader = async (): Promise<number> => {
      loads += 1;
      return loads;
    };

    await expect(cache.getOrLoad("key", loader)).resolves.toBe(1);
    vi.advanceTimersByTime(1_001);
    await expect(cache.getOrLoad("key", loader)).resolves.toBe(2);
    expect(loads).toBe(2);
  });

  it("evicts the oldest entry when full", async () => {
    const cache = new AsyncCache<string>(2, 60_000);
    let loads = 0;
    const loader = (value: string) => async (): Promise<string> => {
      loads += 1;
      return value;
    };

    await cache.getOrLoad("a", loader("a"));
    await cache.getOrLoad("b", loader("b"));
    await cache.getOrLoad("c", loader("c")); // evicts "a"
    expect(loads).toBe(3);

    await cache.getOrLoad("a", loader("a2"));
    expect(loads).toBe(4);
  });

  it("does not cache loader failures", async () => {
    const cache = new AsyncCache<string>(4, 60_000);
    let loads = 0;

    await expect(
      cache.getOrLoad("key", async () => {
        loads += 1;
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    await expect(
      cache.getOrLoad("key", async () => {
        loads += 1;
        return "recovered";
      }),
    ).resolves.toBe("recovered");
    expect(loads).toBe(2);
  });

  it("clear() empties the cache", async () => {
    const cache = new AsyncCache<string>(4, 60_000);
    let loads = 0;
    const loader = async (): Promise<string> => {
      loads += 1;
      return "value";
    };

    await cache.getOrLoad("key", loader);
    cache.clear();
    await cache.getOrLoad("key", loader);
    expect(loads).toBe(2);
  });
});
