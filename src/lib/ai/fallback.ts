import type { UserContext } from "@/types/stadium";

type FallbackVariant = "wheelchair" | "standard";

/**
 * Deterministic zero-key answers in every UI language. The same context that
 * shapes live prompts (language + mobility) shapes the offline answer, so the
 * experience stays multilingual and accessibility-aware without a model.
 */
const FALLBACK_ANSWERS = {
  en: {
    wheelchair:
      "Use Gate C for step-free entry. Head to the North Concourse accessible ramp toward Section 112. The nearest accessible restroom is on the North Concourse.",
    standard:
      "Gate C currently has the shortest wait. Follow concourse signage to your section and allow extra time near Gate B.",
  },
  es: {
    wheelchair:
      "Usa la Puerta C para entrar sin escalones. Sigue la rampa accesible de la explanada norte hacia la Sección 112. El baño accesible más cercano está en la explanada norte.",
    standard:
      "La Puerta C tiene actualmente la espera más corta. Sigue la señalización de la explanada hasta tu sección y prevé tiempo extra cerca de la Puerta B.",
  },
  fr: {
    wheelchair:
      "Utilisez la Porte C pour une entrée sans marches. Suivez la rampe accessible du hall nord vers la Section 112. Les toilettes accessibles les plus proches se trouvent dans le hall nord.",
    standard:
      "La Porte C a actuellement l'attente la plus courte. Suivez la signalétique du hall jusqu'à votre section et prévoyez plus de temps près de la Porte B.",
  },
  ar: {
    wheelchair:
      "استخدم البوابة C للدخول من دون درجات. اتجه إلى المنحدر المخصص لذوي الإعاقة في الردهة الشمالية نحو القسم 112. أقرب دورة مياه مهيأة توجد في الردهة الشمالية.",
    standard:
      "البوابة C لديها حاليًا أقصر مدة انتظار. اتبع لافتات الردهة حتى تصل إلى قسمك وخصص وقتًا إضافيًا قرب البوابة B.",
  },
} as const satisfies Record<string, Record<FallbackVariant, string>>;

type SupportedLanguage = keyof typeof FALLBACK_ANSWERS;

function isSupportedLanguage(code: string): code is SupportedLanguage {
  return code in FALLBACK_ANSWERS;
}

/** Maps region-tagged codes ("es-MX") to a supported base language, else English. */
function normalizeLanguage(language: string): SupportedLanguage {
  const code = language.trim().slice(0, 2).toLowerCase();
  return isSupportedLanguage(code) ? code : "en";
}

export function buildKaiFallbackAnswer(context: UserContext): string {
  const variant: FallbackVariant =
    context.accessibility.mobility === "wheelchair" ? "wheelchair" : "standard";
  return FALLBACK_ANSWERS[normalizeLanguage(context.language)][variant];
}
