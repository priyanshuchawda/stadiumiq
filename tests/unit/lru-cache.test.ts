import { afterEach, describe, expect, it, vi } from "vitest";
import { LruCache } from "@/lib/ai/lru-cache";

describe("LruCache", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("stores and retrieves values", () => {
    const cache = new LruCache<number>(2, 1000);
    cache.set("a", 1);
    expect(cache.get("a")).toBe(1);
    expect(cache.get("missing")).toBeUndefined();
  });

  it("evicts the least-recently-used entry when full", () => {
    const cache = new LruCache<number>(2, 1000);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.get("a"); // 'a' becomes most-recently-used
    cache.set("c", 3); // evicts 'b'
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")).toBe(1);
    expect(cache.get("c")).toBe(3);
  });

  it("expires entries after the TTL", () => {
    vi.useFakeTimers();
    const cache = new LruCache<string>(5, 1000);
    cache.set("k", "v");
    vi.advanceTimersByTime(1500);
    expect(cache.get("k")).toBeUndefined();
  });

  it("overwrites an existing key without evicting others", () => {
    const cache = new LruCache<number>(2, 1000);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("a", 10);
    expect(cache.get("a")).toBe(10);
    expect(cache.get("b")).toBe(2);
  });

  it("clears all entries", () => {
    const cache = new LruCache<number>(5, 1000);
    cache.set("a", 1);
    cache.clear();
    expect(cache.get("a")).toBeUndefined();
  });
});
