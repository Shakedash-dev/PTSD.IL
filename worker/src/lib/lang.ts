// Detect the language the user actually wrote in, so the bot replies in THAT
// language rather than whatever the site UI happens to be set to. Scripts pin
// he/ar/ru unambiguously; the only hard case is English vs French (both Latin),
// resolved by French-specific letters/words, defaulting Latin text to English.
// `fallback` (the site's UI language) is used only when the text carries no
// decisive signal at all (digits/punctuation/emoji only).

export const SUPPORTED_LANGS = ["he", "ar", "en", "ru", "fr"] as const;

// French-only accented letters + common French function words that are NOT also
// English words (so they don't false-positive on English input).
const FRENCH_LETTERS = /[àâæçéèêëîïôœùûÿ]/i;
const FRENCH_WORDS =
  /\b(je|j'ai|c'est|qu'est|est-ce|s'il|pourquoi|quels|quelles|combien|bonjour|merci|nous|vous|droits?|aide|besoin)\b/i;

export function detectLang(text: string, fallback: string): string {
  const t = text || "";
  if (/[֐-׿]/.test(t)) return "he";                 // Hebrew block
  if (/[؀-ۿݐ-ݿ]/.test(t)) return "ar";    // Arabic blocks
  if (/[Ѐ-ӿ]/.test(t)) return "ru";                 // Cyrillic
  if (FRENCH_LETTERS.test(t) || FRENCH_WORDS.test(t)) return "fr";
  if (/[a-z]/i.test(t)) return "en";                          // any other Latin → English
  return (SUPPORTED_LANGS as readonly string[]).includes(fallback) ? fallback : "he";
}
