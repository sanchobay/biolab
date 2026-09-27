import { ListChecks } from 'lucide-react';
import { useI18n } from '../../i18n';
import type { RunRecordView } from '../../presentation/explanation';
import { StateIcon } from '../StateIcon';

/** The add-only run record (PRD-0002 §8) as a strip under the explanation: "occurred during this run", never "damaged". */
export function RunRecord({ rows, empty, footer }: RunRecordView) {
  const { m } = useI18n();
  return (
    <section data-testid="run-record" aria-labelledby="record-title" className="panel area-record">
      {/* The outcome sits under the title, so the entries get the full strip width. */}
      <div className="record-head">
        <h2 id="record-title" className="record-title">
          <ListChecks aria-hidden="true" size={16} strokeWidth={2} />
          {m.record.title}
        </h2>
        {footer && <p className="record-footer">{footer}</p>}
      </div>
      <div className="record-content">
        {rows.length === 0 ? (
          <p>{empty}</p>
        ) : (
          <ul className="record-rows">
            {rows.map((row) => (
              <li key={row.type} className="record-row">
                <strong>
                  <StateIcon name={row.type} size={14} />
                  {row.label}
                </strong>
                <span>{row.text}</span>
                {row.primary && <span className="scope-tag">{m.record.primary}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
