// React Query hooks for all entities. Components should ONLY use these hooks
// to access content - never import from src/data/ directly.
//
// All hooks return the standard React Query result: { data, isLoading, error, ... }

import { useQuery } from '@tanstack/react-query';
import {
  fetchSources,
  fetchCommunities,
  fetchSelfHelpTools,
  fetchTreatmentSteps,
  fetchChildrenContent,
  fetchRightsFaqs,
  fetchPTSDInfoFaqs,
  fetchSecondCircleTools,
  fetchQuestionnaire,
} from './source';

export function useSources({ lang }) {
  return useQuery({
    queryKey: ['sources', lang],
    queryFn: () => fetchSources({ lang }),
  });
}

export function useCommunities({ lang }) {
  return useQuery({
    queryKey: ['communities', lang],
    queryFn: () => fetchCommunities({ lang }),
  });
}

export function useSelfHelpTools({ lang }) {
  return useQuery({
    queryKey: ['self_help_tools', lang],
    queryFn: () => fetchSelfHelpTools({ lang }),
  });
}

export function useTreatmentSteps({ lang }) {
  return useQuery({
    queryKey: ['treatment_steps', lang],
    queryFn: () => fetchTreatmentSteps({ lang }),
  });
}

export function useChildrenContent({ lang }) {
  return useQuery({
    queryKey: ['children_content', lang],
    queryFn: () => fetchChildrenContent({ lang }),
  });
}

export function useRightsFaqs({ lang, category }) {
  return useQuery({
    queryKey: ['rights_faqs', lang, category],
    queryFn: () => fetchRightsFaqs({ lang, category }),
  });
}

export function usePTSDInfoFaqs({ lang }) {
  return useQuery({
    queryKey: ['ptsd_info_faqs', lang],
    queryFn: () => fetchPTSDInfoFaqs({ lang }),
  });
}

export function useSecondCircleTools({ lang }) {
  return useQuery({
    queryKey: ['second_circle_tools', lang],
    queryFn: () => fetchSecondCircleTools({ lang }),
  });
}

export function useQuestionnaire({ lang, slug = 'pcl-5' }) {
  return useQuery({
    queryKey: ['questionnaire', slug, lang],
    queryFn: () => fetchQuestionnaire({ lang, slug }),
  });
}

// Rights FAQs are the only category-scoped query - each tab is a separate
// cache entry, so warming the cache means prefetching every category.
const RIGHTS_CATEGORIES = ['security_forces', 'sexual_harassment', 'hostilities', 'accidents_work', 'general'];

// Warm the React Query cache with every entity for `lang` in one shot. Query
// keys / fns MUST mirror the hooks above so the pages find cached data and
// never re-fetch (i.e. never show "loading..."). prefetchQuery de-dupes against
// any in-flight request and, with staleTime set on the client, is a no-op when
// the entry is already fresh. Call once on load and on every language change.
export function prefetchAllContent(queryClient, lang) {
  const warm = (queryKey, queryFn) => queryClient.prefetchQuery({ queryKey, queryFn });

  warm(['sources', lang], () => fetchSources({ lang }));
  warm(['communities', lang], () => fetchCommunities({ lang }));
  warm(['self_help_tools', lang], () => fetchSelfHelpTools({ lang }));
  warm(['treatment_steps', lang], () => fetchTreatmentSteps({ lang }));
  warm(['children_content', lang], () => fetchChildrenContent({ lang }));
  warm(['ptsd_info_faqs', lang], () => fetchPTSDInfoFaqs({ lang }));
  warm(['second_circle_tools', lang], () => fetchSecondCircleTools({ lang }));
  warm(['questionnaire', 'pcl-5', lang], () => fetchQuestionnaire({ lang, slug: 'pcl-5' }));
  for (const category of RIGHTS_CATEGORIES) {
    warm(['rights_faqs', lang, category], () => fetchRightsFaqs({ lang, category }));
  }
}
