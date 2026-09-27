// Presentation helpers: PRD-0002 §4.1 (light control mapping, D-6) and §1/§6 (formatting, D-8).
import { describe, expect, it } from 'vitest';
import { buildSeries, darkBands, revealSeries } from '../../src/presentation/chartData';
import { formatBiomass, formatClock, formatLight, formatNetO2, formatPH, formatTemperature } from '../../src/presentation/format';
import { BASELINE_INPUT, simulate } from '../../src/simulation';
import {
  LIGHT_REFERENCE_VALUES,
  LIGHT_STOPS,
  jumpLightReference,
  lightToStopPosition,
  stepLight,
} from '../../src/presentation/lightControl';

describe('light control mapping (PRD-0002 §4.1)', () => {
  it('has 79 strictly increasing stops from 0 to 2,200 in steps of 10, 25 and 50', () => {
    expect(LIGHT_STOPS).toHaveLength(79);
    expect(LIGHT_STOPS[0]).toBe(0);
    expect(LIGHT_STOPS[30]).toBe(300);
    expect(LIGHT_STOPS[50]).toBe(800);
    expect(LIGHT_STOPS[78]).toBe(2200);
    expect(LIGHT_STOPS.every((value, i) => i === 0 || value > LIGHT_STOPS[i - 1])).toBe(true);
    expect(LIGHT_STOPS[1] - LIGHT_STOPS[0]).toBe(10);
    expect(LIGHT_STOPS[31] - LIGHT_STOPS[30]).toBe(25);
    expect(LIGHT_STOPS[51] - LIGHT_STOPS[50]).toBe(50);
  });

  it('places the reference values 0, 150, 300, 800 and 2,200 on exact stops', () => {
    expect(LIGHT_REFERENCE_VALUES).toEqual([0, 150, 300, 800, 2200]);
    expect(LIGHT_REFERENCE_VALUES.map((value) => LIGHT_STOPS.indexOf(value))).toEqual([0, 15, 30, 50, 78]);
  });

  it('inverts every stop and places typed values between stops continuously', () => {
    LIGHT_STOPS.forEach((value, index) => expect(lightToStopPosition(value)).toBeCloseTo(index, 12));
    expect(lightToStopPosition(437)).toBeCloseTo(30 + 137 / 25, 12);
    expect(lightToStopPosition(1234)).toBeCloseTo(50 + 434 / 50, 12);
    expect(lightToStopPosition(55)).toBeCloseTo(5.5, 12);
  });

  it('steps one stop, and from a between-stop value to the adjacent stop', () => {
    expect(stepLight(300, 1)).toBe(325);
    expect(stepLight(300, -1)).toBe(290);
    expect(stepLight(800, 1)).toBe(850);
    expect(stepLight(437, 1)).toBe(450);
    expect(stepLight(437, -1)).toBe(425);
    expect(stepLight(2200, 1)).toBe(2200);
    expect(stepLight(0, -1)).toBe(0);
  });

  it('jumps between reference values (PageUp/PageDown)', () => {
    expect(jumpLightReference(300, 1)).toBe(800);
    expect(jumpLightReference(300, -1)).toBe(150);
    expect(jumpLightReference(290, 1)).toBe(300);
    expect(jumpLightReference(437, -1)).toBe(300);
    expect(jumpLightReference(2200, 1)).toBe(2200);
    expect(jumpLightReference(0, -1)).toBe(0);
  });
});

describe('number and time formatting (PRD-0002 §1, §6, D-8)', () => {
  it('formats relative biomass and simulated pH with 2 decimals', () => {
    expect(formatBiomass(1.306)).toBe('1.31');
    expect(formatPH(9.2361)).toBe('9.24');
    expect(formatPH(5.96)).toBe('5.96');
  });

  it('signs net O₂ with "+" or the minus sign "−" and drops the sign near zero', () => {
    expect(formatNetO2(0.8512)).toBe('+0.85');
    expect(formatNetO2(-0.157)).toBe('−0.16');
    expect(formatNetO2(0.004)).toBe('0.00');
    expect(formatNetO2(-0.004)).toBe('0.00');
  });

  it('formats simulated clock times as HH:MM', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(6.5)).toBe('06:30');
    expect(formatClock(14)).toBe('14:00');
    expect(formatClock(1439 / 60)).toBe('23:59');
    expect(formatClock(24)).toBe('24:00');
  });

  it('formats control values with units and thousands separators (chart data follows below)', () => {
    expect(formatTemperature(32)).toBe('32.0 °C');
    expect(formatTemperature(45)).toBe('45.0 °C');
    expect(formatLight(300)).toBe('300');
    expect(formatLight(2200)).toBe('2,200');
  });
});

describe('chart data (PRD-0002 §6)', () => {
  const outcome = simulate(BASELINE_INPUT);
  if (!outcome.ok) throw new Error('baseline simulation failed');
  const { samples } = outcome.result;
  const series = buildSeries(samples, 'biomass');

  it('keeps at least one point per 5 simulated minutes with unchanged model values', () => {
    expect(series[0]).toEqual({ x: 0, y: samples[0].biomass });
    expect(series[series.length - 1]).toEqual({ x: 24, y: samples[1440].biomass });
    for (let i = 1; i < series.length; i += 1) expect(series[i].x - series[i - 1].x).toBeLessThanOrEqual(5 / 60 + 1e-12);
    for (const point of series) expect(point.y).toBe(samples[Math.round(point.x * 60)].biomass);
  });

  it('reveals only the played part of the day, ending at the current sample', () => {
    const visible = revealSeries(buildSeries(samples, 'pH'), samples, 'pH', 123);
    expect(visible[visible.length - 1]).toEqual({ x: 123 / 60, y: samples[123].pH });
    expect(visible.every((point) => point.x <= 123 / 60)).toBe(true);
  });

  it('shades the dark period of the selected light/dark cycle', () => {
    expect(darkBands(14)).toEqual([{ from: 14, to: 24 }]);
    expect(darkBands(24)).toEqual([]);
  });
});
