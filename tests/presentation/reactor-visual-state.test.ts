import { describe, expect, it } from 'vitest';
import { reactorVisualState } from '../../src/presentation/reactorVisualState';
import { BASELINE_INPUT, PARAMETERS, simulate, type SimulationInput } from '../../src/simulation';

function trajectory(patch: Partial<SimulationInput> = {}) {
  const outcome = simulate({ ...BASELINE_INPUT, ...patch });
  if (!outcome.ok) throw new Error('Scenario input must be valid');
  return outcome.result;
}

describe('reactor presentation (ExecPlan 0006 R1–R3)', () => {
  it('previews hardware and neutral idle motion without inventing biological results', () => {
    const config = { ...BASELINE_INPUT, temperatureC: 45, lightIntensity: 2200 };
    const ready = reactorVisualState(config, null);
    expect(ready.health).toBeNull();
    expect(ready.photosynthesisActivity).toBe(0);
    expect(ready.cultureActivity).toBeGreaterThan(0);
    expect(ready.cultureActivity).toBeLessThan(reactorVisualState(BASELINE_INPUT, trajectory().samples[0]).cultureActivity);
    expect(ready.capacity).toBe(1);
    expect(ready.biomass).toBe(PARAMETERS.initialBiomass);
  });

  it('keeps aeration independent of photosynthetic production and health', () => {
    const counts = PARAMETERS.inputRanges.aeration.map((aeration) => {
      const { input, samples } = trajectory({ aeration, temperatureC: 45 });
      const start = reactorVisualState(input, samples[0]);
      const night = reactorVisualState(input, samples.at(-1)!);
      expect(night.aerationCount).toBe(start.aerationCount);
      return start.aerationCount;
    });
    expect(counts[0]).toBe(0);
    expect(counts[1]).toBeGreaterThanOrEqual(3);
    expect(counts[1]).toBeLessThanOrEqual(6);
    expect(counts[1]).toBeLessThan(counts[2]);
    expect(counts[2]).toBeGreaterThanOrEqual(10);
    expect(counts[2]).toBeLessThanOrEqual(16);
  });

  it('maps the actual light range monotonically and gives zero input no lamp emission', () => {
    const levels = [0, 150, 300, PARAMETERS.inputRanges.lightIntensity.max].map((lightIntensity) =>
      reactorVisualState({ ...BASELINE_INPUT, lightIntensity }, null),
    );
    expect(levels[0].lampOn).toBe(false);
    expect(levels[0].lampIntensity).toBe(0);
    expect(levels[0].isLight).toBe(true);
    for (let i = 1; i < levels.length; i++) expect(levels[i].lampIntensity).toBeGreaterThan(levels[i - 1].lampIntensity);
    expect(levels.at(-1)!.lampIntensity).toBe(1);
  });

  it.each(PARAMETERS.inputRanges.lightHours)('uses model light flags at the %i h boundary and at completion', (lightHours) => {
    const { input, samples } = trajectory({ lightHours });
    const boundary = lightHours * PARAMETERS.time.stepsPerHour;
    for (const k of [0, boundary - 1, boundary, samples.length - 1]) {
      const sample = samples[k];
      const visual = reactorVisualState(input, sample);
      expect(visual.isLight).toBe(sample.isLight);
      expect(visual.lampOn).toBe(sample.isLight);
      expect(visual.photosynthesisActivity).toBe(sample.specificProduction);
      if (!sample.isLight) {
        expect(visual.lampIntensity).toBe(0);
        expect(visual.photosynthesisActivity).toBe(0);
      }
    }
  });

  it.each([{ temperatureC: 15 }, { temperatureC: 45 }, { lightIntensity: 2200 }, { temperatureC: 45, lightIntensity: 2200 }])(
    'follows reduced model capacity/production for %j without dimming a high-input lamp', (patch) => {
      const baseline = trajectory();
      const stressed = trajectory(patch);
      const k = 3 * PARAMETERS.time.stepsPerHour;
      const normal = reactorVisualState(baseline.input, baseline.samples[k]);
      const reduced = reactorVisualState(stressed.input, stressed.samples[k]);
      expect(reduced.cultureActivity).toBeLessThan(normal.cultureActivity);
      expect(reduced.photosynthesisActivity).toBe(stressed.samples[k].specificProduction);
      expect(reduced.health).toBe(stressed.samples[k].health.category);
      if (patch.lightIntensity) expect(reduced.lampIntensity).toBeGreaterThan(normal.lampIntensity);
    },
  );

  it('uses delayed health only to modulate motion; never reclassifies it or oxygen', () => {
    const sample = trajectory().samples[0];
    const activity = (['healthy', 'suboptimal', 'stressed'] as const).map((category) => {
      const visual = reactorVisualState(BASELINE_INPUT, { ...sample, health: { ...sample.health, category } });
      expect(visual.health).toBe(category);
      expect(visual.photosynthesisActivity).toBe(sample.specificProduction);
      expect(visual.capacity).toBe(sample.specificCapacity);
      return visual.cultureActivity;
    });
    expect(activity[0]).toBeGreaterThan(activity[1]);
    expect(activity[1]).toBeGreaterThan(activity[2]);
  });
});
