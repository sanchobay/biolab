// @vitest-environment jsdom
// T9 (ExecPlan 0010, PRD-0006 §1–§6): the working Lab Tutor in Learn, "Ask the Lab Tutor", About and the README.
import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../src/ui/App';
import { speechStore } from '../../src/ui/speech/speechController';
import { installFakeSpeech, removeFakeSpeech } from './fakeSpeech';

vi.mock('react-chartjs-2', () => ({ Line: () => null }));

const FULL_RUN_MS = 30_500;
const HONESTY = 'Answers are generated from your run and the model — not by an AI language model.';

function setup(): UserEvent {
  const user = userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });
  render(<App />);
  return user;
}

const tutor = () => screen.getByRole('region', { name: 'Lab Tutor' });
const chip = (name: string) => within(tutor()).getByRole('button', { name });
const answerText = () => (tutor().querySelector('[aria-live="polite"]')?.textContent ?? '').replace(/[\u00a0\u202f]/g, ' ');

async function runAt45(user: UserEvent): Promise<void> {
  const field = screen.getByRole('textbox', { name: 'Temperature value' });
  await user.clear(field);
  await user.type(field, '45{Enter}');
  await user.click(screen.getByTestId('run-button'));
  await act(async () => {
    vi.advanceTimersByTime(FULL_RUN_MS);
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  installFakeSpeech();
});

afterEach(() => {
  cleanup();
  act(() => speechStore.reset());
  removeFakeSpeech();
  vi.useRealTimers();
  document.documentElement.setAttribute('lang', 'en');
});

describe('T9 Lab Tutor', () => {
  it('is a working, honestly labelled tutor in Learn, with chips and no text box', async () => {
    const user = setup();
    await user.click(screen.getByRole('link', { name: 'Learn' }));
    expect(within(tutor()).getByText(HONESTY)).toBeTruthy();
    expect(tutor().textContent).not.toContain('Preview');
    expect(within(tutor()).queryByRole('textbox')).toBeNull();
    expect(screen.getByRole('link', { name: 'Lab Tutor' })).toBeTruthy();

    const chips = within(tutor()).getAllByRole('button').filter((button) => button.hasAttribute('aria-pressed'));
    expect(chips.map((button) => button.textContent)).toEqual([
      'Why did my biomass decrease?',
      'Why did pH increase?',
      'What parameter should I investigate next?',
      'Explain photoinhibition simply.',
    ]);

    await user.click(chip('Why did my biomass decrease?'));
    expect(chip('Why did my biomass decrease?').getAttribute('aria-pressed')).toBe('true');
    expect(answerText()).toContain('Run the experiment first — I answer from your run.');
  });

  it('answers from a 45.0 °C run after "Ask the Lab Tutor", one answer at a time, in the chosen language', async () => {
    const user = setup();
    await runAt45(user);

    await user.click(within(screen.getByRole('region', { name: "What's happening in the culture?" })).getByRole('button', { name: 'Ask the Lab Tutor' }));
    expect(document.activeElement?.id).toBe('learn-tutor');
    expect(chip('Why did heat stress happen?')).toBeTruthy();
    expect(chip('Why is culture health stressed?')).toBeTruthy();
    expect(chip('Why is net O₂ negative even in the light?')).toBeTruthy();

    await user.click(chip('Why did my biomass decrease?'));
    expect(answerText()).toContain('Relative biomass went from 1.00 to 0.94 × initial by 24:00, so it decreased.');
    expect(answerText()).toContain('Based on your run at 24:00: 45.0 °C');
    expect(within(tutor()).getByRole('button', { name: 'Read aloud' })).toBeTruthy();

    await user.click(chip('Why is culture health stressed?'));
    expect(chip('Why did my biomass decrease?').getAttribute('aria-pressed')).toBe('false');
    expect(answerText()).not.toContain('Relative biomass went from');
    expect(answerText()).toContain('delayed');

    await user.click(screen.getByRole('button', { name: 'Русский' }));
    const ruTutor = screen.getByRole('region', { name: 'Наставник лаборатории' });
    expect(within(ruTutor).getByRole('button', { name: 'Почему состояние культуры — «Стресс»?' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('returns to the no-run state after Reset', async () => {
    const user = setup();
    await runAt45(user);
    await user.click(screen.getByRole('link', { name: 'Learn' }));
    await user.click(chip('Why did heat stress happen?'));
    expect(answerText()).toContain('Heat stress');

    await user.click(screen.getByRole('link', { name: 'Experiments' }));
    await user.click(screen.getByRole('button', { name: /^Reset/ }));
    await user.click(screen.getByRole('link', { name: 'Learn' }));
    expect(within(tutor()).queryByRole('button', { name: 'Why did heat stress happen?' })).toBeNull();
    expect(answerText()).toBe('');
  });

  it('lists the Lab Tutor as working in About; only video lessons remain a preview', async () => {
    const user = setup();
    await user.click(screen.getByRole('link', { name: 'About' }));
    const about = screen.getByRole('main');
    expect(about.textContent).toContain('Lab Tutor (answers from your run and the model)');
    expect(about.textContent).not.toContain('AI Lab Tutor');
    expect(about.textContent).toContain('Video lessons');
  });
});
