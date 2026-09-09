import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '@/lib/LanguageContext';
import { translations, setCopyOverrides, clearCopyOverrides, LANGUAGES } from '@/lib/i18n';
import CalmingBreathing from '@/pages/CalmingBreathing';
import CalmingGrounding from '@/pages/CalmingGrounding';
import CalmingMuscle from '@/pages/CalmingMuscle';

// The three exercises used to hold their clinician-authored scripts as
// per-language tables inside the page files, where /admin could not reach them.
// They now read from i18n like the rest of the site's copy. These tests pin
// that the wording still reaches the screen, in every language, and that an
// admin override reaches it too.

function renderPage(ui, lang = 'he') {
  localStorage.setItem('natal_lang', lang);
  return render(<LanguageProvider><MemoryRouter>{ui}</MemoryRouter></LanguageProvider>);
}

const SCRIPT_KEYS = [
  'breathing_setup_title', 'breathing_setup_step_1', 'breathing_setup_step_4',
  'breathing_inhale', 'breathing_hold', 'breathing_exhale',
  'ground_step_5', 'ground_step_1', 'ground_tip_5', 'ground_tip_1',
  'ground_next', 'ground_finish', 'ground_again',
  'muscle_page_title', 'muscle_intro', 'muscle_done_title',
  'muscle_group_1_name', 'muscle_group_1_squeeze', 'muscle_group_6_release',
  'crisis_line_short',
];

describe('calming scripts live in i18n', () => {
  afterEach(() => { cleanup(); localStorage.clear(); clearCopyOverrides(); });

  it('carries every exercise string in all five languages', () => {
    for (const { code } of LANGUAGES) {
      for (const key of SCRIPT_KEYS) {
        expect(translations[code]?.[key], `${code}.${key}`).toBeTruthy();
      }
    }
  });

  it('breathing shows its setup script and starts the cycle', () => {
    renderPage(<CalmingBreathing />);
    expect(screen.getByText(translations.he.breathing_setup_title)).toBeInTheDocument();
    expect(screen.getByText(translations.he.breathing_setup_step_1)).toBeInTheDocument();
    expect(screen.getByText(translations.he.breathing_setup_step_4)).toBeInTheDocument();
    expect(screen.getByText(translations.he.crisis_line_short)).toBeInTheDocument();

    fireEvent.click(screen.getByText(translations.he.breathing_start));
    // Phase strip + the label under the circle both name the current phase.
    expect(screen.getAllByText(translations.he.breathing_inhale).length).toBeGreaterThan(0);
    expect(screen.getByText(translations.he.breathing_exhale)).toBeInTheDocument();
    expect(screen.getByText(translations.he.breathing_stop)).toBeInTheDocument();
  });

  it('grounding walks 5 to 1 with the right instruction and tip at each step', () => {
    renderPage(<CalmingGrounding />);
    for (const num of [5, 4, 3, 2, 1]) {
      expect(screen.getByText(translations.he[`ground_step_${num}`])).toBeInTheDocument();
      expect(screen.getByText(translations.he[`ground_tip_${num}`])).toBeInTheDocument();
      const label = num === 1 ? translations.he.ground_finish : translations.he.ground_next;
      fireEvent.click(screen.getByText(label));
    }
    expect(screen.getByText(translations.he.ground_complete)).toBeInTheDocument();
    expect(screen.getByText(translations.he.ground_again)).toBeInTheDocument();
  });

  it('muscle shows the intro, then the first group name and its squeeze cue', () => {
    renderPage(<CalmingMuscle />);
    expect(screen.getByText(translations.he.muscle_page_title)).toBeInTheDocument();
    expect(screen.getByText(translations.he.muscle_intro)).toBeInTheDocument();

    fireEvent.click(screen.getByText(translations.he.muscle_start));
    expect(screen.getByText(translations.he.muscle_group_1_name)).toBeInTheDocument();
    expect(screen.getByText(translations.he.muscle_group_1_squeeze)).toBeInTheDocument();
    expect(screen.getByText(translations.he.muscle_squeeze_label)).toBeInTheDocument();
  });

  it('renders the English script when the language is English', () => {
    renderPage(<CalmingGrounding />, 'en');
    expect(screen.getByText(translations.en.ground_step_5)).toBeInTheDocument();
    expect(screen.getByText(translations.en.ground_tip_5)).toBeInTheDocument();
  });

  it('shows an admin override instead of the shipped script', () => {
    setCopyOverrides('he', { ground_step_5: 'נוסח שנערך בממשק הניהול' });
    renderPage(<CalmingGrounding />);
    expect(screen.getByText('נוסח שנערך בממשק הניהול')).toBeInTheDocument();
    expect(screen.queryByText(translations.he.ground_step_5)).not.toBeInTheDocument();
  });
});
