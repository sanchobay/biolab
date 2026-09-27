// Input validation: ADR-0002 §4. The engine never clamps or rounds.
import { PARAMETERS } from './parameters';
import type { SimulationInput, ValidationError } from './types';

const ranges = PARAMETERS.inputRanges;
const NUMERIC_FIELDS = ['temperatureC', 'startingPH', 'lightIntensity'] as const;

export function validateInput(input: SimulationInput): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const field of NUMERIC_FIELDS) {
    const value: unknown = input[field];
    const { min, max } = ranges[field];
    const allowed = `${min} to ${max}`;
    if (typeof value !== 'number' || !Number.isFinite(value)) errors.push({ field, reason: 'not-finite', allowed });
    else if (value < min || value > max) errors.push({ field, reason: 'out-of-range', allowed });
  }

  if (!(ranges.lightHours as readonly unknown[]).includes(input.lightHours)) {
    errors.push({ field: 'lightHours', reason: 'unknown-option', allowed: ranges.lightHours.join(', ') });
  }
  if (!(ranges.aeration as readonly unknown[]).includes(input.aeration)) {
    errors.push({ field: 'aeration', reason: 'unknown-option', allowed: ranges.aeration.join(', ') });
  }

  return errors;
}
