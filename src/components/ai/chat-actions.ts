import { sendChatMessage, sendVisionRequest } from "@/components/ai/chat-api";
import type { ChatMessage } from "@/components/ai/chat-api";
import type { UserContext } from "@/types/stadium";

type ChatCallbacks = {
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setStreaming: React.Dispatch<React.SetStateAction<string>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

export async function submitChatMessage(
  text: string,
  context: UserContext,
  controller: AbortController,
  callbacks: ChatCallbacks,
): Promise<void> {
  callbacks.setError(null);
  callbacks.setLoading(true);
  callbacks.setStreaming("");
  callbacks.setMessages((prev) => [
    ...prev,
    { id: crypto.randomUUID(), role: "user", content: text },
  ]);

  try {
    let assistantText = "";
    const meta = await sendChatMessage(
      text,
      context,
      (token) => {
        assistantText += token;
        callbacks.setStreaming(assistantText);
      },
      controller.signal,
    );
    callbacks.setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "assistant", content: assistantText },
    ]);
    callbacks.setStreaming("");
    if (meta.fallback) {
      callbacks.setError("Live AI unavailable — showing offline guidance.");
    }
  } catch (submitError) {
    if (!controller.signal.aborted) {
      callbacks.setError(
        submitError instanceof Error ? submitError.message : "Request failed",
      );
    }
  } finally {
    callbacks.setLoading(false);
  }
}

export async function submitVisionImage(
  file: File,
  context: UserContext,
  callbacks: ChatCallbacks,
): Promise<void> {
  callbacks.setLoading(true);
  callbacks.setError(null);
  try {
    const answer = await sendVisionRequest(
      file,
      context,
      "Translate and explain this stadium sign or menu.",
    );
    callbacks.setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: `[Photo: ${file.name}]` },
      { id: crypto.randomUUID(), role: "assistant", content: answer },
    ]);
  } catch (visionError) {
    callbacks.setError(
      visionError instanceof Error ? visionError.message : "Vision failed",
    );
  } finally {
    callbacks.setLoading(false);
  }
}
