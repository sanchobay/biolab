// In-page navigation shared by the header and the methodology bar (ExecPlan 0004 F1, ExecPlan 0005).
// Views are App state, not routes (ADR-0003 §5): a destination is a view plus an element to focus inside it.
import { prefersReducedMotion } from './preferences';

export type View = 'experiment' | 'learn' | 'about';

export interface Destination {
  view: View;
  /** Id of the element that receives focus once the view is shown. */
  target: string;
}

export type Stage = 'theory' | 'protocol' | 'experiment' | 'results' | 'explanation';

// Theory → Protocol → Experiment → Results → Explanation (PRD-0003 §1). Every stage is always reachable: not a wizard.
export const STAGES: { stage: Stage; destination: Destination }[] = [
  { stage: 'theory', destination: { view: 'learn', target: 'learn-theory' } },
  { stage: 'protocol', destination: { view: 'learn', target: 'learn-protocol' } },
  { stage: 'experiment', destination: { view: 'experiment', target: 'experiment-controls' } },
  { stage: 'results', destination: { view: 'experiment', target: 'key-results' } },
  { stage: 'explanation', destination: { view: 'experiment', target: 'culture-guide' } },
];

const ARRIVAL_MS = 1600;

/**
 * Moves focus to the destination, scrolls it into view when needed and marks it briefly, so the jump is visible with a
 * mouse as well as a keyboard. Smooth scrolling is skipped when reduced motion is requested.
 */
export function arriveAt(id: string): void {
  const target = document.getElementById(id);
  if (!target) return;
  const reduced = prefersReducedMotion();
  target.focus({ preventScroll: true });
  target.scrollIntoView?.({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
  target.dataset.arrived = 'true';
  window.setTimeout(() => delete target.dataset.arrived, ARRIVAL_MS);
}
