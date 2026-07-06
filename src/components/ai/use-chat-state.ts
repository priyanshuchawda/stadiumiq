"use client";

import { useRef, useState } from "react";
import { submitChatMessage, submitVisionImage } from "@/components/ai/chat-actions";
import type { ChatMessage } from "@/components/ai/chat-api";
import type { UserContext } from "@/types/stadium";

export function useChatState(context: UserContext) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const callbacks = { setMessages, setStreaming, setError, setLoading };

  async function sendMessage(text: string): Promise<void> {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    await submitChatMessage(text, context, controller, callbacks);
  }

  async function sendImage(file: File): Promise<void> {
    await submitVisionImage(file, context, callbacks);
  }

  return { messages, streaming, loading, error, sendMessage, sendImage };
}
