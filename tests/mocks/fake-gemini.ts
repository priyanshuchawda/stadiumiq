import type { GenerateContentResponse, GoogleGenAI } from "@google/genai";

type ScriptedTurn =
  | { functionCalls: { name: string; args?: Record<string, unknown> }[] }
  | { text: string }
  | { empty: true };

/**
 * Builds a scripted GenerateContentResponse for a turn. Only the fields our
 * orchestration reads (`text`, `functionCalls`, `candidates`) are populated.
 */
function buildResponse(turn: ScriptedTurn): GenerateContentResponse {
  if ("functionCalls" in turn) {
    return {
      functionCalls: turn.functionCalls,
      candidates: [{ content: { role: "model", parts: [] } }],
    } as unknown as GenerateContentResponse;
  }
  if ("empty" in turn) {
    return { candidates: [] } as unknown as GenerateContentResponse;
  }
  return {
    text: turn.text,
    candidates: [{ content: { role: "model", parts: [{ text: turn.text }] } }],
  } as unknown as GenerateContentResponse;
}

export type FakeGemini = {
  client: GoogleGenAI;
  generateContentCalls: number;
};

/**
 * Deterministic in-memory Gemini test double (inspired by Gemini CLI's
 * `fakeContentGenerator`). Replays a scripted sequence of turns for
 * generateContent and a fixed set of chunks for generateContentStream — no
 * network, no MSW, fully deterministic for orchestration/loop tests.
 */
export function createFakeGemini(options: {
  turns: ScriptedTurn[];
  streamChunks?: (string | null)[];
}): FakeGemini {
  const state = { generateContentCalls: 0 };
  const turns = [...options.turns];

  const generateContent = async (): Promise<GenerateContentResponse> => {
    state.generateContentCalls += 1;
    const turn = turns.shift() ?? { text: "" };
    return buildResponse(turn);
  };

  const generateContentStream = async (): Promise<
    AsyncGenerator<GenerateContentResponse>
  > => {
    const chunks = options.streamChunks ?? ["Hello ", "world."];
    async function* iterate(): AsyncGenerator<GenerateContentResponse> {
      for (const chunk of chunks) {
        yield { text: chunk ?? undefined } as unknown as GenerateContentResponse;
      }
    }
    return iterate();
  };

  const client = {
    models: { generateContent, generateContentStream },
  } as unknown as GoogleGenAI;

  return {
    client,
    get generateContentCalls() {
      return state.generateContentCalls;
    },
  };
}
