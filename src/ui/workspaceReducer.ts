// Run lifecycle state (ADR-0001 §3, PRD-0002 §9).
import { BASELINE_INPUT, PARAMETERS, type SimulationInput, type SimulationResult } from '../simulation';

export type Phase = 'ready' | 'running' | 'completed';

export interface WorkspaceState {
  config: SimulationInput;
  phase: Phase;
  result: SimulationResult | null;
  /** Precomputed sample currently displayed (k). */
  step: number;
  runError: boolean;
  resetNotice: boolean;
}

export type WorkspaceAction =
  | { type: 'configure'; patch: Partial<SimulationInput> }
  | { type: 'runStarted'; result: SimulationResult }
  | { type: 'runFailed' }
  | { type: 'tick'; step: number }
  | { type: 'completed' }
  | { type: 'reset' };

export const FINAL_STEP = PARAMETERS.time.stepsPerHour * PARAMETERS.time.runHours;

/** First-load values are the PRD-0001 §12.9 healthy baseline (PRD-0002 D-2). */
export const initialWorkspace: WorkspaceState = {
  config: { ...BASELINE_INPUT },
  phase: 'ready',
  result: null,
  step: 0,
  runError: false,
  resetNotice: false,
};

export function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case 'configure':
      return state.phase === 'ready'
        ? { ...state, config: { ...state.config, ...action.patch }, runError: false, resetNotice: false }
        : state;
    case 'runStarted':
      return { ...state, phase: 'running', result: action.result, step: 0, runError: false, resetNotice: false };
    case 'runFailed':
      return { ...state, phase: 'ready', result: null, step: 0, runError: true, resetNotice: false };
    case 'tick':
      return state.phase === 'running' && action.step !== state.step
        ? { ...state, step: Math.min(action.step, FINAL_STEP) }
        : state;
    case 'completed':
      return state.phase === 'running' ? { ...state, phase: 'completed', step: FINAL_STEP } : state;
    case 'reset':
      // Reset keeps the configured values (PRD-0002 D-3).
      return { ...state, phase: 'ready', result: null, step: 0, runError: false, resetNotice: true };
  }
}
