export function getClientKey(request: Request): string {
  // Prefer platform-provided real IP (Vercel sets x-real-ip) over spoofable XFF.
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp && realIp.length > 0) {
    return realIp;
  }
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }
  return "local";
}
