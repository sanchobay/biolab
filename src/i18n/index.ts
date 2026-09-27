// Localization entry point (ADR-0003): typed message objects, one React context, no dependency.
// The simulation engine never imports this module; only the presentation and UI layers translate.
import { createContext, useContext } from 'react';
import { en, type Messages } from './en';
import { kk } from './kk';
import { ru } from './ru';

export type { Messages } from './en';

export type Locale = 'en' | 'kk' | 'ru';

/** Order of the header switcher: EN | ҚАЗ | RU (PRD-0003 §9). */
export const LOCALES: readonly Locale[] = ['en', 'kk', 'ru'];

export const MESSAGES: Record<Locale, Messages> = { en, kk, ru };

/** Switcher labels are shown in each language's own script; `lang` goes on the button and on <html>. */
export const LOCALE_META: Record<Locale, { short: string; name: string }> = {
  en: { short: 'EN', name: 'English' },
  kk: { short: 'ҚАЗ', name: 'Қазақша' },
  ru: { short: 'RU', name: 'Русский' },
};

export interface I18nValue {
  locale: Locale;
  m: Messages;
  setLocale: (locale: Locale) => void;
}

export const I18nContext = createContext<I18nValue>({ locale: 'en', m: en, setLocale: () => undefined });

export const useI18n = (): I18nValue => useContext(I18nContext);

/** Splits a "{name}" template so the UI can set the organism name in italics, in each language's own word order. */
export function splitName(template: string): [string, string] {
  const [before, after = ''] = template.split('{name}');
  return [before, after];
}
