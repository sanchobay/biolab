// @vitest-environment jsdom
// Learning layer and localization (PRD-0003, ExecPlan 0005): W20 language switch, W21 knowledge check, W22 previews, W23 views.
import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../src/ui/App';

vi.mock('react-chartjs-2', () => ({ Line: () => null }));

const FULL_RUN_MS = 30_500;

function setup(): UserEvent {
  const user = userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });
  render(<App />);
  return user;
}

async function advance(ms: number): Promise<void> {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

const normalize = (value: string | null): string => (value ?? '').replace(/[\u00a0\u202f]/g, ' ');
const text = (testId: string): string => normalize(screen.getByTestId(testId).textContent);
const runButton = (): HTMLButtonElement => screen.getByTestId('run-button') as HTMLButtonElement;
const lang = (): string | null => document.documentElement.getAttribute('lang');

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
});

afterEach(() => {
  cleanup();
  document.documentElement.setAttribute('lang', 'en');
  vi.useRealTimers();
});

describe('localization (PRD-0003 §9)', () => {
  it('W20 switches EN → RU → ҚАЗ → EN immediately, without affecting the run', async () => {
    const user = setup();
    expect(lang()).toBe('en');
    expect(screen.getByRole('button', { name: 'English' }).getAttribute('aria-pressed')).toBe('true');

    await user.click(runButton());
    await advance(1_000);

    await user.click(screen.getByRole('button', { name: 'Русский' }));
    expect(lang()).toBe('ru');
    expect(screen.getByRole('link', { name: 'Обучение' })).toBeTruthy();
    expect(text('run-status')).toContain('Выполняется');
    expect(runButton().textContent).toContain('Выполняется…');
    expect(text('explanation')).toContain('Культура в норме');
    expect(screen.getByRole('slider', { name: 'Температура' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Қазақша' }));
    expect(lang()).toBe('kk');
    expect(screen.getByRole('link', { name: 'Оқу' })).toBeTruthy();
    expect(text('run-status')).toContain('Жүріп жатыр');

    await advance(FULL_RUN_MS);
    expect(text('run-status')).toContain('Аяқталды');

    await user.click(screen.getByRole('button', { name: 'English' }));
    expect(lang()).toBe('en');
    expect(text('run-status')).toContain('Completed');
    expect(text('readout-biomass')).toContain('1.31');
  });
});

describe('learning layer (PRD-0003 §1–§8)', () => {
  it('W21 the knowledge check answers immediately with Correct or Try again', async () => {
    const user = setup();
    await user.click(screen.getByRole('link', { name: 'Learn' }));

    const question = screen.getByRole('group', { name: /far above 800/ });
    await user.click(within(question).getByRole('radio', { name: 'It keeps increasing with more light' }));
    expect(normalize(within(question).getByRole('status').textContent)).toContain('Try again');

    await user.click(within(question).getByRole('radio', { name: 'It is reduced: this is photoinhibition' }));
    const feedback = normalize(within(question).getByRole('status').textContent);
    expect(feedback).toContain('Correct');
    expect(feedback).toContain('800');
  });

  // PRD-0006 (ExecPlan 0010) replaced the tutor preview with the working Lab Tutor; video lessons remain the only preview.
  it('W22 previews are clearly marked and never pretend to work', async () => {
    const user = setup();
    await user.click(screen.getByRole('link', { name: 'Learn' }));

    const tutor = screen.getByRole('region', { name: 'Lab Tutor' });
    expect(normalize(tutor.textContent)).not.toContain('Preview');
    expect(normalize(tutor.textContent)).toContain('not by an AI language model');
    expect(within(tutor).queryByRole('textbox')).toBeNull();

    const videos = screen.getByRole('region', { name: /Video lessons/ });
    expect(normalize(videos.textContent)).toContain('Coming soon');
    expect(within(videos).queryByRole('button')).toBeNull();
  });

  it('W23 views and methodology stages keep the running experiment', async () => {
    const user = setup();
    const methodology = screen.getByRole('navigation', { name: 'Methodology' });
    expect(within(methodology).getByRole('button', { name: 'Experiment' }).getAttribute('aria-current')).toBe('step');

    await user.click(runButton());
    await advance(1_000);

    await user.click(screen.getByRole('link', { name: 'Learn' }));
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Learn', level: 2 }));

    await user.click(within(methodology).getByRole('button', { name: 'Protocol' }));
    const protocol = screen.getByRole('region', { name: 'Experiment protocol' });
    expect(normalize(protocol.textContent)).toContain('32.0 °C');
    expect(within(methodology).getByRole('button', { name: 'Protocol' }).getAttribute('aria-current')).toBe('step');

    await advance(2_000);
    await user.click(within(protocol).getByRole('button', { name: 'Open the experiment' }));
    expect(text('run-status')).toContain('Running');
    expect(document.activeElement).toBe(screen.getByRole('region', { name: 'Experiment controls' }));

    await user.click(screen.getByRole('link', { name: 'About' }));
    expect(screen.getByRole('heading', { name: 'About BioLab', level: 2 })).toBeTruthy();
  });
});
