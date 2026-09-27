import { ChevronRight } from 'lucide-react';
import { Fragment } from 'react';
import { useI18n } from '../i18n';
import { STAGES, type Destination, type Stage } from './navigation';

interface MethodologyBarProps {
  current: Stage | null;
  onNavigate: (destination: Destination, stage: Stage) => void;
}

/** The learning flow as a slim stepper under the header; the step numbers carry the sequence. */
export function MethodologyBar({ current, onNavigate }: MethodologyBarProps) {
  const { m } = useI18n();
  return (
    <nav aria-label={m.methodology.label} className="methodology-bar">
      <ol>
        {STAGES.map(({ stage, destination }, index) => (
          <Fragment key={stage}>
            {index > 0 && (
              <li aria-hidden="true" className="methodology-sep">
                <ChevronRight size={14} strokeWidth={2} />
              </li>
            )}
            <li>
              <button
                type="button"
                aria-current={current === stage ? 'step' : undefined}
                onClick={() => onNavigate(destination, stage)}
                className="methodology-step"
              >
                <span aria-hidden="true" className="methodology-index">
                  {index + 1}
                </span>
                {m.methodology[stage]}
              </button>
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
