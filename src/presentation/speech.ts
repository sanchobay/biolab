// Read aloud text (PRD-0005 §5, ADR-0005 §1): what each region says, with symbols and units turned into words of the
// interface language, split into sentence-sized chunks so browsers do not cut long utterances.
import type { Messages } from '../i18n';
import type { TrajectorySample } from '../simulation';
import { formatBiomass, formatClock, formatNetO2, formatPH, formatStartingPH } from './format';
import { retainedCauseLabel } from './labels';
import type { ExplanationView } from './explanation';

const SUBSCRIPT_DIGITS: Record<string, string> = {
  '₀': '0',
  '₁': '1',
  '₂': '2',
  '₃': '3',
  '₄': '4',
  '₅': '5',
  '₆': '6',
  '₇': '7',
  '₈': '8',
  '₉': '9',
};

/** Replaces symbols and units that voices read poorly (or not at all) with words of the current language. */
export function spokenText(text: string, m: Messages): string {
  const w = m.speech.words;
  return text
    .replace(/µmol photons m⁻² s⁻¹/g, w.lightUnit)
    .replace(/\s*°C/g, ` ${w.celsius}`)
    .replace(/([A-Za-z])([₀-₉]+)/g, (_, letter: string, digits: string) => `${letter} ${[...digits].map((d) => SUBSCRIPT_DIGITS[d]).join('')}`)
    .replace(/×/g, w.times)
    .replace(/↓/g, w.decreased)
    .replace(/↑/g, w.increased)
    .replace(/−\s*/g, `${w.minus} `)
    .replace(/ \/ /g, ` ${w.per} `)
    .replace(/ · /g, ', ')
    // Lab Tutor answers write changes as "1.00 → 0.94" (Kazakh, PRD-0006 amendment); read the arrow as a pause.
    .replace(/\s*→\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const MAX_CHUNK = 220;

function splitLong(sentence: string, max: number): string[] {
  const pieces: string[] = [];
  let current = '';
  for (const word of sentence.split(' ')) {
    if (current && current.length + 1 + word.length > max) {
      pieces.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) pieces.push(current);
  return pieces;
}

/** Sentence-sized chunks of at most `max` characters; sentences are packed together and never lose words. */
export function speechChunks(text: string, max = MAX_CHUNK): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const sentences = clean.split(/(?<=[.!?…])\s+/).flatMap((sentence) => (sentence.length > max ? splitLong(sentence, max) : [sentence]));
  const chunks: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    if (current && current.length + 1 + sentence.length > max) {
      chunks.push(current);
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/** Ends a heading or label with a full stop so the voice pauses before the next part. */
export const asSentence = (part: string): string => {
  const trimmed = part.trim();
  return /[.!?…:]$/.test(trimmed) ? trimmed : `${trimmed}.`;
};

/** "What's happening in the culture?": the title, then each section label and its lines, then the extra blocks. */
export function explanationSpeech(view: ExplanationView, m: Messages): string {
  const parts = [view.title];
  for (const section of [...view.sections, ...view.blocks]) parts.push(section.label, ...section.lines);
  return spokenText(parts.filter(Boolean).map(asSentence).join(' '), m);
}

/** Key results as one spoken summary: time, each readout with its unit in words, then culture health. */
export function resultsSpeech(sample: TrajectorySample | null, startingPH: number, m: Messages): string {
  const r = m.results;
  if (!sample) return spokenText(r.empty, m);
  const parts = [
    `${r.simulatedTime} ${formatClock(sample.tHours)}`,
    `${r.biomass}: ${formatBiomass(sample.biomass)} ${r.timesInitial}`,
    `${r.pH}: ${formatPH(sample.pH)}. ${r.startedAt(formatStartingPH(startingPH))}`,
    `${r.netO2}: ${formatNetO2(sample.netO2Rate)} ${r.netO2Unit}`,
  ];
  const health = sample.health;
  if (health) {
    const cause = health.retainedCause ? r.dueTo(retainedCauseLabel(health.retainedCause, m)) : '';
    parts.push(`${r.health}: ${m.health[health.category]}, ${m.trend[health.trend]}${cause}`);
  }
  return spokenText(parts.map(asSentence).join(' '), m);
}
