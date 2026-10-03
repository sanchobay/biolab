// @vitest-environment jsdom
// O5 (ExecPlan 0007, PRD-0004 §4–§5): header offline status and the update notice, localized.
import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { pwaStore } from '../../src/pwa/register';
import { App } from '../../src/ui/App';

vi.mock('react-chartjs-2', () => ({ Line: () => null }));

afterEach(() => {
  cleanup();
  act(() => pwaStore.reset());
  document.documentElement.setAttribute('lang', 'en');
});

// The page header (other regions also use <header> elements for their titles).
const header = () => document.querySelector('.app-header') as HTMLElement;

describe('O5 offline status and update notice', () => {
  it('stays hidden until the app is cached, then reports offline readiness and network loss', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(within(header()).queryByText('Available offline')).toBeNull();

    act(() => pwaStore.dispatch({ type: 'ready' }));
    expect(within(header()).getByText('Available offline')).toBeTruthy();

    act(() => pwaStore.dispatch({ type: 'offline' }));
    expect(within(header()).getByText('Offline — running from this device')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Русский' }));
    expect(within(header()).getByText('Офлайн — работает с этого устройства')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Қазақша' }));
    expect(within(header()).getByText('Офлайн — осы құрылғыдан жұмыс істейді')).toBeTruthy();

    act(() => pwaStore.dispatch({ type: 'online' }));
    expect(within(header()).getByText('Офлайн қолжетімді')).toBeTruthy();
  });

  it('offers Reload for a waiting update, never reloads by itself, and can be dismissed', async () => {
    const user = userEvent.setup();
    const updater = vi.fn();
    render(<App />);
    expect(screen.queryByText('A new version of BioLab is available.')).toBeNull();

    act(() => {
      pwaStore.setUpdater(updater);
      pwaStore.dispatch({ type: 'updateWaiting' });
    });
    const notice = screen.getByRole('status', { name: 'A new version of BioLab is available.' });
    expect(updater).not.toHaveBeenCalled();

    await user.click(within(notice).getByRole('button', { name: 'Reload' }));
    expect(updater).toHaveBeenCalledTimes(1);

    await user.click(within(notice).getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText('A new version of BioLab is available.')).toBeNull();
  });
});
