// Calibration regression targets (±0.001) and model invariants: PRD-0001 User flow(s).
// These are model regression targets, not biological predictions.
import { describe, expect, it } from 'vitest';
import type { Aeration, HealthCategory, HealthTrend, LightHours, SimulationInput } from '../../src/simulation';
import { expectWithin, minBiomass, run } from './helpers';

interface Target {
  name: string;
  overrides: Partial<SimulationInput>;
  biomass: number;
  pH: number;
  lightPeriodO2: number;
  netRate: number;
  health: HealthCategory;
  trend?: HealthTrend;
}

const TARGETS: Target[] = [
  { name: 'Baseline (S1)', overrides: {}, biomass: 1.306, pH: 9.236, lightPeriodO2: 16.129, netRate: -0.157, health: 'healthy' },
  { name: '45 °C (S2)', overrides: { temperatureC: 45 }, biomass: 0.943, pH: 8.953, lightPeriodO2: 1.388, netRate: -0.132, health: 'stressed' },
  { name: 'Light 2,200 (S3)', overrides: { lightIntensity: 2200 }, biomass: 1.009, pH: 9.001, lightPeriodO2: 3.573, netRate: -0.121, health: 'suboptimal', trend: 'recovering' },
  { name: 'Starting pH 6.0 (S4)', overrides: { startingPH: 6 }, biomass: 0.965, pH: 5.96, lightPeriodO2: 1.68, netRate: -0.116, health: 'stressed' },
  { name: 'Starting pH 11.0 (S5)', overrides: { startingPH: 11 }, biomass: 1.008, pH: 11.0, lightPeriodO2: 3.506, netRate: -0.121, health: 'stressed' },
  { name: '15 °C (S6)', overrides: { temperatureC: 15 }, biomass: 1.113, pH: 9.094, lightPeriodO2: 5.922, netRate: -0.056, health: 'suboptimal' },
  { name: 'Aeration Off (S7)', overrides: { aeration: 'off' }, biomass: 1.12, pH: 9.096, lightPeriodO2: 8.248, netRate: -0.134, health: 'suboptimal' },
  { name: 'Aeration Low', overrides: { aeration: 'low' }, biomass: 1.22, pH: 9.174, lightPeriodO2: 12.491, netRate: -0.146, health: 'suboptimal' },
  { name: 'Light/dark 24:0 (S8)', overrides: { lightHours: 24 }, biomass: 1.672, pH: 9.467, lightPeriodO2: 30.643, netRate: 1.393, health: 'healthy' },
  { name: 'Light 2,200 and 45 °C (S9)', overrides: { temperatureC: 45, lightIntensity: 2200 }, biomass: 0.905, pH: 8.953, lightPeriodO2: 0.043, netRate: -0.127, health: 'stressed' },
];

describe.each(TARGETS)('regression target: $name', (target) => {
  const { summary } = run(target.overrides);

  it('matches biomass, pH, light-period O₂ and the 24:00 net rate within ±0.001', () => {
    expectWithin(summary.finalBiomass, target.biomass);
    expectWithin(summary.finalPH, target.pH);
    expectWithin(summary.lightPeriodPhotosyntheticO2, target.lightPeriodO2);
    expectWithin(summary.finalNetO2Rate, target.netRate);
  });

  it(`ends with culture health ${target.health}`, () => {
    expect(summary.finalHealth).toBe(target.health);
    if (target.trend) expect(summary.finalHealthTrend).toBe(target.trend);
  });
});

describe('model invariants (hold for every permitted input)', () => {
  const temperatures = [15, 30, 32, 40, 45];
  const startingPHs = [6, 7.5, 9, 10.5, 11];
  const lights = [0, 300, 800, 2200];
  const lightHours: LightHours[] = [8, 14, 24];
  const aerations: Aeration[] = ['off', 'low', 'adequate'];

  it('keeps relative biomass ≥ 0.891 and never gains biomass with negative integrated net O₂ (900-run grid)', () => {
    for (const temperatureC of temperatures)
      for (const startingPH of startingPHs)
        for (const lightIntensity of lights)
          for (const hours of lightHours)
            for (const aeration of aerations) {
              const result = run({ temperatureC, startingPH, lightIntensity, lightHours: hours, aeration });
              expect(minBiomass(result)).toBeGreaterThanOrEqual(0.891);
              if (result.totals.integratedNetO2 < 0) expect(result.summary.finalBiomass).toBeLessThanOrEqual(1);
            }
  });

  it('keeps a favorable starting pH between ≈8.415 and ≈9.980 under otherwise favorable conditions', () => {
    for (const startingPH of [8.51, 9, 9.49])
      for (const temperatureC of [31, 34.9])
        for (const lightIntensity of [300, 799])
          for (const hours of [8, 10, 12, 14, 16, 24] as LightHours[]) {
            const result = run({ startingPH, temperatureC, lightIntensity, lightHours: hours });
            const pHs = result.samples.map((sample) => sample.pH);
            expect(Math.min(...pHs)).toBeGreaterThanOrEqual(8.415);
            expect(Math.max(...pHs)).toBeLessThanOrEqual(9.98);
            expect(result.runRecord.entries.some((entry) => entry.type === 'ph-low' || entry.type === 'ph-high')).toBe(false);
          }
  });

  it('gives baseline pH ≈ 9.000 at hour 0, ≈ 9.276 at nightfall and ≈ 9.236 at hour 24', () => {
    const { samples } = run();
    expect(samples[0].pH).toBe(9);
    expectWithin(samples[840].pH, 9.276);
    expectWithin(samples[1440].pH, 9.236);
  });
});
