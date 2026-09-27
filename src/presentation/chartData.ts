// Chart series and overlays: PRD-0002 §6. Values are sampled, never smoothed or altered.
import type { RunRecord, TrajectorySample } from '../simulation';
import type { Messages } from '../i18n';

export type ChartMetric = 'biomass' | 'netO2Rate' | 'pH';

export interface ChartPoint {
  x: number;
  y: number;
}

/** One point every 5 simulated minutes (5 steps), plus the final sample. */
export const CHART_STRIDE_STEPS = 5;

export function buildSeries(samples: readonly TrajectorySample[], metric: ChartMetric, stride = CHART_STRIDE_STEPS): ChartPoint[] {
  const points: ChartPoint[] = [];
  for (let k = 0; k < samples.length; k += stride) points.push({ x: samples[k].tHours, y: samples[k][metric] });
  const lastIndex = samples.length - 1;
  if (lastIndex % stride !== 0) points.push({ x: samples[lastIndex].tHours, y: samples[lastIndex][metric] });
  return points;
}

/** The played part of the day during playback, ending exactly at the current sample. */
export function revealSeries(
  series: readonly ChartPoint[],
  samples: readonly TrajectorySample[],
  metric: ChartMetric,
  step: number,
  stride = CHART_STRIDE_STEPS,
): ChartPoint[] {
  const visible = series.slice(0, Math.floor(step / stride) + 1);
  if (step % stride !== 0) visible.push({ x: samples[step].tHours, y: samples[step][metric] });
  return visible;
}

export interface DarkBand {
  from: number;
  to: number;
}

export function darkBands(lightHours: number): DarkBand[] {
  return lightHours < 24 ? [{ from: lightHours, to: 24 }] : [];
}

export interface OnsetMarker {
  hours: number;
  label: string;
}

export function onsetMarkers(record: RunRecord, upToStep: number, m: Messages): OnsetMarker[] {
  return record.entries
    .filter((entry) => entry.firstOnsetStep <= upToStep)
    .map((entry) => ({ hours: entry.firstOnsetHours, label: m.failure[entry.type] }));
}

/** pH axis window: starting pH ± 0.6, fixed for each run (PRD-0002 D-11). */
export function pHWindow(startingPH: number): { min: number; max: number } {
  return { min: Math.round((startingPH - 0.6) * 10) / 10, max: Math.round((startingPH + 0.6) * 10) / 10 };
}

/** Hourly values for the "Show values" table (PRD-0002 D-17). */
export function hourlyValues(samples: readonly TrajectorySample[], metric: ChartMetric): { hours: number; value: number }[] {
  const rows: { hours: number; value: number }[] = [];
  for (let k = 0; k < samples.length; k += 60) rows.push({ hours: samples[k].tHours, value: samples[k][metric] });
  return rows;
}
