import { describe, expect, it } from "vitest";
import { buildGroundedSystemPrompt, buildSystemPrompt } from "@/lib/ai/prompts";
import type { UserContext } from "@/types/stadium";

const base: UserContext = {
  persona: "fan",
  language: "en",
  accessibility: { mobility: "none", lowVision: false, sensorySensitive: false },
};

describe("buildSystemPrompt branches", () => {
  it("includes location and minutes-to-kickoff when provided", () => {
    const prompt = buildSystemPrompt({
      ...base,
      location: { gate: "C", section: "112" },
      minutesToKickoff: 45,
    });
    expect(prompt).toContain("gate=C");
    expect(prompt).toContain("section=112");
    expect(prompt).toContain("Minutes to kickoff: 45");
  });

  it("marks location unknown and omits kickoff when absent", () => {
    const prompt = buildSystemPrompt(base);
    expect(prompt).toContain("Location: unknown");
    expect(prompt).not.toContain("Minutes to kickoff");
  });

  it("falls back to 'unknown' for a partially specified location", () => {
    const prompt = buildSystemPrompt({ ...base, location: { section: "205" } });
    expect(prompt).toContain("gate=unknown");
    expect(prompt).toContain("section=205");
  });

  it("adds grounding guidance for the grounded prompt", () => {
    const prompt = buildGroundedSystemPrompt(base);
    expect(prompt).toContain("Google Search grounding");
  });
});
