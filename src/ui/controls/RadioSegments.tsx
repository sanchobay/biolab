import { useRef } from 'react';

interface RadioOption<T extends string | number> {
  value: T;
  label: string;
}

interface RadioSegmentsProps<T extends string | number> {
  labelId: string;
  options: readonly RadioOption<T>[];
  value: T;
  disabled: boolean;
  mono?: boolean;
  /** Six options sit in one row when the card is wide enough, otherwise 2 × 3 (PRD-0002 §4). */
  wide?: boolean;
  onChange: (value: T) => void;
}

/** Radio group with arrow-key selection (PRD-0002 §4, §11). */
export function RadioSegments<T extends string | number>({ labelId, options, value, disabled, mono = false, wide = false, onChange }: RadioSegmentsProps<T>) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (index: number, delta: number) => {
    const next = (index + delta + options.length) % options.length;
    onChange(options[next].value);
    buttons.current[next]?.focus();
  };

  return (
    <div role="radiogroup" aria-labelledby={labelId} className={`segments ${wide ? 'segments-6' : ''}`}>
      {options.map((option, index) => {
        const checked = option.value === value;
        return (
          <button
            key={String(option.value)}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                event.preventDefault();
                move(index, 1);
              } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                event.preventDefault();
                move(index, -1);
              }
            }}
            className={`segment ${mono ? 'mono' : ''}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
