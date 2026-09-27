import { Bubbles, Droplet, Heart, Leaf } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { formatBiomass, formatClock, formatNetO2, formatPH, formatStartingPH } from '../../presentation/format';
import { useI18n } from '../../i18n';
import { TONE_PILL, healthIcon, healthTone, retainedCauseLabel, type Tone } from '../../presentation/labels';
import { PARAMETERS, type SimulationInput, type SimulationResult, type TrajectorySample } from '../../simulation';
import { StateIcon } from '../StateIcon';
import type { Theme } from '../theme';
import type { Phase } from '../workspaceReducer';
import { TrendsPanel } from './TrendsPanel';

interface LiveDataPanelProps {
  phase: Phase;
  config: SimulationInput;
  result: SimulationResult | null;
  step: number;
  theme: Theme;
}

const ICON = { 'aria-hidden': true, size: 16, strokeWidth: 2 } as const;
// The health icon takes the state colour of the current category; before a run it stays neutral.
const TONE_COLOR: Partial<Record<Tone, string>> = {
  healthy: 'var(--bl-healthy)',
  suboptimal: 'var(--bl-warning)',
  failure: 'var(--bl-critical)',
};

function ReadoutLabel({ accent, icon, children }: { accent: string; icon: ReactNode; children: ReactNode }) {
  return (
    <span className="readout-label" style={{ '--accent': accent } as CSSProperties}>
      {icon}
      {children}
    </span>
  );
}

interface ReadoutProps {
  testId: string;
  label: string;
  value: string;
  /** Unit set beside the value, e.g. "× initial". */
  unit?: string;
  /** Line below the value, e.g. "Started at 9.0". */
  caption?: string;
  note?: string;
  icon: ReactNode;
  accent: string;
}

/** One instrument readout: label, then value with its unit beside it; no card or icon tile (DESIGN_SYSTEM §29). */
function Readout({ testId, label, value, unit, caption, note, icon, accent }: ReadoutProps) {
  return (
    <div data-testid={testId} className="readout">
      <ReadoutLabel accent={accent} icon={icon}>
        {label}
      </ReadoutLabel>
      <span className="readout-reading">
        <span className="readout-value">{value}</span>
        {unit && <span className="readout-unit">{unit}</span>}
      </span>
      {caption && <span className="readout-note">{caption}</span>}
      {note && <span className="readout-note">{note}</span>}
    </div>
  );
}

function HealthReadout({ sample }: { sample: TrajectorySample | null }) {
  const { m } = useI18n();
  const health = sample?.health;
  const tone = health ? healthTone(health.category) : null;
  return (
    <div data-testid="readout-health" className="readout">
      <ReadoutLabel accent={(tone && TONE_COLOR[tone]) ?? 'var(--bl-ink-2)'} icon={<Heart {...ICON} />}>
        {m.results.health}
      </ReadoutLabel>
      {health && tone ? (
        <>
          <span className={`health-pill ${TONE_PILL[tone]}`}>
            <StateIcon name={healthIcon(health.category)} size={14} />
            {m.health[health.category]}
          </span>
          <span className="readout-note">
            {m.trend[health.trend]}
            {health.retainedCause ? m.results.dueTo(retainedCauseLabel(health.retainedCause, m)) : ''}
          </span>
        </>
      ) : (
        <span className="readout-value">—</span>
      )}
      <span className="readout-note">{m.results.delayed}</span>
    </div>
  );
}

/** Key results and trends, sampled from the precomputed result (PRD-0002 §6, DESIGN_SYSTEM §28). */
export function LiveDataPanel({ phase, config, result, step, theme }: LiveDataPanelProps) {
  const live = result !== null && phase !== 'ready' ? result : null;
  const sample = live ? live.samples[step] : null;
  const { m } = useI18n();
  const r = m.results;
  const negativeNet = sample !== null && formatNetO2(sample.netO2Rate).startsWith('−');

  return (
    <div className="area-data">
      <section id="key-results" tabIndex={-1} aria-labelledby="results-title" className="panel results-panel">
        <header className="panel-head">
          <div>
            <h2 id="results-title" className="panel-title">
              {r.title}
            </h2>
            {!sample && <p className="panel-caption">{r.empty}</p>}
          </div>
          <p data-testid="sim-clock" className="sim-clock">
            <span className="sim-clock-label">{r.simulatedTime} </span>
            <span className="sim-clock-time">
              {formatClock(sample ? sample.tHours : 0)}
              <span className="text-ink-2"> / 24:00</span>
            </span>
          </p>
        </header>
        {/* Rows pair readouts of similar height (biomass and pH; O₂ and health), so the chart below keeps its space. */}
        <div className="readout-grid">
          <Readout
            testId="readout-biomass"
            label={r.biomass}
            value={sample ? formatBiomass(sample.biomass) : '—'}
            unit={r.timesInitial}
            caption={sample ? r.initial(formatBiomass(PARAMETERS.initialBiomass)) : undefined}
            icon={<Leaf {...ICON} />}
            accent="var(--bl-accent-biomass)"
          />
          <Readout
            testId="readout-ph"
            label={r.pH}
            value={sample ? formatPH(sample.pH) : '—'}
            caption={r.startedAt(formatStartingPH(live ? live.input.startingPH : config.startingPH))}
            icon={<Droplet {...ICON} />}
            accent="var(--bl-accent-ph)"
          />
          <Readout
            testId="readout-net-o2"
            label={r.netO2}
            value={sample ? formatNetO2(sample.netO2Rate) : '—'}
            unit={r.netO2Unit}
            note={negativeNet ? r.respirationExceeds : undefined}
            icon={<Bubbles {...ICON} />}
            accent="var(--bl-accent-oxygen)"
          />
          <HealthReadout sample={sample} />
        </div>
      </section>
      <TrendsPanel phase={phase} config={config} result={result} step={step} theme={theme} />
    </div>
  );
}
