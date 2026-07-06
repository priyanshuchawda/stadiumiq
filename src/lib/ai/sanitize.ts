/**
 * Text sanitization for prompt-injection defense (inspired by Claude Code's
 * input hardening). Removes invisible/deceptive Unicode that can smuggle
 * hidden instructions past a human reviewer or reorder rendered text:
 *   - C0/C1 control chars (except tab/newline/carriage-return)
 *   - Zero-width and word-joiner characters
 *   - Bidirectional override/isolate controls (Trojan Source style attacks)
 *   - Private Use Area code points (custom glyph smuggling)
 */

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
const ZERO_WIDTH = /[\u200B-\u200F\u2060-\u2064\uFEFF]/g;
const BIDI_CONTROLS = /[\u202A-\u202E\u2066-\u2069]/g;
const PRIVATE_USE = /[\uE000-\uF8FF]/g;

/**
 * Strips deceptive/invisible Unicode without altering visible text. Safe to
 * apply to individual streaming chunks (operates per code point).
 */
export function stripUnsafeUnicode(text: string): string {
  return text
    .replace(CONTROL_CHARS, "")
    .replace(ZERO_WIDTH, "")
    .replace(BIDI_CONTROLS, "")
    .replace(PRIVATE_USE, "");
}

/**
 * Full sanitization for text entering a prompt (user messages, grounded
 * results, tool-sourced titles): NFKC-normalize, strip unsafe Unicode, collapse
 * runaway whitespace, trim, and optionally cap length.
 */
export function sanitizeForPrompt(text: string, maxLength = 4_000): string {
  const normalized = text.normalize("NFKC");
  const stripped = stripUnsafeUnicode(normalized);
  const collapsed = stripped.replace(/[^\S\n]{2,}/g, " ").replace(/\n{3,}/g, "\n\n");
  const trimmed = collapsed.trim();
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}
