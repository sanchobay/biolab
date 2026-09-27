// Light intensity control mapping: PRD-0002 §4.1 (D-6).
// The stop index is a UI coordinate only; the simulation only ever receives the photon-flux value.

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

/** 79 stops: 0–300 in steps of 10, 300–800 in steps of 25, 800–2,200 in steps of 50. */
export const LIGHT_STOPS: readonly number[] = Object.freeze([
  ...range(0, 30).map((s) => 10 * s),
  ...range(31, 50).map((s) => 300 + 25 * (s - 30)),
  ...range(51, 78).map((s) => 800 + 50 * (s - 50)),
]);

export const LIGHT_REFERENCE_VALUES: readonly number[] = Object.freeze([0, 150, 300, 800, 2200]);

/** Continuous inverse of the stop mapping, used to place the thumb for any typed value. */
export function lightToStopPosition(value: number): number {
  if (value <= 300) return value / 10;
  if (value <= 800) return 30 + (value - 300) / 25;
  return 50 + (value - 800) / 50;
}

/** One stop up or down; from a value between stops, the adjacent stop in that direction. */
export function stepLight(value: number, direction: 1 | -1): number {
  return adjacent(LIGHT_STOPS, value, direction);
}

/** PageUp/PageDown: the next or previous reference value. */
export function jumpLightReference(value: number, direction: 1 | -1): number {
  return adjacent(LIGHT_REFERENCE_VALUES, value, direction);
}

function adjacent(values: readonly number[], value: number, direction: 1 | -1): number {
  if (direction > 0) return values.find((candidate) => candidate > value) ?? values[values.length - 1];
  for (let i = values.length - 1; i >= 0; i -= 1) if (values[i] < value) return values[i];
  return values[0];
}
