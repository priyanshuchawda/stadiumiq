import {
  sendChatMessage,
  sendGroundedMessage,
  sendVisionRequest,
} from "@/components/ai/chat-api";
import { detectGroundingIntent } from "@/lib/grounding/detect-intent";
import type { ChatMessage } from "@/components/ai/chat-api";
import type { UserContext } from "@/types/stadium";

type ChatCallbacks = {
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setStreaming: React.Dispatch<React.SetStateAction<string>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

type SubmitChatInput = {
  text: string;
  context: UserContext;
  controller: AbortController;
  callbacks: ChatCallbacks;
  groundingTopic?: string | undefined;
};

export async function submitChatMessage(input: SubmitChatInput): Promise<void> {
  if (detectGroundingIntent(input.text, input.groundingTopic)) {
    await submitGroundedChatMessage(input.text, input.context, input.callbacks);
    return;
  }

  const { text, context, controller, callbacks } = input;
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

async function submitGroundedChatMessage(
  text: string,
  context: UserContext,
  callbacks: ChatCallbacks,
): Promise<void> {
  callbacks.setError(null);
  callbacks.setLoading(true);
  callbacks.setMessages((prev) => [
    ...prev,
    { id: crypto.randomUUID(), role: "user", content: text },
  ]);

  try {
    const grounded = await sendGroundedMessage(text, context);
    callbacks.setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: grounded.answer,
        grounding: grounded,
      },
    ]);
    if (grounded.fallback) {
      callbacks.setError(
        "Live search unavailable — showing seeded transport guidance.",
      );
    }
  } catch (groundedError) {
    callbacks.setError(
      groundedError instanceof Error
        ? groundedError.message
        : "Grounded request failed",
    );
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
