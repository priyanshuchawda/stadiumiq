export async function register(): Promise<void> {
  if (process.env["NEXT_RUNTIME"] !== "nodejs") {
    return;
  }

  const { validateServerEnv } = await import("@/lib/config/env");
  const { logger } = await import("@/lib/logging/logger");
  const result = validateServerEnv();

  if (!result.ok) {
    logger.error({ errors: result.errors }, "invalid_server_env");
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Invalid server environment: ${result.errors.join("; ")}`);
    }
    return;
  }

  for (const warning of result.warnings) {
    logger.warn({ warning }, "server_env_warning");
  }
}
