import { Sun } from 'lucide-react';
import { formatLight } from '../../presentation/format';
import {
  LIGHT_REFERENCE_VALUES,
  LIGHT_STOPS,
  jumpLightReference,
  lightToStopPosition,
  stepLight,
} from '../../presentation/lightControl';
import { useI18n } from '../../i18n';
import { PARAMETERS } from '../../simulation';
import { Slider } from './Slider';

const { min, max } = PARAMETERS.inputRanges.lightIntensity;
const LAST_STOP = LIGHT_STOPS.length - 1;
const UNIT = 'µmol photons m⁻² s⁻¹';

function keyStep(key: string, value: number): number | null {
  switch (key) {
    case 'ArrowRight':
    case 'ArrowUp':
      return stepLight(value, 1);
    case 'ArrowLeft':
    case 'ArrowDown':
      return stepLight(value, -1);
    case 'PageUp':
      return jumpLightReference(value, 1);
    case 'PageDown':
      return jumpLightReference(value, -1);
    case 'Home':
      return min;
    case 'End':
      return max;
    default:
      return null;
  }
}

/** Light intensity with the approved stop mapping and reference ticks (PRD-0002 §4.1). */
export function LightControl({ value, disabled, onChange }: { value: number; disabled: boolean; onChange: (value: number) => void }) {
  const { m } = useI18n();
  return (
    <Slider
      id="light"
      name={m.controls.lightIntensity}
      icon={<Sun aria-hidden="true" size={20} strokeWidth={2} />}
      accent="var(--bl-accent-light)"
      value={value}
      min={min}
      max={max}
      decimals={0}
      unitLine={UNIT}
      messageUnit={` ${UNIT}`}
      format={formatLight}
      valueText={(v) => m.controls.lightText(formatLight(v))}
      toPosition={(v) => lightToStopPosition(v) / LAST_STOP}
      fromPosition={(fraction) => LIGHT_STOPS[Math.round(fraction * LAST_STOP)]}
      keyStep={keyStep}
      disabled={disabled}
      onChange={onChange}
    >
      <div className="light-ticks">
        {LIGHT_REFERENCE_VALUES.map((reference, index) => {
          const shift = index === 0 ? '' : index === LIGHT_REFERENCE_VALUES.length - 1 ? '-translate-x-full' : '-translate-x-1/2';
          return (
            <button
              key={reference}
              type="button"
              disabled={disabled}
              onClick={() => onChange(reference)}
              className={`light-tick ${shift}`}
              style={{ left: `${(lightToStopPosition(reference) / LAST_STOP) * 100}%` }}
            >
              {formatLight(reference)}
            </button>
          );
        })}
      </div>
    </Slider>
  );
}
