import { describe, expect, it } from "vitest";
import { sanitizeForPrompt, stripUnsafeUnicode } from "@/lib/ai/sanitize";

describe("stripUnsafeUnicode", () => {
  it("removes zero-width, bidi-override and private-use characters", () => {
    const input = "he\u200Bllo\u202Eworld\uE000";
    expect(stripUnsafeUnicode(input)).toBe("helloworld");
  });

  it("strips control characters but keeps newlines and tabs", () => {
    const input = "a\u0007b\tc\nd";
    expect(stripUnsafeUnicode(input)).toBe("ab\tc\nd");
  });

  it("leaves ordinary text untouched", () => {
    expect(stripUnsafeUnicode("Gate C — Section 112")).toBe("Gate C — Section 112");
  });
});

describe("sanitizeForPrompt", () => {
  it("NFKC-normalizes and trims", () => {
    const input = "  \uFF21\uFF22\uFF23  "; // fullwidth ABC
    expect(sanitizeForPrompt(input)).toBe("ABC");
  });

  it("collapses runaway inline whitespace and blank lines", () => {
    expect(sanitizeForPrompt("a      b\n\n\n\nc")).toBe("a b\n\nc");
  });

  it("caps length", () => {
    expect(sanitizeForPrompt("x".repeat(100), 10)).toHaveLength(10);
  });

  it("removes a bidi Trojan-source style override", () => {
    expect(sanitizeForPrompt("safe\u202Eevil")).toBe("safeevil");
  });
});
