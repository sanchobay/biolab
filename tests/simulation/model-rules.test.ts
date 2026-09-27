// Model rules: PRD-0001 §12.2–§12.3 (response factors), §9 (classification, ranking, nightfall), §12.10 (delayed health).
import { describe, expect, it } from 'vitest';
import type { SimulationInput } from '../../src/simulation';
import { run } from './helpers';

// Sample 0 has B = 1 and h = starting pH, so its capacity c = f_T · f_h · f_L · A exposes the calibrated factors directly.
const capacity0 = (overrides: Partial<SimulationInput>) => run(overrides).samples[0].specificCapacity;
const condition0 = (overrides: Partial<SimulationInput>) => run(overrides).samples[0].condition;

describe('calibrated response factors (PRD-0001 §12.2–§12.3)', () => {
  it.each([
    [0, 0],
    [150, 0.75],
    [300, 1],
    [500, 1],
    [800, 1],
    [2200, 0.25],
  ])('light %s µmol photons m⁻² s⁻¹ gives f_L = %s at a favorable temperature', (lightIntensity, expected) => {
    expect(capacity0({ lightIntensity })).toBeCloseTo(expected, 9);
  });

  it('starts inhibition continuously from zero just above 800', () => {
    expect(capacity0({ lightIntensity: 850 })).toBeCloseTo(0.998, 3);
    expect(capacity0({ lightIntensity: 1000 })).toBeCloseTo(0.972, 3);
  });

  it.each([
    [15, 0.4],
    [25, 0.8],
    [27.5, 0.885],
    [30, 0.97],
    [32, 1],
    [35, 0.95],
    [40, 0.55],
    [45, 0.1],
  ])('temperature %s °C gives f_T = %s (piecewise-linear table)', (temperatureC, expected) => {
    expect(capacity0({ temperatureC })).toBeCloseTo(expected, 9);
  });

  it.each([
    [15, 0.05],
    [32, 0.12],
    [40, 0.16],
    [45, 0.14],
  ])('temperature %s °C gives specific respiration r = %s', (temperatureC, expected) => {
    expect(run({ temperatureC }).samples[0].respiratoryRate).toBeCloseTo(expected, 9);
  });

  it.each([
    [6, 0.12],
    [7.5, 0.6],
    [8.5, 0.95],
    [9.25, 0.975],
    [10.5, 0.45],
    [11, 0.25],
  ])('starting pH %s gives f_h = %s', (startingPH, expected) => {
    expect(capacity0({ startingPH })).toBeCloseTo(expected, 9);
  });

  it('applies the aeration factors Off 0.55, Low 0.80, Adequate 1.00', () => {
    expect(capacity0({ aeration: 'off' })).toBeCloseTo(0.55, 9);
    expect(capacity0({ aeration: 'low' })).toBeCloseTo(0.8, 9);
    expect(capacity0({ aeration: 'adequate' })).toBeCloseTo(1, 9);
  });

  it('strengthens photoinhibition away from the favorable temperature (C-07)', () => {
    expect(capacity0({ temperatureC: 45, lightIntensity: 2200 })).toBeCloseTo(0.1 * 0.03125, 9);
  });
});

describe('classification boundaries: the more severe zone wins (PRD-0001 §9 rule 4)', () => {
  it.each<[Partial<SimulationInput>, string]>([
    [{ temperatureC: 30 }, 'temperature-cold'],
    [{ temperatureC: 35 }, 'temperature-warm'],
    [{ temperatureC: 39.9 }, 'temperature-warm'],
    [{ lightIntensity: 150 }, 'light-limited'],
    [{ startingPH: 8.5 }, 'ph-low'],
    [{ startingPH: 9.5 }, 'ph-high'],
    [{ aeration: 'low' }, 'aeration-low'],
    [{ aeration: 'off' }, 'aeration-off'],
  ])('%o is Suboptimal with cause %s', (overrides, cause) => {
    const condition = condition0(overrides);
    expect(condition.severity).toBe('suboptimal');
    expect(condition.suboptimalCauses).toContain(cause);
    expect(condition.failures).toEqual([]);
    expect(condition.primaryFailure).toBeNull();
  });

  it.each<[Partial<SimulationInput>, string]>([
    [{ temperatureC: 40 }, 'thermal'],
    [{ lightIntensity: 800 }, 'photoinhibition'],
    [{ startingPH: 7 }, 'ph-low'],
    [{ startingPH: 10.5 }, 'ph-high'],
  ])('%o enters failure %s', (overrides, type) => {
    const condition = condition0(overrides);
    expect(condition.severity).toBe('failure');
    expect(condition.primaryFailure).toBe(type);
  });

  it('classifies the favorable interior as Healthy', () => {
    const condition = condition0({ temperatureC: 30.1, startingPH: 8.6, lightIntensity: 151 });
    expect(condition.severity).toBe('healthy');
    expect(condition.suboptimalCauses).toEqual([]);
  });

  it('orders suboptimal causes temperature, light, pH, aeration', () => {
    const condition = condition0({ temperatureC: 20, lightIntensity: 100, startingPH: 8, aeration: 'off' });
    expect(condition.suboptimalCauses).toEqual(['temperature-cold', 'light-limited', 'ph-low', 'aeration-off']);
  });

  it('never classifies cold as a failure (MD-4)', () => {
    const cold = run({ temperatureC: 15 });
    expect(cold.samples.some((sample) => sample.condition.failures.some((f) => f.type === 'thermal'))).toBe(false);
  });
});

describe('darkness and nightfall (PRD-0001 §9 rules 5 and 8)', () => {
  it('does not treat darkness as light limitation', () => {
    const dim = run({ lightIntensity: 100 });
    expect(dim.samples[0].condition.suboptimalCauses).toContain('light-limited');
    expect(dim.samples[840].condition.suboptimalCauses).not.toContain('light-limited');
  });

  it('ends the high-light exposure classification exactly at nightfall (S3)', () => {
    const bright = run({ lightIntensity: 2200 });
    expect(bright.samples[839].condition.primaryFailure).toBe('photoinhibition');
    expect(bright.samples[840].condition.failures).toEqual([]);
    expect(bright.samples[840].condition.severity).toBe('healthy');
  });
});

describe('primary-cause ranking (PRD-0001 §9 rule 1)', () => {
  it('ranks simultaneous failures by the capacity gained from correcting each control alone (S9)', () => {
    const condition = run({ temperatureC: 45, lightIntensity: 2200 }).samples[0].condition;
    expect(condition.failures.map((failure) => failure.type)).toEqual(['thermal', 'photoinhibition']);
    expect(condition.failures[0].contribution).toBeCloseTo(0.25 - 0.003125, 9);
    expect(condition.failures[1].contribution).toBeCloseTo(0.1 - 0.003125, 9);
    expect(condition.primaryFailure).toBe('thermal');
  });

  it('ranks persistent non-light failures in darkness using reference light', () => {
    const night = run({ temperatureC: 45 }).samples[900].condition;
    expect(night.primaryFailure).toBe('thermal');
    expect(night.failures[0].contribution).toBeGreaterThan(0);
  });
});

describe('delayed health (PRD-0001 §12.10)', () => {
  it('worsens one category per 2 simulated hours of persistent failure (S2)', () => {
    const health = run({ temperatureC: 45 }).samples.map((sample) => sample.health);
    expect(health[0]).toMatchObject({ category: 'healthy', target: 'stressed', trend: 'worsening', retainedCause: 'thermal' });
    expect(health[119].category).toBe('healthy');
    expect(health[120].category).toBe('suboptimal');
    expect(health[239].category).toBe('suboptimal');
    expect(health[240].category).toBe('stressed');
    expect(health[1440]).toMatchObject({ category: 'stressed', trend: 'steady' });
  });

  it('recovers one category after 6 simulated hours once high-light exposure ends at nightfall (S3)', () => {
    const health = run({ lightIntensity: 2200 }).samples.map((sample) => sample.health);
    expect(health[839].category).toBe('stressed');
    expect(health[840]).toMatchObject({
      category: 'stressed',
      target: 'healthy',
      trend: 'recovering',
      retainedCause: 'photoinhibition',
    });
    expect(health[1199].category).toBe('stressed');
    expect(health[1200].category).toBe('suboptimal');
    expect(health[1440]).toMatchObject({ category: 'suboptimal', trend: 'recovering', retainedCause: 'photoinhibition' });
  });

  it('has no retained cause while healthy with a healthy target', () => {
    expect(run().samples.every((sample) => sample.health.retainedCause === null)).toBe(true);
  });
});
