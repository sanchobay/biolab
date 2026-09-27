// The complete 24-simulated-hour run: PRD-0001 §12.11, ADR-0002 §5–§8.
import { classify, tieRank, type ClassificationContext } from './classify';
import { advanceHealth, initialHealth, toHealthState, type HealthTracker } from './health';
import { inhibitionFactor, pHDriftRate, respirationRate, specificCapacity, specificGrowthRate } from './model';
import { PARAMETERS } from './parameters';
import type {
  FailureType,
  RunRecordEntry,
  Severity,
  SimulationInput,
  SimulationOutcome,
  SimulationResult,
  TrajectorySample,
} from './types';
import { validateInput } from './validate';

const STEPS_PER_HOUR = PARAMETERS.time.stepsPerHour;
const TOTAL_STEPS = STEPS_PER_HOUR * PARAMETERS.time.runHours; // 1,440 steps → 1,441 samples
const DT = 1 / STEPS_PER_HOUR;
const SEVERITY_RANK: Record<Severity, number> = { healthy: 0, suboptimal: 1, failure: 2 };
const SEVERITY_BY_RANK: Severity[] = ['healthy', 'suboptimal', 'failure'];

export function simulate(input: SimulationInput): SimulationOutcome {
  const errors = validateInput(input);
  if (errors.length > 0) return { ok: false, error: { kind: 'invalid-input', errors } };
  const result = computeRun(input);
  if (!isFiniteResult(result)) return { ok: false, error: { kind: 'non-finite-output' } };
  return { ok: true, result };
}

function computeRun(input: SimulationInput): SimulationResult {
  const temperatureC = input.temperatureC;
  const lightIntensity = input.lightIntensity;
  const aerationFactor = PARAMETERS.aerationFactor[input.aeration];
  const lightSteps = input.lightHours * STEPS_PER_HOUR;
  const isLightInterval = (k: number) => k < lightSteps; // D(k), PRD-0001 §12.4
  const respiration = respirationRate(temperatureC);
  const capacityAt = (pH: number) => specificCapacity(temperatureC, pH, lightIntensity, aerationFactor);
  const context: ClassificationContext = { temperatureC, lightIntensity, aeration: input.aeration, aerationFactor };

  const samples: TrajectorySample[] = [];
  const entries = new Map<FailureType, RunRecordEntry>();
  let outcomeRank = 0;
  let health: HealthTracker | null = null;

  // Sample m uses the light state D(min(m, 1439)): the interval that begins at that instant (ADR-0002 §5).
  const pushSample = (m: number, biomass: number, pH: number) => {
    const isLight = isLightInterval(Math.min(m, TOTAL_STEPS - 1));
    const capacity = capacityAt(pH);
    const production = isLight ? capacity : 0;
    const condition = classify(context, pH, isLight);
    health = health === null ? initialHealth(condition) : advanceHealth(health, condition, m);

    for (const failure of condition.failures) {
      const entry = entries.get(failure.type);
      if (!entry) {
        entries.set(failure.type, {
          type: failure.type,
          firstOnsetStep: m,
          firstOnsetHours: m / STEPS_PER_HOUR,
          maxContribution: failure.contribution,
        });
      } else if (failure.contribution > entry.maxContribution) {
        entry.maxContribution = failure.contribution;
      }
    }
    outcomeRank = Math.max(outcomeRank, SEVERITY_RANK[condition.severity]);

    const photosyntheticRate = biomass * production;
    const respiratoryRate = biomass * respiration;
    samples.push({
      k: m,
      tHours: m / STEPS_PER_HOUR,
      isLight,
      biomass,
      pH,
      photosyntheticRate,
      respiratoryRate,
      netO2Rate: photosyntheticRate - respiratoryRate,
      specificProduction: production,
      specificCapacity: capacity,
      condition,
      health: toHealthState(health),
    });
  };

  let biomass: number = PARAMETERS.initialBiomass;
  let pH = input.startingPH;
  let lightPeriodPhotosyntheticO2 = 0;
  let integratedNetO2 = 0;
  pushSample(0, biomass, pH);

  for (let k = 0; k < TOTAL_STEPS; k += 1) {
    const isLight = isLightInterval(k);
    const drift = (h: number) => pHDriftRate(isLight, (isLight ? capacityAt(h) : 0) - respiration, respiration);
    const midpointPH = pH + (DT / 2) * drift(pH);
    const production = isLight ? capacityAt(midpointPH) : 0;
    const growth = specificGrowthRate(production - respiration);
    const exposure = growth !== 0 ? (biomass * Math.expm1(growth * DT)) / growth : biomass * DT; // J_B
    lightPeriodPhotosyntheticO2 += production * exposure;
    integratedNetO2 += (production - respiration) * exposure;
    pH += DT * drift(midpointPH);
    biomass *= Math.exp(growth * DT);
    pushSample(k + 1, biomass, pH);
  }

  const recordEntries = [...entries.values()];
  const primary = recordEntries.reduce<RunRecordEntry | null>(
    (best, entry) =>
      best === null ||
      entry.maxContribution > best.maxContribution ||
      (entry.maxContribution === best.maxContribution && tieRank(entry.type) < tieRank(best.type))
        ? entry
        : best,
    null,
  );
  const last = samples[samples.length - 1];

  return {
    input: { ...input },
    parameterSetId: PARAMETERS.id,
    samples,
    runRecord: {
      entries: recordEntries,
      primaryFailure: primary ? primary.type : null,
      outcomeSeverity: SEVERITY_BY_RANK[outcomeRank],
    },
    totals: { lightPeriodPhotosyntheticO2, integratedNetO2 },
    photoinhibitionPenalty: 1 - inhibitionFactor(temperatureC, lightIntensity),
    summary: {
      finalBiomass: last.biomass,
      finalPH: last.pH,
      lightPeriodPhotosyntheticO2,
      finalNetO2Rate: last.netO2Rate,
      finalHealth: last.health.category,
      finalHealthTrend: last.health.trend,
    },
  };
}

function isFiniteResult(result: SimulationResult): boolean {
  const numbers = [result.totals.lightPeriodPhotosyntheticO2, result.totals.integratedNetO2, result.photoinhibitionPenalty];
  for (const sample of result.samples) {
    numbers.push(
      sample.biomass,
      sample.pH,
      sample.photosyntheticRate,
      sample.respiratoryRate,
      sample.netO2Rate,
      sample.specificProduction,
      sample.specificCapacity,
    );
    for (const failure of sample.condition.failures) numbers.push(failure.contribution);
  }
  return numbers.every(Number.isFinite);
}
