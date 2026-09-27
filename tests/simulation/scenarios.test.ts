// Reference scenarios S1–S10: PRD-0001 User flow(s). Directional assertions only; numeric targets live in regression.test.ts.
import { describe, expect, it } from 'vitest';
import { minBiomass, recorded, run, worstHealth } from './helpers';

const s1 = run();
const s3 = run({ lightIntensity: 2200 });

describe('S1 healthy baseline (32 °C, pH 9.0, 300, 14:10, Adequate)', () => {
  it('stays Healthy with no failures and no health change', () => {
    expect(s1.runRecord.entries).toEqual([]);
    expect(s1.runRecord.outcomeSeverity).toBe('healthy');
    expect(s1.samples.every((sample) => sample.condition.severity === 'healthy')).toBe(true);
    expect(s1.samples.every((sample) => sample.health.category === 'healthy')).toBe(true);
  });

  it('gains biomass over 24 h', () => {
    expect(s1.summary.finalBiomass).toBeGreaterThan(1);
  });

  it('has positive net O₂ in light and negative net O₂ in darkness', () => {
    for (const sample of s1.samples) {
      if (sample.isLight) expect(sample.netO2Rate).toBeGreaterThan(0);
      else expect(sample.netO2Rate).toBeLessThan(0);
    }
  });

  it('raises simulated pH during the light period', () => {
    expect(s1.samples[840].pH).toBeGreaterThan(s1.samples[0].pH);
  });
});

describe.each([
  { id: 'S2', overrides: { temperatureC: 45 }, failure: 'thermal' as const },
  { id: 'S3', overrides: { lightIntensity: 2200 }, failure: 'photoinhibition' as const },
  { id: 'S4', overrides: { startingPH: 6 }, failure: 'ph-low' as const },
  { id: 'S5', overrides: { startingPH: 11 }, failure: 'ph-high' as const },
])('$id stress scenario', ({ overrides, failure }) => {
  const result = run(overrides);

  it(`records ${failure} and makes it the primary failure`, () => {
    expect(recorded(result, failure)).toBe(true);
    expect(result.runRecord.primaryFailure).toBe(failure);
    expect(result.runRecord.outcomeSeverity).toBe('failure');
  });

  it('gains less biomass than S1', () => {
    expect(result.summary.finalBiomass).toBeLessThan(s1.summary.finalBiomass);
  });

  it('produces less light-period photosynthetic O₂ than S1', () => {
    expect(result.totals.lightPeriodPhotosyntheticO2).toBeLessThan(s1.totals.lightPeriodPhotosyntheticO2);
  });

  it('worsens culture health to Stressed at some point', () => {
    expect(worstHealth(result)).toBe('stressed');
  });

  it('keeps relative biomass above zero', () => {
    expect(minBiomass(result)).toBeGreaterThan(0);
  });
});

describe('S6 cold (15 °C)', () => {
  const s6 = run({ temperatureC: 15 });

  it('is Suboptimal, never Thermal stress', () => {
    expect(s6.runRecord.entries).toEqual([]);
    expect(s6.runRecord.outcomeSeverity).toBe('suboptimal');
    expect(s6.samples[0].condition.suboptimalCauses).toContain('temperature-cold');
  });

  it('gains less biomass than S1', () => {
    expect(s6.summary.finalBiomass).toBeLessThan(s1.summary.finalBiomass);
  });
});

describe('S7 aeration Off', () => {
  const s7 = run({ aeration: 'off' });

  it('is Suboptimal with no failure', () => {
    expect(s7.runRecord.entries).toEqual([]);
    expect(s7.runRecord.outcomeSeverity).toBe('suboptimal');
  });

  it('gains less biomass than S1 and keeps biomass above zero', () => {
    expect(s7.summary.finalBiomass).toBeLessThan(s1.summary.finalBiomass);
    expect(minBiomass(s7)).toBeGreaterThan(0);
  });
});

describe('S8 continuous light (24:0)', () => {
  const s8 = run({ lightHours: 24 });

  it('is not a failure and never has darkness-driven negative net O₂', () => {
    expect(s8.runRecord.entries).toEqual([]);
    expect(s8.samples.every((sample) => sample.netO2Rate > 0)).toBe(true);
  });
});

describe('S9 heat plus high light', () => {
  const s9 = run({ temperatureC: 45, lightIntensity: 2200 });

  it('records both failures with Thermal stress as the overall primary', () => {
    expect(recorded(s9, 'thermal')).toBe(true);
    expect(recorded(s9, 'photoinhibition')).toBe(true);
    expect(s9.runRecord.primaryFailure).toBe('thermal');
  });

  it('has photosynthetic performance no better than S3', () => {
    expect(s9.samples[0].specificCapacity).toBeLessThanOrEqual(s3.samples[0].specificCapacity);
    expect(s9.totals.lightPeriodPhotosyntheticO2).toBeLessThanOrEqual(s3.totals.lightPeriodPhotosyntheticO2);
  });
});

describe('S10 repeatability', () => {
  it('gives identical trajectories, current states, health transitions and run record', () => {
    const input = { temperatureC: 38.5, startingPH: 10.2, lightIntensity: 1250, lightHours: 16 as const, aeration: 'low' as const };
    expect(run(input)).toEqual(run(input));
  });
});
