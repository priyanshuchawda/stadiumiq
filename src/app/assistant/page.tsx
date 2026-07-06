import { ChatWindow } from "@/components/ai/chat-window";
import type { Persona } from "@/types/domain";

type AssistantPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function AssistantPage({
  searchParams,
}: AssistantPageProps): Promise<React.JSX.Element> {
  const params = await searchParams;
  const persona = readParam(params["persona"]) as Persona | undefined;
  const language = readParam(params["lang"]);

  return (
    <main id="main-content" className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-bold">Kai Assistant</h1>
      <p className="mt-2 mb-6 text-zinc-600 dark:text-zinc-400">
        Context-aware GenAI copilot for fans, volunteers, staff, and organizers.
      </p>
      <ChatWindow
        initialContext={{
          ...(persona ? { persona } : {}),
          ...(language ? { language } : {}),
        }}
      />
    </main>
  );
}
