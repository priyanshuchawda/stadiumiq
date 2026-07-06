import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = ["a", "div", "span", "p", "ul", "ol", "li", "strong", "em", "br"];
const ALLOWED_ATTR = ["href", "class", "target", "rel"];

/**
 * Sanitizes Google Search grounding widget HTML with DOMPurify (allowlist-only).
 * Replaces the previous regex sanitizer which was bypassable via nested tags and
 * slash-separated event attributes.
 */
export function sanitizeGroundingHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
  });
}
