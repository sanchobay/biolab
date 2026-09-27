// Scientific explanation, run record and announcements: PRD-0002 §7–§8 and §11, in the selected language (PRD-0003 §9).
// The model decides WHAT is explained (state, primary failure, causes, onsets); the locale only decides HOW it is worded.
// Scientific content follows the PRD-0001 §10 wording rules; boundaries are quoted from PARAMETERS ("in this model").
import type { Messages } from '../i18n';
import {
  BASELINE_INPUT,
  PARAMETERS,
  type FailureType,
  type RunRecordEntry,
  type SimulationInput,
  type SimulationResult,
  type SuboptimalCause,
  type TrajectorySample,
} from '../simulation';
import { formatBiomass, formatClock, formatLight, formatPH, formatStartingPH, formatTemperature } from './format';
import { conditionLabel, type StateIconKey, type Tone } from './labels';

/** PRD-0002 D-9: photoinhibition copy switches from "mild" to "clear" at this model penalty. A UI copy convention, not a biological threshold. */
export const MILD_PHOTOINHIBITION_PENALTY = 0.1;

const { zones, light } = PARAMETERS;
const T = zones.temperature;
const H = zones.pH;

export interface ExplanationSection {
  label: string;
  lines: string[];
}

export interface ExplanationView {
  icon: StateIconKey;
  tone: Tone;
  title: string;
  scope: string | null;
  sections: ExplanationSection[];
  blocks: ExplanationSection[];
}

export function introExplanation(m: Messages): ExplanationView {
  const e = m.explanation;
  return {
    icon: 'info',
    tone: 'neutral',
    title: e.introTitle,
    scope: null,
    sections: [
      { label: e.howItWorks, lines: [e.introHow] },
      { label: e.whatYouSee, lines: [...e.introSee] },
    ],
    blocks: [],
  };
}

export function errorExplanation(m: Messages): ExplanationView {
  const e = m.explanation;
  return {
    icon: 'error',
    tone: 'warning',
    title: e.errorTitle,
    scope: null,
    sections: [{ label: e.whatHappened, lines: [e.errorText] }],
    blocks: [],
  };
}

function failureWhatHappened(m: Messages, type: FailureType, input: SimulationInput, pH: number, penalty: number): string {
  const what = m.explanation.what;
  switch (type) {
    case 'thermal':
      return what.thermal(formatTemperature(input.temperatureC), T.heatStressAtOrAbove);
    case 'photoinhibition':
      return penalty < MILD_PHOTOINHIBITION_PENALTY
        ? what.photoMild(formatLight(input.lightIntensity), zones.light.photoinhibitionAtOrAbove)
        : what.photoClear(formatLight(input.lightIntensity), zones.light.photoinhibitionAtOrAbove);
    case 'ph-low':
      return what.pHLow(formatPH(pH), formatStartingPH(input.startingPH), H.lowStressAtOrBelow.toFixed(1));
    case 'ph-high':
      return what.pHHigh(formatPH(pH), formatStartingPH(input.startingPH), H.highStressAtOrAbove.toFixed(1));
  }
}

function failureWhy(m: Messages, type: FailureType, pH: number): string[] {
  const why = m.explanation.why;
  switch (type) {
    case 'thermal':
      return [...why.thermal];
    case 'photoinhibition':
      return [...why.photoinhibition];
    case 'ph-low':
      // "Acidic" only below pH 7 (PRD-0001 §10).
      return why.pHLow(pH < 7);
    case 'ph-high':
      return [...why.pHHigh];
  }
}

function failureTryNext(m: Messages, type: FailureType): string {
  const next = m.explanation.tryNext;
  switch (type) {
    case 'thermal':
      return next.thermal(T.favorableLow, T.favorableHigh);
    case 'photoinhibition':
      return next.photoinhibition(light.saturationOnset, zones.light.photoinhibitionAtOrAbove);
    case 'ph-low':
      return next.pHLow(H.favorableLow, H.favorableHigh);
    case 'ph-high':
      return next.pHHigh(H.favorableLow, H.favorableHigh);
  }
}

function causeWhatHappened(m: Messages, cause: SuboptimalCause, input: SimulationInput, pH: number): string {
  const what = m.explanation.cause;
  switch (cause) {
    case 'temperature-cold':
      return what.cold(formatTemperature(input.temperatureC));
    case 'temperature-warm':
      return what.warm(formatTemperature(input.temperatureC), T.heatStressAtOrAbove);
    case 'light-limited':
      return what.lightLimited(formatLight(input.lightIntensity), zones.light.limitedAtOrBelow);
    case 'ph-low':
      return what.pHLow(formatPH(pH), H.favorableLow, H.favorableHigh);
    case 'ph-high':
      return what.pHHigh(formatPH(pH), H.favorableLow, H.favorableHigh);
    case 'aeration-low':
    case 'aeration-off':
      return what.aeration(m.aeration[input.aeration]);
  }
}

function causeWhy(m: Messages, cause: SuboptimalCause): string {
  const why = m.explanation.causeWhy;
  switch (cause) {
    case 'temperature-cold':
      return why.cold;
    case 'temperature-warm':
      return why.warm;
    case 'light-limited':
      return why.lightLimited;
    case 'ph-low':
    case 'ph-high':
      return why.pH;
    case 'aeration-low':
    case 'aeration-off':
      return why.aeration;
  }
}

function causeTryNext(m: Messages, cause: SuboptimalCause): string {
  const next = m.explanation.tryNext;
  switch (cause) {
    case 'temperature-cold':
      return next.cold(T.favorableLow, T.favorableHigh);
    case 'temperature-warm':
      return next.warm(T.favorableLow, T.favorableHigh);
    case 'light-limited':
      return next.lightLimited(light.saturationOnset);
    case 'ph-low':
      return next.pHLow(H.favorableLow, H.favorableHigh);
    case 'ph-high':
      return next.pHHigh(H.favorableLow, H.favorableHigh);
    case 'aeration-low':
    case 'aeration-off':
      return next.aeration;
  }
}

function failureView(
  m: Messages,
  type: FailureType,
  sample: TrajectorySample,
  input: SimulationInput,
  penalty: number,
  scope: string,
  effect: string[],
): ExplanationView {
  const e = m.explanation;
  return {
    icon: type,
    tone: 'failure',
    title: m.failure[type],
    scope,
    sections: [
      { label: e.whatHappened, lines: [failureWhatHappened(m, type, input, sample.pH, penalty)] },
      { label: e.whyLabel, lines: failureWhy(m, type, sample.pH) },
      { label: e.effect, lines: effect },
      { label: e.tryNextLabel, lines: [failureTryNext(m, type)] },
    ],
    blocks: [],
  };
}

interface ObservedCause {
  cause: SuboptimalCause;
  pH: number;
}

function suboptimalView(m: Messages, causes: ObservedCause[], input: SimulationInput, scope: string, effect: string[]): ExplanationView {
  const e = m.explanation;
  return {
    icon: 'suboptimal',
    tone: 'suboptimal',
    title: e.suboptimalTitle,
    scope,
    sections: [
      { label: e.whatHappened, lines: causes.map(({ cause, pH }) => causeWhatHappened(m, cause, input, pH)) },
      { label: e.whyLabel, lines: [...new Set(causes.map(({ cause }) => causeWhy(m, cause)))] },
      { label: e.effect, lines: effect },
      { label: e.tryNextLabel, lines: causes.map(({ cause }) => causeTryNext(m, cause)) },
    ],
    blocks: [],
  };
}

function healthyView(m: Messages, scope: string, effect: string[]): ExplanationView {
  const e = m.explanation;
  return {
    icon: 'healthy',
    tone: 'healthy',
    title: e.healthyTitle,
    scope,
    sections: [
      { label: e.whatHappened, lines: [e.what.healthy] },
      { label: e.whyLabel, lines: [...e.why.healthy] },
      { label: e.effect, lines: effect },
      { label: e.tryNextLabel, lines: [e.tryNext.healthy] },
    ],
    blocks: [],
  };
}

function endedNote(m: Messages, entry: RunRecordEntry): string {
  return m.explanation.ended(m.failure[entry.type], formatClock(entry.firstOnsetHours), entry.type === 'photoinhibition');
}

function liveFailureEffect(m: Messages, type: FailureType): string[] {
  const live = m.explanation.live;
  return [live.biomass, type === 'photoinhibition' ? live.o2Photo : live.o2, live.health, live.hint];
}

/** While running: explain the current condition (PRD-0002 §7 "Update timing"). */
export function currentExplanation(result: SimulationResult, step: number, m: Messages): ExplanationView {
  const e = m.explanation;
  const sample = result.samples[step];
  const { condition } = sample;
  const input = result.input;
  const scope = e.scopeCurrent;
  let view: ExplanationView;

  if (condition.severity === 'failure' && condition.primaryFailure) {
    view = failureView(m, condition.primaryFailure, sample, input, result.photoinhibitionPenalty, scope, liveFailureEffect(m, condition.primaryFailure));
    const others = condition.failures.slice(1);
    if (others.length > 0) {
      view.blocks.push({
        label: e.alsoOccurring,
        lines: others.map(({ type }) =>
          e.alsoLive(m.failure[type], failureWhatHappened(m, type, input, sample.pH, result.photoinhibitionPenalty), failureTryNext(m, type)),
        ),
      });
    }
    if (condition.suboptimalCauses.length > 0) {
      view.blocks.push({
        label: e.suboptimalConditions,
        lines: condition.suboptimalCauses.map((cause) => causeWhatHappened(m, cause, input, sample.pH)),
      });
    }
  } else if (condition.severity === 'suboptimal') {
    view = suboptimalView(
      m,
      condition.suboptimalCauses.map((cause) => ({ cause, pH: sample.pH })),
      input,
      scope,
      [e.live.moderate, e.live.hint],
    );
  } else {
    view = healthyView(m, scope, [e.live.accumulates, e.live.hint]);
  }

  const current = new Set(condition.failures.map((failure) => failure.type));
  const earlier = result.runRecord.entries.filter((entry) => entry.firstOnsetStep <= step && !current.has(entry.type));
  if (earlier.length > 0) view.blocks.push({ label: e.earlier, lines: earlier.map((entry) => endedNote(m, entry)) });
  return view;
}

function sameInput(a: SimulationInput, b: SimulationInput): boolean {
  return (
    a.temperatureC === b.temperatureC &&
    a.startingPH === b.startingPH &&
    a.lightIntensity === b.lightIntensity &&
    a.lightHours === b.lightHours &&
    a.aeration === b.aeration
  );
}

const arrow = (value: number, reference: number): string => (value < reference ? '↓ ' : value > reference ? '↑ ' : '');

/** Final values compared with the model-computed healthy baseline (PRD-0002 D-10). */
function outcomeEffect(m: Messages, result: SimulationResult, baseline: SimulationResult | null): string[] {
  const outcome = m.explanation.outcome;
  const { summary } = result;
  const usesBaseline = sameInput(result.input, BASELINE_INPUT);
  const reference = !usesBaseline && baseline ? baseline.summary : null;
  const o2 = summary.lightPeriodPhotosyntheticO2;
  const lines = [
    reference
      ? arrow(summary.finalBiomass, reference.finalBiomass) + outcome.biomass(formatBiomass(summary.finalBiomass), formatBiomass(reference.finalBiomass))
      : outcome.biomass(formatBiomass(summary.finalBiomass), null),
    reference
      ? arrow(o2, reference.lightPeriodPhotosyntheticO2) + outcome.o2(o2.toFixed(2), reference.lightPeriodPhotosyntheticO2.toFixed(2))
      : outcome.o2(o2.toFixed(2), null),
    outcome.health(m.health[summary.finalHealth], m.trend[summary.finalHealthTrend].toLocaleLowerCase()),
  ];
  if (usesBaseline) lines.push(outcome.baselineRun);
  return lines;
}

function observedCauses(samples: readonly TrajectorySample[]): ObservedCause[] {
  const order: SuboptimalCause[] = ['temperature-cold', 'temperature-warm', 'light-limited', 'ph-low', 'ph-high', 'aeration-low', 'aeration-off'];
  const firstSeen = new Map<SuboptimalCause, number>();
  for (const sample of samples) {
    for (const cause of sample.condition.suboptimalCauses) if (!firstSeen.has(cause)) firstSeen.set(cause, sample.pH);
  }
  return order.filter((cause) => firstSeen.has(cause)).map((cause) => ({ cause, pH: firstSeen.get(cause) ?? 0 }));
}

/** At completion: the run outcome, i.e. the most severe state that occurred (PRD-0001 §9 rule 6). */
export function outcomeExplanation(result: SimulationResult, baseline: SimulationResult | null, m: Messages): ExplanationView {
  const e = m.explanation;
  const { runRecord, input, samples } = result;
  const scope = e.scopeOutcome;
  const effect = outcomeEffect(m, result, baseline);
  const primary = runRecord.entries.find((entry) => entry.type === runRecord.primaryFailure);

  if (runRecord.outcomeSeverity === 'failure' && primary) {
    const view = failureView(m, primary.type, samples[primary.firstOnsetStep], input, result.photoinhibitionPenalty, scope, effect);
    const others = runRecord.entries.filter((entry) => entry.type !== primary.type);
    if (others.length > 0) {
      view.blocks.push({
        label: e.alsoOccurring,
        lines: others.map((entry) => e.alsoOutcome(m.failure[entry.type], formatClock(entry.firstOnsetHours), failureTryNext(m, entry.type))),
      });
    }
    const causes = observedCauses(samples);
    if (causes.length > 0) {
      view.blocks.push({ label: e.suboptimalConditions, lines: causes.map(({ cause, pH }) => causeWhatHappened(m, cause, input, pH)) });
    }
    const final = samples[samples.length - 1];
    if (!final.condition.failures.some((failure) => failure.type === primary.type)) {
      view.blocks.push({ label: e.earlier, lines: [endedNote(m, primary)] });
    }
    return view;
  }
  if (runRecord.outcomeSeverity === 'suboptimal') return suboptimalView(m, observedCauses(samples), input, scope, effect);
  return healthyView(m, scope, effect);
}

export interface RunRecordRow {
  type: FailureType;
  label: string;
  text: string;
  primary: boolean;
}

export interface RunRecordView {
  rows: RunRecordRow[];
  empty: string;
  footer: string | null;
}

function outcomeLabel(m: Messages, result: SimulationResult): string {
  const { runRecord } = result;
  if (runRecord.outcomeSeverity === 'failure' && runRecord.primaryFailure) return m.failure[runRecord.primaryFailure];
  return runRecord.outcomeSeverity === 'suboptimal' ? m.record.outcomeSuboptimal : m.record.outcomeHealthy;
}

/** The add-only run record (PRD-0002 §8). */
export function runRecordView(result: SimulationResult | null, completed: boolean, step: number, m: Messages): RunRecordView {
  if (!result) return { rows: [], empty: m.record.noRun, footer: null };
  const rows = result.runRecord.entries
    .filter((entry) => completed || entry.firstOnsetStep <= step)
    .map((entry) => ({
      type: entry.type,
      label: m.failure[entry.type],
      text: m.record.occurred(formatClock(entry.firstOnsetHours)),
      primary: completed && entry.type === result.runRecord.primaryFailure,
    }));
  return {
    rows,
    empty: completed ? m.record.none : m.record.noneYet,
    footer: completed ? m.record.outcome(outcomeLabel(m, result)) : null,
  };
}

export interface Announcement {
  polite: string;
  assertive: string;
}

/** Screen-reader announcements: state changes only, never every data tick (PRD-0002 §11). */
export function announcement(
  phase: 'ready' | 'running' | 'completed',
  runError: boolean,
  result: SimulationResult | null,
  step: number,
  resetNotice: boolean,
  m: Messages,
): Announcement {
  if (runError) return { polite: '', assertive: m.announce.error };
  if (phase === 'running' && result) {
    const sample = result.samples[step];
    const health = `${m.health[sample.health.category]}, ${m.trend[sample.health.trend].toLocaleLowerCase()}`;
    return { polite: m.announce.running(conditionLabel(sample.condition, m), health), assertive: '' };
  }
  if (phase === 'completed' && result) {
    return { polite: m.announce.complete(outcomeLabel(m, result), result.runRecord.outcomeSeverity === 'failure'), assertive: '' };
  }
  return { polite: resetNotice ? m.announce.reset : '', assertive: '' };
}
