// Public engine types (ADR-0002 §4–§6).

export type Aeration = 'off' | 'low' | 'adequate';
export type LightHours = 8 | 10 | 12 | 14 | 16 | 24;

export interface SimulationInput {
  /** °C, 15–45 (C-01). */
  temperatureC: number;
  /** Starting pH, 6.0–11.0 (C-08). */
  startingPH: number;
  /** Incident photon flux, µmol photons m⁻² s⁻¹, 0–2,200 (C-04). */
  lightIntensity: number;
  /** Light hours of the light/dark preset (PRD-0001 §4). */
  lightHours: LightHours;
  aeration: Aeration;
}

export type FailureType = 'thermal' | 'photoinhibition' | 'ph-low' | 'ph-high';
export type SuboptimalCause =
  | 'temperature-cold'
  | 'temperature-warm'
  | 'light-limited'
  | 'ph-low'
  | 'ph-high'
  | 'aeration-low'
  | 'aeration-off';
export type Severity = 'healthy' | 'suboptimal' | 'failure';
export type HealthCategory = 'healthy' | 'suboptimal' | 'stressed';
export type HealthTrend = 'worsening' | 'recovering' | 'steady';

export interface RankedFailure {
  type: FailureType;
  /** Specific-capacity improvement from correcting this control alone (PRD-0001 §9 rule 1). */
  contribution: number;
}

export interface CurrentCondition {
  severity: Severity;
  /** Ordered by the §9 rule 1 ranking and tie order. */
  failures: RankedFailure[];
  primaryFailure: FailureType | null;
  /** Ordered temperature, light, pH, aeration. */
  suboptimalCauses: SuboptimalCause[];
}

export interface HealthState {
  category: HealthCategory;
  target: HealthCategory;
  trend: HealthTrend;
  retainedCause: FailureType | SuboptimalCause | null;
}

export interface TrajectorySample {
  k: number;
  tHours: number;
  isLight: boolean;
  biomass: number;
  pH: number;
  /** RO per simulated hour. */
  photosyntheticRate: number;
  respiratoryRate: number;
  netO2Rate: number;
  /** Per unit relative biomass. */
  specificProduction: number;
  /** f_T · f_h · f_L · A, evaluated as if in light. */
  specificCapacity: number;
  condition: CurrentCondition;
  health: HealthState;
}

export interface RunRecordEntry {
  type: FailureType;
  firstOnsetStep: number;
  firstOnsetHours: number;
  maxContribution: number;
}

export interface RunRecord {
  entries: RunRecordEntry[];
  primaryFailure: FailureType | null;
  outcomeSeverity: Severity;
}

export interface SimulationTotals {
  /** Photosynthetic O₂ integrated over the light periods, RO. */
  lightPeriodPhotosyntheticO2: number;
  /** Net O₂ integrated over the whole run, RO. */
  integratedNetO2: number;
}

export interface SimulationSummary {
  finalBiomass: number;
  finalPH: number;
  lightPeriodPhotosyntheticO2: number;
  finalNetO2Rate: number;
  finalHealth: HealthCategory;
  finalHealthTrend: HealthTrend;
}

export interface SimulationResult {
  input: SimulationInput;
  parameterSetId: string;
  samples: TrajectorySample[];
  runRecord: RunRecord;
  totals: SimulationTotals;
  /** 1 − j, constant within a run (PRD-0001 §12.3). */
  photoinhibitionPenalty: number;
  summary: SimulationSummary;
}

export interface ValidationError {
  field: keyof SimulationInput;
  reason: 'not-finite' | 'out-of-range' | 'unknown-option';
  allowed: string;
}

export type SimulationError = { kind: 'invalid-input'; errors: ValidationError[] } | { kind: 'non-finite-output' };

export type SimulationOutcome = { ok: true; result: SimulationResult } | { ok: false; error: SimulationError };
