import { MessageBubble } from "@/components/ai/message-bubble";
import type { ChatMessage } from "@/components/ai/chat-api";

type ChatMessageListProps = {
  messages: ChatMessage[];
  streaming: string;
  loading: boolean;
};

function LiveStatusAnnouncer({
  loading,
  streaming,
  messages,
}: Pick<
  ChatMessageListProps,
  "loading" | "streaming" | "messages"
>): React.JSX.Element {
  const lastAssistant = messages.at(-1);
  const status =
    loading && !streaming
      ? "Kai is thinking."
      : !loading && lastAssistant?.role === "assistant"
        ? `Kai replied: ${lastAssistant.content}`
        : null;

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {status}
    </div>
  );
}

export function ChatMessageList({
  messages,
  streaming,
  loading,
}: ChatMessageListProps): React.JSX.Element {
  const showEmptyHint = messages.length === 0 && !streaming;

  return (
    <div
      aria-busy={loading}
      className="grid min-h-80 gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <div aria-live="off" className="grid gap-3">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            role={message.role}
            content={message.content}
            grounding={message.grounding}
            language={message.language}
          />
        ))}
      </div>
      {streaming ? (
        <MessageBubble role="assistant" content={streaming} ariaLive="off" />
      ) : null}
      {showEmptyHint ? (
        <p className="text-sm text-zinc-500">
          Ask Kai about routes, crowds, transport, or SOPs.
        </p>
      ) : null}
      <LiveStatusAnnouncer
        loading={loading}
        streaming={streaming}
        messages={messages}
      />
    </div>
  );
}
