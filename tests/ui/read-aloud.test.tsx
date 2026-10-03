// @vitest-environment jsdom
// R5–R6 (ExecPlan 0009, PRD-0005 §5–§6): Read aloud controls in the explanation, Key results and Learn sections.
import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../src/ui/App';
import { speechStore } from '../../src/ui/speech/speechController';
import { LAPTOP_VOICES, installFakeSpeech, removeFakeSpeech, type FakeSpeech } from './fakeSpeech';

vi.mock('react-chartjs-2', () => ({ Line: () => null }));

const region = (name: string) => screen.getByRole('region', { name });
const explanation = () => region("What's happening in the culture?");
let fake: FakeSpeech;

beforeEach(() => {
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
  fake = installFakeSpeech(LAPTOP_VOICES);
});

afterEach(() => {
  cleanup();
  act(() => speechStore.reset());
  removeFakeSpeech();
  document.documentElement.setAttribute('lang', 'en');
});

describe('R5 Read aloud controls', () => {
  it('never speaks by itself, and reads the explanation with a local English voice on request', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(fake.synth.speak).not.toHaveBeenCalled();

    await user.click(within(explanation()).getByRole('button', { name: 'Read aloud' }));
    expect(fake.synth.speak).toHaveBeenCalledTimes(1);
    expect(fake.spoken[0].voice?.name).toBe('Samantha');
    expect(fake.spoken[0].lang).toBe('en-US');
    expect(fake.spoken[0].text.startsWith('Ready to experiment.')).toBe(true);
    expect(within(explanation()).queryByRole('button', { name: 'Read aloud' })).toBeNull();

    await user.click(within(explanation()).getByRole('button', { name: 'Pause' }));
    expect(fake.synth.pause).toHaveBeenCalledTimes(1);
    await user.click(within(explanation()).getByRole('button', { name: 'Resume' }));
    expect(fake.synth.resume).toHaveBeenCalledTimes(1);
    await user.click(within(explanation()).getByRole('button', { name: 'Stop' }));
    expect(fake.synth.cancel).toHaveBeenCalled();
    expect(within(explanation()).getByRole('button', { name: 'Read aloud' })).toBeTruthy();
  });

  it('reads one region at a time: starting Key results stops the explanation', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(within(explanation()).getByRole('button', { name: 'Read aloud' }));
    await user.click(within(region('Key results')).getByRole('button', { name: 'Read aloud' }));
    expect(within(explanation()).getByRole('button', { name: 'Read aloud' })).toBeTruthy();
    expect(within(region('Key results')).getByRole('button', { name: 'Pause' })).toBeTruthy();
    expect(fake.spoken[fake.spoken.length - 1].text).toBe('Run the experiment to see data');
  });

  it('stops when the language changes, then reads Russian with a Russian voice', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(within(explanation()).getByRole('button', { name: 'Read aloud' }));
    const cancels = fake.synth.cancel.mock.calls.length;
    await user.click(screen.getByRole('button', { name: 'Русский' }));
    expect(fake.synth.cancel.mock.calls.length).toBeGreaterThan(cancels);
    expect(speechStore.getState().status).toBe('idle');

    const ruExplanation = region('Что происходит с культурой?');
    await user.click(within(ruExplanation).getByRole('button', { name: 'Читать вслух' }));
    const last = fake.spoken[fake.spoken.length - 1];
    expect(last.voice?.name).toBe('Milena');
    expect(last.lang).toBe('ru-RU');
  });

  it('reads a Learn section from its heading, skipping controls, and stops when the view changes', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('link', { name: 'Learn' }));

    const methodology = region('Methodology');
    await user.click(within(methodology).getByRole('button', { name: 'Read aloud' }));
    const text = fake.spoken.map((u) => u.text).join(' ');
    expect(text.startsWith('Methodology.')).toBe(true);
    expect(text).not.toContain('Read aloud');

    await user.click(within(region('Experiment protocol')).getByRole('button', { name: 'Read aloud' }));
    const protocol = fake.spoken[fake.spoken.length - 1].text;
    expect(protocol.startsWith('Experiment protocol.')).toBe(true);
    expect(protocol).not.toContain('Open the experiment');

    const cancels = fake.synth.cancel.mock.calls.length;
    await user.click(screen.getByRole('link', { name: 'Experiments' }));
    expect(fake.synth.cancel.mock.calls.length).toBeGreaterThan(cancels);
    expect(speechStore.getState().status).toBe('idle');
  });

  it('offers Read aloud in the Theory section too', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('link', { name: 'Learn' }));
    await user.click(within(region('Theory')).getByRole('button', { name: 'Read aloud' }));
    expect(fake.spoken[0].text.startsWith('Theory.')).toBe(true);
  });
});

describe('R6 unavailable states', () => {
  it('disables Read aloud in Kazakh when no Kazakh voice is installed, with the reason', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Қазақша' }));
    const kkExplanation = region('Культурада не болып жатыр?');
    const button = within(kkExplanation).getByRole('button', { name: 'Дауыстап оқу' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(
      within(kkExplanation).getByText('Бұл құрылғыда қазақ тіліндегі дауыс орнатылмаған, сондықтан қазақша дауыстап оқу қолжетімсіз.'),
    ).toBeTruthy();
    await user.click(button);
    expect(fake.synth.speak).not.toHaveBeenCalled();
  });

  it('explains when the browser has no speech synthesis', () => {
    removeFakeSpeech();
    render(<App />);
    const button = within(explanation()).getByRole('button', { name: 'Read aloud' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(within(explanation()).getByText('Read aloud is not supported in this browser.')).toBeTruthy();
  });

  it('enables Read aloud when the voice list arrives late', () => {
    fake = installFakeSpeech([]);
    render(<App />);
    const button = () => within(explanation()).getByRole('button', { name: 'Read aloud' }) as HTMLButtonElement;
    expect(button().disabled).toBe(true);
    expect(
      within(explanation()).getByText('No English voice is installed on this device, so read aloud is unavailable in English.'),
    ).toBeTruthy();
    act(() => fake.setVoices(LAPTOP_VOICES));
    expect(button().disabled).toBe(false);
  });
});
