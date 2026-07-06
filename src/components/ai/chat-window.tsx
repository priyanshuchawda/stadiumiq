"use client";

import { useState } from "react";
import { ChatComposer } from "@/components/ai/chat-composer";
import { ChatMessageList } from "@/components/ai/chat-message-list";
import { ContextPanel, createDefaultContext } from "@/components/ai/context-panel";
import { useChatState } from "@/components/ai/use-chat-state";
import type { UserContext } from "@/types/stadium";

type ChatWindowProps = {
  initialContext?: Partial<UserContext>;
};

export function ChatWindow({ initialContext }: ChatWindowProps): React.JSX.Element {
  const [context, setContext] = useState<UserContext>(() =>
    createDefaultContext(initialContext),
  );
  const [input, setInput] = useState("");
  const chat = useChatState(context);

  function handleSubmit(): void {
    const trimmed = input.trim();
    if (!trimmed || chat.loading) {
      return;
    }
    setInput("");
    void chat.sendMessage(trimmed);
  }

  return (
    <div className="grid gap-6">
      <ContextPanel context={context} onChange={setContext} />
      <ChatMessageList
        messages={chat.messages}
        streaming={chat.streaming}
        loading={chat.loading}
      />
      {chat.error ? (
        <p role="alert" className="text-sm text-amber-700 dark:text-amber-300">
          {chat.error}
        </p>
      ) : null}
      <ChatComposer
        input={input}
        loading={chat.loading}
        onInputChange={setInput}
        onSubmit={handleSubmit}
        onImageSelected={(file) => void chat.sendImage(file)}
      />
    </div>
  );
}
