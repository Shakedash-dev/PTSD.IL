import { useLang } from '@/lib/LanguageContext';
import { getDir } from '@/lib/i18n';

/**
 * Text direction for the active language.
 *
 * Derives direction from LanguageContext rather than reading the `dir`
 * attribute off document.documentElement. LanguageProvider writes that
 * attribute inside an effect, so a component reading it during render saw the
 * previous language's direction on the render immediately after a switch -
 * which is what the four hand-rolled copies this replaces all did.
 *
 * Unknown language codes fall back to RTL, matching getDir.
 *
 * @returns {{ dir: 'rtl' | 'ltr', isRTL: boolean }}
 */
export default function useDirection() {
  const { lang } = useLang();
  const dir = getDir(lang);
  return { dir, isRTL: dir === 'rtl' };
}
