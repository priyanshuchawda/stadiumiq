export type ServerEnvStatus = {
  hasGeminiKey: boolean;
};

export function checkGeminiKeyConfigured(apiKey: string | undefined): boolean {
  return (
    typeof apiKey === "string" &&
    apiKey.length > 0 &&
    apiKey !== "REPLACE_WITH_YOUR_GEMINI_API_KEY"
  );
}

export function getServerEnvStatus(): ServerEnvStatus {
  return {
    hasGeminiKey: checkGeminiKeyConfigured(process.env["GEMINI_API_KEY"]),
  };
}
