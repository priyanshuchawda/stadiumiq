import { describe, expect, it } from "vitest";
import { sanitizeGroundingHtml } from "@/lib/utils/sanitize-grounding-html";

describe("sanitizeGroundingHtml", () => {
  it("removes scripts and event handlers", () => {
    const html =
      '<div onclick="alert(1)"><script>alert(1)</script><a href="https://example.com">ok</a></div>';
    const sanitized = sanitizeGroundingHtml(html);
    expect(sanitized).not.toContain("<script");
    expect(sanitized).not.toContain("onclick");
    expect(sanitized).toContain("https://example.com");
  });

  it("blocks javascript: and data: href schemes", () => {
    const html =
      '<a href="javascript:alert(1)">bad</a><a href="data:text/html,evil">bad2</a>';
    const sanitized = sanitizeGroundingHtml(html);
    expect(sanitized.toLowerCase()).not.toContain("javascript:");
    expect(sanitized.toLowerCase()).not.toContain("data:text/html");
  });

  it("strips nested script tags that bypass flat regex filters", () => {
    const html = "<scr<script>ipt>alert(1)</scr<script>ipt>";
    const sanitized = sanitizeGroundingHtml(html);
    expect(sanitized.toLowerCase()).not.toContain("script");
  });
});
