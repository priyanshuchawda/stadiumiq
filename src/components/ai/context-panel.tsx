import {
  AccessibilityFields,
  LocationFields,
} from "@/components/ai/accessibility-fields";
import { PersonaLanguageFields } from "@/components/ai/persona-language-fields";
import type { UserContext } from "@/types/stadium";

type ContextPanelProps = {
  context: UserContext;
  onChange: (context: UserContext) => void;
};

export function ContextPanel({
  context,
  onChange,
}: ContextPanelProps): React.JSX.Element {
  return (
    <section
      aria-label="Assistant context settings"
      className="grid gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <PersonaLanguageFields context={context} onChange={onChange} />
      <AccessibilityFields context={context} onChange={onChange} />
      <LocationFields context={context} onChange={onChange} />
    </section>
  );
}

export function createDefaultContext(overrides?: Partial<UserContext>): UserContext {
  return {
    persona: "fan",
    language: "en",
    accessibility: { mobility: "none", lowVision: false, sensorySensitive: false },
    location: { gate: "C", section: "112" },
    ...overrides,
  };
}
