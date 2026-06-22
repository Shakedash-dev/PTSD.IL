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

export function useSources() {
  return useQuery({
    queryKey: ['sources'],
    queryFn: fetchSources,
  });
}

export function useCommunities() {
  return useQuery({
    queryKey: ['communities'],
    queryFn: fetchCommunities,
  });
}

export function useSelfHelpTools() {
  return useQuery({
    queryKey: ['self_help_tools'],
    queryFn: fetchSelfHelpTools,
  });
}

export function useTreatmentSteps() {
  return useQuery({
    queryKey: ['treatment_steps'],
    queryFn: fetchTreatmentSteps,
  });
}

export function useChildrenContent() {
  return useQuery({
    queryKey: ['children_content'],
    queryFn: fetchChildrenContent,
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
