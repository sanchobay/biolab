import { Check, Droplet, Moon, Sun, Thermometer, TriangleAlert, Wind, type LucideIcon } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useI18n, type Messages } from '../../i18n';
import { formatLight, formatPH, formatStartingPH } from '../../presentation/format';
import { TONE_PILL, conditionIcon, conditionLabel, type StateIconKey, type Tone } from '../../presentation/labels';
import { reactorVisualState } from '../../presentation/reactorVisualState';
import type { CurrentCondition, SimulationInput, TrajectorySample } from '../../simulation';
import { StateIcon } from '../StateIcon';
import type { Phase } from '../workspaceReducer';
import { Reactor } from './Reactor';

interface CultureChamberProps {
  phase: Phase;
  runError: boolean;
  config: SimulationInput;
  sample: TrajectorySample | null;
}

interface RunStatus {
  text: string;
  tone: Tone;
  icon: LucideIcon | null;
}

/** The run-status pill reports the lifecycle only, never the culture's condition (PRD-0002 §3). */
function runStatus(phase: Phase, runError: boolean, m: Messages): RunStatus {
  if (runError) return { text: m.status.failed, tone: 'warning', icon: TriangleAlert };
  if (phase === 'running') return { text: m.status.running, tone: 'active', icon: null };
  if (phase === 'completed') return { text: m.status.completed, tone: 'neutral', icon: Check };
  return { text: m.status.ready, tone: 'neutral', icon: null };
}

type SensorKind = 'temperature' | 'light' | 'pH' | 'aeration';

/** A sensor card is highlighted when its condition is a current failure or suboptimal cause (PRD-0002 §5). */
function sensorTone(condition: CurrentCondition | null, kind: SensorKind): Tone | null {
  if (!condition) return null;
  const failures = condition.failures.map((failure) => failure.type);
  const causes = condition.suboptimalCauses;
  if (kind === 'temperature') {
    if (failures.includes('thermal')) return 'failure';
    if (causes.includes('temperature-cold') || causes.includes('temperature-warm')) return 'suboptimal';
  } else if (kind === 'light') {
    if (failures.includes('photoinhibition')) return 'failure';
    if (causes.includes('light-limited')) return 'suboptimal';
  } else if (kind === 'pH') {
    if (failures.includes('ph-low') || failures.includes('ph-high')) return 'failure';
    if (causes.includes('ph-low') || causes.includes('ph-high')) return 'suboptimal';
  } else if (causes.includes('aeration-low') || causes.includes('aeration-off')) {
    return 'suboptimal';
  }
  return null;
}

interface SensorCardProps {
  label: string;
  value: string;
  unit?: string;
  tone: Tone | null;
  icon: LucideIcon;
  accent: string;
  failureIcon: StateIconKey;
}

function SensorCard({ label, value, unit, tone, icon: Icon, accent, failureIcon }: SensorCardProps) {
  const { m } = useI18n();
  return (
    <li className="sensor-row" data-tone={tone ?? undefined} style={{ '--accent': accent } as CSSProperties}>
      <Icon aria-hidden="true" size={18} strokeWidth={2} className="sensor-icon" />
      <span className="sensor-label">{label}</span>
      {tone && (
        <span className="sensor-flag">
          <StateIcon name={tone === 'failure' ? failureIcon : 'suboptimal'} />
          <span className="sr-only">{tone === 'failure' ? m.chamber.stressFlag : m.chamber.suboptimalFlag}</span>
        </span>
      )}
      <span className="sensor-reading">
        <span className="sensor-value">{value}</span>
        {unit && <span className="sensor-unit">{unit}</span>}
      </span>
    </li>
  );
}

/** The hero culture chamber (DESIGN_SYSTEM §14–§15, §28; PRD-0002 §5). Every appearance is an illustrative cue. */
export function CultureChamber({ phase, runError, config, sample }: CultureChamberProps) {
  const live = phase !== 'ready' && sample !== null ? sample : null;
  const visual = reactorVisualState(config, live);
  const { isLight } = visual;
  const condition = live ? live.condition : null;
  const { m } = useI18n();
  const ch = m.chamber;
  const status = runStatus(phase, runError, m);
  const StatusIcon = status.icon;

  return (
    <section aria-labelledby="chamber-title" className="panel area-chamber">
      <h2 id="chamber-title" className="sr-only">
        {ch.title}
      </h2>
      <div className="chamber-status">
        <span data-testid="run-status" className={`status-pill ${TONE_PILL[status.tone]}`}>
          {StatusIcon ? (
            <StatusIcon aria-hidden="true" size={14} strokeWidth={2.5} />
          ) : (
            <span aria-hidden="true" className={`status-dot ${phase === 'running' ? 'is-running' : 'text-primary'}`} />
          )}
          {status.text}
        </span>
        {condition ? (
          <p data-testid="current-condition" className={`condition-pill ${TONE_PILL[condition.severity]}`}>
            <StateIcon name={conditionIcon(condition)} />
            {`${phase === 'completed' ? ch.at24 : ch.now}: ${conditionLabel(condition, m)}`}
          </p>
        ) : (
          <p data-testid="current-condition" className="condition-note">
            {runError ? ch.errorNote : ch.readyNote}
          </p>
        )}
        <p className="light-period">
          {isLight ? (
            <Sun aria-hidden="true" size={18} strokeWidth={2} className="text-accent-light" />
          ) : (
            <Moon aria-hidden="true" size={18} strokeWidth={2} className="text-ink-2" />
          )}
          <span>
            <strong>{isLight ? ch.lightPeriod : ch.darkPeriod}</strong>
            <span>{m.controls.cycleValue(config.lightHours)}</span>
          </span>
        </p>
      </div>

      <div className="chamber-stage" data-period={isLight ? 'light' : 'dark'}>
        {/* Before a run only the hardware is previewed: lamp at the configured intensity, aeration, base colour (PRD-0002 §5). */}
        <Reactor
          visual={visual}
          label={ch.reactorLabel(visual.lampOn, m.aeration[config.aeration])}
        />
        <ul aria-label={ch.sensors} className="sensor-rail">
          <SensorCard
            label={ch.lightIncident}
            value={isLight ? formatLight(config.lightIntensity) : '0'}
            unit={isLight ? 'µmol photons m⁻² s⁻¹' : ch.darkPeriodUnit}
            tone={sensorTone(condition, 'light')}
            icon={Sun}
            accent="var(--bl-accent-light)"
            failureIcon="photoinhibition"
          />
          <SensorCard
            label={ch.temperature}
            value={config.temperatureC.toFixed(1)}
            unit="°C"
            tone={sensorTone(condition, 'temperature')}
            icon={Thermometer}
            accent="var(--bl-accent-temperature)"
            failureIcon="thermal"
          />
          <SensorCard
            label={ch.pHProbe}
            value={live ? formatPH(live.pH) : formatStartingPH(config.startingPH)}
            unit={live ? undefined : ch.startingValue}
            tone={sensorTone(condition, 'pH')}
            icon={Droplet}
            accent="var(--bl-accent-ph)"
            failureIcon={condition?.failures.some((failure) => failure.type === 'ph-high') ? 'ph-high' : 'ph-low'}
          />
          <SensorCard
            label={ch.aeration}
            value={m.aeration[config.aeration]}
            tone={sensorTone(condition, 'aeration')}
            icon={Wind}
            accent="var(--bl-accent-aeration)"
            failureIcon="suboptimal"
          />
        </ul>
        <p className="stage-caption">{ch.caption}</p>
      </div>
    </section>
  );
}
