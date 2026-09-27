// @vitest-environment jsdom
// Light laboratory redesign behaviour: W14 trend tabs and W15 theme control (ExecPlan 0003).
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
const tab = (name: string): HTMLElement => screen.getByRole('tab', { name });
const button = (name: string): HTMLButtonElement => screen.getByRole('button', { name }) as HTMLButtonElement;
const runButton = (): HTMLButtonElement => screen.getByTestId('run-button') as HTMLButtonElement;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
});

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute('data-theme');
  vi.useRealTimers();
});

describe('light laboratory redesign (ExecPlan 0003)', () => {
  it('W14 switches the single trend chart between Biomass, Oxygen and pH', async () => {
    const user = setup();
    expect(tab('Biomass').getAttribute('aria-selected')).toBe('true');
    expect(normalize(screen.getByRole('tabpanel').textContent)).toContain('Relative biomass');

    await user.click(tab('Oxygen'));
    expect(tab('Oxygen').getAttribute('aria-selected')).toBe('true');
    expect(tab('Biomass').getAttribute('aria-selected')).toBe('false');
    expect(normalize(screen.getByRole('tabpanel').textContent)).toContain('Net O₂ production');

    await user.keyboard('{ArrowRight}');
    expect(tab('pH').getAttribute('aria-selected')).toBe('true');
    expect(normalize(screen.getByRole('tabpanel').textContent)).toContain('Simulated pH');

    // The hourly table (PRD-0002 D-17) is available after completion and follows the selected tab.
    expect(button('Show values').disabled).toBe(true);
    await user.click(runButton());
    await advance(FULL_RUN_MS);
    expect(text('run-status')).toContain('Completed');
    await user.click(button('Show values'));
    const pHTable = screen.getByRole('table', { name: 'Simulated pH, hourly values' });
    expect(within(pHTable).getAllByRole('row')).toHaveLength(26);
    expect(normalize(pHTable.textContent)).toContain('24:00');
    expect(pHTable.textContent).toContain('9.24');

    await user.click(tab('Biomass'));
    expect(screen.getByRole('table', { name: 'Relative biomass (× initial), hourly values' }).textContent).toContain('1.31');
  });

  it('W15 switches between the light and dark themes without affecting the experiment', async () => {
    const user = setup();
    const light = button('Light theme');
    const dark = button('Dark theme');
    expect(document.documentElement.getAttribute('data-theme')).not.toBe('dark');
    expect(light.getAttribute('aria-pressed')).toBe('true');
    expect(dark.getAttribute('aria-pressed')).toBe('false');

    await user.click(runButton());
    await advance(1_000);
    await user.click(dark);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(dark.getAttribute('aria-pressed')).toBe('true');
    expect(light.getAttribute('aria-pressed')).toBe('false');
    expect(text('run-status')).toContain('Running');

    await advance(FULL_RUN_MS);
    expect(text('run-status')).toContain('Completed');
    expect(text('readout-biomass')).toContain('1.31');

    await user.click(light);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(light.getAttribute('aria-pressed')).toBe('true');
  });
});
