import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '@/lib/LanguageContext';
import { ChatProvider } from '@/lib/ChatContext';
import { ValidationProvider } from '@/contexts/ValidationContext';
import { UserTypeProvider } from '@/contexts/UserTypeContext';

// Every page reads its content through these hooks. Stub them so the pages
// render against empty-but-valid data instead of hitting the live API.
vi.mock('@/api/hooks', () => {
  const empty = { data: [], isLoading: false, error: null };
  const one = { data: null, isLoading: false, error: null };
  return {
    useSources: () => empty,
    useCommunities: () => empty,
    useSelfHelpTools: () => empty,
    useTreatmentSteps: () => empty,
    useChildrenContent: () => empty,
    useRightsFaqs: () => empty,
    usePTSDInfoFaqs: () => empty,
    useSecondCircleTools: () => empty,
    useQuestionnaire: () => one,
  };
});

import Calming from '@/pages/Calming';
import CalmingBreathing from '@/pages/CalmingBreathing';
import CalmingGrounding from '@/pages/CalmingGrounding';
import CalmingMuscle from '@/pages/CalmingMuscle';
import Children from '@/pages/Children';
import Community from '@/pages/Community';
import FirstCircle from '@/pages/FirstCircle';
import Home from '@/pages/Home';
import PTSDInfo from '@/pages/PTSDInfo';
import PTSDInfo2 from '@/pages/PTSDInfo2';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import Questionnaire from '@/pages/Questionnaire';
import Rights from '@/pages/Rights';
import SecondCircle from '@/pages/SecondCircle';
import SecondCircleTools from '@/pages/SecondCircleTools';
import SelfHelp from '@/pages/SelfHelp';
import Sources from '@/pages/Sources';
import TermsOfUse from '@/pages/TermsOfUse';
import Treatment from '@/pages/Treatment';

const PAGES = {
  Calming, CalmingBreathing, CalmingGrounding, CalmingMuscle, Children,
  Community, FirstCircle, Home, PTSDInfo, PTSDInfo2, PrivacyPolicy,
  Questionnaire, Rights, SecondCircle, SecondCircleTools, SelfHelp, Sources,
  TermsOfUse, Treatment,
};

function Providers({ children }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return (
    <QueryClientProvider client={client}>
      <LanguageProvider>
        <ChatProvider>
          <ValidationProvider>
            <MemoryRouter>
              <UserTypeProvider>{children}</UserTypeProvider>
            </MemoryRouter>
          </ValidationProvider>
        </ChatProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

// Public pages have no automated coverage otherwise, so a runtime error - an
// undefined component, a bad hook call, a missing import - would only surface
// in a browser. `npm run build` does not catch those; this does.
describe('every public page renders', () => {
  let errorSpy;

  beforeEach(() => {
    localStorage.setItem('natal_lang', 'he');
    errorSpy = vi.spyOn(console, 'error');
  });

  afterEach(() => {
    errorSpy.mockRestore();
    cleanup();
    localStorage.clear();
  });

  /** React reports bad markup - invalid DOM nesting, missing keys - through
   *  console.error rather than by throwing, so a render that "passes" can still
   *  be broken. Fail on those. */
  const reactComplaints = () =>
    errorSpy.mock.calls
      .map((args) => String(args[0]))
      .filter((msg) => msg.includes('Warning:') || msg.includes('validateDOMNesting'));

  for (const [name, Page] of Object.entries(PAGES)) {
    it(`${name} renders cleanly`, () => {
      const { container } = render(<Providers><Page /></Providers>);
      expect(container.firstChild).not.toBeNull();
      expect(reactComplaints()).toEqual([]);
    });
  }

  it('renders in an LTR language too', () => {
    localStorage.setItem('natal_lang', 'en');
    const { container } = render(<Providers><Home /></Providers>);
    expect(container.firstChild).not.toBeNull();
    expect(reactComplaints()).toEqual([]);
  });
});
