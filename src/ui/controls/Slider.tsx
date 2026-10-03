import { TriangleAlert } from 'lucide-react';
import { useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import { useI18n } from '../../i18n';

/**
 * Thumb diameter in px. It is also the CSS `--thumb` variable, so the thumb's travel is inset by half of it on each side:
 * at the minimum and the maximum the thumb sits inside the track instead of overhanging its ends.
 */
const THUMB_PX = 18;

export interface SliderProps {
  id: string;
  name: string;
  icon: ReactNode;
  /** Parameter identity colours (DESIGN_SYSTEM §28): the slider fill, and the icon when it differs. */
  accent: string;
  iconAccent?: string;
  value: number;
  min: number;
  max: number;
  /** Typed precision (PRD-0002 §10). */
  decimals: number;
  unit?: string;
  unitLine?: string;
  /** Unit suffix used in validation messages, e.g. " °C". */
  messageUnit: string;
  format: (value: number) => string;
  valueText: (value: number) => string;
  toPosition: (value: number) => number;
  fromPosition: (fraction: number) => number;
  keyStep: (key: string, value: number) => number | null;
  disabled: boolean;
  onChange: (value: number) => void;
  children?: ReactNode;
}

/** Accessible slider card with an editable value field (PRD-0002 §4, §10, §11). Keys are handled explicitly. */
export function Slider(props: SliderProps) {
  const { id, name, icon, accent, iconAccent, value, min, max, decimals, unit, unitLine, messageUnit, format, valueText, toPosition, fromPosition, keyStep, disabled, onChange, children } = props;
  const { m } = useI18n();
  const [draft, setDraft] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const labelId = `${id}-label`;
  const bound = (limit: number) => (decimals > 0 ? limit.toFixed(decimals) : format(limit));

  const commit = (text: string) => {
    setDraft(null);
    const cleaned = text.replace(/,/g, '').trim();
    const parsed = cleaned === '' ? Number.NaN : Number(cleaned);
    if (!Number.isFinite(parsed)) {
      setMessage(m.controls.enterNumber(bound(min), bound(max), messageUnit));
      return;
    }
    const factor = 10 ** decimals;
    const rounded = Math.round(parsed * factor) / factor;
    const clamped = Math.min(max, Math.max(min, rounded));
    setMessage(clamped === rounded ? null : m.controls.adjusted(bound(clamped), messageUnit, clamped === max));
    onChange(clamped);
  };

  const setFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const travel = rect.width - THUMB_PX;
    if (travel <= 0) return;
    setMessage(null);
    onChange(fromPosition(Math.min(1, Math.max(0, (event.clientX - rect.left - THUMB_PX / 2) / travel))));
  };

  const position = Math.min(1, Math.max(0, toPosition(value)));
  const accents = { '--accent': accent, '--accent-icon': iconAccent ?? accent, '--thumb': `${THUMB_PX}px` } as CSSProperties;

  return (
    <div className="control" style={accents}>
      <div className="control-head">
        <span id={labelId} className="control-name">
          {icon}
          {name}
        </span>
        <span className="control-reading">
          <input
            type="text"
            inputMode="decimal"
            aria-label={m.controls.valueField(name)}
            value={draft ?? format(value)}
            disabled={disabled}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => {
              if (draft !== null) commit(draft);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && draft !== null) {
                event.preventDefault();
                commit(draft);
              } else if (event.key === 'Escape') {
                setDraft(null);
              }
            }}
            className="control-input"
          />
          {unit && <span>{unit}</span>}
        </span>
      </div>
      {unitLine && <span className="control-unit-line">{unitLine}</span>}
      <div
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-labelledby={labelId}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={valueText(value)}
        aria-disabled={disabled || undefined}
        onKeyDown={(event) => {
          if (disabled) return;
          const next = keyStep(event.key, value);
          if (next !== null) {
            event.preventDefault();
            setMessage(null);
            onChange(next);
          }
        }}
        onPointerDown={(event) => {
          if (disabled) return;
          event.currentTarget.setPointerCapture?.(event.pointerId);
          setFromPointer(event);
        }}
        onPointerMove={(event) => {
          if (!disabled && event.currentTarget.hasPointerCapture?.(event.pointerId)) setFromPointer(event);
        }}
        style={{ '--p': position } as CSSProperties}
        className="slider"
      >
        <div className="slider-track" />
        <div className="slider-fill" />
        <div className="slider-thumb" />
      </div>
      {children}
      {message && (
        <p className="field-message">
          <TriangleAlert aria-hidden="true" size={16} strokeWidth={2} className="shrink-0 text-warning" />
          {message}
        </p>
      )}
    </div>
  );
}
