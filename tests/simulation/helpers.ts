import { expect } from 'vitest';
import {
  BASELINE_INPUT,
  simulate,
  type FailureType,
  type HealthCategory,
  type SimulationInput,
  type SimulationResult,
} from '../../src/simulation';

/** Runs the model with the healthy baseline plus overrides; fails the test if the run is rejected. */
export function run(overrides: Partial<SimulationInput> = {}): SimulationResult {
  const outcome = simulate({ ...BASELINE_INPUT, ...overrides });
  if (!outcome.ok) {
    throw new Error(`simulate() rejected ${JSON.stringify(overrides)}: ${JSON.stringify(outcome.error)}`);
  }
  return outcome.result;
}

/** PRD-0001 regression tolerance. */
export function expectWithin(actual: number, expected: number, tolerance = 0.001): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

const HEALTH_RANK: Record<HealthCategory, number> = { healthy: 0, suboptimal: 1, stressed: 2 };

export function worstHealth(result: SimulationResult): HealthCategory {
  return result.samples.reduce<HealthCategory>(
    (worst, sample) => (HEALTH_RANK[sample.health.category] > HEALTH_RANK[worst] ? sample.health.category : worst),
    'healthy',
  );
}

export function recorded(result: SimulationResult, type: FailureType): boolean {
  return result.runRecord.entries.some((entry) => entry.type === type);
}

export function minBiomass(result: SimulationResult): number {
  return Math.min(...result.samples.map((sample) => sample.biomass));
}
