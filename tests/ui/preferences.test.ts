// @vitest-environment jsdom
// D1–D2 (ExecPlan 0008, PRD-0005 §2 and §4, ADR-0005 §2–§4): preferences store, document attributes and reduced motion.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { arriveAt } from '../../src/ui/navigation';
import {
  DEFAULT_PREFERENCES,
  PREFERENCES_KEY,
  applyPreferences,
  loadPreferences,
  parsePreferences,
  prefersReducedMotion,
  savePreferences,
  scaledFontSize,
} from '../../src/ui/preferences';

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };
}

const blockedStorage = {
  getItem: (): string | null => {
    throw new Error('storage blocked');
  },
  setItem: (): void => {
    throw new Error('storage blocked');
  },
};

function mockReducedMotionQuery(matches: boolean): void {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? matches : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

afterEach(() => {
  const root = document.documentElement;
  delete root.dataset.textSize;
  delete root.dataset.lineSpacing;
  delete root.dataset.motion;
  document.body.innerHTML = '';
});

describe('D1 preferences store', () => {
  it('defaults to 100% text, standard spacing and the device motion setting', () => {
    expect(DEFAULT_PREFERENCES).toEqual({ v: 1, textSize: 100, lineSpacing: 'standard', motion: 'system' });
    expect(PREFERENCES_KEY).toBe('biolab.preferences');
  });

  it('falls back to defaults for missing, unparsable, wrong-version or out-of-range data', () => {
    expect(parsePreferences(null)).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences('{not json')).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences('42')).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences(JSON.stringify({ v: 2, textSize: 200 }))).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences(JSON.stringify({ v: 1, textSize: 300, lineSpacing: 'huge', motion: 'always' }))).toEqual(
      DEFAULT_PREFERENCES,
    );
  });

  it('keeps the valid fields of a partly valid record', () => {
    expect(parsePreferences(JSON.stringify({ v: 1, textSize: 150, lineSpacing: 'nope', motion: 'reduce' }))).toEqual({
      v: 1,
      textSize: 150,
      lineSpacing: 'standard',
      motion: 'reduce',
    });
  });

  it('round-trips through storage under one versioned key', () => {
    const storage = memoryStorage();
    const preferences = { v: 1, textSize: 200, lineSpacing: 'extra', motion: 'reduce' } as const;
    expect(savePreferences(storage, preferences)).toBe(true);
    expect(JSON.parse(storage.map.get('biolab.preferences') ?? '')).toEqual(preferences);
    expect(loadPreferences(storage)).toEqual(preferences);
  });

  it('never throws when storage is blocked or missing, and reports that saving failed', () => {
    expect(loadPreferences(blockedStorage)).toEqual(DEFAULT_PREFERENCES);
    expect(loadPreferences(null)).toEqual(DEFAULT_PREFERENCES);
    expect(savePreferences(blockedStorage, DEFAULT_PREFERENCES)).toBe(false);
    expect(savePreferences(null, DEFAULT_PREFERENCES)).toBe(false);
  });
});

describe('D2 document attributes, reduced motion and chart fonts', () => {
  it('mirrors the preferences onto <html> data attributes', () => {
    applyPreferences({ v: 1, textSize: 125, lineSpacing: 'wide', motion: 'reduce' });
    const root = document.documentElement;
    expect(root.dataset.textSize).toBe('125');
    expect(root.dataset.lineSpacing).toBe('wide');
    expect(root.dataset.motion).toBe('reduce');
  });

  it('reduces motion when the device asks for it or the user chose Reduce motion, never forcing it back on', () => {
    mockReducedMotionQuery(false);
    applyPreferences(DEFAULT_PREFERENCES);
    expect(prefersReducedMotion()).toBe(false);

    applyPreferences({ ...DEFAULT_PREFERENCES, motion: 'reduce' });
    expect(prefersReducedMotion()).toBe(true);

    mockReducedMotionQuery(true);
    applyPreferences(DEFAULT_PREFERENCES);
    expect(prefersReducedMotion()).toBe(true);
  });

  it('jumps without smooth scrolling once Reduce motion is chosen', () => {
    mockReducedMotionQuery(false);
    const target = document.createElement('section');
    target.id = 'jump-target';
    target.tabIndex = -1;
    const scrollIntoView = vi.fn();
    target.scrollIntoView = scrollIntoView;
    document.body.appendChild(target);

    applyPreferences(DEFAULT_PREFERENCES);
    arriveAt('jump-target');
    expect(scrollIntoView).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: 'smooth' }));

    applyPreferences({ ...DEFAULT_PREFERENCES, motion: 'reduce' });
    arriveAt('jump-target');
    expect(scrollIntoView).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: 'auto' }));
  });

  it('scales chart font sizes with the text size', () => {
    expect(scaledFontSize(11, 100)).toBe(11);
    expect(scaledFontSize(11, 125)).toBe(13.75);
    expect(scaledFontSize(12, 200)).toBe(24);
  });
});
