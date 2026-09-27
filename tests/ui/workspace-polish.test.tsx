// @vitest-environment jsdom
// Interaction polish (ExecPlan 0004): W16 in-page navigation focus, W17 Reset hands focus to Run, W19 Show values state.
import { act, cleanup, render, screen } from '@testing-library/react';
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

const button = (name: string): HTMLButtonElement => screen.getByRole('button', { name }) as HTMLButtonElement;
const runButton = (): HTMLButtonElement => screen.getByTestId('run-button') as HTMLButtonElement;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('interaction polish (ExecPlan 0004)', () => {
  it('W16 header navigation moves focus to its destination (views since ExecPlan 0005)', async () => {
    const user = setup();

    await user.click(screen.getByRole('link', { name: 'Learn' }));
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Learn', level: 2 }));

    await user.click(screen.getByRole('link', { name: 'About' }));
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'About BioLab', level: 2 }));

    // "Experiments" returns to the workspace and the start of the workflow, the experiment controls.
    await user.click(screen.getByRole('link', { name: 'Experiments' }));
    expect(document.activeElement).toBe(screen.getByRole('region', { name: 'Experiment controls' }));
  });

  it('W17 Reset hands keyboard focus to Run Experiment instead of dropping it', async () => {
    const user = setup();
    await user.click(runButton());
    await advance(FULL_RUN_MS);

    const reset = button('Reset');
    reset.focus();
    await user.keyboard('{Enter}');
    expect(runButton().disabled).toBe(false);
    expect(document.activeElement).toBe(runButton());
  });

  it('W19 Show values exposes its pressed state and is explained while unavailable', async () => {
    const user = setup();
    const toggle = button('Show values');
    expect(toggle.disabled).toBe(true);
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    expect(toggle.getAttribute('title')).toBe('Available after the run completes');

    await user.click(runButton());
    await advance(FULL_RUN_MS);
    await user.click(button('Show values'));
    expect(button('Show values').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('table')).toBeTruthy();
  });
});
