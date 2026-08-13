import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { computeSeo, applySeo } from '@/lib/seo';

/**
 * Keeps <title>, the meta description, the canonical URL and the Open Graph
 * tags in step with the current route and language. Called once, from Layout.
 * All the logic lives in src/lib/seo.js - this is just the React binding.
 */
export default function useSeo() {
  const { pathname } = useLocation();
  const { lang } = useLang();

  useEffect(() => {
    applySeo(document, computeSeo(lang, pathname));
  }, [pathname, lang]);
}
