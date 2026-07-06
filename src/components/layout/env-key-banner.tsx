import { getServerEnvStatus } from "@/lib/env/server-env";

export function EnvKeyBanner(): React.JSX.Element | null {
  const { hasGeminiKey } = getServerEnvStatus();

  if (hasGeminiKey) {
    return null;
  }

  return (
    <div
      role="status"
      className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
    >
      <strong>Gemini API key missing.</strong> Add{" "}
      <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">
        GEMINI_API_KEY
      </code>{" "}
      to <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">.env.local</code>{" "}
      to enable live AI features. The app will still run with graceful fallbacks.
    </div>
  );
}
