// Outcome classification and primary-cause ranking: PRD-0001 §9 rules 1–5.
import { specificCapacity } from './model';
import { PARAMETERS } from './parameters';
import type { Aeration, CurrentCondition, FailureType, RankedFailure, SuboptimalCause } from './types';

export interface ClassificationContext {
  temperatureC: number;
  lightIntensity: number;
  aeration: Aeration;
  aerationFactor: number;
}

const { zones, correctionTargets, failureTieOrder } = PARAMETERS;

export function tieRank(type: FailureType): number {
  return failureTieOrder.indexOf(type);
}

export function classify(ctx: ClassificationContext, pH: number, isLight: boolean): CurrentCondition {
  const failures: FailureType[] = [];
  const causes: SuboptimalCause[] = [];
  const t = ctx.temperatureC;

  // Temperature: the more severe zone wins at every boundary (rule 4).
  if (t >= zones.temperature.heatStressAtOrAbove) failures.push('thermal');
  else if (t <= zones.temperature.favorableLow) causes.push('temperature-cold');
  else if (t >= zones.temperature.favorableHigh) causes.push('temperature-warm');

  // Light is judged on the configured intensity during light periods only (rule 5).
  if (isLight) {
    if (ctx.lightIntensity >= zones.light.photoinhibitionAtOrAbove) failures.push('photoinhibition');
    else if (ctx.lightIntensity <= zones.light.limitedAtOrBelow) causes.push('light-limited');
  }

  // pH uses the simulated pH.
  if (pH <= zones.pH.lowStressAtOrBelow) failures.push('ph-low');
  else if (pH >= zones.pH.highStressAtOrAbove) failures.push('ph-high');
  else if (pH <= zones.pH.favorableLow) causes.push('ph-low');
  else if (pH >= zones.pH.favorableHigh) causes.push('ph-high');

  if (ctx.aeration === 'low') causes.push('aeration-low');
  else if (ctx.aeration === 'off') causes.push('aeration-off');

  const ranked = rankFailures(ctx, pH, isLight, failures);
  return {
    severity: ranked.length > 0 ? 'failure' : causes.length > 0 ? 'suboptimal' : 'healthy',
    failures: ranked,
    primaryFailure: ranked.length > 0 ? ranked[0].type : null,
    suboptimalCauses: causes,
  };
}

/** Rule 1: rank by the specific-capacity gain from correcting each control alone; darkness uses reference light. */
function rankFailures(ctx: ClassificationContext, pH: number, isLight: boolean, failures: FailureType[]): RankedFailure[] {
  if (failures.length === 0) return [];
  const light = isLight ? ctx.lightIntensity : correctionTargets.lightIntensity;
  const capacity = (temperatureC: number, h: number, lightIntensity: number) =>
    specificCapacity(temperatureC, h, lightIntensity, ctx.aerationFactor);
  const current = capacity(ctx.temperatureC, pH, light);

  const ranked = failures.map((type): RankedFailure => {
    const corrected =
      type === 'thermal'
        ? capacity(correctionTargets.temperatureC, pH, light)
        : type === 'photoinhibition'
          ? capacity(ctx.temperatureC, pH, correctionTargets.lightIntensity)
          : capacity(ctx.temperatureC, correctionTargets.pH, light);
    return { type, contribution: corrected - current };
  });
  ranked.sort((a, b) => b.contribution - a.contribution || tieRank(a.type) - tieRank(b.type));
  return ranked;
}
