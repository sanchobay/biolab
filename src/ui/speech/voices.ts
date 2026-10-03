// Voice choice for read aloud (PRD-0005 §5, ADR-0005 §1, ExecPlan 0009): only voices installed on this device, only in
// the interface language, preferred voices first. A voice for another language is never used.
import type { Locale } from '../../i18n';

/** The part of SpeechSynthesisVoice that the choice needs; tests use plain objects. */
export interface VoiceLike {
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
  voiceURI: string;
}

/** Clear, natural voices chosen for the demo (user decision, 2026-10-01), in order of preference. */
export const PREFERRED_VOICES = ['Samantha', 'Daniel', 'Karen', 'Moira', 'Tessa'] as const;

/** Explicit novelty voices shipped with macOS; never used even when nothing else matches. */
export const NOVELTY_VOICES: ReadonlySet<string> = new Set([
  'Albert',
  'Bad News',
  'Bahh',
  'Bells',
  'Boing',
  'Bubbles',
  'Cellos',
  'Deranged',
  'Good News',
  'Hysterical',
  'Jester',
  'Organ',
  'Pipe Organ',
  'Superstar',
  'Trinoids',
  'Whisper',
  'Wobble',
  'Zarvox',
]);

/** Main regions tried first in the fallback, e.g. en-US before en-GB before other English voices. */
const MAIN_REGIONS: Record<Locale, readonly string[]> = { en: ['en-us', 'en-gb'], kk: ['kk-kz'], ru: ['ru-ru'] };

/** macOS reports "kk_KZ"; browsers usually report "kk-KZ". */
const normalizedLang = (lang: string): string => lang.replace('_', '-').toLowerCase();

export function pickVoice<V extends VoiceLike>(voices: readonly V[], locale: Locale): V | null {
  const candidates = voices.filter((voice) => voice.localService && normalizedLang(voice.lang).split('-')[0] === locale);
  for (const name of PREFERRED_VOICES) {
    const preferred = candidates.find((voice) => voice.name === name);
    if (preferred) return preferred;
  }
  const allowed = candidates.filter((voice) => !NOVELTY_VOICES.has(voice.name));
  const byDefault = allowed.find((voice) => voice.default);
  if (byDefault) return byDefault;
  for (const region of MAIN_REGIONS[locale]) {
    const regional = allowed.find((voice) => normalizedLang(voice.lang) === region);
    if (regional) return regional;
  }
  return allowed[0] ?? null;
}
