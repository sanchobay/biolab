import type { SimulationInput } from './types';

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as object)) deepFreeze(child);
  }
  return value;
}

/**
 * The single parameter source (PRD-0001 §11, ADR-0002 §3).
 * Every number is a PRD-0001 educational calibration (CAL) and is labelled with its register ID.
 * Changing any value is a PRD-0001 change: regression targets must be recomputed and re-approved.
 */
export const PARAMETERS = deepFreeze({
  id: 'PRD-0001 calibration, adopted 2026-09-27',
  time: { stepsPerHour: 60, runHours: 24 }, // C-21: step 1/60 simulated hour; one simulated day
  inputRanges: {
    temperatureC: { min: 15, max: 45 }, // C-01, °C
    startingPH: { min: 6, max: 11 }, // C-08
    lightIntensity: { min: 0, max: 2200 }, // C-04, µmol photons m⁻² s⁻¹ incident
    lightHours: [8, 10, 12, 14, 16, 24], // PRD-0001 §4 presets
    aeration: ['off', 'low', 'adequate'], // PRD-0001 §4
  },
  aerationFactor: { off: 0.55, low: 0.8, adequate: 1 }, // C-18
  referenceCapacity: 1, // C-23: 1 RO per simulated hour at B = 1, 32 °C, pH 9.0, 300, Adequate, in light
  temperatureTable: {
    knots: [15, 25, 30, 32, 35, 40, 45], // °C
    photosynthesis: [0.4, 0.8, 0.97, 1, 0.95, 0.55, 0.1], // C-21 f_T
    respiration: [0.05, 0.09, 0.115, 0.12, 0.135, 0.16, 0.14], // C-16 r(T), RO per unit relative biomass per h (40 °C peak is CAL)
  },
  pHTable: {
    knots: [5.5, 6, 7.5, 8.5, 9, 9.5, 10.5, 11, 11.6],
    photosynthesis: [0.08, 0.12, 0.6, 0.95, 1, 0.95, 0.45, 0.25, 0.1], // C-21 f_h (the pH 11 factor is CAL, not derived from COND-P4)
  },
  light: {
    saturationOnset: 300, // C-22
    inhibitionOnset: 800, // C-06
    inhibitionSpan: 1400, // C-21: e = clip((I − 800) / 1400)
    inhibitionStrength: Math.log(4), // C-21: j = exp(−ln 4 · (1 + gain · d_T) · e²)
    interactionGain: 1.5, // C-07
  },
  temperatureDeparture: { favorableLow: 30, favorableHigh: 35, coldSpan: 15, heatSpan: 10 }, // C-02, C-21 d_T
  coupling: { surplus: 0.025, deficit: 0.03 }, // C-17, relative biomass per RO
  pHDrift: { lightMaxRate: 0.02, referenceBalance: 0.88, darkRate: -0.004, referenceRespiration: 0.12 }, // C-12, C-13, pH per simulated hour
  zones: {
    temperature: { favorableLow: 30, favorableHigh: 35, heatStressAtOrAbove: 40 }, // C-02, C-03
    light: { limitedAtOrBelow: 150, photoinhibitionAtOrAbove: 800 }, // C-05, C-06
    pH: { favorableLow: 8.5, favorableHigh: 9.5, lowStressAtOrBelow: 7, highStressAtOrAbove: 10.5 }, // C-09, C-10, C-11
  },
  correctionTargets: { temperatureC: 32, lightIntensity: 300, pH: 9 }, // PRD-0001 §9 rule 1
  failureTieOrder: ['thermal', 'ph-low', 'ph-high', 'photoinhibition'], // PRD-0001 §9 rule 1
  health: { worsenSteps: 120, recoverSteps: 360 }, // C-20
  initialBiomass: 1, // C-14
  baseline: { temperatureC: 32, startingPH: 9, lightIntensity: 300, lightHours: 14, aeration: 'adequate' }, // PRD-0001 §12.9
} as const);

export const BASELINE_INPUT: SimulationInput = PARAMETERS.baseline;
