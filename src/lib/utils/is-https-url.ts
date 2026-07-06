export function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function sanitizeHttpsUrl(value: string): string | null {
  const trimmed = value.trim();
  return isHttpsUrl(trimmed) ? trimmed : null;
}
