// R2–R3 (ExecPlan 0009, PRD-0005 §5): spoken-text normalization, sentence chunks and the texts read for each region.
import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../src/i18n';
import { introExplanation, outcomeExplanation } from '../../src/presentation/explanation';
import { explanationSpeech, resultsSpeech, speechChunks, spokenText } from '../../src/presentation/speech';
import { BASELINE_INPUT, simulate, type SimulationResult } from '../../src/simulation';

const { en, ru, kk } = MESSAGES;

function run(input = BASELINE_INPUT): SimulationResult {
  const outcome = simulate(input);
  if (!outcome.ok) throw new Error('baseline run failed');
  return outcome.result;
}

describe('R2 spoken text', () => {
  it('reads symbols and units as words in English', () => {
    expect(spokenText('300 µmol photons m⁻² s⁻¹', en)).toBe('300 micromoles of photons per square metre per second');
    expect(spokenText('32.0 °C', en)).toBe('32.0 degrees Celsius');
    expect(spokenText('Net O₂ production', en)).toBe('Net O 2 production');
    expect(spokenText('1.31 × initial', en)).toBe('1.31 times initial');
    expect(spokenText('Biomass ↓ 12%, pH ↑', en)).toBe('Biomass decreased 12%, pH increased');
    expect(spokenText('−0.16 relative units / simulated hour', en)).toBe('minus 0.16 relative units per simulated hour');
  });

  it('uses the words of the current language', () => {
    expect(spokenText('32.0 °C', ru)).toBe('32.0 градусов Цельсия');
    expect(spokenText('−0.16', ru)).toBe('минус 0.16');
    expect(spokenText('1.31 × от исходной', ru)).toBe('1.31 раза от исходной');
    expect(spokenText('300 µmol photons m⁻² s⁻¹', kk)).not.toMatch(/[µ⁻²¹]/);
    expect(spokenText('1.31 × бастапқыдан', kk)).toBe('1.31 есе бастапқыдан');
  });

  it('splits long text into sentence-sized chunks without losing words', () => {
    const sentence = 'The culture grows during the light period and respires in the dark.';
    const text = Array.from({ length: 8 }, () => sentence).join(' ');
    const chunks = speechChunks(text);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 220)).toBe(true);
    expect(chunks.join(' ').split(/\s+/)).toEqual(text.split(/\s+/));
    expect(speechChunks('  ')).toEqual([]);
  });

  it('splits a single sentence longer than the limit at word boundaries', () => {
    const long = Array.from({ length: 60 }, (_, i) => `word${i}`).join(' ');
    const chunks = speechChunks(long);
    expect(chunks.every((chunk) => chunk.length <= 220)).toBe(true);
    expect(chunks.join(' ')).toBe(long);
  });
});

describe('R3 texts read for each region', () => {
  it('reads the explanation as title, then each section label with its lines, then the extra blocks', () => {
    const view = introExplanation(en);
    const text = explanationSpeech(view, en);
    expect(text.startsWith('Ready to experiment.')).toBe(true);
    const how = text.indexOf(en.explanation.howItWorks);
    const see = text.indexOf(en.explanation.whatYouSee);
    expect(how).toBeGreaterThan(0);
    expect(see).toBeGreaterThan(how);
    for (const line of en.explanation.introSee) expect(text).toContain(line);

    const outcome = outcomeExplanation(run(), run(), en);
    const outcomeText = explanationSpeech(outcome, en);
    expect(outcomeText.startsWith(`${outcome.title}.`)).toBe(true);
    for (const block of outcome.blocks) expect(outcomeText).toContain(block.label);
  });

  it('reads Key results before a run as the empty-state hint', () => {
    expect(resultsSpeech(null, BASELINE_INPUT.startingPH, en)).toBe('Run the experiment to see data');
    expect(resultsSpeech(null, BASELINE_INPUT.startingPH, ru)).toBe(ru.results.empty);
  });

  it('summarises Key results after a run with spoken units', () => {
    const result = run();
    const sample = result.samples[result.samples.length - 1];
    const text = resultsSpeech(sample, result.input.startingPH, en);
    expect(text).toMatch(/^Simulated time 24:00\./);
    expect(text).toContain('Relative biomass: 1.31 times initial');
    expect(text).toContain('Simulated pH: 9.24');
    expect(text).toContain('Net O 2 production: minus 0.16 relative units per simulated hour');
    expect(text).toContain('Culture health: Healthy, Steady');
    expect(text).not.toMatch(/[×−₂µ⁻]/);
  });
});
