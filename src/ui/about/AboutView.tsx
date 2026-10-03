import { ArrowRight, Check } from 'lucide-react';
import { splitName, useI18n } from '../../i18n';
import { Species } from '../Species';

/** About: what BioLab is, the experiment library, what works now and what is a preview (PRD-0003 §2, §8). */
export function AboutView({ onOpenExperiment }: { onOpenExperiment: () => void }) {
  const { m } = useI18n();
  const a = m.about;
  const [before, after] = splitName(m.assumptions.body);

  return (
    <main id="about-view" className="reading-view">
      <div className="reading-layout reading-layout-single">
        <div className="reading-content">
          <header className="reading-header">
            <h2 id="about-title" tabIndex={-1}>
              {a.title}
            </h2>
            <p className="reading-lead">{a.lead}</p>
          </header>

          <section aria-labelledby="about-library" className="reading-section">
            <h3 id="about-library">{a.libraryTitle}</h3>
            <p>
              <Species text={a.libraryAvailable} />
            </p>
            <p className="reading-note">{a.libraryPlanned}</p>
            <button type="button" onClick={onOpenExperiment} className="text-action">
              {m.common.openExperiment}
              <ArrowRight aria-hidden="true" size={16} strokeWidth={2} />
            </button>
          </section>

          <section aria-labelledby="about-status" className="reading-section">
            <h3 id="about-status">{a.functionalTitle}</h3>
            <ul className="status-list">
              {a.functional.map((item) => (
                <li key={item}>
                  <Check aria-hidden="true" size={16} strokeWidth={2.25} />
                  {/* One flex item, so the italic name keeps normal word spacing. */}
                  <span>
                    <Species text={item} />
                  </span>
                </li>
              ))}
            </ul>
            <h4>{a.previewTitle}</h4>
            <ul className="status-list">
              {a.previewItems.map((item) => (
                <li key={item}>
                  <span className="scope-tag">{m.common.comingSoon}</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="about-model" className="reading-section">
            <h3 id="about-model">{a.modelTitle}</h3>
            <p>
              {before}
              <i>Arthrospira platensis</i>
              {after}
            </p>
            <p className="reading-note">{m.assumptions.caption}</p>
          </section>

          <section aria-labelledby="about-languages" className="reading-section">
            <h3 id="about-languages">{a.languagesTitle}</h3>
            <p>{a.languages}</p>
          </section>
        </div>
      </div>
    </main>
  );
}
