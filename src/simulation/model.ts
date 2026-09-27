// Calibrated response functions: PRD-0001 §12.2–§12.7. All coefficients come from PARAMETERS.
import { PARAMETERS } from './parameters';

const { temperatureTable, pHTable, light, temperatureDeparture, coupling, pHDrift, referenceCapacity } = PARAMETERS;

export function clip(x: number): number {
  return Math.min(1, Math.max(0, x));
}

/** Piecewise-linear interpolation; outside the table the nearest endpoint is held (PRD-0001 §12.2). */
export function interpolate(knots: readonly number[], values: readonly number[], x: number): number {
  const last = knots.length - 1;
  if (x <= knots[0]) return values[0];
  if (x >= knots[last]) return values[last];
  for (let i = 0; i < last; i += 1) {
    if (x === knots[i + 1]) return values[i + 1];
    if (x < knots[i + 1]) {
      const fraction = (x - knots[i]) / (knots[i + 1] - knots[i]);
      return values[i] + (values[i + 1] - values[i]) * fraction;
    }
  }
  return values[last];
}

export const temperatureFactor = (temperatureC: number): number =>
  interpolate(temperatureTable.knots, temperatureTable.photosynthesis, temperatureC);

export const respirationRate = (temperatureC: number): number =>
  interpolate(temperatureTable.knots, temperatureTable.respiration, temperatureC);

export const pHFactor = (pH: number): number => interpolate(pHTable.knots, pHTable.photosynthesis, pH);

/** d_T: departure from the favorable temperature region (PRD-0001 §12.3). */
export function temperatureDepartureOf(temperatureC: number): number {
  return clip(
    Math.max(
      (temperatureDeparture.favorableLow - temperatureC) / temperatureDeparture.coldSpan,
      (temperatureC - temperatureDeparture.favorableHigh) / temperatureDeparture.heatSpan,
      0,
    ),
  );
}

/** j: high-light inhibition factor, strengthened away from the favorable temperature (C-07). */
export function inhibitionFactor(temperatureC: number, lightIntensity: number): number {
  const excess = clip((lightIntensity - light.inhibitionOnset) / light.inhibitionSpan);
  return Math.exp(
    -light.inhibitionStrength * (1 + light.interactionGain * temperatureDepartureOf(temperatureC)) * excess * excess,
  );
}

/** f_L = s(I) · j(T, I): rising response, plateau from saturation onset, inhibition above 800. */
export function lightFactor(temperatureC: number, lightIntensity: number): number {
  const u = clip(lightIntensity / light.saturationOnset);
  return (2 * u - u * u) * inhibitionFactor(temperatureC, lightIntensity);
}

/** c = f_T · f_h · f_L · A on the fixed C-23 reference scale (the multiplicative combination is CAL). */
export function specificCapacity(temperatureC: number, pH: number, lightIntensity: number, aerationFactor: number): number {
  return referenceCapacity * temperatureFactor(temperatureC) * pHFactor(pH) * lightFactor(temperatureC, lightIntensity) * aerationFactor;
}

/** g(n): biomass coupling on the specific balance n = p − r (C-17). */
export function specificGrowthRate(balance: number): number {
  return coupling.surplus * Math.max(balance, 0) - coupling.deficit * Math.max(-balance, 0);
}

/** dh/dt: buffered pH drift (C-12 in light, C-13 in darkness). Zero in light when the balance is ≤ 0. */
export function pHDriftRate(isLight: boolean, balance: number, respiration: number): number {
  return isLight
    ? pHDrift.lightMaxRate * clip(balance / pHDrift.referenceBalance)
    : (pHDrift.darkRate * respiration) / pHDrift.referenceRespiration;
}
