// Number and time formatting: PRD-0002 §1 and §6 (D-8). JetBrains Mono is applied by the UI.
const MINUS = '−';
const integerFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

export const formatBiomass = (value: number): string => value.toFixed(2);

export const formatPH = (value: number): string => value.toFixed(2);

export const formatStartingPH = (value: number): string => value.toFixed(1);

/** Signed with "+" or the minus sign; no sign when the magnitude rounds to zero. */
export function formatNetO2(value: number): string {
  if (Math.abs(value) < 0.005) return '0.00';
  return `${value > 0 ? '+' : MINUS}${Math.abs(value).toFixed(2)}`;
}

/** Simulated clock time as HH:MM. */
export function formatClock(hours: number): string {
  const minutes = Math.round(hours * 60);
  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export const formatTemperature = (value: number): string => `${value.toFixed(1)} °C`;

export const formatLight = (value: number): string => integerFormat.format(value);
