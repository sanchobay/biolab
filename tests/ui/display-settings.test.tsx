// @vitest-environment jsdom
// D3–D4 (ExecPlan 0008, PRD-0005 §1, §4 and §6): the Display settings panel, persistence and applying before first render.
import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../src/ui/App';

vi.mock('react-chartjs-2', () => ({ Line: () => null }));

const root = document.documentElement;
const stored = () => JSON.parse(window.localStorage.getItem('biolab.preferences') ?? 'null') as Record<string, unknown> | null;
const trigger = () => screen.getByRole('button', { name: 'Display settings' });

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
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  delete root.dataset.textSize;
  delete root.dataset.lineSpacing;
  delete root.dataset.motion;
  root.setAttribute('lang', 'en');
  document.body.innerHTML = '';
});

describe('D3 Display settings panel', () => {
  it('opens a non-modal panel with text size, line spacing and motion, applying and saving each choice at once', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(trigger().getAttribute('aria-expanded')).toBe('false');

    await user.click(trigger());
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    const panel = screen.getByRole('dialog', { name: 'Display settings' });

    const textSize = within(panel).getByRole('radiogroup', { name: 'Text size' });
    expect(within(textSize).getAllByRole('radio').map((radio) => radio.textContent)).toEqual(['100%', '125%', '150%', '200%']);
    await user.click(within(textSize).getByRole('radio', { name: '200%' }));
    expect(root.dataset.textSize).toBe('200');
    expect(stored()).toMatchObject({ v: 1, textSize: 200 });

    const spacing = within(panel).getByRole('radiogroup', { name: 'Line spacing' });
    expect(within(spacing).getAllByRole('radio').map((radio) => radio.textContent)).toEqual(['Standard', 'Wide', 'Extra wide']);
    await user.click(within(spacing).getByRole('radio', { name: 'Extra wide' }));
    expect(root.dataset.lineSpacing).toBe('extra');

    const motion = within(panel).getByRole('radiogroup', { name: 'Motion' });
    await user.click(within(motion).getByRole('radio', { name: 'Reduce motion' }));
    expect(root.dataset.motion).toBe('reduce');
    expect(stored()).toEqual({ v: 1, textSize: 200, lineSpacing: 'extra', motion: 'reduce' });
  });

  it('selects with the arrow keys, like the other segmented controls', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(trigger());
    const textSize = within(screen.getByRole('dialog', { name: 'Display settings' })).getByRole('radiogroup', { name: 'Text size' });
    within(textSize).getByRole('radio', { name: '100%' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(root.dataset.textSize).toBe('125');
    expect(document.activeElement?.textContent).toBe('125%');
  });

  it('closes with Escape or the close button and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(trigger());
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Display settings' })).toBeNull();
    expect(document.activeElement).toBe(trigger());

    await user.click(trigger());
    await user.click(screen.getByRole('button', { name: 'Close display settings' }));
    expect(screen.queryByRole('dialog', { name: 'Display settings' })).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('resets all three settings to their defaults', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem('biolab.preferences', JSON.stringify({ v: 1, textSize: 150, lineSpacing: 'wide', motion: 'reduce' }));
    render(<App />);
    await user.click(trigger());
    const panel = screen.getByRole('dialog', { name: 'Display settings' });
    expect(within(panel).getByRole('radio', { name: '150%' }).getAttribute('aria-checked')).toBe('true');

    await user.click(within(panel).getByRole('button', { name: 'Reset to defaults' }));
    expect(root.dataset.textSize).toBe('100');
    expect(root.dataset.lineSpacing).toBe('standard');
    expect(root.dataset.motion).toBe('system');
    expect(stored()).toEqual({ v: 1, textSize: 100, lineSpacing: 'standard', motion: 'system' });
  });

  it('is localized in Russian and Kazakh', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Русский' }));
    await user.click(screen.getByRole('button', { name: 'Настройки отображения' }));
    const ru = screen.getByRole('dialog', { name: 'Настройки отображения' });
    expect(within(ru).getByRole('radiogroup', { name: 'Размер текста' })).toBeTruthy();
    expect(within(ru).getByRole('radiogroup', { name: 'Межстрочный интервал' })).toBeTruthy();
    expect(within(ru).getByRole('radio', { name: 'Уменьшить анимацию' })).toBeTruthy();
    expect(within(ru).getByRole('button', { name: 'Сбросить настройки' })).toBeTruthy();

    // A click outside the panel (here, on the language switch) closes it (PRD-0005 §1), so it is reopened in Kazakh.
    await user.click(screen.getByRole('button', { name: 'Қазақша' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Көрініс баптаулары' }));
    const kk = screen.getByRole('dialog', { name: 'Көрініс баптаулары' });
    expect(within(kk).getByRole('radiogroup', { name: 'Мәтін өлшемі' })).toBeTruthy();
    expect(within(kk).getByRole('radio', { name: 'Қозғалысты азайту' })).toBeTruthy();
  });
});

describe('D4 preferences apply before the first render', () => {
  it('sets the stored preferences on <html> as soon as the entry module runs', async () => {
    window.localStorage.setItem('biolab.preferences', JSON.stringify({ v: 1, textSize: 200, lineSpacing: 'wide', motion: 'reduce' }));
    document.body.innerHTML = '<div id="root"></div>';
    vi.resetModules();
    await act(async () => {
      await import('../../src/main');
    });
    expect(root.dataset.textSize).toBe('200');
    expect(root.dataset.lineSpacing).toBe('wide');
    expect(root.dataset.motion).toBe('reduce');
  });
});
