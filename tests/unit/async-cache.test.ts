import { describe, expect, it } from "vitest";
import { AsyncCache } from "@/lib/ai/async-cache";

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
});
