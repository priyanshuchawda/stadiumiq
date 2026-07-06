import { ImageUploadButton } from "@/components/ai/image-upload-button";

type ChatComposerProps = {
  input: string;
  loading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onImageSelected: (file: File) => void;
};

const fieldClass =
  "min-h-11 w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950";

export function ChatComposer({
  input,
  loading,
  onInputChange,
  onSubmit,
  onImageSelected,
}: ChatComposerProps): React.JSX.Element {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="grid gap-3"
    >
      <label htmlFor="chat-input" className="sr-only">
        Message to Kai
      </label>
      <textarea
        id="chat-input"
        rows={3}
        value={input}
        onChange={(event) => onInputChange(event.target.value)}
        className={fieldClass}
        placeholder="Ask Kai anything about the stadium..."
        disabled={loading}
      />
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-11 items-center rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Kai is thinking…" : "Send"}
        </button>
        <ImageUploadButton loading={loading} onImageSelected={onImageSelected} />
      </div>
    </form>
  );
}
