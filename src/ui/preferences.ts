// Display preferences (PRD-0005 §1–§4, ADR-0005 §2–§4): text size, line spacing and motion, kept on this device only.
// They live on <html> as data attributes so the stylesheet, the charts and the motion helper all read one source.
import { createContext, useContext } from 'react';

export type TextSize = 100 | 125 | 150 | 200;
export type LineSpacing = 'standard' | 'wide' | 'extra';
export type Motion = 'system' | 'reduce';

export interface Preferences {
  v: 1;
  textSize: TextSize;
  lineSpacing: LineSpacing;
  motion: Motion;
}

export const TEXT_SIZES: readonly TextSize[] = [100, 125, 150, 200];
export const LINE_SPACINGS: readonly LineSpacing[] = ['standard', 'wide', 'extra'];
export const MOTIONS: readonly Motion[] = ['system', 'reduce'];

export const DEFAULT_PREFERENCES: Preferences = { v: 1, textSize: 100, lineSpacing: 'standard', motion: 'system' };

export const PREFERENCES_KEY = 'biolab.preferences';

/** The part of Web Storage used here, so tests and blocked storage can stand in for localStorage. */
export interface PreferenceStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const pick = <T>(allowed: readonly T[], value: unknown, fallback: T): T => (allowed.includes(value as T) ? (value as T) : fallback);

/** Missing, unreadable or wrong-version data gives the defaults; each valid field of a version-1 record is kept. */
export function parsePreferences(raw: string | null): Preferences {
  if (raw === null) return DEFAULT_PREFERENCES;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return DEFAULT_PREFERENCES;
  }
  if (typeof data !== 'object' || data === null || (data as { v?: unknown }).v !== 1) return DEFAULT_PREFERENCES;
  const record = data as Record<string, unknown>;
  return {
    v: 1,
    textSize: pick(TEXT_SIZES, record.textSize, DEFAULT_PREFERENCES.textSize),
    lineSpacing: pick(LINE_SPACINGS, record.lineSpacing, DEFAULT_PREFERENCES.lineSpacing),
    motion: pick(MOTIONS, record.motion, DEFAULT_PREFERENCES.motion),
  };
}

export function loadPreferences(storage: PreferenceStorage | null): Preferences {
  try {
    return parsePreferences(storage?.getItem(PREFERENCES_KEY) ?? null);
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

/** Returns false when the browser refuses storage (private windows, blocked site data); the settings still apply. */
export function savePreferences(storage: PreferenceStorage | null, preferences: Preferences): boolean {
  if (!storage) return false;
  try {
    storage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    return true;
  } catch {
    return false;
  }
}

/** localStorage itself can throw on access when site data is blocked. */
export function browserStorage(): PreferenceStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function applyPreferences(preferences: Preferences, root: HTMLElement = document.documentElement): void {
  root.dataset.textSize = String(preferences.textSize);
  root.dataset.lineSpacing = preferences.lineSpacing;
  root.dataset.motion = preferences.motion;
}

/** The device setting or the in-app Reduce motion choice; the in-app setting never turns motion back on (ADR-0005 §4). */
export function prefersReducedMotion(): boolean {
  if (typeof document !== 'undefined' && document.documentElement.dataset.motion === 'reduce') return true;
  return typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
}

/** Canvas text (Chart.js) does not follow the root font size, so its sizes are scaled here (ADR-0005 §3). */
export const scaledFontSize = (size: number, textSize: TextSize): number => (size * textSize) / 100;

export interface PreferencesValue {
  preferences: Preferences;
  update: (patch: Partial<Omit<Preferences, 'v'>>) => void;
  reset: () => void;
}

export const PreferencesContext = createContext<PreferencesValue>({
  preferences: DEFAULT_PREFERENCES,
  update: () => undefined,
  reset: () => undefined,
});

export const usePreferences = (): PreferencesValue => useContext(PreferencesContext);
