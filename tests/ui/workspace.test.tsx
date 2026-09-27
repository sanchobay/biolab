// @vitest-environment jsdom
// Critical workspace behaviour: PRD-0002 §4.1, §5, §7–§11 (W1–W10, W12, W13). W11 (error state) is in workspace-errors.test.tsx.
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../src/ui/App';

vi.mock('react-chartjs-2', () => ({ Line: () => null }));

const FULL_RUN_MS = 30_500;

function setVisibility(state: DocumentVisibilityState): void {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => state === 'hidden' });
  document.dispatchEvent(new Event('visibilitychange'));
}

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
const slider = (name: string): HTMLElement => screen.getByRole('slider', { name });
const valueField = (name: string): HTMLElement => screen.getByRole('textbox', { name: `${name} value` });
const button = (name: string): HTMLButtonElement => screen.getByRole('button', { name }) as HTMLButtonElement;
const runButton = (): HTMLButtonElement => screen.getByTestId('run-button') as HTMLButtonElement;
const isDisabled = (el: HTMLElement): boolean => el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true';
const isChecked = (el: HTMLElement): boolean =>
  el.getAttribute('aria-checked') === 'true' || (el as HTMLInputElement).checked === true;

async function typeValue(user: UserEvent, name: string, value: string): Promise<void> {
  const input = valueField(name);
  await user.clear(input);
  await user.type(input, `${value}{Enter}`);
}

async function runToCompletion(user: UserEvent): Promise<void> {
  await user.click(runButton());
  await advance(FULL_RUN_MS);
}

beforeEach(() => {
  vi.useFakeTimers({
    toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'],
  });
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
  setVisibility('visible');
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('experiment workspace (PRD-0002)', () => {
  it('W1 opens in Ready with the healthy-baseline configuration (§9, D-2)', () => {
    setup();
    expect(text('run-status')).toContain('Ready');
    expect(text('sim-clock')).toContain('00:00');
    expect(slider('Temperature').getAttribute('aria-valuetext')).toBe('32.0 degrees Celsius');
    expect(slider('Starting pH').getAttribute('aria-valuetext')).toBe('pH 9.0');
    expect(slider('Light intensity').getAttribute('aria-valuenow')).toBe('300');
    expect(slider('Light intensity').getAttribute('aria-valuetext')).toBe(
      '300 micromoles of photons per square metre per second',
    );
    expect(isChecked(screen.getByRole('radio', { name: '14:10' }))).toBe(true);
    expect(isChecked(screen.getByRole('radio', { name: 'Adequate' }))).toBe(true);
    expect(runButton().disabled).toBe(false);
    expect(button('Reset').disabled).toBe(true);
  });

  it('W2 locks controls while running, and Reset aborts to Ready (§9, D-5)', async () => {
    const user = setup();
    await user.click(runButton());
    await advance(1_000);
    expect(text('run-status')).toContain('Running');
    expect(isDisabled(slider('Temperature'))).toBe(true);
    expect(isDisabled(screen.getByRole('radio', { name: '14:10' }))).toBe(true);
    expect(runButton().disabled).toBe(true);
    expect(button('Reset').disabled).toBe(false);

    await user.click(button('Reset'));
    expect(text('run-status')).toContain('Ready');
    expect(isDisabled(slider('Temperature'))).toBe(false);
    expect(text('readout-biomass')).toContain('—');
  });

  it('W3 plays 24 simulated hours in about 30 seconds, then completes with controls locked (§9, D-4)', async () => {
    const user = setup();
    await user.click(runButton());
    await advance(29_000);
    expect(text('run-status')).toContain('Running');
    await advance(1_500);
    expect(text('run-status')).toContain('Completed');
    expect(text('sim-clock')).toContain('24:00');
    expect(isDisabled(slider('Temperature'))).toBe(true);
    expect(runButton().disabled).toBe(true);
    expect(button('Reset').disabled).toBe(false);
    // Baseline values at 24:00 (PRD-0001 regression targets 1.306 / 9.236 / −0.157).
    expect(text('readout-biomass')).toContain('1.31');
    expect(text('readout-ph')).toContain('9.24');
    expect(text('readout-net-o2')).toContain('−0.16');
  });

  it('W4 Reset after completion returns to Ready and keeps the configured values (D-3)', async () => {
    const user = setup();
    await typeValue(user, 'Temperature', '45');
    await runToCompletion(user);
    await user.click(button('Reset'));
    expect(text('run-status')).toContain('Ready');
    expect(slider('Temperature').getAttribute('aria-valuetext')).toBe('45.0 degrees Celsius');
    expect(text('run-record')).toContain('No run yet');
    expect(runButton().disabled).toBe(false);
  });

  it('W5 pauses playback while the browser tab is hidden (D-12)', async () => {
    const user = setup();
    await user.click(runButton());
    await advance(1_000);
    setVisibility('hidden');
    await advance(60_000);
    expect(text('run-status')).toContain('Running');
    setVisibility('visible');
    await advance(30_000);
    expect(text('run-status')).toContain('Completed');
  });

  it('W6 light control steps stops, jumps reference values and supports Home/End and ticks (§4.1, D-6)', async () => {
    const user = setup();
    const light = slider('Light intensity');
    const value = () => light.getAttribute('aria-valuenow');
    light.focus();
    await user.keyboard('{ArrowRight}');
    expect(value()).toBe('325');
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(value()).toBe('290');
    await user.keyboard('{PageUp}');
    expect(value()).toBe('300');
    await user.keyboard('{PageUp}');
    expect(value()).toBe('800');
    await user.keyboard('{End}');
    expect(value()).toBe('2200');
    await user.keyboard('{PageDown}');
    expect(value()).toBe('800');
    await user.keyboard('{Home}');
    expect(value()).toBe('0');
    await user.click(button('150'));
    expect(value()).toBe('150');
    await typeValue(user, 'Light intensity', '437');
    expect(value()).toBe('437');
    light.focus();
    await user.keyboard('{ArrowRight}');
    expect(value()).toBe('450');
  });

  it('W7 clamps out-of-range typed values and reverts non-numeric input (§10)', async () => {
    const user = setup();
    await typeValue(user, 'Temperature', '50');
    expect(slider('Temperature').getAttribute('aria-valuetext')).toBe('45.0 degrees Celsius');
    expect(screen.getByText('Adjusted to 45.0 °C (maximum)')).toBeTruthy();
    await typeValue(user, 'Temperature', 'abc');
    expect(slider('Temperature').getAttribute('aria-valuetext')).toBe('45.0 degrees Celsius');
    expect(screen.getByText('Enter a number from 15.0 to 45.0 °C')).toBeTruthy();
  });

  it('W8 explains a heat-stress outcome with the run record and delayed health (§7, §8)', async () => {
    const user = setup();
    await typeValue(user, 'Temperature', '45');
    await runToCompletion(user);
    expect(text('run-status')).toContain('Completed');
    const explanation = text('explanation');
    expect(explanation).toContain('Run outcome');
    expect(explanation).toContain('Heat stress');
    expect(explanation).toContain('40 °C');
    expect(explanation).toContain('healthy baseline');
    expect(text('run-record')).toContain('Heat stress');
    expect(text('run-record')).toContain('first at 00:00');
    expect(text('readout-health')).toContain('Stressed');
    expect(text('current-condition')).toContain('At 24:00');
    expect(text('current-condition')).toContain('Heat stress');
  });

  it('W9 keeps current condition, delayed health and run record distinct after nightfall (S3, §8)', async () => {
    const user = setup();
    slider('Light intensity').focus();
    await user.keyboard('{End}');
    await runToCompletion(user);
    expect(text('current-condition')).toContain('At 24:00');
    expect(text('current-condition')).toContain('Healthy');
    expect(text('readout-health')).toContain('Suboptimal');
    expect(text('readout-health')).toContain('Recovering');
    expect(text('run-record')).toContain('Photoinhibition');
    expect(text('run-record')).toContain('occurred during this run');
    expect(text('explanation')).toContain('well above');
  });

  it('W10 uses the mild photoinhibition wording just above 800 (D-9)', async () => {
    const user = setup();
    await typeValue(user, 'Light intensity', '850');
    await runToCompletion(user);
    const explanation = text('explanation');
    expect(explanation).toContain('Photoinhibition');
    expect(explanation).toContain('may not yet be visible');
    expect(explanation).not.toContain('well above');
  });

  it('W12 opens and closes the Model assumptions note (§5)', async () => {
    const user = setup();
    await user.click(button('Model assumptions'));
    const note = screen.getByRole('dialog', { name: 'Model assumptions' });
    expect(normalize(note.textContent)).toContain('simplified educational model');
    expect(normalize(note.textContent)).toContain('may contain other microorganisms');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Model assumptions' })).toBeNull();
  });

  it('W13 provides a skip link to the experiment controls (§11)', () => {
    setup();
    expect(screen.getByRole('link', { name: 'Skip to experiment controls' }).getAttribute('href')).toBe(
      '#experiment-controls',
    );
    expect(document.getElementById('experiment-controls')).not.toBeNull();
  });
});
