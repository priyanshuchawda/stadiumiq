import "server-only";
import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey || apiKey === "REPLACE_WITH_YOUR_GEMINI_API_KEY") {
    return null;
  }
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

export function resetGeminiClientForTests(): void {
  client = null;
}
