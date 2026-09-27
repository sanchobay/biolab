// Public engine API (ADR-0002 §1). The UI imports only from this file.
export { BASELINE_INPUT, PARAMETERS } from './parameters';
export { simulate } from './simulate';
export type {
  Aeration,
  CurrentCondition,
  FailureType,
  HealthCategory,
  HealthState,
  HealthTrend,
  LightHours,
  RankedFailure,
  RunRecord,
  RunRecordEntry,
  Severity,
  SimulationError,
  SimulationInput,
  SimulationOutcome,
  SimulationResult,
  SimulationSummary,
  SimulationTotals,
  SuboptimalCause,
  TrajectorySample,
  ValidationError,
} from './types';
export { validateInput } from './validate';
