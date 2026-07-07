import { describe, expect, it, vi } from "vitest";
import { askKai } from "@/lib/ai/assistant-service";
import type { UserContext } from "@/types/stadium";

vi.mock("@/lib/ai/client", () => ({
  getGeminiClient: () => null,
  resetGeminiClientForTests: vi.fn(),
}));

const wheelchairFan: UserContext = {
  persona: "fan",
  language: "es",
  accessibility: { mobility: "wheelchair", lowVision: false, sensorySensitive: false },
};

const generalFan: UserContext = {
  persona: "fan",
  language: "en",
  accessibility: { mobility: "none", lowVision: false, sensorySensitive: false },
};

describe("askKai fallback divergence", () => {
  it("diverges by mobility need and answers in the user's language", async () => {
    const question = "Which gate should I use?";
    const wheelchair = await askKai({ context: wheelchairFan, message: question });
    const general = await askKai({ context: generalFan, message: question });

    expect(wheelchair.answer).not.toEqual(general.answer);
    // Spanish-speaking wheelchair user gets a step-free answer in Spanish.
    expect(wheelchair.answer.toLowerCase()).toContain("sin escalones");
    expect(general.answer.toLowerCase()).toContain("shortest wait");
  });
});
