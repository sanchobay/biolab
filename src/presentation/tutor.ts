// Lab Tutor (PRD-0006 as amended 2026-10-01, ExecPlan 0010): fixed and contextual questions, and deterministic answers
// built only from the run so far, PARAMETERS and the model-computed healthy baseline. Nothing here runs a simulation or
// changes a model value; the wording reuses the explanation helpers so the tutor never contradicts the explanation panel.
import type { Messages } from '../i18n';
import {
  BASELINE_INPUT,
  PARAMETERS,
  type FailureType,
  type RunRecordEntry,
  type SimulationInput,
  type SimulationResult,
  type TrajectorySample,
} from '../simulation';
import {
  causeTryNext,
  causeWhatHappened,
  failureTryNext,
  failureWhatHappened,
  failureWhy,
  observedCauses,
  sameInput,
} from './explanation';
import { formatBiomass, formatClock, formatLight, formatNetO2, formatPH, formatStartingPH, formatTemperature } from './format';
import { retainedCauseLabel } from './labels';

export type TutorQuestionId = 'F1' | 'F2' | 'F3' | 'F4' | 'C1' | 'C2' | 'C3' | 'C3L';

/** The run as the tutor sees it: the precomputed result and how far playback has got. */
export interface TutorRun {
  result: SimulationResult;
  step: number;
  completed: boolean;
}

export interface TutorQuestion {
  id: TutorQuestionId;
  label: string;
}

export interface TutorAnswer {
  /** The chip question, restated as the answer heading. */
  question: string;
  lines: string[];
  /** "Based on your run at 24:00: …"; null when the answer does not come from a run. */
  provenance: string | null;
}

const MAX_LINES = 5;
const { zones, light, health, time, inputRanges } = PARAMETERS;

/** The run so far (PRD-0006 §3): samples 0 to the current step, or the whole day once completed. */
interface RunSoFar {
  input: SimulationInput;
  result: SimulationResult;
  samples: readonly TrajectorySample[];
  current: TrajectorySample;
  entries: readonly RunRecordEntry[];
  primary: FailureType | null;
}

function soFar(run: TutorRun): RunSoFar {
  const { result } = run;
  const last = run.completed ? result.samples.length - 1 : Math.min(Math.max(run.step, 0), result.samples.length - 1);
  const samples = result.samples.slice(0, last + 1);
  const current = samples[samples.length - 1];
  const entries = result.runRecord.entries.filter((entry) => run.completed || entry.firstOnsetStep <= last);
  // Completed: the model's own ranking. Running: the current primary failure, else the earliest one so far.
  const earliest = [...entries].sort((a, b) => a.firstOnsetStep - b.firstOnsetStep)[0]?.type ?? null;
  const primary = run.completed ? result.runRecord.primaryFailure : (current.condition.primaryFailure ?? earliest);
  return { input: result.input, result, samples, current, entries, primary };
}

/** "45.0 °C, pH 9.0, 300 µmol photons m⁻² s⁻¹, 14 h light : 10 h dark, Adequate" in the current language. */
function conditions(input: SimulationInput, m: Messages): string {
  return [
    formatTemperature(input.temperatureC),
    `pH ${formatStartingPH(input.startingPH)}`,
    `${formatLight(input.lightIntensity)} µmol photons m⁻² s⁻¹`,
    m.controls.cycleValue(input.lightHours),
    m.aeration[input.aeration],
  ].join(', ');
}

function negativeO2(run: RunSoFar): { any: boolean; inLight: boolean } {
  const negative = run.samples.filter((sample) => sample.netO2Rate < 0);
  // A "light" period at 0 µmol photons m⁻² s⁻¹ is dark for this purpose (PRD-0006 amendment, C3′).
  const inLight = run.input.lightIntensity > 0 && negative.some((sample) => sample.isLight);
  return { any: negative.length > 0, inLight };
}

function label(id: TutorQuestionId, run: RunSoFar | null, m: Messages): string {
  const q = m.tutor.questions;
  switch (id) {
    case 'F1':
      return q.f1;
    case 'F2':
      return q.f2;
    case 'F3':
      return q.f3;
    case 'F4':
      return q.f4;
    case 'C1':
      return run?.primary ? q.c1(m.failure[run.primary]) : '';
    case 'C2':
      return run ? q.c2(m.health[run.current.health.category]) : '';
    case 'C3':
      return q.c3;
    case 'C3L':
      return q.c3Light;
  }
}

/** Fixed questions always; contextual ones (at most three, in order) only when the run so far supports them. */
export function tutorQuestions(run: TutorRun | null, m: Messages): TutorQuestion[] {
  const ids: TutorQuestionId[] = ['F1', 'F2', 'F3', 'F4'];
  if (run) {
    const view = soFar(run);
    if (view.primary) ids.push('C1');
    if (view.current.health.category !== 'healthy') ids.push('C2');
    const o2 = negativeO2(view);
    if (o2.any) ids.push(o2.inLight ? 'C3L' : 'C3');
    return ids.map((id) => ({ id, label: label(id, view, m) }));
  }
  return ids.map((id) => ({ id, label: label(id, null, m) }));
}

function onsetOf(view: RunSoFar, type: FailureType): { entry: RunRecordEntry | undefined; sample: TrajectorySample } {
  const entry = view.entries.find((candidate) => candidate.type === type);
  return { entry, sample: (entry && view.result.samples[entry.firstOnsetStep]) || view.current };
}

function failureWhat(view: RunSoFar, type: FailureType, m: Messages): string {
  return failureWhatHappened(m, type, view.input, onsetOf(view, type).sample.pH, view.result.photoinhibitionPenalty);
}

/** Time of the failure's first onset in this run, formatted as on the clock. */
function onsetTime(view: RunSoFar, type: FailureType): string {
  const { entry, sample } = onsetOf(view, type);
  return formatClock(entry ? entry.firstOnsetHours : sample.tHours);
}

function biomassAnswer(view: RunSoFar, completed: boolean, baseline: SimulationResult | null, m: Messages): string[] {
  const t = m.tutor.f1;
  const from = formatBiomass(PARAMETERS.initialBiomass);
  const to = formatBiomass(view.current.biomass);
  const at = formatClock(view.current.tHours);
  const lines = [Number(to) < Number(from) ? t.decreased(from, to, at) : t.notDecreased(from, to, at)];
  if (completed && baseline && !sameInput(view.input, BASELINE_INPUT)) lines.push(t.baseline(formatBiomass(baseline.summary.finalBiomass)));

  if (view.primary) {
    const primary = view.primary;
    lines.push(`${t.mainCause(m.failure[primary], onsetTime(view, primary))} ${failureWhat(view, primary, m)}`);
    lines.push(failureWhy(m, primary, onsetOf(view, primary).sample.pH)[0]);
    const others = view.entries.filter((entry) => entry.type !== primary);
    if (others.length > 0) lines.push(t.also(others.map((entry) => m.failure[entry.type]).join(', ')));
  } else {
    const causes = observedCauses(view.samples);
    if (causes.length > 0) {
      lines.push(`${t.suboptimal} ${causeWhatHappened(m, causes[0].cause, view.input, causes[0].pH)}`);
      if (causes[1]) lines.push(causeWhatHappened(m, causes[1].cause, view.input, causes[1].pH));
    } else {
      lines.push(t.normal);
    }
  }
  return lines;
}

function pHAnswer(view: RunSoFar, m: Messages): string[] {
  const t = m.tutor.f2;
  const from = formatStartingPH(view.input.startingPH);
  const to = formatPH(view.current.pH);
  const at = formatClock(view.current.tHours);
  const increased = Number(to) > view.input.startingPH;
  const lines = [increased ? t.increased(from, to, at) : t.notIncreased(from, to, at), t.mechanism];
  if (!increased) lines.push(t.notRaised);
  const pHTypes: string[] = ['ph-low', 'ph-high'];
  const pHIssue =
    view.entries.some((entry) => pHTypes.includes(entry.type)) || observedCauses(view.samples).some(({ cause }) => pHTypes.includes(cause));
  if (pHIssue) {
    const H = zones.pH;
    lines.push(t.boundaries(H.favorableLow.toFixed(1), H.favorableHigh.toFixed(1), H.lowStressAtOrBelow.toFixed(1), H.highStressAtOrAbove.toFixed(1)));
  }
  return lines;
}

function nextAnswer(view: RunSoFar | null, m: Messages): string[] {
  const t = m.tutor.f3;
  if (!view) return [t.beforeRun(conditions(BASELINE_INPUT, m))];
  if (view.primary) return [t.primary(m.failure[view.primary]), failureTryNext(m, view.primary)];
  const causes = observedCauses(view.samples);
  if (causes.length > 0) return [t.suboptimal, causeTryNext(m, causes[0].cause)];
  return [t.healthy, t.examples(formatLight(inputRanges.lightIntensity.max), formatTemperature(inputRanges.temperatureC.max))];
}

function photoinhibitionAnswer(view: RunSoFar | null, m: Messages): string[] {
  const t = m.tutor.f4;
  const zone = zones.light.photoinhibitionAtOrAbove;
  const lines = [t.saturation(light.saturationOnset), t.zone(zone), t.temperature(zones.temperature.favorableLow, zones.temperature.favorableHigh)];
  if (view) {
    lines.push(
      view.input.lightIntensity >= zone
        ? failureWhatHappened(m, 'photoinhibition', view.input, view.current.pH, view.result.photoinhibitionPenalty)
        : t.outside(formatLight(view.input.lightIntensity), zone),
    );
  }
  return lines;
}

function failureAnswer(view: RunSoFar, m: Messages): string[] {
  const primary = view.primary;
  if (!primary) return [m.tutor.needRun];
  return [
    m.tutor.c1.onset(m.failure[primary], onsetTime(view, primary)),
    failureWhat(view, primary, m),
    failureWhy(m, primary, onsetOf(view, primary).sample.pH)[0],
    failureTryNext(m, primary),
  ];
}

function healthAnswer(view: RunSoFar, m: Messages): string[] {
  const t = m.tutor.c2;
  const state = view.current.health;
  const lines = [t.state(formatClock(view.current.tHours), m.health[state.category], m.trend[state.trend].toLocaleLowerCase())];
  if (state.retainedCause) lines.push(t.retained(retainedCauseLabel(state.retainedCause, m)));
  lines.push(t.delayed(health.worsenSteps / time.stepsPerHour, health.recoverSteps / time.stepsPerHour));
  return lines;
}

function oxygenAnswer(view: RunSoFar, inLight: boolean, m: Messages): string[] {
  const t = m.tutor.c3;
  const negative = view.samples.filter((sample) => sample.netO2Rate < 0);
  if (negative.length === 0) return [t.respiration, t.darkNormal];
  const lowest = negative.reduce((low, sample) => (sample.netO2Rate < low.netO2Rate ? sample : low));
  const lines = [
    t.lowest(formatNetO2(lowest.netO2Rate), m.results.netO2Unit, formatClock(lowest.tHours), lowest.isLight && view.input.lightIntensity > 0),
    t.respiration,
  ];
  if (!inLight) {
    lines.push(t.darkNormal);
    return lines;
  }
  const firstInLight = negative.find((sample) => sample.isLight) ?? lowest;
  lines.push(t.light(formatClock(firstInLight.tHours)));
  if (view.primary) lines.push(failureWhat(view, view.primary, m));
  return lines;
}

const NEEDS_RUN: ReadonlySet<TutorQuestionId> = new Set(['F1', 'F2', 'C1', 'C2', 'C3', 'C3L']);

/** One answer: the question as heading, 2–5 lines from this run, and the provenance line (PRD-0006 §4). */
export function tutorAnswer(id: TutorQuestionId, run: TutorRun | null, baseline: SimulationResult | null, m: Messages): TutorAnswer {
  const view = run ? soFar(run) : null;
  const question = label(id, view, m);
  if (!view || !run) {
    if (NEEDS_RUN.has(id)) return { question, lines: [m.tutor.needRun], provenance: null };
    return { question, lines: id === 'F3' ? nextAnswer(null, m) : photoinhibitionAnswer(null, m), provenance: null };
  }
  let lines: string[];
  switch (id) {
    case 'F1':
      lines = biomassAnswer(view, run.completed, baseline, m);
      break;
    case 'F2':
      lines = pHAnswer(view, m);
      break;
    case 'F3':
      lines = nextAnswer(view, m);
      break;
    case 'F4':
      lines = photoinhibitionAnswer(view, m);
      break;
    case 'C1':
      lines = failureAnswer(view, m);
      break;
    case 'C2':
      lines = healthAnswer(view, m);
      break;
    case 'C3':
      lines = oxygenAnswer(view, false, m);
      break;
    case 'C3L':
      lines = oxygenAnswer(view, true, m);
      break;
  }
  return {
    question,
    lines: lines.slice(0, MAX_LINES),
    provenance: m.tutor.provenance(formatClock(view.current.tHours), conditions(view.input, m)),
  };
}
