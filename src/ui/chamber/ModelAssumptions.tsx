import { Info, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { splitName, useI18n } from '../../i18n';

/** Non-modal "Model assumptions" note (PRD-0001 §1, PRD-0002 §5). */
export function ModelAssumptions() {
  const { m } = useI18n();
  const a = m.assumptions;
  const [before, after] = splitName(a.body);
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    dialog.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!dialog.current?.contains(target) && !trigger.current?.contains(target)) setOpen(false);
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
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls="model-assumptions"
        onClick={() => setOpen((value) => !value)}
        className="ghost-button"
      >
        <Info aria-hidden="true" size={16} strokeWidth={2} />
        {a.button}
      </button>
      {open && (
        <div
          ref={dialog}
          id="model-assumptions"
          role="dialog"
          aria-labelledby="model-assumptions-title"
          tabIndex={-1}
          className="absolute right-0 bottom-full z-30 mb-2 w-80 max-w-[calc(100vw-2rem)] rounded-panel border border-line-strong bg-surface p-4 text-body shadow-panel"
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 id="model-assumptions-title" className="text-body font-semibold text-ink">
              {a.button}
            </h3>
            <button
              type="button"
              aria-label={a.close}
              onClick={() => {
                setOpen(false);
                trigger.current?.focus();
              }}
              className="rounded-control p-1 text-ink-2 hover:text-ink"
            >
              <X aria-hidden="true" size={16} strokeWidth={2} />
            </button>
          </div>
          <p className="text-ink">
            {before}
            <i>Arthrospira platensis</i>
            {after}
          </p>
          <p className="mt-2 text-meta text-ink-2">{a.caption}</p>
        </div>
      )}
    </div>
  );
}
