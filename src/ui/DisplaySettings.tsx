import { ALargeSmall, X } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { RadioSegments } from './controls/RadioSegments';
import { LINE_SPACINGS, MOTIONS, TEXT_SIZES, usePreferences } from './preferences';

/**
 * Header "Display settings" (PRD-0005 §1, DESIGN_SYSTEM §31): a non-modal panel in the Model-assumptions pattern with
 * text size, line spacing and motion. Every choice applies at once and is kept on this device.
 */
export function DisplaySettings() {
  const { m } = useI18n();
  const d = m.display;
  const { preferences, update, reset } = usePreferences();
  const [open, setOpen] = useState(false);
  // The panel opens leftwards from the trigger; when the header wraps at larger text and that would leave the
  // viewport, it opens rightwards instead. Measured before paint, again whenever the text size changes.
  const [alignStart, setAlignStart] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !trigger.current || !panel.current) return;
    const width = panel.current.offsetWidth;
    const { left, right } = trigger.current.getBoundingClientRect();
    setAlignStart(right - width < 8 && left + width <= document.documentElement.clientWidth - 8);
  }, [open, preferences.textSize]);

  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };

  useEffect(() => {
    if (!open) return undefined;
    panel.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!panel.current?.contains(target) && !trigger.current?.contains(target)) setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  return (
    <div className="relative">
      <div className="segmented">
        <button
          ref={trigger}
          type="button"
          aria-label={d.button}
          aria-expanded={open}
          aria-controls="display-settings"
          onClick={() => setOpen((value) => !value)}
        >
          <ALargeSmall aria-hidden="true" size={16} strokeWidth={2} />
        </button>
      </div>
      {open && (
        <div
          ref={panel}
          id="display-settings"
          role="dialog"
          aria-labelledby="display-settings-title"
          tabIndex={-1}
          className={`display-panel absolute top-full ${alignStart ? 'left-0' : 'right-0'} z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-panel border border-line-strong bg-surface p-4 text-body shadow-panel`}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="display-settings-title" className="text-body font-semibold text-ink">
              {d.button}
            </h2>
            <button type="button" aria-label={d.close} onClick={close} className="rounded-control p-1 text-ink-2 hover:text-ink">
              <X aria-hidden="true" size={16} strokeWidth={2} />
            </button>
          </div>

          <div className="display-group">
            <p id="display-text-size" className="display-label">
              {d.textSize}
            </p>
            <RadioSegments
              labelId="display-text-size"
              options={TEXT_SIZES.map((size) => ({ value: size, label: `${size}%` }))}
              value={preferences.textSize}
              disabled={false}
              onChange={(textSize) => update({ textSize })}
            />
          </div>
          <div className="display-group">
            <p id="display-line-spacing" className="display-label">
              {d.lineSpacing}
            </p>
            <RadioSegments
              labelId="display-line-spacing"
              options={LINE_SPACINGS.map((spacing) => ({ value: spacing, label: d.spacing[spacing] }))}
              value={preferences.lineSpacing}
              disabled={false}
              onChange={(lineSpacing) => update({ lineSpacing })}
            />
          </div>
          <div className="display-group">
            <p id="display-motion" className="display-label">
              {d.motion}
            </p>
            <RadioSegments
              labelId="display-motion"
              options={MOTIONS.map((motion) => ({ value: motion, label: d.motionOptions[motion] }))}
              value={preferences.motion}
              disabled={false}
              onChange={(motion) => update({ motion })}
            />
          </div>

          <div className="mt-4 flex flex-col items-start gap-1">
            <button type="button" onClick={reset} className="display-reset">
              {d.reset}
            </button>
            <p className="text-meta text-ink-2">{d.saved}</p>
          </div>
        </div>
      )}
    </div>
  );
}
