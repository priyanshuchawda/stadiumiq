import { describe, expect, it, vi } from "vitest";
import {
  classifyModelFailure,
  createModelHealthRegistry,
  runWithModelFallback,
} from "@/lib/ai/model-fallback";

describe("classifyModelFailure", () => {
  it("classifies transient status codes", () => {
    expect(classifyModelFailure({ status: 429 })).toBe("transient");
    expect(classifyModelFailure({ status: 503 })).toBe("transient");
  });

  it("classifies terminal status codes and model-not-found messages", () => {
    expect(classifyModelFailure({ status: 404 })).toBe("terminal");
    expect(classifyModelFailure(new Error("model gemini-x not found"))).toBe(
      "terminal",
    );
  });

  it("classifies transient network codes and messages", () => {
    expect(classifyModelFailure({ code: "ECONNRESET" })).toBe("transient");
    expect(classifyModelFailure(new Error("resource exhausted"))).toBe("transient");
  });

  it("treats unknown errors as unknown", () => {
    expect(classifyModelFailure(new Error("weird parsing bug"))).toBe("unknown");
  });
});

describe("createModelHealthRegistry", () => {
  it("marks a model in cooldown then recovers after the window", () => {
    let clock = 1_000;
    const registry = createModelHealthRegistry({ now: () => clock, cooldownMs: 5_000 });
    registry.markFailure("m1", "transient");
    expect(registry.isAvailable("m1")).toBe(false);
    clock += 6_000;
    expect(registry.isAvailable("m1")).toBe(true);
  });

  it("keeps a terminal model permanently unavailable", () => {
    const registry = createModelHealthRegistry();
    registry.markFailure("m1", "terminal");
    expect(registry.isAvailable("m1")).toBe(false);
    registry.markSuccess("m1");
    expect(registry.isAvailable("m1")).toBe(true);
  });

  it("honors Retry-After when computing cooldown", () => {
    let clock = 0;
    const registry = createModelHealthRegistry({ now: () => clock, cooldownMs: 1_000 });
    registry.markFailure("m1", "transient", { retryAfter: "10" });
    clock = 5_000;
    expect(registry.isAvailable("m1")).toBe(false);
    clock = 11_000;
    expect(registry.isAvailable("m1")).toBe(true);
  });
});

describe("runWithModelFallback", () => {
  it("advances to the next model on a transient failure", async () => {
    const registry = createModelHealthRegistry();
    const execute = vi
      .fn()
      .mockRejectedValueOnce({ status: 503 })
      .mockResolvedValue("ok-from-secondary");
    const result = await runWithModelFallback({
      models: ["primary", "secondary"],
      registry,
      execute,
    });
    expect(result).toBe("ok-from-secondary");
    expect(execute).toHaveBeenCalledTimes(2);
    expect(registry.isAvailable("primary")).toBe(false);
  });

  it("rethrows immediately on an unknown failure", async () => {
    const registry = createModelHealthRegistry();
    const execute = vi.fn().mockRejectedValue(new Error("unexpected"));
    await expect(
      runWithModelFallback({ models: ["a", "b"], registry, execute }),
    ).rejects.toThrow("unexpected");
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it("throws when every model is unavailable", async () => {
    const registry = createModelHealthRegistry();
    registry.markFailure("a", "terminal");
    registry.markFailure("b", "terminal");
    const execute = vi.fn();
    await expect(
      runWithModelFallback({ models: ["a", "b"], registry, execute }),
    ).rejects.toThrow(/no gemini models/i);
    expect(execute).not.toHaveBeenCalled();
  });

  it("throws the last error after exhausting the chain", async () => {
    const registry = createModelHealthRegistry();
    const execute = vi.fn().mockRejectedValue({ status: 429 });
    await expect(
      runWithModelFallback({ models: ["a", "b"], registry, execute }),
    ).rejects.toBeTruthy();
    expect(execute).toHaveBeenCalledTimes(2);
  });
});
