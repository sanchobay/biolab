import { useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  DEFAULT_PREFERENCES,
  PreferencesContext,
  applyPreferences,
  browserStorage,
  loadPreferences,
  savePreferences,
  type Preferences,
} from './preferences';

/**
 * Holds the display preferences (PRD-0005 §4). main.tsx has already applied the stored values before the first render;
 * each change is applied to <html> before React re-renders and saved on this device when the browser allows it.
 */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(() => loadPreferences(browserStorage()));
  const latest = useRef(preferences);

  useLayoutEffect(() => {
    applyPreferences(latest.current);
  }, []);

  const commit = useCallback((next: Preferences) => {
    latest.current = next;
    applyPreferences(next);
    savePreferences(browserStorage(), next);
    setPreferences(next);
  }, []);

  const value = useMemo(
    () => ({
      preferences,
      update: (patch: Partial<Omit<Preferences, 'v'>>) => commit({ ...latest.current, ...patch }),
      reset: () => commit(DEFAULT_PREFERENCES),
    }),
    [preferences, commit],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}
