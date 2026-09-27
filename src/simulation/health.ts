// Delayed categorical health: PRD-0001 §12.10 with the approved timer rule (ExecPlan 0001).
import { PARAMETERS } from './parameters';
import type { CurrentCondition, FailureType, HealthCategory, HealthState, SuboptimalCause } from './types';

export interface HealthTracker {
  category: HealthCategory;
  target: HealthCategory;
  /** Sample where the current differing target began, or the last transition (m_start). */
  startStep: number;
  retainedCause: FailureType | SuboptimalCause | null;
}

const RANK: Record<HealthCategory, number> = { healthy: 0, suboptimal: 1, stressed: 2 };
const BY_RANK: HealthCategory[] = ['healthy', 'suboptimal', 'stressed'];

export function targetFor(condition: CurrentCondition): HealthCategory {
  if (condition.severity === 'failure') return 'stressed';
  return condition.severity === 'suboptimal' ? 'suboptimal' : 'healthy';
}

function causeOf(condition: CurrentCondition): FailureType | SuboptimalCause | null {
  return condition.primaryFailure ?? condition.suboptimalCauses[0] ?? null;
}

export function initialHealth(condition: CurrentCondition): HealthTracker {
  const target = targetFor(condition);
  return { category: 'healthy', target, startStep: 0, retainedCause: target === 'healthy' ? null : causeOf(condition) };
}

export function advanceHealth(previous: HealthTracker, condition: CurrentCondition, step: number): HealthTracker {
  const target = targetFor(condition);
  let { category, startStep } = previous;

  if (target !== previous.target) startStep = step;
  if (target === category) {
    startStep = step;
  } else {
    const worsening = RANK[target] > RANK[category];
    const threshold = worsening ? PARAMETERS.health.worsenSteps : PARAMETERS.health.recoverSteps;
    if (step - startStep >= threshold) {
      category = BY_RANK[RANK[category] + (worsening ? 1 : -1)];
      startStep = step;
    }
  }

  const retainedCause =
    target !== 'healthy' ? causeOf(condition) : category !== 'healthy' ? previous.retainedCause : null;
  return { category, target, startStep, retainedCause };
}

export function toHealthState(tracker: HealthTracker): HealthState {
  const difference = RANK[tracker.target] - RANK[tracker.category];
  return {
    category: tracker.category,
    target: tracker.target,
    trend: difference > 0 ? 'worsening' : difference < 0 ? 'recovering' : 'steady',
    retainedCause: tracker.retainedCause,
  };
}
