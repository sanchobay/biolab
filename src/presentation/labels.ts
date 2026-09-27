// State tones, icons and translated labels shared by the workspace (PRD-0002 §5–§8). Text comes from the locale (ADR-0003).
import type { CurrentCondition, FailureType, HealthCategory, SuboptimalCause } from '../simulation';
import type { Messages } from '../i18n';

export type Tone = 'healthy' | 'suboptimal' | 'failure' | 'warning' | 'neutral' | 'active';
export type StateIconKey = FailureType | 'healthy' | 'suboptimal' | 'stressed' | 'info' | 'error';

export const retainedCauseLabel = (cause: FailureType | SuboptimalCause, m: Messages): string => m.retainedCause[cause];

/** "Heat stress" is the English label for PRD-0001's Thermal stress state (PRD-0002 D-14). */
export function conditionLabel(condition: CurrentCondition, m: Messages): string {
  if (condition.severity === 'failure' && condition.primaryFailure) {
    const extra = condition.failures.length - 1;
    return `${m.failure[condition.primaryFailure]}${extra > 0 ? m.condition.moreFailures(extra) : ''}`;
  }
  if (condition.severity === 'suboptimal') {
    const [first, ...rest] = condition.suboptimalCauses;
    return m.condition.suboptimal(m.cause[first], rest.length);
  }
  return m.condition.healthy;
}

export function conditionIcon(condition: CurrentCondition): StateIconKey {
  if (condition.severity === 'failure' && condition.primaryFailure) return condition.primaryFailure;
  return condition.severity === 'suboptimal' ? 'suboptimal' : 'healthy';
}

export const healthTone = (category: HealthCategory): Tone => (category === 'stressed' ? 'failure' : category);

export const healthIcon = (category: HealthCategory): StateIconKey => category;

// Semantic colours are used only for state (DESIGN_SYSTEM §4); blue marks activity and controls.
export const TONE_TEXT: Record<Tone, string> = {
  healthy: 'text-healthy',
  suboptimal: 'text-warning',
  failure: 'text-critical',
  warning: 'text-warning',
  neutral: 'text-ink-2',
  active: 'text-primary',
};

export const TONE_PILL: Record<Tone, string> = {
  healthy: 'border-healthy/40 bg-healthy/10 text-healthy',
  suboptimal: 'border-warning/40 bg-warning/10 text-warning',
  failure: 'border-critical/40 bg-critical/10 text-critical',
  warning: 'border-warning/40 bg-warning/10 text-warning',
  neutral: 'border-line-strong bg-surface-3 text-ink-2',
  active: 'border-primary/40 bg-primary-soft text-primary-ink',
};

export const TONE_BORDER: Record<Tone, string> = {
  healthy: 'border-healthy/60',
  suboptimal: 'border-warning/60',
  failure: 'border-critical/60',
  warning: 'border-warning/60',
  neutral: 'border-line',
  active: 'border-primary/60',
};
