// Engine contract: ADR-0002 §4–§9 (inputs, validation, trajectory shape, light-state rule, identities, determinism).
import { describe, expect, it } from 'vitest';
import { BASELINE_INPUT, PARAMETERS, simulate, validateInput, type SimulationInput } from '../../src/simulation';
import { run } from './helpers';

function withField(field: keyof SimulationInput, value: unknown): SimulationInput {
  return { ...BASELINE_INPUT, [field]: value } as SimulationInput;
}

function isDeepFrozen(value: unknown): boolean {
  if (value === null || typeof value !== 'object') return true;
  return Object.isFrozen(value) && Object.values(value).every(isDeepFrozen);
}

describe('input validation (ADR-0002 §4)', () => {
  it('exposes the PRD-0001 §12.9 healthy baseline and accepts it', () => {
    expect(BASELINE_INPUT).toEqual({
      temperatureC: 32,
      startingPH: 9,
      lightIntensity: 300,
      lightHours: 14,
      aeration: 'adequate',
    });
    expect(validateInput(BASELINE_INPUT)).toEqual([]);
    expect(simulate(BASELINE_INPUT).ok).toBe(true);
  });

  it.each<[keyof SimulationInput, number]>([
    ['temperatureC', 15],
    ['temperatureC', 45],
    ['startingPH', 6],
    ['startingPH', 11],
    ['lightIntensity', 0],
    ['lightIntensity', 2200],
  ])('accepts the inclusive limit %s = %s', (field, value) => {
    expect(validateInput(withField(field, value))).toEqual([]);
  });

  it.each<[keyof SimulationInput, number]>([
    ['temperatureC', 14.9],
    ['temperatureC', 45.1],
    ['startingPH', 5.9],
    ['startingPH', 11.1],
    ['lightIntensity', -1],
    ['lightIntensity', 2200.5],
  ])('rejects out-of-range %s = %s without throwing', (field, value) => {
    const input = withField(field, value);
    expect(validateInput(input)).toContainEqual(expect.objectContaining({ field, reason: 'out-of-range' }));
    const outcome = simulate(input);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.error.kind).toBe('invalid-input');
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])('rejects a non-finite value (%s)', (value) => {
    for (const field of ['temperatureC', 'startingPH', 'lightIntensity'] as const) {
      expect(validateInput(withField(field, value))).toContainEqual(
        expect.objectContaining({ field, reason: 'not-finite' }),
      );
    }
  });

  it('rejects unknown light/dark presets and aeration settings', () => {
    expect(validateInput(withField('lightHours', 13))).toContainEqual(
      expect.objectContaining({ field: 'lightHours', reason: 'unknown-option' }),
    );
    expect(validateInput(withField('aeration', 'high'))).toContainEqual(
      expect.objectContaining({ field: 'aeration', reason: 'unknown-option' }),
    );
  });

  it('reports every invalid field at once', () => {
    const errors = validateInput({ ...BASELINE_INPUT, temperatureC: 50, startingPH: 3 });
    expect(errors.map((error) => error.field).sort()).toEqual(['startingPH', 'temperatureC']);
  });
});

describe('trajectory contract (ADR-0002 §5–§6)', () => {
  const baseline = run();

  it('has 1,441 samples at t = k / 60 simulated hours', () => {
    expect(baseline.samples).toHaveLength(1441);
    baseline.samples.forEach((sample, k) => {
      expect(sample.k).toBe(k);
      expect(sample.tHours).toBe(k / 60);
    });
  });

  it('starts at relative biomass 1.0 and the configured starting pH', () => {
    expect(baseline.samples[0].biomass).toBe(1);
    expect(baseline.samples[0].pH).toBe(9);
    expect(run({ startingPH: 7.4 }).samples[0].pH).toBe(7.4);
  });

  it('applies the per-sample light-state rule D(min(m, 1439))', () => {
    expect(baseline.samples[0].isLight).toBe(true);
    expect(baseline.samples[839].isLight).toBe(true);
    expect(baseline.samples[840].isLight).toBe(false);
    expect(baseline.samples[1440].isLight).toBe(false);
    expect(run({ lightHours: 8 }).samples[480].isLight).toBe(false);
    expect(run({ lightHours: 24 }).samples.every((sample) => sample.isLight)).toBe(true);
  });

  it('keeps N = P − R, P = B · p, p = 0 in darkness and p = c in light', () => {
    for (const sample of baseline.samples) {
      expect(sample.netO2Rate).toBeCloseTo(sample.photosyntheticRate - sample.respiratoryRate, 12);
      expect(sample.photosyntheticRate).toBeCloseTo(sample.biomass * sample.specificProduction, 12);
      expect(sample.respiratoryRate).toBeGreaterThan(0);
      if (sample.isLight) expect(sample.specificProduction).toBeCloseTo(sample.specificCapacity, 12);
      else expect(sample.specificProduction).toBe(0);
    }
  });

  it('summarises the final sample and the light-period total', () => {
    const last = baseline.samples[1440];
    expect(baseline.summary.finalBiomass).toBe(last.biomass);
    expect(baseline.summary.finalPH).toBe(last.pH);
    expect(baseline.summary.finalNetO2Rate).toBe(last.netO2Rate);
    expect(baseline.summary.finalHealth).toBe(last.health.category);
    expect(baseline.summary.finalHealthTrend).toBe(last.health.trend);
    expect(baseline.summary.lightPeriodPhotosyntheticO2).toBe(baseline.totals.lightPeriodPhotosyntheticO2);
  });

  it('reports the photoinhibition penalty 1 − j (PRD-0001 §12.3)', () => {
    expect(baseline.photoinhibitionPenalty).toBe(0);
    expect(run({ lightIntensity: 800 }).photoinhibitionPenalty).toBe(0);
    expect(run({ lightIntensity: 2200 }).photoinhibitionPenalty).toBeCloseTo(0.75, 9);
    expect(run({ lightIntensity: 2200, temperatureC: 45 }).photoinhibitionPenalty).toBeCloseTo(1 - 0.03125, 9);
  });

  it('echoes the input and identifies the calibration set', () => {
    expect(baseline.input).toEqual(BASELINE_INPUT);
    expect(baseline.parameterSetId).toMatch(/PRD-0001/);
  });

  it('exposes a deep-frozen PARAMETERS source (PRD-0001 §11)', () => {
    expect(isDeepFrozen(PARAMETERS)).toBe(true);
  });
});

describe('determinism and speed (ADR-0002 §7, §9)', () => {
  it('returns deep-equal results for identical inputs (S10)', () => {
    const input = { temperatureC: 45, lightIntensity: 2200 };
    expect(run(input)).toEqual(run(input));
  });

  it('computes a run well under the 300 ms Preparing threshold', () => {
    const started = performance.now();
    for (let i = 0; i < 20; i += 1) run({ temperatureC: 45, lightIntensity: 2200, aeration: 'low' });
    expect((performance.now() - started) / 20).toBeLessThan(100);
  });
});
