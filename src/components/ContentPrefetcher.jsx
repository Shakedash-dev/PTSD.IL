import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLang } from '@/lib/LanguageContext';
import { prefetchAllContent } from '@/api/hooks';

// Renders nothing. On first load (and whenever the language changes) it warms
// the React Query cache with every page's content for the active language, so
// navigating between pages finds the data already cached and never shows a
// "loading..." state. See prefetchAllContent in src/api/hooks.js.
export default function ContentPrefetcher() {
  const queryClient = useQueryClient();
  const { lang } = useLang();

  useEffect(() => {
    prefetchAllContent(queryClient, lang);
  }, [queryClient, lang]);

  return null;
}
