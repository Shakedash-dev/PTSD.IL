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
} from './source';

export function useSources({ lang }) {
  return useQuery({
    queryKey: ['sources', lang],
    queryFn: () => fetchSources({ lang }),
  });
}

export function useCommunities() {
  return useQuery({
    queryKey: ['communities'],
    queryFn: fetchCommunities,
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
