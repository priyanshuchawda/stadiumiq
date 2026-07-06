import { isHttpsUrl } from "@/lib/utils/is-https-url";

const BLOCKED_TAGS =
  /<\/?(?:script|style|iframe|object|embed|form|input|button|link|meta)[^>]*>/gi;
const EVENT_ATTRS = /\s(on[a-z]+)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const HREF_ATTR = /href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi;

function sanitizeHref(rawHref: string): string {
  const decoded = rawHref.replace(/&amp;/g, "&").trim();
  return isHttpsUrl(decoded) ? decoded : "#";
}

function sanitizeHrefAttributes(html: string): string {
  return html.replace(HREF_ATTR, (...groups: string[]) => {
    const href = groups[2] ?? groups[3] ?? groups[4] ?? "";
    return `href="${sanitizeHref(href)}"`;
  });
}

export function sanitizeGroundingHtml(html: string): string {
  const withoutBlocked = html.replace(BLOCKED_TAGS, "");
  const withoutEvents = withoutBlocked.replace(EVENT_ATTRS, "");
  return sanitizeHrefAttributes(withoutEvents);
}
