// @vitest-environment jsdom
// W11 simulation error state: PRD-0002 §10. The engine is mocked to fail only for 44 °C.
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { SimulationInput } from '../../src/simulation';
import { App } from '../../src/ui/App';

vi.mock('react-chartjs-2', () => ({ Line: () => null }));

vi.mock('../../src/simulation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/simulation')>();
  return {
    ...actual,
    simulate: (input: SimulationInput) =>
      input.temperatureC === 44 ? { ok: false, error: { kind: 'non-finite-output' } } : actual.simulate(input),
  };
});

beforeEach(() => {
  vi.useFakeTimers({
    toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'],
  });
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it('W11 shows the educational error state and keeps the settings when a run cannot complete (§10)', async () => {
  const user = userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });
  render(<App />);
  const field = screen.getByRole('textbox', { name: 'Temperature value' });
  await user.clear(field);
  await user.type(field, '44{Enter}');
  await user.click(screen.getByTestId('run-button'));
  await act(async () => {
    vi.advanceTimersByTime(100);
  });

  const slider = screen.getByRole('slider', { name: 'Temperature' });
  expect(screen.getByTestId('run-status').textContent).toContain('Run could not complete');
  expect(slider.getAttribute('aria-disabled') === 'true' || slider.hasAttribute('disabled')).toBe(false);
  expect(slider.getAttribute('aria-valuetext')).toBe('44.0 degrees Celsius');
  expect(screen.getByTestId('explanation').textContent).toContain('The simulation could not complete');
  expect(screen.queryByText(/^ERROR$/)).toBeNull();
  expect((screen.getByTestId('run-button') as HTMLButtonElement).disabled).toBe(false);
});
