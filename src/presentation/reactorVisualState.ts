import { PARAMETERS, type HealthCategory, type SimulationInput, type TrajectorySample } from '../simulation';

// Drawing limits and motion weights only; these are never scientific quantities.
export const REACTOR_POOL = { filaments: 32, aeration: 14, photosynthesis: 8 } as const;
const AIR_COUNT = { off: 0, low: 5, adequate: REACTOR_POOL.aeration } as const;
const AIR_RING = { off: 0.15, low: 0.5, adequate: 0.9 } as const;
const MIXING_SECONDS = { off: 18, low: 14, adequate: 10 } as const;
const HEALTH_MOTION: Record<HealthCategory, number> = { healthy: 1, suboptimal: 0.7, stressed: 0.35 };
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Pure presentation of the SAME sample used by the readouts. No clock, classification or model evaluation.
 * Temperature/pH effects already arrive in specificCapacity and specificProduction. Health only scales
 * the decorative displacement; it never changes the photosynthetic output or capacity palette.
 */
export function reactorVisualState(config: SimulationInput, sample: TrajectorySample | null) {
  const isLight = sample?.isLight ?? true; // Existing Ready preview: the run begins at lights-on.
  const lampIntensity = isLight ? Math.sqrt(clamp01(config.lightIntensity / PARAMETERS.inputRanges.lightIntensity.max)) : 0;
  const capacity = sample ? clamp01(sample.specificCapacity) : 1;
  const photosynthesisActivity = sample ? clamp01(sample.specificProduction) : 0;
  const health = sample?.health.category ?? null;
  const biomass = sample?.biomass ?? PARAMETERS.initialBiomass;
  // A small passive drift remains even in stress/night. Ready has no predicted biological response.
  const cultureActivity = sample
    ? 0.12 + 0.88 * (0.5 * capacity + 0.5 * photosynthesisActivity) * HEALTH_MOTION[sample.health.category]
    : 0.3;

  return {
    isLight,
    lampOn: lampIntensity > 0,
    lampIntensity,
    aeration: config.aeration,
    aerationCount: AIR_COUNT[config.aeration],
    aerationRing: AIR_RING[config.aeration],
    mixingSeconds: MIXING_SECONDS[config.aeration],
    cultureActivity,
    photosynthesisActivity,
    health,
    capacity,
    biomass,
    density: 0.7 + 0.25 * clamp01((biomass - 0.8) / 1.0),
    filamentCount: Math.min(REACTOR_POOL.filaments, Math.round(18 * biomass)),
  };
}

export type ReactorVisualState = ReturnType<typeof reactorVisualState>;
