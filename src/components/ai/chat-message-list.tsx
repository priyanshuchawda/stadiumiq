import { MessageBubble } from "@/components/ai/message-bubble";
import type { ChatMessage } from "@/components/ai/chat-api";

type ChatMessageListProps = {
  messages: ChatMessage[];
  streaming: string;
  loading: boolean;
};

export function ChatMessageList({
  messages,
  streaming,
  loading,
}: ChatMessageListProps): React.JSX.Element {
  return (
    <div
      aria-live="polite"
      aria-busy={loading}
      className="grid min-h-80 gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
    >
      {messages.map((message) => (
        <MessageBubble key={message.id} role={message.role} content={message.content} />
      ))}
      {streaming ? <MessageBubble role="assistant" content={streaming} /> : null}
      {messages.length === 0 && !streaming ? (
        <p className="text-sm text-zinc-500">
          Ask Kai about routes, crowds, transport, or SOPs.
        </p>
      ) : null}
    </div>
  );
}
