import { Clock3, Droplet, Lock, Play, RotateCcw, Thermometer, Wind } from 'lucide-react';
import { useEffect, useRef, type CSSProperties, type MouseEvent } from 'react';
import { useI18n } from '../../i18n';
import { PARAMETERS, type Aeration, type LightHours, type SimulationInput } from '../../simulation';
import type { Phase } from '../workspaceReducer';
import { LightControl } from './LightControl';
import { RadioSegments } from './RadioSegments';
import { Slider } from './Slider';

const ranges = PARAMETERS.inputRanges;
const CYCLE_OPTIONS = ranges.lightHours.map((hours) => ({ value: hours as LightHours, label: `${hours}:${24 - hours}` }));
const ICON = { 'aria-hidden': true, size: 20, strokeWidth: 2 } as const;
const AERATION_ACCENT = { '--accent-icon': 'var(--bl-accent-aeration)' } as CSSProperties;
// The photoperiod belongs to the light parameter, so it shares the light identity accent (DESIGN_SYSTEM §28).
const CYCLE_ACCENT = { '--accent-icon': 'var(--bl-accent-light)' } as CSSProperties;

const roundTo = (value: number, decimals: number) => Number(value.toFixed(decimals));

/** Arrow keys snap to the slider step; PageUp/PageDown take larger steps; Home/End go to the limits (PRD-0002 §4). */
function linearKeys(min: number, max: number, step: number, largeStep: number, decimals: number) {
  const clamp = (value: number) => Math.min(max, Math.max(min, roundTo(value, decimals)));
  return (key: string, value: number): number | null => {
    switch (key) {
      case 'ArrowRight':
      case 'ArrowUp':
        return clamp((Math.floor(value / step + 1e-9) + 1) * step);
      case 'ArrowLeft':
      case 'ArrowDown':
        return clamp((Math.ceil(value / step - 1e-9) - 1) * step);
      case 'PageUp':
        return clamp(value + largeStep);
      case 'PageDown':
        return clamp(value - largeStep);
      case 'Home':
        return min;
      case 'End':
        return max;
      default:
        return null;
    }
  };
}

function linearPosition(min: number, max: number, step: number, decimals: number) {
  return {
    toPosition: (value: number) => (value - min) / (max - min),
    fromPosition: (fraction: number) => roundTo(min + Math.round((fraction * (max - min)) / step) * step, decimals),
  };
}

const temperature = { ...ranges.temperatureC, ...linearPosition(ranges.temperatureC.min, ranges.temperatureC.max, 0.5, 1) };
const startingPH = { ...ranges.startingPH, ...linearPosition(ranges.startingPH.min, ranges.startingPH.max, 0.1, 1) };
const temperatureKeys = linearKeys(temperature.min, temperature.max, 0.5, 5, 1);
const pHKeys = linearKeys(startingPH.min, startingPH.max, 0.1, 1, 1);

/** Range ends under a linear slider; decorative, since the slider exposes its own limits. */
function Scale({ from, to }: { from: string; to: string }) {
  return (
    <div aria-hidden="true" className="slider-scale">
      <span>{from}</span>
      <span>{to}</span>
    </div>
  );
}

interface ControlsPanelProps {
  config: SimulationInput;
  phase: Phase;
  onChange: (patch: Partial<SimulationInput>) => void;
  onRun: () => void;
  onReset: () => void;
}

export function ControlsPanel({ config, phase, onChange, onRun, onReset }: ControlsPanelProps) {
  const locked = phase !== 'ready';
  const { m } = useI18n();
  const c = m.controls;
  const caption = phase === 'running' ? c.captionRunning : phase === 'completed' ? c.captionCompleted : c.captionReady;
  const runHint = phase === 'running' ? c.hintRunning : phase === 'completed' ? c.hintCompleted : c.hintReady;
  const aerationOptions = ranges.aeration.map((setting) => ({ value: setting as Aeration, label: m.aeration[setting] }));
  const runRef = useRef<HTMLButtonElement>(null);
  const focusRunAfterReset = useRef(false);

  // Reset disables itself in Ready, which would drop keyboard focus to the page. Hand it to the next action instead (ExecPlan 0004 F2).
  const handleReset = (event: MouseEvent<HTMLButtonElement>) => {
    focusRunAfterReset.current = document.activeElement === event.currentTarget;
    onReset();
  };

  useEffect(() => {
    if (phase === 'ready' && focusRunAfterReset.current) {
      focusRunAfterReset.current = false;
      runRef.current?.focus();
    }
  }, [phase]);

  return (
    <section id="experiment-controls" tabIndex={-1} aria-labelledby="controls-title" className="panel area-controls">
      <header className="controls-head">
        <h2 id="controls-title" className="panel-title">
          {c.title}
        </h2>
        <p className="panel-caption">
          {locked && <Lock aria-hidden="true" size={14} strokeWidth={2} />}
          {caption}
        </p>
      </header>

      <Slider
        id="temperature"
        name={c.temperature}
        icon={<Thermometer {...ICON} />}
        accent="var(--bl-primary)"
        iconAccent="var(--bl-accent-temperature)"
        value={config.temperatureC}
        min={temperature.min}
        max={temperature.max}
        decimals={1}
        unit="°C"
        messageUnit=" °C"
        format={(value) => value.toFixed(1)}
        valueText={(value) => c.temperatureText(value.toFixed(1))}
        toPosition={temperature.toPosition}
        fromPosition={temperature.fromPosition}
        keyStep={temperatureKeys}
        disabled={locked}
        onChange={(value) => onChange({ temperatureC: value })}
      >
        <Scale from={`${temperature.min}`} to={`${temperature.max}`} />
      </Slider>

      <Slider
        id="starting-ph"
        name={c.startingPH}
        icon={<Droplet {...ICON} />}
        accent="var(--bl-accent-ph)"
        value={config.startingPH}
        min={startingPH.min}
        max={startingPH.max}
        decimals={1}
        messageUnit=""
        format={(value) => value.toFixed(1)}
        valueText={(value) => c.pHText(value.toFixed(1))}
        toPosition={startingPH.toPosition}
        fromPosition={startingPH.fromPosition}
        keyStep={pHKeys}
        disabled={locked}
        onChange={(value) => onChange({ startingPH: value })}
      >
        <Scale from={startingPH.min.toFixed(1)} to={startingPH.max.toFixed(1)} />
      </Slider>

      <LightControl value={config.lightIntensity} disabled={locked} onChange={(value) => onChange({ lightIntensity: value })} />

      <div className="control" style={CYCLE_ACCENT}>
        <div className="control-head">
          <span id="cycle-label" className="control-name">
            <Clock3 {...ICON} />
            {c.cycle}
          </span>
          <span className="control-summary">{c.cycleValue(config.lightHours)}</span>
        </div>
        <RadioSegments
          labelId="cycle-label"
          options={CYCLE_OPTIONS}
          value={config.lightHours}
          disabled={locked}
          mono
          wide
          onChange={(lightHours) => onChange({ lightHours })}
        />
      </div>

      <div className="control" style={AERATION_ACCENT}>
        <div className="control-head">
          <span id="aeration-label" className="control-name">
            <Wind {...ICON} />
            {c.aeration}
          </span>
          <span className="control-summary">{m.aeration[config.aeration]}</span>
        </div>
        <RadioSegments
          labelId="aeration-label"
          options={aerationOptions}
          value={config.aeration}
          disabled={locked}
          onChange={(aeration) => onChange({ aeration })}
        />
      </div>

      <div className="run-actions">
        <button
          ref={runRef}
          type="button"
          data-testid="run-button"
          onClick={onRun}
          disabled={phase !== 'ready'}
          aria-describedby="run-hint"
          className="run-button"
        >
          <Play aria-hidden="true" size={18} strokeWidth={2.25} />
          {phase === 'running' ? c.running : c.run}
        </button>
        {/* Reset keeps the configured values (PRD-0002 D-3); the accessible name stays "Reset". */}
        <button type="button" onClick={handleReset} disabled={phase === 'ready'} aria-describedby="reset-hint" className="reset-button">
          <RotateCcw aria-hidden="true" size={16} strokeWidth={2} />
          <span>
            {c.reset}{' '}
            <span id="reset-hint" aria-hidden="true">
              {c.resetHint}
            </span>
          </span>
        </button>
        <p id="run-hint" className="run-hint">
          {runHint}
        </p>
      </div>
    </section>
  );
}
