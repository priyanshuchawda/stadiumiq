import { describe, expect, it } from "vitest";
import { sanitizeGroundingHtml } from "@/lib/utils/sanitize-grounding-html";

describe("sanitizeGroundingHtml", () => {
  it("removes scripts and non-https hrefs", () => {
    const html =
      '<div onclick="alert(1)"><script>alert(1)</script><a href="javascript:evil">bad</a><a href="https://example.com">ok</a></div>';
    const sanitized = sanitizeGroundingHtml(html);
    expect(sanitized).not.toContain("<script");
    expect(sanitized).not.toContain("onclick");
    expect(sanitized).toContain('href="https://example.com"');
    expect(sanitized).toContain('href="#"');
  });
});
