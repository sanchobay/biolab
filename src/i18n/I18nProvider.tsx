import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nContext, MESSAGES, type Locale } from './index';

/** Holds the interface language (English by default, not persisted) and mirrors it onto <html lang> and the title (ADR-0003). */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');
  const value = useMemo(() => ({ locale, m: MESSAGES[locale], setLocale }), [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = MESSAGES[locale].meta.title;
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
