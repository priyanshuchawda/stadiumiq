import type { Persona } from "@/types/domain";
import type { UserContext } from "@/types/stadium";

const PERSONAS: Persona[] = ["fan", "volunteer", "staff", "organizer"];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "ar", label: "العربية" },
  { code: "fr", label: "Français" },
] as const;

type PersonaLanguageFieldsProps = {
  context: UserContext;
  onChange: (context: UserContext) => void;
};

export function PersonaLanguageFields({
  context,
  onChange,
}: PersonaLanguageFieldsProps): React.JSX.Element {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="grid gap-1 text-sm">
        Persona
        <select
          className="min-h-11 rounded-md border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950"
          value={context.persona}
          onChange={(event) =>
            onChange({ ...context, persona: event.target.value as Persona })
          }
        >
          {PERSONAS.map((persona) => (
            <option key={persona} value={persona}>
              {persona}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Language
        <select
          className="min-h-11 rounded-md border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950"
          value={context.language}
          onChange={(event) => onChange({ ...context, language: event.target.value })}
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
