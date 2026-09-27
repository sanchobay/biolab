// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BASELINE_INPUT, simulate } from '../../src/simulation';
import { App } from '../../src/ui/App';
import { CultureChamber } from '../../src/ui/chamber/CultureChamber';

vi.mock('react-chartjs-2', () => ({ Line: ({ data }: { data: { datasets: { data: { x: number }[] }[] } }) =>
  <div data-testid="chart-last-hour">{data.datasets[0].data.at(-1)?.x ?? ''}</div> }));

const reactor = () => document.querySelector<SVGSVGElement>('.reactor')!;
const advance = async (ms: number) => act(async () => { vi.advanceTimersByTime(ms); });
function visibility(value: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => value });
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  visibility('visible');
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('reactor animation integration (ExecPlan 0006 R1–R5)', () => {
  it('keeps a bounded, stable pool in liquid clips across playback and reset', () => {
    const outcome = simulate(BASELINE_INPUT);
    if (!outcome.ok) throw new Error('Baseline must run');
    const props = { config: BASELINE_INPUT, runError: false };
    const { rerender } = render(<CultureChamber {...props} phase="ready" sample={null} />);
    const nodes = Array.from(reactor().querySelectorAll('[data-particle]'));
    expect(nodes.length).toBeGreaterThan(0);
    expect(nodes.length).toBeLessThanOrEqual(56);
    for (const layer of ['filaments', 'activity-bubbles', 'aeration-bubbles']) {
      expect(reactor().querySelector(`[data-layer="${layer}"]`)?.getAttribute('clip-path')).toContain('liquid');
    }
    rerender(<CultureChamber {...props} phase="completed" sample={outcome.result.samples.at(-1)!} />);
    expect(Array.from(reactor().querySelectorAll('[data-particle]'))).toEqual(nodes);
    expect(reactor().dataset.lamp).toBe('off');
    expect(reactor().dataset.health).toBe(outcome.result.summary.finalHealth);
    rerender(<CultureChamber {...props} phase="ready" sample={null} />);
    expect(reactor().dataset.lamp).toBe('on');
    expect(reactor().dataset.health).toBe('preview');
    expect(reactor().dataset.photosynthesis).toBe('0');
  });

  it('describes a zero-intensity lamp as off without labelling the light period as night', () => {
    render(<CultureChamber phase="ready" runError={false} config={{ ...BASELINE_INPUT, lightIntensity: 0 }} sample={null} />);
    expect(reactor().dataset.lamp).toBe('off');
    expect(reactor().getAttribute('aria-label')).toContain('lamp off');
    expect(screen.getByText('Light period')).toBeTruthy();
  });

  it('shares playback with the clock/chart, pauses hidden scientific state, and retains final state until Reset', async () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('run-button'));
    await advance(17_000);
    expect(reactor().dataset.lamp).toBe('on');
    const clock = screen.getByTestId('sim-clock').textContent;
    const chart = screen.getByTestId('chart-last-hour').textContent;
    const state = reactor().outerHTML;
    visibility('hidden');
    await advance(10_000);
    expect(screen.getByTestId('sim-clock').textContent).toBe(clock);
    expect(screen.getByTestId('chart-last-hour').textContent).toBe(chart);
    expect(reactor().outerHTML).toBe(state);
    visibility('visible');
    await advance(1_000);
    expect(reactor().dataset.lamp).toBe('off');
    expect(reactor().dataset.photosynthesis).toBe('0');
    expect(Number(screen.getByTestId('chart-last-hour').textContent)).toBeGreaterThanOrEqual(14);
    expect(screen.getByText('Dark period')).toBeTruthy();
    await advance(13_000);
    expect(screen.getByTestId('run-status').textContent).toContain('Completed');
    expect(screen.getByTestId('sim-clock').textContent).toContain('24:00');
    const final = reactor().outerHTML;
    await advance(5_000);
    expect(reactor().outerHTML).toBe(final);
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(reactor().dataset.lamp).toBe('on');
    expect(reactor().dataset.photosynthesis).toBe('0');
    expect(screen.getByTestId('run-status').textContent).toContain('Ready');
  });
});
